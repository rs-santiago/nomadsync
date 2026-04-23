// backend/src/presentation/controllers/DestinationController.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DestinationController } from './DestinationController';

describe('DestinationController', () => {
  // 1. Dublês dos Casos de Uso
  let mockCreateUseCase: any;
  let mockListUseCase: any;
  let mockDeleteUseCase: any;
  let controller: DestinationController;

  // 2. Dublês do Express (A Mágica acontece aqui ✨)
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    // Preparamos os dublês dos Casos de Uso
    mockCreateUseCase = { execute: vi.fn() };
    mockListUseCase = { execute: vi.fn() };
    mockDeleteUseCase = { execute: vi.fn() };

    controller = new DestinationController(
      mockCreateUseCase,
      mockListUseCase,
      mockDeleteUseCase
    );

    // Zeramos o Request antes de cada teste
    mockReq = {
      body: {},
      params: {}
    };

    // Zeramos o Response. O "mockReturnThis()" é crucial para podermos 
    // encadear as chamadas, ex: res.status(200).json(...)
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn()
    };
  });

  // 👇 TESTE 1: Criação com Sucesso (Status 201)
  it('deve retornar status 201 e o destino criado no sucesso', async () => {
    // Simulamos os dados chegando na requisição
    mockReq.body = {
      name: 'Paris',
      tripId: 'trip-123'
    };

    // Simulamos a resposta de sucesso do Use Case
    const destinoCriado = { id: 'dest-1', name: 'Paris' };
    mockCreateUseCase.execute.mockResolvedValue(destinoCriado);

    await controller.handleCreate(mockReq, mockRes);

    // Verifica se o Use Case foi chamado com os dados do body
    expect(mockCreateUseCase.execute).toHaveBeenCalledWith(mockReq.body);
    
    // Verifica se o HTTP Status correto foi enviado (201 Created)
    expect(mockRes.status).toHaveBeenCalledWith(201);
    
    // Verifica se o JSON retornado é o objeto que o Use Case gerou
    expect(mockRes.json).toHaveBeenCalledWith(destinoCriado);
  });

  // 👇 TESTE 2: Erro na Criação (Status 400)
  it('deve retornar status 400 e a mensagem de erro se o Use Case falhar', async () => {
    mockReq.body = { name: '' }; // Nome vazio para forçar erro

    // Simulamos o Use Case "estourando" aquele erro que testamos antes
    mockCreateUseCase.execute.mockRejectedValue(new Error("Nome e TripID são obrigatórios."));

    await controller.handleCreate(mockReq, mockRes);

    // Verifica se o catch pegou o erro e devolveu um Bad Request (400)
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Nome e TripID são obrigatórios." });
  });

  // 👇 TESTE 3: Listagem com Sucesso (Status 200)
  it('deve retornar status 200 e a lista de destinos', async () => {
    mockReq.params = { tripId: 'trip-123' };

    const listaDestinos = [{ id: 'dest-1', name: 'Paris' }];
    mockListUseCase.execute.mockResolvedValue(listaDestinos);

    await controller.handleList(mockReq, mockRes);

    expect(mockListUseCase.execute).toHaveBeenCalledWith('trip-123');
    expect(mockRes.status).toHaveBeenCalledWith(200); // 200 OK
    expect(mockRes.json).toHaveBeenCalledWith(listaDestinos);
  });

  // 👇 TESTE 4: Exclusão com Sucesso (Status 204)
  it('deve retornar status 204 e nenhum body no sucesso da exclusão', async () => {
    mockReq.params = { id: 'dest-1' };

    mockDeleteUseCase.execute.mockResolvedValue(undefined);

    await controller.handleDelete(mockReq, mockRes);

    expect(mockDeleteUseCase.execute).toHaveBeenCalledWith('dest-1');
    expect(mockRes.status).toHaveBeenCalledWith(204); // 204 No Content
    expect(mockRes.send).toHaveBeenCalled(); // Usamos send() vazio no delete
  });
});