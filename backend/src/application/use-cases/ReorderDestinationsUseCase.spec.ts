import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReorderDestinationsUseCase } from './ReorderDestinationsUseCase';
import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';

describe('ReorderDestinationsUseCase', () => {
  let mockDestinationRepo: IDestinationRepository;
  let sut: ReorderDestinationsUseCase;

  beforeEach(() => {
    // 1. Cria o dublê (Mock) do Repositório
    mockDestinationRepo = {
      countByTripId: vi.fn(),
      create: vi.fn(),
      findByTripIdOrdered: vi.fn(),
      updateOrderTransaction: vi.fn(),
      delete: vi.fn(),
    } as unknown as IDestinationRepository;

    // 2. Instancia o UseCase com o Mock
    sut = new ReorderDestinationsUseCase(mockDestinationRepo);
  });

  it('deve reordenar movendo um item de CIMA para BAIXO (Ex: Posição 0 para 2)', async () => {
    // Arrange (Preparação)
    const tripId = 'trip-123';
    
    // Fingimos que o banco retornou 3 destinos já ordenados (0, 1 e 2)
    const mockDestinations = [
      { id: 'dest-A', order: 0 }, // Estava no topo
      { id: 'dest-B', order: 1 },
      { id: 'dest-C', order: 2 }
    ];
    vi.mocked(mockDestinationRepo.findByTripIdOrdered).mockResolvedValue(mockDestinations);

    // Act (Ação: O usuário arrastou o Destino A para o final da lista)
    await sut.execute({ tripId, startIndex: 0, endIndex: 2 });

    // Assert (Verificação)
    // A nova ordem esperada na tela é: B, C, A.
    // O UseCase tem que mandar atualizar o banco com essa nova ordem.
    expect(mockDestinationRepo.findByTripIdOrdered).toHaveBeenCalledWith('trip-123');
    
    expect(mockDestinationRepo.updateOrderTransaction).toHaveBeenCalledWith([
      { id: 'dest-B', order: 0 }, // B subiu
      { id: 'dest-C', order: 1 }, // C subiu
      { id: 'dest-A', order: 2 }  // A caiu para o final
    ]);
  });

  it('deve reordenar movendo um item de BAIXO para CIMA (Ex: Posição 2 para 0)', async () => {
    // Arrange
    const tripId = 'trip-123';
    
    const mockDestinations = [
      { id: 'dest-A', order: 0 }, 
      { id: 'dest-B', order: 1 },
      { id: 'dest-C', order: 2 }  // Estava no final
    ];
    vi.mocked(mockDestinationRepo.findByTripIdOrdered).mockResolvedValue(mockDestinations);

    // Act (Ação: O usuário arrastou o Destino C para o topo da lista)
    await sut.execute({ tripId, startIndex: 2, endIndex: 0 });

    // Assert
    // A nova ordem esperada na tela é: C, A, B.
    expect(mockDestinationRepo.updateOrderTransaction).toHaveBeenCalledWith([
      { id: 'dest-C', order: 0 }, // C foi pro topo
      { id: 'dest-A', order: 1 }, // A desceu um pouco
      { id: 'dest-B', order: 2 }  // B desceu um pouco
    ]);
  });

  it('não deve quebrar se a lista estiver vazia (proteção de resiliência)', async () => {
    // Arrange
    vi.mocked(mockDestinationRepo.findByTripIdOrdered).mockResolvedValue([]);

    // Act
    await sut.execute({ tripId: 'trip-123', startIndex: 0, endIndex: 1 });

    // Assert
    // Se não há destinos, ele manda uma transação vazia sem quebrar a aplicação
    expect(mockDestinationRepo.updateOrderTransaction).toHaveBeenCalledWith([]);
  });
});