import { IActivityRepository } from '../../domain/repositories/IActivityRepository';

export class DeleteActivityUseCase {
  constructor(private activityRepository: IActivityRepository) {}

  async execute(id: string) {
    if (!id) throw new Error("O ID da atividade é obrigatório.");
    await this.activityRepository.delete(id);
  }
}