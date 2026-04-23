import { PrismaClient } from '@prisma/client';
import { IActivityRepository, CreateActivityData } from '../../domain/repositories/IActivityRepository';

export class PrismaActivityRepository implements IActivityRepository {
  
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateActivityData) {
    return await this.prisma.activity.create({
      data: {
        title: data.title,
        type: data.type,
        destinationId: data.destinationId,
        // 👇 A MÁGICA AQUI: Se for undefined, passamos null para o Prisma ficar feliz
        category: data.category ?? null,          
        description: data.description ?? null,    
        isAiGenerated: data.isAiGenerated ?? false 
      }
    });
  }

  async delete(id: string) {
    await this.prisma.activity.delete({
      where: { id }
    });
  }
}