import { ITripRepository } from '../../domain/repositories/ITripRepository';

export class DeleteTripUseCase {
  constructor(private tripRepository: ITripRepository) {}

  async execute(id: string | null) {
    if (!id) throw new Error("O ID da viagem é obrigatório para exclusão.");

    await this.tripRepository.delete(id);
  }
}