import { PrismaClient } from '@prisma/client';
import { IActivityRepository, CreateActivityData } from '../../domain/repositories/IActivityRepository';

const prisma = new PrismaClient();

export class PrismaActivityRepository implements IActivityRepository {
  async create(data: CreateActivityData) {
    return await prisma.activity.create({
      data: {
        title: data.title,
        type: data.type,
        destinationId: data.destinationId
      }
    });
  }

  async delete(id: string) {
    await prisma.activity.delete({
      where: { id }
    });
  }
}