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

export interface AIPackingList {
  weatherCondition: string; // Ex: "Quente e Úmido", "Frio intenso com neve"
  temperature: string;      // Ex: "22°C a 30°C"
  checklist: {
    clothing: string[];     // Ex: ["3x Camisetas dry-fit", "1x Casaco leve"]
    essentials: string[];   // Ex: ["Protetor solar FPS 50", "Óculos de sol"]
    gadgets: string[];      // Ex: ["Adaptador de tomada universal", "Powerbank"]
  };
  tip: string;              // Dica de ouro da IA
}

export interface IAIService {
  generateActivities(destination: string, days: number): Promise<AISuggestion[]>;
  estimateBudget(destinationName: string, days: number, activities: any[], currency: string): Promise<AIBudgetEstimate>;
  generatePackingList(destinationName: string, month: string, activities: string[]): Promise<AIPackingList>;
}