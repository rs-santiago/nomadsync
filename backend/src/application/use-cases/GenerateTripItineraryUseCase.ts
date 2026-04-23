// backend/src/application/use-cases/GenerateTripItineraryUseCase.ts

import { IAIService } from '../../domain/services/IAIService';
import { IActivityRepository } from '../../domain/repositories/IActivityRepository';

export class GenerateTripItineraryUseCase {
  constructor(
    private aiService: IAIService,
    private activityRepository: IActivityRepository,
  ) {}

  async execute(destinationId: string, destinationName: string) {
    const suggestions = await this.aiService.generateActivities(destinationName, 3);

    // Salva usando o repositório em vez do prisma direto
    const createdActivities = await Promise.all(
      suggestions.map(activity => {
        let activityType = 'other';
        if (activity.category === 'FOOD') activityType = 'restaurant';
        if (activity.category === 'CULTURE') activityType = 'museum';
        if (activity.category === 'TRANSPORT') activityType = 'flight';

        return this.activityRepository.create({
          title: activity.title,
          category: activity.category,
          description: activity.description,
          type: activityType,
          destinationId: destinationId,
          isAiGenerated: true // A flag visual da IA!
        });
      })
    );

    return createdActivities;
  }
}