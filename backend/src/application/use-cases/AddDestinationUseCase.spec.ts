import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddDestinationUseCase } from './AddDestinationUseCase';
import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';

describe('AddDestinationUseCase', () => {
  // Variáveis para guardar nossas instâncias limpas a cada teste
  let mockDestinationRepo: IDestinationRepository;
  let sut: AddDestinationUseCase; // SUT = System Under Test (Sistema Sob Teste)

  beforeEach(() => {
    // 1. Criamos um "Dublê" (Mock) do Repositório antes de cada teste
    mockDestinationRepo = {
      countByTripId: vi.fn(),
      create: vi.fn(),
      findByTripIdOrdered: vi.fn(),
      updateOrderTransaction: vi.fn(),
      delete: vi.fn(),
    } as unknown as IDestinationRepository;

    // 2. Injetamos o dublê no Use Case
    sut = new AddDestinationUseCase(mockDestinationRepo);
  });

  it('deve criar um destino com a ordem correta baseada na contagem atual', async () => {
    // Arrange (Preparação)
    const requestData = { id: 'dest-1', name: 'Paris', tripId: 'trip-123' };
    
    // Fingimos que o banco de dados tem 2 destinos atualmente
    vi.mocked(mockDestinationRepo.countByTripId).mockResolvedValue(2);
    
    // Fingimos a resposta de criação
    vi.mocked(mockDestinationRepo.create).mockResolvedValue({ 
      ...requestData, 
      order: 2 
    });

    // Act (Ação)
    const result = await sut.execute(requestData);

    // Assert (Verificação)
    // Garante que o Use Case perguntou ao banco quantos destinos existiam na viagem 'trip-123'
    expect(mockDestinationRepo.countByTripId).toHaveBeenCalledWith('trip-123');
    
    // A MÁGICA AQUI: Garante que ele mandou salvar com a "order: 2"
    expect(mockDestinationRepo.create).toHaveBeenCalledWith({
      id: 'dest-1',
      name: 'Paris',
      tripId: 'trip-123',
      order: 2 
    });
    
    expect(result.order).toBe(2);
  });

  it('deve lançar um erro se o nome do destino não for fornecido', async () => {
    // Arrange (Preparação de um dado inválido)
    const invalidData = { id: 'dest-2', name: '', tripId: 'trip-123' };

    // Act & Assert (Tenta executar e espera que quebre com a mensagem exata)
    await expect(sut.execute(invalidData)).rejects.toThrow("O nome do destino é obrigatório.");
    
    // Garante que o banco de dados NUNCA foi chamado (proteção de performance/segurança)
    expect(mockDestinationRepo.countByTripId).not.toHaveBeenCalled();
    expect(mockDestinationRepo.create).not.toHaveBeenCalled();
  });
});