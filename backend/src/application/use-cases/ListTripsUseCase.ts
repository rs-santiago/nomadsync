import { ITripRepository } from '../../domain/repositories/ITripRepository';

export class ListTripsUseCase {
  constructor(private tripRepository: ITripRepository) {}

  async execute(ownerId: string) {
    if (!ownerId) throw new Error("ID do usuário é obrigatório.");
    
    return await this.tripRepository.findAll(ownerId);
  }
}