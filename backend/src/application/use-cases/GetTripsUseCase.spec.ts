// backend/src/application/use-cases/GetTripsUseCase.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetTripsUseCase } from './GetTripsUseCase';

describe('GetTripsUseCase', () => {
  let mockTripRepository: any;
  let useCase: GetTripsUseCase;

  beforeEach(() => {
    mockTripRepository = {
      // Simulamos que o banco encontrou a viagem e a retornou
      findById: vi.fn().mockResolvedValue({
        id: 'trip-123',
        title: 'Eurotrip 2026',
        ownerId: 'user-789'
      })
    };

    useCase = new GetTripsUseCase(mockTripRepository);
  });

  // 👇 TESTE 1: Caminho Feliz
  it('deve retornar os dados da viagem quando um ID válido for fornecido', async () => {
    const tripId = 'trip-123';

    const result = await useCase.execute(tripId);

    // Verifica se o repositório foi chamado com o ID correto
    expect(mockTripRepository.findById).toHaveBeenCalledWith(tripId);
    expect(mockTripRepository.findById).toHaveBeenCalledTimes(1);

    // Verifica se o Use Case está devolvendo o objeto que veio do banco
    expect(result).toHaveProperty('id', 'trip-123');
    expect(result).toHaveProperty('title', 'Eurotrip 2026');
  });

  // 👇 TESTE 2: Regra de Negócio (Proteção contra ID vazio)
  it('deve lançar um erro se o ID não for fornecido', async () => {
    const tripId = ''; // ID vazio!

    // Espera que a execução falhe com a mensagem exata
    await expect(useCase.execute(tripId)).rejects.toThrow("ID da viagem é obrigatório.");
    
    // Garante que não fez uma busca inútil no banco
    expect(mockTripRepository.findById).not.toHaveBeenCalled();
  });

  // 👇 TESTE 3: Regra de Negócio (Viagem não existe)
  it('deve retornar null se a viagem não for encontrada no banco', async () => {
    const tripId = 'trip-ghost';
    
    // Simulamos o Prisma não achando nada (retornando null)
    mockTripRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute(tripId);

    // O Use Case deve simplesmente repassar o null para o Controller lidar com isso (ex: retornando 404)
    expect(result).toBeNull();
    expect(mockTripRepository.findById).toHaveBeenCalledWith(tripId);
  });
});