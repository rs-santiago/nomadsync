import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';

export class AddDestinationUseCase {
  constructor(private destinationRepository: IDestinationRepository) {}

  async execute(data: { 
    id: string; 
    name: string; 
    tripId: string;
    startDate?: Date | string | null; // Pode vir como string do Frontend
    endDate?: Date | string | null;
  }) {
    if (!data.name) throw new Error("O nome do destino é obrigatório.");

    // 1. Conta quantos destinos existem
    const count = await this.destinationRepository.countByTripId(data.tripId);

    // 2. Converte as datas (se existirem)
    const parsedStartDate = data.startDate ? new Date(data.startDate) : null;
    const parsedEndDate = data.endDate ? new Date(data.endDate) : null;

    // 3. Cria enviando TODOS os dados esperados pelo teste e pelo banco
    return await this.destinationRepository.create({
      id: data.id,
      name: data.name,
      tripId: data.tripId,
      order: count,
      startDate: parsedStartDate,
      endDate: parsedEndDate
    });
  }
}