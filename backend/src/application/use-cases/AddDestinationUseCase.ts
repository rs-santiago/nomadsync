import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';

export class AddDestinationUseCase {
  constructor(private destinationRepository: IDestinationRepository) {}

  async execute(data: { id: string; name: string; tripId: string }) {
    if (!data.name) throw new Error("O nome do destino é obrigatório.");

    // 1. Conta quantos destinos existem
    const count = await this.destinationRepository.countByTripId(data.tripId);

    // 2. Cria com a ordem correta
    return await this.destinationRepository.create({
      id: data.id,
      name: data.name,
      tripId: data.tripId,
      order: count
    });
  }
}