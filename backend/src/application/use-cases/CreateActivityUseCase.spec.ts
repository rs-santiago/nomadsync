// backend/src/application/use-cases/CreateActivityUseCase.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateActivityUseCase } from './CreateActivityUseCase';
import { CreateActivityData } from '../../domain/repositories/IActivityRepository';

describe('CreateActivityUseCase', () => {
  // 1. Variáveis para o Dublê e para o Use Case
  let mockActivityRepository: any;
  let useCase: CreateActivityUseCase;

  // 2. Antes de cada teste, instanciamos o dublê zerado
  beforeEach(() => {
    mockActivityRepository = {
      // Simulamos a criação no banco retornando um objeto com ID
      create: vi.fn().mockResolvedValue({
        id: 'act-123',
        title: 'Visita ao Museu do Louvre',
        type: 'museum',
        destinationId: 'dest-456'
      })
    };

    useCase = new CreateActivityUseCase(mockActivityRepository);
  });

  // 👇 TESTE 1: Caminho Feliz
  it('deve criar uma atividade com sucesso', async () => {
    const input: CreateActivityData = {
      title: 'Visita ao Museu do Louvre',
      type: 'museum',
      destinationId: 'dest-456',
      category: 'cultural',
    };

    const result = await useCase.execute(input);

    // Verifica se o repositório foi chamado corretamente com os dados de entrada
    expect(mockActivityRepository.create).toHaveBeenCalledWith(input);
    expect(mockActivityRepository.create).toHaveBeenCalledTimes(1);
    
    // Verifica se o retorno tem o ID gerado pelo "banco"
    expect(result).toHaveProperty('id', 'act-123');
    expect(result.title).toBe(input.title);
  });

  // 👇 TESTE 2: Regra de Negócio (Título obrigatório)
  it('deve lançar um erro se o título da atividade não for fornecido', async () => {
    const input: CreateActivityData = {
      title: '', // Título vazio
      type: 'museum',
      destinationId: 'dest-456',
      category: 'cultural',
    };

    // Verifica se a exceção é lançada com a mensagem exata
    await expect(useCase.execute(input)).rejects.toThrow("O título da atividade é obrigatório.");
    
    // Garante que o banco não foi chamado
    expect(mockActivityRepository.create).not.toHaveBeenCalled();
  });

  // 👇 TESTE 3: Regra de Negócio (Destino obrigatório)
  it('deve lançar um erro se o ID do destino não for fornecido', async () => {
    const input: CreateActivityData = {
      title: 'Visita ao Museu do Louvre',
      type: 'museum',
      destinationId: '', // Sem destino associado
      category: 'cultural',
    };

    // Verifica se a exceção é lançada com a mensagem exata
    await expect(useCase.execute(input)).rejects.toThrow("O ID do destino é obrigatório.");
    
    // Garante que o banco não foi chamado
    expect(mockActivityRepository.create).not.toHaveBeenCalled();
  });
});