// src/app.ts

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import 'dotenv/config';

import { tripRoutes } from './presentation/routes/tripRoutes';
import { destinationRoutes } from './presentation/routes/destinationRoutes';
import { activityRoutes } from './presentation/routes/activityRoutes';
import { setupTripSockets } from './presentation/websockets/tripSocketHandler';

const app = express();

// 1. Inicializa Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// 2. Configurações de Servidor
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 3. Inicializa os WebSockets (A mágica foi abstraída!)
setupTripSockets(io);

// 4. Middlewares Globais
app.use(cors());
app.use(express.json());

// 5. Rotas HTTP
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'NomadSync API is running!' });
});

app.use('/trips', tripRoutes);
app.use('/destinations', destinationRoutes);
app.use('/activities', activityRoutes(io));

app.get("/debug-sentry", (req, res) => {
  throw new Error("Sentry Test Error: NomadSync está monitorado! 🚀");
});

// 6. Error Handling Global
Sentry.setupExpressErrorHandler(app);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Erro capturado:", err.message);
  res.status(500).json({
    error: "Erro interno no servidor.",
    eventId: res.get('sentry')
  });
});

export { server, io, app };