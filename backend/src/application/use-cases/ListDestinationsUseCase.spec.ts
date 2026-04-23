// backend/src/application/use-cases/ListDestinationsUseCase.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListDestinationsUseCase } from './ListDestinationsUseCase';

describe('ListDestinationsUseCase', () => {
  let mockDestinationRepository: any;
  let useCase: ListDestinationsUseCase;

  beforeEach(() => {
    // Preparamos o dublê (mock) do repositório
    mockDestinationRepository = {
      // Simulamos o banco retornando um array de destinos
      findByTripIdOrdered: vi.fn().mockResolvedValue([
        { id: 'dest-1', name: 'Paris', tripId: 'trip-123' },
        { id: 'dest-2', name: 'Londres', tripId: 'trip-123' }
      ])
    };

    useCase = new ListDestinationsUseCase(mockDestinationRepository);
  });

  // 👇 TESTE 1: Caminho Feliz (Viagem com destinos)
  it('deve retornar a lista de destinos de uma viagem com sucesso', async () => {
    const tripId = 'trip-123';

    const result = await useCase.execute(tripId);

    // Verifica se o repositório foi chamado corretamente com o ID da viagem
    expect(mockDestinationRepository.findByTripIdOrdered).toHaveBeenCalledWith(tripId);
    expect(mockDestinationRepository.findByTripIdOrdered).toHaveBeenCalledTimes(1);

    // Verifica se retornou um array e se tem os dados certos
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('name', 'Paris');
  });

  // 👇 TESTE 2: Regra de Negócio (Proteção contra tripId vazio)
  it('deve lançar um erro se o ID da viagem não for fornecido', async () => {
    const tripId = ''; // String vazia!

    // Espera que a execução falhe com a mensagem exata
    await expect(useCase.execute(tripId)).rejects.toThrow("O ID da viagem é obrigatório para listar destinos.");
    
    // Garante que o banco nunca foi consultado
    expect(mockDestinationRepository.findByTripIdOrdered).not.toHaveBeenCalled();
  });

  // 👇 TESTE 3: Regra de Negócio (Viagem sem destinos)
  it('deve retornar um array vazio se a viagem não tiver destinos cadastrados', async () => {
    const tripId = 'trip-nova';

    // Simulamos o Prisma não encontrando nada (retorna array vazio)
    mockDestinationRepository.findByTripIdOrdered.mockResolvedValue([]);

    const result = await useCase.execute(tripId);

    // Verifica se o Use Case lidou bem com a falta de dados e repassou o array vazio
    expect(mockDestinationRepository.findByTripIdOrdered).toHaveBeenCalledWith(tripId);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0); // Garante que a lista está vazia
  });
});