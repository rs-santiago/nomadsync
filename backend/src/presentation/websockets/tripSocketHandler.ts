// src/presentation/websockets/tripSocketHandler.ts

import { Server, Socket } from 'socket.io';
import { prisma } from '../../lib/prisma'; // Instância do Prisma
import * as Sentry from '@sentry/node';
import { verifyToken } from '@clerk/clerk-sdk-node';

// Repositórios
import { GroqAIService } from '../../infrastructure/services/GroqAIService';

// Repositórios
import { PrismaDestinationRepository } from '../../infrastructure/database/PrismaDestinationRepository';
import { PrismaActivityRepository } from '../../infrastructure/database/PrismaActivityRepository';
import { PrismaTripRepository } from '../../infrastructure/database/PrismaTripRepository';

// Casos de Uso
import { GenerateTripItineraryUseCase } from '../../application/use-cases/GenerateTripItineraryUseCase';
import { AddDestinationUseCase } from '../../application/use-cases/AddDestinationUseCase';
import { ReorderDestinationsUseCase } from '../../application/use-cases/ReorderDestinationsUseCase';
import { GenerateTripBudgetUseCase } from '../../application/use-cases/GenerateTripBudgetUseCase';
import { GenerateTripPackingListUseCase } from '../../application/use-cases/GenerateTripPackingListUseCase';

// Estado em memória para controle de presença nas salas
const activeUsers = new Map<string, { id: string, name: string, color: string }[]>();
const avatarColors = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#d97706', '#059669', '#9333ea', '#dc2626'];

