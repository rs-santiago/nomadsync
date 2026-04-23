// src/application/interfaces/IAIService.ts
export interface AISuggestion {
  title: string;
  category: 'LEISURE' | 'FOOD' | 'TRANSPORT' | 'CULTURE';
  description: string;
}

export interface IAIService {
  generateActivities(destination: string, days: number): Promise<AISuggestion[]>;
}