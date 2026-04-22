// Define o formato dos dados que o repositório precisa receber
export interface CreateTripData {
  title: string;
  startDate?: Date | null;
  endDate?: Date | null;
  imageUrl?: string | null;
  ownerId: string;
}

// O contrato que qualquer banco de dados (Prisma, TypeORM, etc) deve seguir
export interface ITripRepository {
  create(data: CreateTripData): Promise<any>;
  findAll(ownerId: string): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  delete(id: string): Promise<void>;
  addParticipant(tripId: string, userId: string): Promise<void>;
}