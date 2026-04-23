// backend/src/application/use-cases/ListTripsUseCase.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListTripsUseCase } from './ListTripsUseCase';

describe('ListTripsUseCase', () => {
  let mockTripRepository: any;
  let useCase: ListTripsUseCase;

  beforeEach(() => {
    // Preparamos o dublê (mock) do repositório
    mockTripRepository = {
      // Simulamos o banco retornando um array de viagens para o usuário
      findAll: vi.fn().mockResolvedValue([
        { id: 'trip-1', title: 'Eurotrip', ownerId: 'user-789' },
        { id: 'trip-2', title: 'Férias no Chile', ownerId: 'user-789' }
      ])
    };

    useCase = new ListTripsUseCase(mockTripRepository);
  });

  // 👇 TESTE 1: Caminho Feliz (Usuário com viagens)
  it('deve retornar a lista de viagens de um usuário com sucesso', async () => {
    const ownerId = 'user-789';

    const result = await useCase.execute(ownerId);

    // Verifica se o repositório foi chamado corretamente com o ID do usuário
    expect(mockTripRepository.findAll).toHaveBeenCalledWith(ownerId);
    expect(mockTripRepository.findAll).toHaveBeenCalledTimes(1);

    // Verifica se retornou o array corretamente
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('title', 'Eurotrip');
  });

  // 👇 TESTE 2: Regra de Negócio (Proteção contra ownerId vazio)
  it('deve lançar um erro se o ID do usuário não for fornecido', async () => {
    const ownerId = ''; // String vazia!

    // Espera que a execução falhe com a mensagem exata
    await expect(useCase.execute(ownerId)).rejects.toThrow("ID do usuário é obrigatório.");
    
    // Garante que o banco nunca foi consultado
    expect(mockTripRepository.findAll).not.toHaveBeenCalled();
  });

  // 👇 TESTE 3: Regra de Negócio (Usuário novo, sem viagens)
  it('deve retornar um array vazio se o usuário não tiver nenhuma viagem cadastrada', async () => {
    const ownerId = 'user-novo';

    // Simulamos o Prisma não encontrando nada para esse usuário
    mockTripRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute(ownerId);

    // Verifica se o Use Case repassou o array vazio pacificamente
    expect(mockTripRepository.findAll).toHaveBeenCalledWith(ownerId);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});