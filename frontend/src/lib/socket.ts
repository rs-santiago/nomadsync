import { io } from 'socket.io-client';

export const socket = io('http://localhost:3333', {
  autoConnect: false, // 👈 Importante: Não conecta sozinho ao carregar o arquivo
  transports: ['websocket'] // 👈 Força websocket (mais rápido e seguro)
});