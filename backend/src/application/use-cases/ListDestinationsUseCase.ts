import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';

export class ListDestinationsUseCase {
  constructor(private destinationRepository: IDestinationRepository) {}

  async execute(tripId: string) {
    if (!tripId) throw new Error("O ID da viagem é obrigatório para listar destinos.");
    return await this.destinationRepository.findByTripId(tripId);
  }
}