import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';
import { ILocationService } from '../../domain/services/ILocationService';
import { IPhotoService } from '../../domain/services/IPhotoService';

export class CreateDestinationUseCase {
  constructor(
    private destinationRepository: IDestinationRepository,
    private locationService: ILocationService,
    private photoService: IPhotoService
  ) {}

  async execute(data: { name: string; startDate?: string; endDate?: string; tripId: string }) {
    if (!data.name) throw new Error("O nome do destino é obrigatório.");
    if (!data.tripId) throw new Error("O ID da viagem é obrigatório.");
    // 1. Busca os dados nas APIs externas paralelamente (para ficar mais rápido!)
    const [coordinates, imageUrl, order] = await Promise.all([
      this.locationService.getCoordinates(data.name),
      this.photoService.getPhotoUrl(data.name),
      this.destinationRepository.countByTripId(data.tripId)
    ]);
    
    return await this.destinationRepository.create({
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      tripId: data.tripId,
      latitude: coordinates?.latitude || null,
      longitude: coordinates?.longitude || null,
      imageUrl: imageUrl || null,
      order: order 
    });
  }
}