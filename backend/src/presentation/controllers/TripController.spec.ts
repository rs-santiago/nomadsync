// backend/src/presentation/controllers/TripController.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TripController } from './TripController';

describe('TripController', () => {
  // 1. Dublês dos 5 Casos de Uso
  let mockCreateTripUseCase: any;
  let mockJoinTripUseCase: any;
  let mockListTripsUseCase: any;
  let mockGetTripsUseCase: any;
  let mockDeleteTripUseCase: any;
  let controller: TripController;

  // 2. Dublês do Express
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    // Inicializa os mocks dos Casos de Uso com vi.fn()
    mockCreateTripUseCase = { execute: vi.fn() };
    mockJoinTripUseCase = { execute: vi.fn() };
    mockListTripsUseCase = { execute: vi.fn() };
    mockGetTripsUseCase = { execute: vi.fn() };
    mockDeleteTripUseCase = { execute: vi.fn() };

    controller = new TripController(
      mockCreateTripUseCase,
      mockJoinTripUseCase,
      mockListTripsUseCase,
      mockGetTripsUseCase,
      mockDeleteTripUseCase
    );

    // Prepara o Request falso com a estrutura do Clerk (req.auth)
    mockReq = {
      body: {},
      params: {},
      auth: { userId: 'user-auth-123' } // Simulando o ID vindo do middleware de autenticação
    };

    // Prepara o Response falso
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn()
    };
  });

  // 👇 TESTES DO CREATE (POST /trips)
  describe('handleCreate', () => {
    it('deve retornar 201 e a viagem criada no sucesso', async () => {
      mockReq.body = { title: 'Japão', startDate: '2026-01-01', endDate: '2026-01-15' };
      const viagemCriada = { id: 'trip-1', title: 'Japão' };
      mockCreateTripUseCase.execute.mockResolvedValue(viagemCriada);

      await controller.handleCreate(mockReq, mockRes);

      expect(mockCreateTripUseCase.execute).toHaveBeenCalledWith({
        title: 'Japão',
        startDate: '2026-01-01',
        endDate: '2026-01-15',
        ownerId: 'user-auth-123'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(viagemCriada);
    });

    it('deve retornar 400 se a criação falhar', async () => {
      mockCreateTripUseCase.execute.mockRejectedValue(new Error('Título obrigatório.'));

      await controller.handleCreate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Título obrigatório.' });
    });
  });

  // 👇 TESTES DO JOIN (POST /trips/:id/join)
  describe('handleJoin', () => {
    it('deve retornar 201 ao aceitar o convite', async () => {
      mockReq.params = { id: 'trip-123' };
      const resultadoJoin = { message: 'Convite aceito com sucesso!', tripId: 'trip-123' };
      mockJoinTripUseCase.execute.mockResolvedValue(resultadoJoin);

      await controller.handleJoin(mockReq, mockRes);

      expect(mockJoinTripUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-auth-123',
        tripId: 'trip-123'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(resultadoJoin);
    });

    it('deve retornar 400 se o join falhar', async () => {
      mockJoinTripUseCase.execute.mockRejectedValue(new Error('Viagem não encontrada.'));

      await controller.handleJoin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Viagem não encontrada.' });
    });
  });

  // 👇 TESTES DO LIST (GET /trips)
  describe('handleList', () => {
    it('deve retornar 200 e a lista de viagens do usuário', async () => {
      const listaViagens = [{ id: 'trip-1', title: 'Brasil' }];
      mockListTripsUseCase.execute.mockResolvedValue(listaViagens);

      await controller.handleList(mockReq, mockRes);

      expect(mockListTripsUseCase.execute).toHaveBeenCalledWith('user-auth-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(listaViagens);
    });

    it('deve retornar 400 em caso de erro na listagem', async () => {
      mockListTripsUseCase.execute.mockRejectedValue(new Error('Erro interno.'));

      await controller.handleList(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro interno.' });
    });
  });

  // 👇 TESTES DO DELETE (DELETE /trips/:id)
  describe('handleDelete', () => {
    it('deve retornar 204 no sucesso da exclusão', async () => {
      mockReq.params = { id: 'trip-123' };
      mockDeleteTripUseCase.execute.mockResolvedValue(undefined);

      await controller.handleDelete(mockReq, mockRes);

      expect(mockDeleteTripUseCase.execute).toHaveBeenCalledWith('trip-123');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('deve retornar 400 em caso de erro na exclusão', async () => {
      mockDeleteTripUseCase.execute.mockRejectedValue(new Error('Viagem protegida.'));

      await controller.handleDelete(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  // 👇 TESTES DO GET SINGLE TRIP (GET /trips/:id)
  describe('handleGet', () => {
    it('deve retornar 200 e a viagem encontrada', async () => {
      mockReq.params = { id: 'trip-123' };
      const viagemEncontrada = { id: 'trip-123', title: 'Roma' };
      mockGetTripsUseCase.execute.mockResolvedValue(viagemEncontrada);

      await controller.handleGet(mockReq, mockRes);

      expect(mockGetTripsUseCase.execute).toHaveBeenCalledWith('trip-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(viagemEncontrada);
    });

    it('deve retornar 404 se a viagem retornar null (não encontrada)', async () => {
      mockReq.params = { id: 'trip-ghost' };
      
      // O banco procurou, não achou e retornou null pacificamente
      mockGetTripsUseCase.execute.mockResolvedValue(null);

      await controller.handleGet(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Viagem não encontrada.' });
    });

    it('deve retornar 400 se o caso de uso lançar uma exceção', async () => {
      mockGetTripsUseCase.execute.mockRejectedValue(new Error('ID inválido.'));

      await controller.handleGet(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'ID inválido.' });
    });
  });
});