import { describe, it, expect, vi } from 'vitest';
import { GenerateTripItineraryUseCase } from './GenerateTripItineraryUseCase';
import { IAIService } from '../../domain/services/IAIService';
import { IActivityRepository } from '../../domain/repositories/IActivityRepository';

// 1. Novo Mock: Agora "fingimos" ser o Repositório, e não o Prisma direto!
const mockActivityRepo: IActivityRepository = {
  create: vi.fn((data) => Promise.resolve({ id: 'fake-id', ...data })),
  // Se a sua interface tiver delete, update, etc, você pode adicionar mock vazio aqui:
  // delete: vi.fn(),
  // findByDestination: vi.fn(),
} as any;

// 2. Mock do Serviço de IA
const mockAIService: IAIService = {
  generateActivities: vi.fn().mockResolvedValue([
    { title: 'Torre Eiffel', category: 'CULTURE', description: 'Vista incrível' },
    { title: 'Café Parisien', category: 'FOOD', description: 'Croissant clássico' }
  ]),
  estimateBudget: vi.fn().mockResolvedValue({
    currency: 'USD',
    total: 500,
    breakdown: {
      food: 150,
      transport: 100,
      leisure: 200,
      accommodation: 50
    },
    tips: 'Considere comprar um passe de transporte para economizar!'
  }),
  generatePackingList: vi.fn().mockResolvedValue([
    'Camisetas leves',
    'Tênis confortável',
    'Adaptador de tomada',
    'Câmera fotográfica'
  ])
};

describe('GenerateTripItineraryUseCase', () => {
  it('deve gerar atividades via IA e mapear as categorias corretamente', async () => {
    
    // 👇 AQUI ESTAVA O ERRO! Agora passamos o Repo primeiro e a IA em segundo
    const useCase = new GenerateTripItineraryUseCase(mockAIService, mockActivityRepo);
    
    const result = await useCase.execute('dest-123', 'Paris');

    // Verifica se a IA foi chamada corretamente
    expect(mockAIService.generateActivities).toHaveBeenCalledWith('Paris', 3);
    
    // Verifica se salvou as 2 atividades mapeando categorias para types exigidos pelo banco
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('museum'); 
    expect(result[0].isAiGenerated).toBe(true); // Flag da IA garantida!
    expect(result[1].type).toBe('restaurant'); 
  });
});