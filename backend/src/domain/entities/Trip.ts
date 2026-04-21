// src/domain/entities/Trip.ts

export type TripStatus = 'planning' | 'ongoing' | 'completed';

export class Trip {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string,
    public readonly ownerId: string, 
    public status: TripStatus,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  // Métodos que alteram o estado da viagem garantem a consistência
  startTrip(): void {
    if (this.status !== 'planning') {
      throw new Error("Apenas viagens em planejamento podem ser iniciadas.");
    }
    this.status = 'ongoing';
    this.updatedAt = new Date();
  }

  finishTrip(): void {
    this.status = 'completed';
    this.updatedAt = new Date();
  }
}