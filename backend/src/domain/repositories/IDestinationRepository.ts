export interface CreateDestinationData {
  id?: string;
  name: string;
  startDate?: Date | null;
  endDate?: Date | null;
  tripId: string;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  order?: number;
}

export interface IDestinationRepository {
  countByTripId(tripId: string): Promise<number>;
  create(data: CreateDestinationData): Promise<any>;
  findByTripIdOrdered(tripId: string): Promise<any[]>;
  updateOrderTransaction(destinations: { id: string; order: number }[]): Promise<void>;
  delete(id: string): Promise<void>;
}