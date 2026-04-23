// backend/src/application/use-cases/DeleteDestinationUseCase.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteDestinationUseCase } from './DeleteDestinationUseCase';

describe('DeleteDestinationUseCase', () => {
  let mockDestinationRepository: any;
  let useCase: DeleteDestinationUseCase;

  beforeEach(() => {
    // Preparamos o dublê (mock) do repositório
    mockDestinationRepository = {
      delete: vi.fn().mockResolvedValue(undefined) // Retorna undefined pois deletar não devolve dados
    };

    useCase = new DeleteDestinationUseCase(mockDestinationRepository);
  });

  // 👇 TESTE 1: Caminho Feliz
  it('deve deletar o destino com sucesso quando um ID válido for fornecido', async () => {
    const destinationId = 'dest-123';

    await useCase.execute(destinationId);

    // Verifica se o repositório foi chamado com o ID correto
    expect(mockDestinationRepository.delete).toHaveBeenCalledWith(destinationId);
    
    // Garante que a exclusão foi chamada apenas uma vez
    expect(mockDestinationRepository.delete).toHaveBeenCalledTimes(1);
  });

  // 👇 TESTE 2: Regra de Negócio (Proteção contra ID vazio)
  it('deve lançar um erro se o ID não for fornecido (string vazia)', async () => {
    const destinationId = ''; // ID em branco

    // Espera que a execução falhe com a mensagem exata
    await expect(useCase.execute(destinationId)).rejects.toThrow("O ID do destino é obrigatório.");
    
    // Garante que o banco NUNCA foi chamado com um ID inválido
    expect(mockDestinationRepository.delete).not.toHaveBeenCalled();
  });

  // 👇 TESTE 3: Resiliência e Repasse (Destino não existe no banco)
  it('deve repassar o erro se o repositório falhar na exclusão', async () => {
    const destinationId = 'dest-ghost';
    
    // Simulamos o Prisma estourando um erro de "Registro não encontrado"
    mockDestinationRepository.delete.mockRejectedValue(new Error("Record to delete does not exist."));

    // O Use Case deve apenas deixar o erro subir para o Controller
    await expect(useCase.execute(destinationId)).rejects.toThrow("Record to delete does not exist.");
  });
});