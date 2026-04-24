import { IAIService } from '../../domain/services/IAIService';
import { ITripRepository } from '../../domain/repositories/ITripRepository';

export class GenerateTripBudgetUseCase {
  constructor(
    private aiService: IAIService,
    private tripRepository: ITripRepository 
  ) {}

  async execute(tripId: string, destinationName: string, currency: string, days: number = 3) {
    const trip = await this.tripRepository.findById(tripId);
    if (!trip) throw new Error("Viagem não encontrada");
    const allActivities = trip.destinations.flatMap((dest: any) => dest.activities);
    // Passamos a moeda e as atividades reais para a IA
    return await this.aiService.estimateBudget(destinationName, days, allActivities, currency);
  }
}