export function setupTripSockets(io: Server) {
  // 1. Middleware de Autenticação via Clerk
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Autenticação necessária para o Socket"));

    try {
      const decoded = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY as string } as any);
      (socket as any).userId = decoded.sub;
      next();
    } catch (error) {
      return next(new Error("Token de Socket inválido ou expirado"));
    }
  });

  // 2. Eventos de Conexão
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;

    // 💉 INJEÇÃO DE DEPENDÊNCIAS (As "peças do lego" são montadas aqui)
    const destinationRepo = new PrismaDestinationRepository(prisma);
    const aiService = new GroqAIService();
    const activityRepo = new PrismaActivityRepository(prisma);
    const addDestUC = new AddDestinationUseCase(destinationRepo);
    const reorderDestUC = new ReorderDestinationsUseCase(destinationRepo);
    const tripRepo = new PrismaTripRepository(prisma);
    
    // O UseCase de IA agora recebe o serviço da Groq e o repositório de Atividades
    const aiBudgetUC = new GenerateTripBudgetUseCase(aiService, tripRepo);
    const aiPackingListUC = new GenerateTripPackingListUseCase(aiService, tripRepo);
    const aiItineraryUC = new GenerateTripItineraryUseCase(aiService, activityRepo);

    // --- EVENTOS DE PRESENÇA ---
    socket.on('joinTripPlanning', async (tripId: string) => {
      if (!tripId) return;
      try {
        const trip = await prisma.trip.findUnique({ where: { id: tripId } });
        const isOwner = trip?.ownerId === userId;
        const isParticipant = trip?.participants.includes(userId);
        // Verifica se o usuário tem permissão (Aqui pode ser expandido para participants depois)
        if (trip && (isOwner || isParticipant)) {
          socket.join(tripId);
          
          const currentUsers = activeUsers.get(tripId) || [];
          if (!currentUsers.some(u => u.id === socket.id)) {
            currentUsers.push({
              id: socket.id,
              name: `Usuário ${userId.substring(0, 4)}`, // Temporário: Ideal é buscar o nome no Clerk
              color: avatarColors[Math.floor(Math.random() * avatarColors.length)] || '#8c4545'
            });
            activeUsers.set(tripId, currentUsers);
            io.to(tripId).emit('presenceUpdate', currentUsers);
          }
        }
      } catch (error) {
        Sentry.captureException(error);
      }
    });

    // --- EVENTOS DE DESTINOS ---
    socket.on('newDestinationAdded', async (data: { destinationId: string, destinationName: string, tripId: string }) => {
      try {
        const newDest = await addDestUC.execute({
          id: data.destinationId,
          name: data.destinationName,
          tripId: data.tripId
        });
        socket.broadcast.to(data.tripId).emit('updateTripMap', newDest);
      } catch (error) {
        console.error(error);
        Sentry.captureException(error);
      }
    });

    socket.on('reorderDestinations', async (data: { tripId: string, startIndex: number, endIndex: number }) => {
      try {
        await reorderDestUC.execute(data);
        socket.broadcast.to(data.tripId).emit('destinationsReordered', { 
          startIndex: data.startIndex, 
          endIndex: data.endIndex 
        });
      } catch (error) {
        console.error(error);
        Sentry.captureException(error);
      }
    });

    socket.on('removeDestination', async (data: { destinationId: string, tripId: string }) => {
      try {
        // Chamando o repositório direto (ou você pode criar um DeleteDestinationUseCase)
        await destinationRepo.delete(data.destinationId);
        socket.broadcast.to(data.tripId).emit('destinationRemoved', { destinationId: data.destinationId });
      } catch (error) {
        console.error(error);
        Sentry.captureException(error);
      }
    });

    // --- EVENTOS DE ATIVIDADES ---
    socket.on('addActivity', (data: { tripId: string, activity: any }) => {
      socket.broadcast.to(data.tripId).emit('activityAdded', data);
    });

    socket.on('removeActivity', async (data: { tripId: string, activityId: string }) => {
      socket.broadcast.to(data.tripId).emit('activityRemoved', { activityId: data.activityId });
    });

    // --- INTEGRAÇÃO COM INTELIGÊNCIA ARTIFICIAL ---
    socket.on('requestAIItinerary', async (data: { tripId: string, destinationId: string, destinationName: string }) => {
      try {
        console.log(`🤖 IA gerando roteiro para: ${data.destinationName}`);
        // Executa a inteligência
        const newActivities = await aiItineraryUC.execute(data.destinationId, data.destinationName);
        // Dispara para todo mundo na sala ver a mágica acontecendo
        io.to(data.tripId).emit('activitiesGeneratedByAI', newActivities);
        console.log(`✅ ${newActivities.length} atividades geradas com sucesso via Groq Llama 3!`);
      } catch (error) {
        console.error("Erro na geração por IA:", error);
        Sentry.captureException(error);
        socket.emit('error_message', 'Desculpe, a IA falhou ao gerar o roteiro. Tente novamente.');
      }
    });

    socket.on('requestAIBudget', async (data: { tripId: string, destinationName: string, currency: string }) => {
      try {
        const budget = await aiBudgetUC.execute(data.tripId, data.destinationName, data.currency);
        io.to(data.tripId).emit('budgetGeneratedByAI', budget);
      } catch (error) {
        console.error("Erro no orçamento por IA:", error);
        Sentry.captureException(error);
        socket.emit('error_message', 'A IA financeira falhou ao calcular o orçamento.');
      }
    });

    socket.on('requestAIPackingList', async (tripId: string) => {
      try {
        console.log(`🎒 IA gerando checklist de bagagem para a viagem: ${tripId}`);
        
        const packingList = await aiPackingListUC.execute(tripId);

        // Manda a resposta para a sala da viagem
        io.to(tripId).emit('packingListGeneratedByAI', packingList);
        
        console.log(`✅ Checklist gerado com sucesso! Clima: ${packingList.weatherCondition}`);
      } catch (error: any) {
        console.error("Erro na bagagem por IA:", error);
        socket.emit('error_message', error.message || 'A IA falhou ao gerar o checklist de bagagem.');
      }
    });

    // --- DESCONEXÃO E LIMPEZA ---
    socket.on('disconnect', () => {
      activeUsers.forEach((users, tripId) => {
        const filtered = users.filter(u => u.id !== socket.id);
        if (filtered.length === 0) {
          activeUsers.delete(tripId); // Limpa a sala se ficar vazia para economizar RAM
        } else {
          activeUsers.set(tripId, filtered);
          io.to(tripId).emit('presenceUpdate', filtered);
        }
      });
    });
  });
}