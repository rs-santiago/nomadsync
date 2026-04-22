import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';

export class CreateDestinationUseCase {
  constructor(private destinationRepository: IDestinationRepository) {}

  async execute(data: { name: string; startDate?: string; endDate?: string; tripId: string }) {
    if (!data.name) throw new Error("O nome do destino é obrigatório.");
    if (!data.tripId) throw new Error("O ID da viagem é obrigatório.");

    return await this.destinationRepository.create({
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      tripId: data.tripId
    });
  }
}