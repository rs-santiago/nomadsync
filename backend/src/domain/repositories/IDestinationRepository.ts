export interface CreateDestinationData {
  name: string;
  startDate?: Date | null;
  endDate?: Date | null;
  tripId: string;
}

export interface IDestinationRepository {
  create(data: CreateDestinationData): Promise<any>;
  findByTripId(tripId: string): Promise<any[]>; // Busca todos de uma viagem
  delete(id: string): Promise<void>;
}