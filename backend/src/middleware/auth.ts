import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

// Usamos o 'any' aqui para ignorar a incompatibilidade de versões dos tipos do Express.
// Na prática, o middleware continua funcionando perfeitamente no runtime.
export const requireAuth = ClerkExpressRequireAuth() as any;