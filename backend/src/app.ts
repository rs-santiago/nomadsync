import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { prisma } from './lib/prisma';
import { requireAuth } from './middleware/auth';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { getDestinationImage } from './services/unsplash';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY || '' });

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'NomadSync API is running!' });
});

// 1. Rota de CRIAR nova viagem (Fixa)
app.post('/trips', requireAuth, async (req: any, res) => {
  const userId = req.auth.userId;
  const { title } = req.body;
  try {
    const novaViagem = await prisma.trip.create({
      data: {
        title: title || 'Novo Roteiro',
        ownerId: userId 
      }
    });
    res.json(novaViagem);
  } catch (error) {
    console.error("Erro ao criar viagem:", error);
    res.status(500).json({ error: 'Erro ao criar' });
  }
});

app.post('/trips/:id/join', requireAuth, async (req: any, res: any) => {
  const userId = req.auth.userId; // ID de quem clicou no link
  const tripId = req.params.id;   // ID da viagem

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    
    if (!trip) {
      return res.status(404).json({ error: 'Viagem não encontrada' });
    }

    // Se a pessoa já for o dono ou já estiver na lista, não faz nada
    if (trip.ownerId === userId || trip.participants.includes(userId)) {
      return res.json({ message: 'Você já faz parte desta viagem!', tripId });
    }

    // Adiciona o ID do amigo no array de participantes
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        participants: {
          push: userId // O 'push' empurra o novo ID para dentro da lista
        }
      }
    });

    res.json({ message: 'Convite aceito com sucesso!', tripId });
  } catch (error) {
    console.error("Erro ao entrar na viagem:", error);
    res.status(500).json({ error: 'Erro ao processar convite' });
  }
});

// ==========================================
// 👇 Rota de LISTAR as viagens no Dashboard
// ==========================================
app.get('/trips', requireAuth, async (req: any, res) => {
  const userId = req.auth.userId;

  try {
    const trips = await prisma.trip.findMany({
      where: { 
        OR: [
          { ownerId: userId }, // Se eu for o dono...
          { participants: { has: userId } } // OU se eu for um convidado!
        ]
       },
      orderBy: { createdAt: 'desc' } // Ordena das mais recentes para as mais antigas
    });
    
    res.json(trips);
  } catch (error) {
    console.error("Erro ao buscar no banco:", error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// 3. Rota de BUSCAR UMA viagem ESPECÍFICA (Dinâmica)
app.get('/trips/:id', requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const userId = req.auth.userId;

  try {
    // 1. Vai no banco e busca SÓ pelo ID da viagem
    const trip = await prisma.trip.findUnique({
      where: { 
        id
     },
      include: { 
        destinations: { 
          include: { activities: true },
          orderBy: { order: 'asc' }
        } 
      }
    });

    // 2. Se não achou nada, devolve erro 404 (Not Found)
    if (!trip) {
      return res.status(404).json({ error: 'Viagem não encontrada' });
    }

    // 3. A trava de segurança: O cara é o dono OU está na lista?
    const isOwner = trip.ownerId === userId;
    const isParticipant = trip.participants.includes(userId);

    if (!isOwner && !isParticipant) {
      // 403 Forbidden: Sei que a viagem existe, mas você não entra.
      return res.status(403).json({ error: 'Você não tem permissão para acessar este roteiro' });
    }

    res.json(trip);
  } catch (error) {
    console.error("Erro ao procurar viagem específica:", error);
    res.status(500).json({ error: 'Erro ao procurar viagem' });
  }
});

app.post('/trips/:tripId/destinations', async (req, res) => {
  const { name } = req.body;
  const { tripId } = req.params;

  // 📸 BUSCA A FOTO AUTOMATICAMENTE
  const imageUrl = await getDestinationImage(name);

  const newDestination = await prisma.destination.create({
    data: {
      name: name,
      tripId: tripId,
      imageUrl: imageUrl, // Certifique-se de que este campo existe no seu schema.prisma
      // ... outros campos (ordem, etc)
    }
  });

  // Emite via Socket para todo mundo ver a foto nova na hora!
  io.to(tripId).emit('destination_added', newDestination);
  
  res.json(newDestination);
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error("Não autorizado"));
    }

    // O Clerk verifica o token e devolve os dados (payload)
    const tokenData = await clerk.verifyToken(token);
    
    (socket as any).userId = tokenData.sub; 

    next();
  } catch (err) {
    next(new Error("Token inválido"));
  }
});

