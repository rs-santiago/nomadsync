// src/domain/entities/Activity.ts

export type ActivityType = 'flight' | 'hotel' | 'restaurant' | 'museum' | 'other';

export class Activity {
  constructor(
    public readonly id: string,
    public readonly destinationId: string,
    public title: string,
    public type: ActivityType,
    public cost: number, // Para o cálculo de orçamento
    public currency: string,
    public scheduledFor: Date
  ) {}

  updateCost(newCost: number, newCurrency: string): void {
    if (newCost < 0) {
      throw new Error("O custo de uma atividade não pode ser negativo.");
    }
    this.cost = newCost;
    this.currency = newCurrency;
  }
}