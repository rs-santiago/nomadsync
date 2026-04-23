// backend/src/presentation/controllers/ActivityController.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityController } from './ActivityController';

describe('ActivityController', () => {
  let mockCreateUseCase: any;
  let mockDeleteUseCase: any;
  let mockIo: any;
  let controller: ActivityController;

  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    // 1. Dublês dos Use Cases
    mockCreateUseCase = { execute: vi.fn() };
    mockDeleteUseCase = { execute: vi.fn() };

    // 2. A Mágica do Dublê do Socket.io ✨
    // Como você usa io.to(sala).emit(evento), precisamos que o "to" retorne o próprio objeto para o "emit" funcionar.
    mockIo = {
      to: vi.fn().mockReturnThis(), 
      emit: vi.fn()
    };

    // 3. Dublês do Express
    mockReq = {
      body: {},
      params: {},
      query: {}
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn()
    };

    controller = new ActivityController(
      mockCreateUseCase,
      mockDeleteUseCase,
      mockIo
    );
  });

  // 👇 TESTE 1: Create com Sucesso E com Socket Emit
  it('deve retornar 201, criar a atividade e emitir o evento via socket se o tripId existir', async () => {
    mockReq.body = {
      title: 'Museu',
      type: 'museum',
      destinationId: 'dest-1',
      tripId: 'trip-123'
    };

    const createdActivity = { id: 'act-1', title: 'Museu', destinationId: 'dest-1' };
    mockCreateUseCase.execute.mockResolvedValue(createdActivity);

    await controller.handleCreate(mockReq, mockRes);

    // Verifica chamada pro UseCase
    expect(mockCreateUseCase.execute).toHaveBeenCalledWith({
      title: 'Museu', type: 'museum', destinationId: 'dest-1'
    });

    // Verifica se o Socket.io gritou pra sala certa
    expect(mockIo.to).toHaveBeenCalledWith('trip-123');
    expect(mockIo.emit).toHaveBeenCalledWith('activityAdded', { 
      tripId: 'trip-123', 
      activity: createdActivity 
    });

    // Verifica HTTP response
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(createdActivity);
  });

  // 👇 TESTE 2: Create com Sucesso MAS SEM Socket Emit (fallback)
  it('deve retornar 201, mas não emitir evento no socket se o tripId não for enviado no body', async () => {
    mockReq.body = {
      title: 'Praia',
      type: 'beach',
      destinationId: 'dest-1'
      // sem tripId!
    };

    mockCreateUseCase.execute.mockResolvedValue({ id: 'act-2' });

    await controller.handleCreate(mockReq, mockRes);

    // Verifica que o Socket.io FICOU CALADO
    expect(mockIo.to).not.toHaveBeenCalled();
    expect(mockIo.emit).not.toHaveBeenCalled();

    expect(mockRes.status).toHaveBeenCalledWith(201);
  });

  // 👇 TESTE 3: Erro no Create (400)
  it('deve retornar 400 se o caso de uso de criação falhar', async () => {
    mockReq.body = { title: '' };
    
    mockCreateUseCase.execute.mockRejectedValue(new Error('Título obrigatório'));

    await controller.handleCreate(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Título obrigatório' });
  });

  // 👇 TESTE 4: Delete com Sucesso E com Socket Emit
  it('deve retornar 204, deletar a atividade e emitir evento se tripId vier na query', async () => {
    mockReq.params = { id: 'act-1' };
    mockReq.query = { tripId: 'trip-123' };

    mockDeleteUseCase.execute.mockResolvedValue(undefined);

    await controller.handleDelete(mockReq, mockRes);

    // Verificações
    expect(mockDeleteUseCase.execute).toHaveBeenCalledWith('act-1');
    
    // O String() garante que mesmo que o express passe um objeto/array, o código não quebra
    expect(mockIo.to).toHaveBeenCalledWith('trip-123'); 
    expect(mockIo.emit).toHaveBeenCalledWith('activityRemoved', {
      tripId: 'trip-123',
      activityId: 'act-1'
    });

    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.send).toHaveBeenCalled();
  });

  // 👇 TESTE 5: Erro no Delete (400)
  it('deve retornar 400 se o caso de uso de deleção falhar', async () => {
    mockReq.params = { id: 'act-fantasma' };
    
    mockDeleteUseCase.execute.mockRejectedValue(new Error('Atividade não encontrada'));

    await controller.handleDelete(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Atividade não encontrada' });
  });
});