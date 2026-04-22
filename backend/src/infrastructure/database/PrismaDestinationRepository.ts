import { PrismaClient } from '@prisma/client';
import { IDestinationRepository, CreateDestinationData } from '../../domain/repositories/IDestinationRepository';

const prisma = new PrismaClient();

export class PrismaDestinationRepository implements IDestinationRepository {
  async create(data: CreateDestinationData) {
    return await prisma.destination.create({
      data: {
        name: data.name,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        tripId: data.tripId,

        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        imageUrl: data.imageUrl ?? null
      }
    });
  }

  async findByTripId(tripId: string) {
    return await prisma.destination.findMany({
      where: { tripId },
      orderBy: { createdAt: 'asc' }, // Ordena pela data mais próxima primeiro
      include: {
        activities: true // Já traz as atividades embutidas para o frontend!
      }
    });
  }

  async delete(id: string) {
    await prisma.destination.delete({
      where: { id }
    });
  }
}