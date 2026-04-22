import { IActivityRepository } from '../../domain/repositories/IActivityRepository';

export class CreateActivityUseCase {
  constructor(private activityRepository: IActivityRepository) {}

  async execute(data: { title: string; type: string; destinationId: string }) {
    if (!data.title) throw new Error("O título da atividade é obrigatório.");
    if (!data.destinationId) throw new Error("O ID do destino é obrigatório.");

    return await this.activityRepository.create(data);
  }
}