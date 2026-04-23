// backend/src/application/use-cases/DeleteActivityUseCase.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteActivityUseCase } from './DeleteActivityUseCase';

describe('DeleteActivityUseCase', () => {
  let mockActivityRepository: any;
  let useCase: DeleteActivityUseCase;

  beforeEach(() => {
    mockActivityRepository = {
      // Como o delete não costuma retornar nada de útil (só sucesso), mockamos sem valor de retorno
      delete: vi.fn().mockResolvedValue(undefined)
    };

    useCase = new DeleteActivityUseCase(mockActivityRepository);
  });

  // 👇 TESTE 1: Caminho Feliz
  it('deve deletar a atividade com sucesso quando um ID válido for fornecido', async () => {
    const activityId = 'act-123';

    await useCase.execute(activityId);

    // Verifica se o repositório foi chamado com o ID correto
    expect(mockActivityRepository.delete).toHaveBeenCalledWith(activityId);
    
    // Garante que a exclusão foi chamada apenas uma vez
    expect(mockActivityRepository.delete).toHaveBeenCalledTimes(1);
  });

  // 👇 TESTE 2: Regra de Negócio (Proteção contra ID vazio)
  it('deve lançar um erro se o ID não for fornecido (string vazia)', async () => {
    const activityId = ''; // ID vazio!

    // Espera que a execução falhe com a mensagem específica
    await expect(useCase.execute(activityId)).rejects.toThrow("O ID da atividade é obrigatório.");
    
    // O mais importante do teste de delete: garante que o comando NÃO foi pro banco!
    expect(mockActivityRepository.delete).not.toHaveBeenCalled();
  });

  // 👇 TESTE 3: Resiliência (Repasse de erro do banco)
  it('deve repassar o erro se o repositório falhar (ex: atividade não encontrada)', async () => {
    const activityId = 'act-ghost';
    
    // Simulamos que o Prisma tentou deletar algo que não existe e estourou um erro
    mockActivityRepository.delete.mockRejectedValue(new Error("Record to delete does not exist."));

    // O Use Case não trata esse erro internamente, ele deve apenas repassar para o Controller
    await expect(useCase.execute(activityId)).rejects.toThrow("Record to delete does not exist.");
  });
});