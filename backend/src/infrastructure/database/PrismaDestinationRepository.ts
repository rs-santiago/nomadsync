import { PrismaClient } from '@prisma/client';
import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';

export class PrismaDestinationRepository implements IDestinationRepository {
  
  // 1. Recebemos a conexão pelo construtor (Injeção de Dependência)
  constructor(private prisma: PrismaClient) {}

  async countByTripId(tripId: string): Promise<number> {
    // 2. Trocamos tudo para 'this.prisma'
    return this.prisma.destination.count({ where: { tripId } });
  }

  async create(data: { 
    id: string; 
    name: string; 
    tripId: string; 
    order: number;
    startDate?: Date | null;
    endDate?: Date | null;
  }) {
    return this.prisma.destination.create({ 
      data: {
        id: data.id,
        name: data.name,
        tripId: data.tripId,
        order: data.order,
        // Proteção contra undefined (Strict Null Checks)
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null
      } 
    });
  }

  async findByTripIdOrdered(tripId: string) {
    return this.prisma.destination.findMany({
      where: { tripId },
      orderBy: { order: 'asc' }
    });
  }

  async updateOrderTransaction(destinations: { id: string; order: number }[]) {
    await this.prisma.$transaction(
      destinations.map(dest =>
        this.prisma.destination.update({
          where: { id: dest.id },
          data: { order: dest.order }
        })
      )
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.destination.delete({ where: { id } });
  }
}