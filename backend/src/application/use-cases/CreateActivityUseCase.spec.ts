// backend/src/application/use-cases/CreateActivityUseCase.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateActivityUseCase } from './CreateActivityUseCase';
import { CreateActivityData, IActivityRepository } from '../../domain/repositories/IActivityRepository';

describe('CreateActivityUseCase', () => {
  // 1. Variáveis para o Dublê e para o Use Case
  let mockActivityRepository: IActivityRepository;
  let useCase: CreateActivityUseCase;

  // 2. Antes de cada teste, instanciamos o dublê zerado
  beforeEach(() => {
    mockActivityRepository = {
      // Simulamos a criação no banco retornando um objeto com ID
      create: vi.fn().mockResolvedValue({
        id: 'act-123',
        title: 'Visita ao Museu do Louvre',
        type: 'museum',
        destinationId: 'dest-456',
        isAiGenerated: false // 👈 Simula o retorno correto do banco
      }),
      // Adicionamos funções vazias para respeitar a interface
      delete: vi.fn(), 
    } as unknown as IActivityRepository;

    useCase = new CreateActivityUseCase(mockActivityRepository);
  });

  // 👇 TESTE 1: Caminho Feliz (Atualizado com a regra da IA)
  it('deve criar uma atividade manual com sucesso e definir isAiGenerated como false', async () => {
    const input: CreateActivityData = {
      title: 'Visita ao Museu do Louvre',
      type: 'museum',
      destinationId: 'dest-456',
      category: 'cultural',
    };

    const result = await useCase.execute(input);

    // 👈 A MÁGICA: Verifica se o UseCase injetou o isAiGenerated: false antes de salvar
    expect(mockActivityRepository.create).toHaveBeenCalledWith({
      ...input,
      isAiGenerated: false
    });
    expect(mockActivityRepository.create).toHaveBeenCalledTimes(1);
    
    // Verifica se o retorno tem o ID gerado pelo "banco"
    expect(result).toHaveProperty('id', 'act-123');
    expect(result.title).toBe(input.title);
    expect(result.isAiGenerated).toBe(false);
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