// Um mapa para guardar: { tripId: [lista de usuários] }
const activeUsers = new Map<string, { id: string, name: string, color: string }[]>();

// Cores divertidas para os avatares
const avatarColors = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#d97706', '#059669', '#9333ea', '#dc2626', '#2563eb'];

io.on('connection', (socket) => {
    console.log(`🔌 Novo viajante conectado: ${socket.id}`);

    socket.on('joinTripPlanning', async (tripId: string) => {
        if (!tripId) {
            console.log('⚠️ Tentativa de entrar em sala sem ID da viagem.');
            return; 
        }
        try {
            const trip = await prisma.trip.findUnique({ where: { id: tripId } });
            
            if (trip && trip.ownerId === (socket as any).userId) { 
                socket.join(tripId);
                console.log(`🔒 Utilizador autorizado na sala: ${tripId}`);
            }
            } catch (error) {
                console.error("Erro ao buscar viagem no socket:", error);
            }
    });

    socket.on('newDestinationAdded', async (data) => {
        try {
        // 1. Conta quantos já existem nessa viagem
        const count = await prisma.destination.count({
            where: { tripId: data.tripId }
        });

        // 2. Salva com a ordem correta (se tem 0, ele vira o 0. Se tem 2, ele vira o 2)
        const newDest = await prisma.destination.create({
            data: {
            id: data.destinationId,
            name: data.destinationName,
            tripId: data.tripId,
            order: count // 👈 CORREÇÃO AQUI
            }
        });

        socket.broadcast.to(data.tripId).emit('updateTripMap', {
            destinationId: newDest.id,
            destination: newDest.name
        });
        } catch (error) {
        console.error("Erro ao salvar destino:", error);
        }
    });

    socket.on('reorderDestinations', async (data: { tripId: string, startIndex: number, endIndex: number }) => {
        const { tripId, startIndex, endIndex } = data;

        // 1. Busca todos os destinos daquela viagem ordenados
        const destinations = await prisma.destination.findMany({
            where: { tripId },
            orderBy: { order: 'asc' }
        });

        // 2. Reordena o array na memória
        const [movedItem] = destinations.splice(startIndex, 1);
        if (movedItem) {
            destinations.splice(endIndex, 0, movedItem);
        }

        // 3. Atualiza todos no banco de dados (Transaction)
        await prisma.$transaction(
            destinations.map((dest, index) =>
                prisma.destination.update({
                    where: { id: dest.id },
                    data: { order: index }
                })
            )
        );

        // 4. Avisa os outros usuários para moverem em suas telas também
        socket.broadcast.to(tripId).emit('destinationsReordered', { startIndex, endIndex });
    });

    socket.on('removeDestination', async (data) => {
        try {
        // 1. O PRISMA DELETA APENAS O DESTINO ESPECÍFICO (pelo destinationId)
        await prisma.destination.delete({
            where: { id: data.destinationId } 
        });

        // 2. O SOCKET AVISA A SALA (usando o tripId)
        socket.broadcast.to(data.tripId).emit('destinationRemoved', {
            destinationId: data.destinationId
        });
        
        } catch (error) {
        console.error("Erro ao deletar destino:", error);
        }
    });

    socket.on('addActivity', async (data: { tripId: string, activity: any }) => {
        await prisma.activity.create({
            data: {
                id: data.activity.id,
                destinationId: data.activity.destinationId,
                title: data.activity.title,
                type: data.activity.type,
                cost: data.activity.cost
            }
        });

        socket.broadcast.to(data.tripId).emit('activityAdded', { activity: data.activity });
    });

    socket.on('removeActivity', async (data: { tripId: string, activityId: string }) => {
        await prisma.activity.delete({
            where: { id: data.activityId }
        });

        socket.broadcast.to(data.tripId).emit('activityRemoved', { activityId: data.activityId });
    });

    socket.on('disconnect', () => {
        activeUsers.forEach((users, tripId) => {
            const filtered = users.filter(u => u.id !== socket.id);
            activeUsers.set(tripId, filtered);
            io.to(tripId).emit('presenceUpdate', filtered);
        });
        console.log(`❌ Viajante desconectado: ${socket.id}`);
    });
});

export { server, io, app };