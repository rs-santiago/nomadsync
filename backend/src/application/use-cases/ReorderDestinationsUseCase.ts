import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';

export class ReorderDestinationsUseCase {
  constructor(private destinationRepository: IDestinationRepository) {}

  async execute(data: { tripId: string; startIndex: number; endIndex: number }) {
    const { tripId, startIndex, endIndex } = data;

    // Busca ordenado
    const destinations = await this.destinationRepository.findByTripIdOrdered(tripId);

    // Reordena na memória
    const [movedItem] = destinations.splice(startIndex, 1);
    if (movedItem) {
      destinations.splice(endIndex, 0, movedItem);
    }

    // Prepara o array com a nova ordem e envia para a transaction do repositório
    const destinationsToUpdate = destinations.map((dest, index) => ({
      id: dest.id,
      order: index
    }));

    await this.destinationRepository.updateOrderTransaction(destinationsToUpdate);
  }
}