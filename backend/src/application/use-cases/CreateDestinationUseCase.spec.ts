// backend/src/application/use-cases/CreateDestinationUseCase.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDestinationUseCase } from './CreateDestinationUseCase';

describe('CreateDestinationUseCase', () => {
  // 1. Preparamos as variáveis para os nossos "Dublês"
  let mockDestinationRepository: any;
  let mockLocationService: any;
  let mockPhotoService: any;
  let useCase: CreateDestinationUseCase;

  // 2. Antes de CADA teste, "zeramos" os dublês para não vazar dados de um teste para outro
  beforeEach(() => {
    mockDestinationRepository = {
      // vi.fn() cria uma função vazia que podemos espionar
      create: vi.fn().mockResolvedValue({ id: 'fake-id', name: 'Paris', latitude: 48.85, longitude: 2.35, imageUrl: 'foto.jpg' }),
      countByTripId: vi.fn().mockResolvedValue(0) // Simula que não tem destinos ainda
    };

    mockLocationService = {
      getCoordinates: vi.fn().mockResolvedValue({ latitude: 48.85, longitude: 2.35 })
    };

    mockPhotoService = {
      getPhotoUrl: vi.fn().mockResolvedValue('foto.jpg')
    };

    // Injetamos os dublês no Caso de Uso verdadeiro!
    useCase = new CreateDestinationUseCase(
      mockDestinationRepository,
      mockLocationService,
      mockPhotoService
    );
  });

  // 👇 TESTE 1: Caminho Feliz (Deve funcionar perfeitamente)
  it('deve criar um destino com coordenadas e foto com sucesso', async () => {
    const input = {
      name: 'Paris',
      tripId: 'trip-123'
    };

    const result = await useCase.execute(input);

    // Verificamos se o serviço de localização foi chamado com "Paris"
    expect(mockLocationService.getCoordinates).toHaveBeenCalledWith('Paris');
    
    // Verificamos se o repositório foi chamado com os dados enriquecidos
    expect(mockDestinationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Paris',
      latitude: 48.85,
      imageUrl: 'foto.jpg'
    }));

    // Verificamos se a resposta do Use Case está correta
    expect(result).toHaveProperty('id', 'fake-id');
  });

  // 👇 TESTE 2: Regra de Negócio (Campos obrigatórios)
  it('deve lançar um erro se o nome do destino não for fornecido', async () => {
    const input = {
      name: '', // Nome vazio!
      tripId: 'trip-123'
    };

    // Verificamos se a função "explode" com a mensagem de erro correta
    await expect(useCase.execute(input)).rejects.toThrow("O nome do destino é obrigatório.");
    
    // Garantimos que não tentou salvar no banco se deu erro
    expect(mockDestinationRepository.create).not.toHaveBeenCalled();
  });

  // 👇 TESTE 3: Regra de Negócio (Campos obrigatórios)
  it('deve lançar um erro se o nome do destino não for fornecido', async () => {
    const input = {
      name: 'Nome do destino', // Nome vazio!
      tripId: ''
    };

    // Verificamos se a função "explode" com a mensagem de erro correta
    await expect(useCase.execute(input)).rejects.toThrow("O ID da viagem é obrigatório.");
    
    // Garantimos que não tentou salvar no banco se deu erro
    expect(mockDestinationRepository.create).not.toHaveBeenCalled();
  });

  // 👇 TESTE 4: Resiliência (APIs fora do ar)
  it('deve criar um destino mesmo se a API do Mapbox e Unsplash falharem (retornarem null)', async () => {
    // Forçamos as APIs a falharem neste teste específico
    mockLocationService.getCoordinates.mockResolvedValue(null);
    mockPhotoService.getPhotoUrl.mockResolvedValue(null);

    const input = { name: 'Atlântida', tripId: 'trip-123' };
    await useCase.execute(input);

    // Deve salvar no banco, mas com lat/lng nulos
    expect(mockDestinationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Atlântida',
      latitude: null,
      longitude: null,
      imageUrl: null
    }));
  });
});