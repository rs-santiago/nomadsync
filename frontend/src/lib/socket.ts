import { io } from 'socket.io-client';

export const socket = io(`${import.meta.env.VITE_API_URL}`, {
  autoConnect: false, // 👈 Importante: Não conecta sozinho ao carregar o arquivo
  transports: ['websocket'] // 👈 Força websocket (mais rápido e seguro)
});