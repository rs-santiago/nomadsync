// src/domain/entities/Destination.ts

export class Destination {
  constructor(
    public readonly id: string,
    public readonly tripId: string, // Chave estrangeira conceitual para a Trip
    public cityName: string,
    public country: string,
    public latitude: number,
    public longitude: number,
    public startDate: Date,
    public order: number,
    public endDate: Date
  ) {
    this.validateDates();
  }

  // Validação intrínseca: a data de fim não pode ser antes do início
  private validateDates(): void {
    if (this.endDate < this.startDate) {
      throw new Error("A data de fim deve ser posterior à data de início.");
    }
  }
}