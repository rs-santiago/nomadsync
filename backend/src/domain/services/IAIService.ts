// src/application/interfaces/IAIService.ts
export interface AISuggestion {
  title: string;
  category: 'LEISURE' | 'FOOD' | 'TRANSPORT' | 'CULTURE';
  description: string;
}

export interface AIBudgetEstimate {
  currency: string; // Ex: "USD" ou "BRL"
  total: number;
  breakdown: {
    food: number;
    transport: number;
    leisure: number;
    accommodation: number;
  };
  tips: string; // Uma dica financeira curta da IA
}

export interface IAIService {
  generateActivities(destination: string, days: number): Promise<AISuggestion[]>;
  estimateBudget(destinationName: string, days: number, activities: any[], currency: string): Promise<AIBudgetEstimate>;
}