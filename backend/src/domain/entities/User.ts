// src/domain/entities/User.ts

export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public passwordHash: string,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  // Exemplo de regra de negócio do próprio domínio
  changeName(newName: string): void {
    if (newName.trim().length === 0) {
      throw new Error("O nome não pode ser vazio.");
    }
    this.name = newName;
    this.updatedAt = new Date();
  }
}