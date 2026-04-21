// src/server.ts
import { server } from './app';

const PORT = process.env.PORT || 3333;

server.listen(PORT, () => {
  console.log(`🚀 NomadSync Server rodando na porta ${PORT}`);
  console.log(`📡 Servidor de WebSockets pronto para conexões...`);
});