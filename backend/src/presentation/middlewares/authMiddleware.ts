import { ClerkExpressRequireAuth, RequireAuthProp, StrictAuthProp } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

// 👇 Adicionamos ": RequestHandler" para o TypeScript parar de reclamar
export const requireAuth = ClerkExpressRequireAuth() as any; // Usamos "as any" para contornar a incompatibilidade de tipos do Express

export type AuthenticatedRequest = Request & RequireAuthProp<StrictAuthProp>;

export const authErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'Unauthenticated') {
    return res.status(401).json({ error: "Acesso negado. Faça login para continuar." });
  }
  next(err);
};