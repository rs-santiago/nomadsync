// backend/src/application/use-cases/DeleteTripUseCase.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteTripUseCase } from './DeleteTripUseCase';

describe('DeleteTripUseCase', () => {
  let mockTripRepository: any;
  let useCase: DeleteTripUseCase;

  beforeEach(() => {
    // Preparamos o dublê (mock) do repositório
    mockTripRepository = {
      delete: vi.fn().mockResolvedValue(undefined) 
    };

    useCase = new DeleteTripUseCase(mockTripRepository);
  });

  // 👇 TESTE 1: Caminho Feliz
  it('deve deletar a viagem com sucesso quando um ID válido for fornecido', async () => {
    const tripId = 'trip-123';

    await useCase.execute(tripId);

    // Verifica se o repositório foi chamado com o ID correto
    expect(mockTripRepository.delete).toHaveBeenCalledWith(tripId);
    expect(mockTripRepository.delete).toHaveBeenCalledTimes(1);
  });

  // 👇 TESTE 2: Regra de Negócio (Proteção contra null)
  it('deve lançar um erro se o ID for null', async () => {
    const tripId = null;

    // Espera que a execução falhe com a mensagem exata
    await expect(useCase.execute(tripId)).rejects.toThrow("O ID da viagem é obrigatório para exclusão.");
    
    // Garante que o banco NUNCA foi chamado
    expect(mockTripRepository.delete).not.toHaveBeenCalled();
  });

  // 👇 TESTE 3: Regra de Negócio (Proteção contra string vazia)
  it('deve lançar um erro se o ID for uma string vazia', async () => {
    const tripId = ''; 

    await expect(useCase.execute(tripId)).rejects.toThrow("O ID da viagem é obrigatório para exclusão.");
    expect(mockTripRepository.delete).not.toHaveBeenCalled();
  });

  // 👇 TESTE 4: Resiliência e Repasse (Viagem não existe no banco)
  it('deve repassar o erro se o repositório falhar na exclusão', async () => {
    const tripId = 'trip-ghost';
    
    // Simulamos o Prisma estourando um erro de "Registro não encontrado"
    mockTripRepository.delete.mockRejectedValue(new Error("Record to delete does not exist."));

    // O Use Case deve apenas deixar o erro subir para o Controller
    await expect(useCase.execute(tripId)).rejects.toThrow("Record to delete does not exist.");
  });
});