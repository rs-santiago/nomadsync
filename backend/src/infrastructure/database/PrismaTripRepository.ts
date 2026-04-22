import { PrismaClient } from '@prisma/client';
import { ITripRepository, CreateTripData } from '../../domain/repositories/ITripRepository';

const prisma = new PrismaClient();

export class PrismaTripRepository implements ITripRepository {
  async create(data: CreateTripData) {
    return await prisma.trip.create({
      data: {
        title: data.title,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        imageUrl: data.imageUrl ?? null,
        ownerId: data.ownerId
      }
    });
  }

  async findAll(ownerId: string) {
    return await prisma.trip.findMany({
      where: {
        ownerId
      },
      include: {
        // Ele diz ao Prisma para fazer o "JOIN" e trazer os destinos
        destinations: {
            include: {
            activities: true // Se quiseres trazer as atividades dos destinos também!
            }
        }
      },
      orderBy: { createdAt: 'desc' } // Traz as mais novas primeiro
    });
  }

  async delete(id: string) {
    await prisma.trip.delete({
      where: { id }
    });
  }

    async findById(id: string) {
      return await prisma.trip.findUnique({
        where: { id },
        include: {
        // Ele diz ao Prisma para fazer o "JOIN" e trazer os destinos
        destinations: {
          include: {
            activities: true // Se quiseres trazer as atividades dos destinos também!
          }
        }
      },
      });
    }

    async addParticipant(tripId: string, userId: string) {
        // 1. Busca a viagem
        const trip = await this.findById(tripId);
        if (!trip) {
            throw new Error("Viagem não encontrada.");
        }

        // 2. Adiciona o participante
        await prisma.trip.update({
            where: { id: tripId },
            data: {
                participants: {
                    push: userId
                }
            }
        });

    }
}