import { ITripRepository } from '../../domain/repositories/ITripRepository';

export class GetTripsUseCase {
  constructor(private tripRepository: ITripRepository) {}

  async execute(id: string) {
    if (!id) throw new Error("ID da viagem é obrigatório.");

    return await this.tripRepository.findById(id);
  }
}