// backend/src/application/use-cases/JoinTripUseCase.ts

import { ITripRepository } from '../../domain/repositories/ITripRepository';

interface Input {
  userId: string;
  tripId: string | null;
}

export class JoinTripUseCase {
  constructor(private tripRepository: ITripRepository) {}

  async execute(input: Input) {
    // 1. Validação de dados de entrada
    if (!input.userId) throw new Error("O ID do usuário é obrigatório.");
    if (!input.tripId) throw new Error("O ID da viagem é obrigatório.");

    // 2. Busca a viagem
    const trip = await this.tripRepository.findById(input.tripId);
    if (!trip) {
      throw new Error("Viagem não encontrada.");
    }

    // 3. Regra de Negócio: Verifica se já é dono ou já está na lista
    const isOwner = trip.ownerId === input.userId;
    const isAlreadyParticipant = trip.participants?.includes(input.userId);

    if (isOwner || isAlreadyParticipant) {
      return { success: true, message: "Você já faz parte desta viagem!", trip };
    }

    // 4. Salva o novo participante
    await this.tripRepository.addParticipant(input.tripId, input.userId);

    return { success: true, message: "Convite aceito com sucesso!" };
  }
}