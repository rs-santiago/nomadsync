// Define o formato dos dados que o repositório precisa receber
export interface CreateTripData {
  title: string;
  startDate?: Date | null;
  endDate?: Date | null;
  imageUrl?: string | null;
  ownerId: string;
}

export interface TripWithRelations {
  id: string;
  ownerId: string;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
  imageUrl: string | null;
  participants: string[]; // IDs dos participantes
  destinations: {
    id: string;
    activities: any[]; 
  }[];
}

// O contrato que qualquer banco de dados (Prisma, TypeORM, etc) deve seguir
export interface ITripRepository {
  create(data: CreateTripData): Promise<any>;
  findAll(ownerId: string): Promise<TripWithRelations[]>;
  findById(id: string): Promise<TripWithRelations | null>;
  delete(id: string): Promise<void>;
  addParticipant(tripId: string, userId: string): Promise<void>;
}