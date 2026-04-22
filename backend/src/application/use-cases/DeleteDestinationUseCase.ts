import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';

export class DeleteDestinationUseCase {
  constructor(private destinationRepository: IDestinationRepository) {}

  async execute(id: string) {
    if (!id) throw new Error("O ID do destino é obrigatório.");
    await this.destinationRepository.delete(id);
  }
}