// backend/src/presentation/middlewares/authMiddleware.spec.ts

import { describe, it, expect, vi } from 'vitest';
import { authErrorHandler } from './authMiddleware'; 

describe('Auth Middleware - Error Handler', () => {
  
  // 👇 TESTE 1: Capturando o erro exato do Clerk
  it('deve retornar status 401 e a mensagem customizada se o erro for "Unauthenticated"', () => {
    // 1. Preparamos o erro exatamente como o Clerk devolve
    const err = { message: 'Unauthenticated' };
    const mockReq: any = {};
    const mockRes: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const mockNext = vi.fn();

    // 2. Chamamos a SUA função real
    authErrorHandler(err, mockReq, mockRes, mockNext);

    // 3. Verificamos se você barrou a requisição com sucesso
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Acesso negado. Faça login para continuar." });
    
    // Garantimos que a requisição parou aqui e não continuou para o Controller
    expect(mockNext).not.toHaveBeenCalled(); 
  });

  // 👇 TESTE 2: Deixando outros erros passarem
  it('deve repassar o erro para o Express se a mensagem não for de autenticação', () => {
    // 1. Preparamos um erro genérico que não tem a ver com o Clerk
    const err = new Error('Banco de dados caiu');
    const mockReq: any = {};
    const mockRes: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const mockNext = vi.fn();

    // 2. Chamamos a função
    authErrorHandler(err, mockReq, mockRes, mockNext);

    // 3. Verificamos se ele ignorou o erro e mandou o Express lidar com ele
    expect(mockNext).toHaveBeenCalledWith(err);
    
    // Garantimos que o middleware não tentou responder com 401
    expect(mockRes.status).not.toHaveBeenCalled();
  });
});