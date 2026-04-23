import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JoinTripUseCase } from './JoinTripUseCase';

describe('JoinTripUseCase', () => {
  // 1. Criamos a variável pro nosso Dublê (Mock)
  let mockTripRepository: any;
  let useCase: JoinTripUseCase;

  // 2. Zeramos o dublê antes de cada teste
  beforeEach(() => {
    mockTripRepository = {
      findById: vi.fn(),
      addParticipant: vi.fn()
    };

    useCase = new JoinTripUseCase(mockTripRepository);
  });

  // 👇 TESTE 1: O Caminho Feliz (Novo usuário entra)
  it('deve adicionar um novo participante com sucesso', async () => {
    // Simulamos que o banco encontrou uma viagem onde o dono é o 'joao'
    mockTripRepository.findById.mockResolvedValue({
      id: 'trip-123',
      ownerId: 'joao',
      participants: ['maria'] 
    });

    // O 'pedro' tenta entrar
    const result = await useCase.execute({ userId: 'pedro', tripId: 'trip-123' });

    // Verificamos se o repositório foi chamado para salvar o pedro
    expect(mockTripRepository.addParticipant).toHaveBeenCalledWith('trip-123', 'pedro');
    expect(result.message).toBe("Convite aceito com sucesso!");
  });

  // 👇 TESTE 2: Regra de Negócio (Dono tentando entrar via link)
  it('não deve chamar o addParticipant se o usuário já for o dono da viagem', async () => {
    mockTripRepository.findById.mockResolvedValue({
      id: 'trip-123',
      ownerId: 'joao', // O dono é o joao
      participants: []
    });

    // O 'joao' clica no próprio link de convite
    const result = await useCase.execute({ userId: 'joao', tripId: 'trip-123' });

    // Garantimos que a função de salvar NO BANCO NUNCA foi chamada
    expect(mockTripRepository.addParticipant).not.toHaveBeenCalled();
    expect(result.message).toBe("Você já faz parte desta viagem!");
  });

  // 👇 TESTE 3: Regra de Negócio (Participante clicando de novo no link)
  it('não deve chamar o addParticipant se o usuário já estiver na lista de participantes', async () => {
    mockTripRepository.findById.mockResolvedValue({
      id: 'trip-123',
      ownerId: 'joao',
      participants: ['maria'] // A maria já está na viagem
    });

    // A 'maria' clica no link de novo
    const result = await useCase.execute({ userId: 'maria', tripId: 'trip-123' });

    // Garantimos que não duplicou no banco
    expect(mockTripRepository.addParticipant).not.toHaveBeenCalled();
    expect(result.message).toBe("Você já faz parte desta viagem!");
  });

  // 👇 TESTE 4: Validação de Erro
  it('deve lançar erro se a viagem não existir', async () => {
    // Simulamos o Prisma não encontrando a viagem (retorna null)
    mockTripRepository.findById.mockResolvedValue(null);

    // Verificamos se o Use Case "explode" do jeito certo
    await expect(useCase.execute({ userId: 'pedro', tripId: 'trip-ghost' }))
      .rejects.toThrow("Viagem não encontrada.");
  });
});