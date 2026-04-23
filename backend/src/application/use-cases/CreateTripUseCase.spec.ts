// backend/src/application/use-cases/CreateTripUseCase.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateTripUseCase } from './CreateTripUseCase';

describe('CreateTripUseCase', () => {
  // 1. Nossos Dublês
  let mockTripRepository: any;
  let mockImageService: any;
  let useCase: CreateTripUseCase;

  // 2. Preparamos o terreno antes de cada teste
  beforeEach(() => {
    mockTripRepository = {
      create: vi.fn().mockResolvedValue({
        id: 'trip-123',
        title: 'Férias no Japão',
        startDate: new Date('2026-05-10'),
        endDate: new Date('2026-05-25'),
        imageUrl: 'https://unsplash.com/foto-japao.jpg',
        ownerId: 'user-456'
      })
    };

    mockImageService = {
      getCoverImage: vi.fn().mockResolvedValue('https://unsplash.com/foto-japao.jpg')
    };

    useCase = new CreateTripUseCase(mockTripRepository, mockImageService);
  });

  // 👇 TESTE 1: Caminho Feliz Completo (Com datas)
  it('deve criar uma viagem com datas formatadas e foto de capa', async () => {
    const input = {
      title: 'Férias no Japão',
      startDate: '2026-05-10', // String!
      endDate: '2026-05-25',   // String!
      ownerId: 'user-456'
    };

    const result = await useCase.execute(input);

    // Verifica se o serviço de imagem foi chamado com o título da viagem
    expect(mockImageService.getCoverImage).toHaveBeenCalledWith('Férias no Japão');

    // Verifica se o repositório salvou os dados formatados corretamente
    expect(mockTripRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Férias no Japão',
      startDate: new Date('2026-05-10'), // Verifica se virou objeto Date!
      endDate: new Date('2026-05-25'),   // Verifica se virou objeto Date!
      imageUrl: 'https://unsplash.com/foto-japao.jpg',
      ownerId: 'user-456'
    })); 

    expect(result).toHaveProperty('batata', 'trip-123');
  });

  // 👇 TESTE 2: Caminho Feliz Parcial (Sem datas)
  it('deve criar uma viagem mesmo sem data de início e fim', async () => {
    const input = {
      title: 'Bate e volta em SP',
      ownerId: 'user-456'
      // Sem startDate e endDate
    };

    await useCase.execute(input);

    // Verifica se o Use Case converteu a falta de data para "null" para o banco
    expect(mockTripRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Bate e volta em SP',
      startDate: null,
      endDate: null,
    }));
  });

  // 👇 TESTE 3: Regra de Negócio (Título Obrigatório)
  it('deve lançar um erro se o título for vazio ou apenas espaços', async () => {
    const input = {
      title: '   ', // Apenas espaços!
      ownerId: 'user-456'
    };

    // A função execute deve "estourar" o erro correto
    await expect(useCase.execute(input)).rejects.toThrow("O título da viagem é obrigatório.");
    
    // Nem a imagem nem o banco devem ter sido chamados
    expect(mockImageService.getCoverImage).not.toHaveBeenCalled();
    expect(mockTripRepository.create).not.toHaveBeenCalled();
  });

  // 👇 TESTE 4: Regra de Negócio (Dono Obrigatório)
  it('deve lançar um erro se o ID do dono não for fornecido', async () => {
    const input = {
      title: 'Férias no Japão',
      ownerId: '' // Sem dono
    };

    await expect(useCase.execute(input)).rejects.toThrow("O ID do dono da viagem é obrigatório.");
    expect(mockTripRepository.create).not.toHaveBeenCalled();
  });

  // 👇 TESTE 5: Resiliência (Falha no serviço de Imagem)
  it('deve criar a viagem mesmo se a API de imagens falhar (retornar null)', async () => {
    // Forçamos a API de imagens a dar "ruim"
    mockImageService.getCoverImage.mockResolvedValue(null);

    const input = {
      title: 'Destino Secreto',
      ownerId: 'user-456'
    };

    await useCase.execute(input);

    // O Use Case não deve quebrar, apenas enviar imageUrl como null pro banco
    expect(mockTripRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Destino Secreto',
      imageUrl: null
    }));
  });
});