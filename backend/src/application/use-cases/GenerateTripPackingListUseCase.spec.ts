import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateTripPackingListUseCase } from './GenerateTripPackingListUseCase';
import { ITripRepository } from '../../domain/repositories/ITripRepository';
import { IAIService } from '../../domain/services/IAIService';

describe('GenerateTripPackingListUseCase', () => {
  let mockTripRepo: ITripRepository;
  let mockAIService: IAIService;
  let sut: GenerateTripPackingListUseCase;

  beforeEach(() => {
    // 1. Criamos os Mocks
    mockTripRepo = {
      findById: vi.fn(),
      // ... outras funções da interface podem ser omitidas ou declaradas como vi.fn()
    } as unknown as ITripRepository;

    mockAIService = {
      generatePackingList: vi.fn(),
    } as unknown as IAIService;

    // 2. Injetamos os mocks
    sut = new GenerateTripPackingListUseCase(mockAIService, mockTripRepo);
  });

  // 👇 TESTE 1: Caminho Feliz COM Data (Verifica formatação do mês)
  it('deve extrair destinos, atividades e o mês (se existir data) para gerar a lista', async () => {
    // Arrange
    const tripId = 'trip-123';
    const mockTripFromDB = {
      id: tripId,
      startDate: new Date('2026-07-15T10:00:00Z'), // Data no meio de Julho
      destinations: [
        {
          name: 'Bariloche',
          activities: [{ title: 'Esquiar no Cerro Catedral' }]
        },
        {
          name: 'Buenos Aires',
          activities: [{ title: 'Show de Tango' }, { title: 'Jantar em Puerto Madero' }]
        }
      ]
    };

    vi.mocked(mockTripRepo.findById).mockResolvedValue(mockTripFromDB as any);

    const mockExpectedPackingList = {
      weatherCondition: 'Muito Frio e Neve',
      temperature: '-5°C a 5°C',
      checklist: { clothing: ['Casaco térmico'], essentials: [], gadgets: [] },
      tip: 'Leve hidratante labial.'
    };
    vi.mocked(mockAIService.generatePackingList).mockResolvedValue(mockExpectedPackingList);

    // Act
    const result = await sut.execute(tripId);

    // Assert
    expect(mockTripRepo.findById).toHaveBeenCalledWith(tripId);
    
    // A MÁGICA: Verifica se formatou o mês corretamente ('julho') e juntou os destinos
    expect(mockAIService.generatePackingList).toHaveBeenCalledWith(
      'Bariloche e Buenos Aires', // Nomes concatenados
      'julho',                    // Mês formatado
      ['Esquiar no Cerro Catedral', 'Show de Tango', 'Jantar em Puerto Madero'] // Array flat de atividades
    );
    expect(result).toEqual(mockExpectedPackingList);
  });

  // 👇 TESTE 2: Caminho Feliz SEM Data
  it('deve usar "época atual" se a viagem não tiver data de início definida', async () => {
    const tripId = 'trip-456';
    const mockTripFromDB = {
      id: tripId,
      startDate: null, // Sem data!
      destinations: [
        { name: 'Rio de Janeiro', activities: [] }
      ]
    };

    vi.mocked(mockTripRepo.findById).mockResolvedValue(mockTripFromDB as any);
    vi.mocked(mockAIService.generatePackingList).mockResolvedValue({} as any);

    await sut.execute(tripId);

    // Verifica se passou a string fallback
    expect(mockAIService.generatePackingList).toHaveBeenCalledWith(
      'Rio de Janeiro',
      'época atual',
      []
    );
  });

  // 👇 TESTE 3: Regra de Negócio (Viagem Inexistente)
  it('deve lançar erro se a viagem não for encontrada', async () => {
    vi.mocked(mockTripRepo.findById).mockResolvedValue(null);

    await expect(sut.execute('invalid-trip')).rejects.toThrow("Viagem não encontrada");
    expect(mockAIService.generatePackingList).not.toHaveBeenCalled();
  });

  // 👇 TESTE 4: Regra de Negócio (Viagem Vazia)
  it('deve lançar erro se a viagem não tiver nenhum destino cadastrado', async () => {
    const mockTripFromDB = {
      id: 'trip-789',
      destinations: [] // Array vazio
    };

    vi.mocked(mockTripRepo.findById).mockResolvedValue(mockTripFromDB as any);

    await expect(sut.execute('trip-789')).rejects.toThrow("Adicione pelo menos um destino para gerar a bagagem.");
    expect(mockAIService.generatePackingList).not.toHaveBeenCalled();
  });
});