import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { prisma } from './lib/prisma';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { tripRoutes } from './presentation/routes/tripRoutes';
import { destinationRoutes } from './presentation/routes/destinationRoutes';
import { activityRoutes } from './presentation/routes/activityRoutes';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import 'dotenv/config'; // Seu config de variáveis de ambiente;

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY || '' });

const app = express();
// 1. Inicializa o Sentry o mais cedo possível
Sentry.init({
  dsn: process.env.SENTRY_DSN, // Coloque a URL do Sentry no seu .env
  integrations: [
    nodeProfilingIntegration(),
  ],
  // TracesSampleRate a 1.0 captura 100% das transações para performance.
  // Em produção com muito tráfego, você pode baixar para 0.2 (20%)
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'NomadSync API is running!' });
});

// 1. Rota de CRIAR nova viagem (Fixa)
app.use('/trips', tripRoutes);
app.use('/destinations', destinationRoutes);
app.use('/activities', activityRoutes(io));

app.get("/debug-sentry", (req, res) => {
  throw new Error("Sentry Test Error: NomadSync está monitorado! 🚀");
});

Sentry.setupExpressErrorHandler(app);

// Seu middleware de erro customizado (opcional, mas bom para manter o padrão de resposta)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Erro capturado:", err.message);
  res.status(500).json({
    error: "Erro interno no servidor.",
    // O Sentry anexa um 'sentry' id ao erro, você pode retornar ao usuário para suporte
    eventId: res.get('sentry')
  });
});

io.use(async (socket, next) => {
  // O frontend vai enviar o token por aqui
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Autenticação necessária para o Socket"));
  }

  try {
    // Validamos o token usando a chave secreta
    const decoded = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY as string
    } as any);

    // Injetamos o ID do usuário no socket!
    (socket as any).userId = decoded.sub;
    next();
  } catch (error) {
    return next(new Error("Token de Socket inválido ou expirado"));
  }
});

// Um mapa para guardar: { tripId: [lista de usuários] }
const activeUsers = new Map<string, { id: string, name: string, color: string }[]>();

// Cores divertidas para os avatares
const avatarColors = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#d97706', '#059669', '#9333ea', '#dc2626', '#2563eb'];

io.on('connection', (socket) => {
  socket.on('joinTripPlanning', async (tripId: string) => {
    if (!tripId) {
      return;
    }
    try {
      const trip = await prisma.trip.findUnique({ where: { id: tripId } });
      if (trip && trip.ownerId === (socket as any).userId) {
        socket.join(tripId);
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
        ...newDest
      });
    } catch (error) {
      console.error("Erro ao salvar destino:", error);
    }
  });

  socket.on('reorderDestinations', async (data: { tripId: string, startIndex: number, endIndex: number }) => {
    try {
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
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
    }
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

  socket.on('addActivity', (data: { tripId: string, activity: any }) => {
    socket.broadcast.to(data.tripId).emit('activityAdded', data);
  });

  socket.on('removeActivity', async (data: { tripId: string, activityId: string }) => {
    socket.broadcast.to(data.tripId).emit('activityRemoved', { activityId: data.activityId });
  });

  socket.on('disconnect', () => {
    activeUsers.forEach((users, tripId) => {
      const filtered = users.filter(u => u.id !== socket.id);
      activeUsers.set(tripId, filtered);
      io.to(tripId).emit('presenceUpdate', filtered);
    });
  });
});

export { server, io, app };