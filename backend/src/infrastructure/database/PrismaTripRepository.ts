import { PrismaClient } from '@prisma/client';
import { ITripRepository, CreateTripData } from '../../domain/repositories/ITripRepository';

export class PrismaTripRepository implements ITripRepository {
  
  // ✅ ADICIONADO: Injeção de Dependência pelo Construtor
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTripData) {
    // ⚠️ ATENÇÃO: Mudamos de 'prisma.trip...' para 'this.prisma.trip...' em todos os métodos!
    return await this.prisma.trip.create({
      data: {
        title: data.title,
        startDate: data.startDate ?? null, // Proteção contra nullish já estava aqui, ótimo!
        endDate: data.endDate ?? null,
        imageUrl: data.imageUrl ?? null,
        ownerId: data.ownerId
      }
    });
  }

  async findAll(ownerId: string) {
    return await this.prisma.trip.findMany({
      where: {
        OR: [
          { ownerId }, // Viagens onde o usuário é o dono
          { participants: { has: ownerId } } // Viagens onde o usuário é participante
        ]
      },
      include: {
        destinations: {
            include: {
            activities: true
            }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async delete(id: string) {
    await this.prisma.trip.delete({
      where: { id }
    });
  }

    async findById(id: string) {
      return await this.prisma.trip.findUnique({
        where: { id },
        include: {
        destinations: {
          include: {
            activities: true 
          }
        }
      },
      });
    }

    async addParticipant(tripId: string, userId: string) {
        const trip = await this.findById(tripId);
        if (!trip) {
            throw new Error("Viagem não encontrada.");
        }

        await this.prisma.trip.update({
            where: { id: tripId },
            data: {
                participants: {
                    push: userId
                }
            }
        });
    }
}