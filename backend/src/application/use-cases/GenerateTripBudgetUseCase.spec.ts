import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateTripBudgetUseCase } from './GenerateTripBudgetUseCase';
import { ITripRepository } from '../../domain/repositories/ITripRepository';
import { IAIService } from '../../domain/services/IAIService';

describe('GenerateTripBudgetUseCase', () => {
  let mockTripRepo: ITripRepository;
  let mockAIService: IAIService;
  let sut: GenerateTripBudgetUseCase; // System Under Test

  beforeEach(() => {
    // 1. Criamos os dublês (Mocks)
    mockTripRepo = {
      findById: vi.fn(),
      create: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      addParticipant: vi.fn(),
    } as unknown as ITripRepository;

    mockAIService = {
      estimateBudget: vi.fn(),
      generateActivities: vi.fn(),
    } as unknown as IAIService;

    // 2. Injetamos os mocks no nosso Caso de Uso
    sut = new GenerateTripBudgetUseCase(mockAIService, mockTripRepo);
  });

  it('deve extrair atividades de múltiplos destinos e gerar o orçamento via IA', async () => {
    // Arrange (Preparação)
    const tripId = 'trip-123';
    
    // Fingimos que o banco retornou uma viagem com 2 destinos e 3 atividades no total
    const mockTripFromDB = {
      id: tripId,
      destinations: [
        {
          id: 'dest-1',
          name: 'Paris',
          activities: [
            { title: 'Torre Eiffel', type: 'museum' },
            { title: 'Croissant na Padaria', type: 'restaurant' }
          ]
        },
        {
          id: 'dest-2',
          name: 'Versalhes',
          activities: [
            { title: 'Castelo de Versalhes', type: 'museum' }
          ]
        }
      ]
    };
    
    // Configuramos o mock do banco para retornar nossa viagem falsa
    vi.mocked(mockTripRepo.findById).mockResolvedValue(mockTripFromDB as any);

    // Configuramos o mock da IA para retornar um orçamento falso
    const mockExpectedBudget = {
      currency: 'EUR',
      total: 300,
      breakdown: { food: 50, transport: 50, leisure: 100, accommodation: 100 },
      tips: 'Compre o Paris Pass.'
    };
    vi.mocked(mockAIService.estimateBudget).mockResolvedValue(mockExpectedBudget);

    // Act (Ação)
    const result = await sut.execute(tripId, 'Paris', 'EUR', 5);

    // Assert (Verificações)
    // 1. Garante que buscou a viagem certa
    expect(mockTripRepo.findById).toHaveBeenCalledWith(tripId);

    // 2. A MÁGICA: Garante que o flatMap funcionou e a IA recebeu uma lista única com as 3 atividades!
    expect(mockAIService.estimateBudget).toHaveBeenCalledWith(
      'Paris',
      5,
      [
        { title: 'Torre Eiffel', type: 'museum' },
        { title: 'Croissant na Padaria', type: 'restaurant' },
        { title: 'Castelo de Versalhes', type: 'museum' }
      ],
      'EUR'
    );

    // 3. Garante que o caso de uso devolveu o resultado da IA intacto
    expect(result).toEqual(mockExpectedBudget);
  });

  it('deve lançar um erro se a viagem não for encontrada no banco de dados', async () => {
    // Arrange: Simulamos que o banco não achou nada (retornou null)
    vi.mocked(mockTripRepo.findById).mockResolvedValue(null);

    // Act & Assert: Tentamos executar e esperamos que ele quebre com a mensagem certa
    await expect(sut.execute('trip-invalida', 'Paris', 'USD', 5))
      .rejects.toThrow("Viagem não encontrada");

    // Garante que a IA não foi chamada à toa, economizando dinheiro de API!
    expect(mockAIService.estimateBudget).not.toHaveBeenCalled();
  });
});