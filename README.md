# ✈️ NomadSync

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

![NomadSync Cover](https://via.placeholder.com/1200x400/0f172a/ffffff?text=NomadSync+-+Real-time+Collaborative+Trip+Planning)
> *Uma plataforma SaaS completa para planejamento colaborativo de roteiros de viagem, construída com foco em performance, experiência do usuário (UX) e sincronização em tempo real.*

---

## 📖 Sobre o Projeto

O **NomadSync** vai muito além de um simples aplicativo de listas (CRUD). É um ecossistema projetado para permitir que múltiplos usuários planejem viagens simultaneamente. A plataforma resolve os desafios de concorrência de dados utilizando **WebSockets** protegidos e proporciona uma experiência "zero-latency" no lado do cliente através de **Optimistic UI**.

## ✨ Funcionalidades Principais

* 🔒 **Multi-Trip & Ownership Privado:** Isolamento de dados seguro ponta a ponta. Autenticação gerenciada pelo **Clerk**, onde cada usuário possui seu próprio Dashboard (`GET /trips` otimizado contra cache) e só pode acessar roteiros em que é o dono.
* ⚡ **Optimistic UI:** Graças ao **Zustand**, as interações do usuário (adicionar destinos, reordenar) refletem instantaneamente na tela antes mesmo da confirmação do servidor de banco de dados, garantindo fluidez absoluta.
* 📡 **Sincronização Real-time (Sem Efeito Eco):** WebSockets blindados com verificação de token JWT. O sistema utiliza `socket.broadcast.to(tripId)` para sincronizar apenas os usuários conectados na sala específica da viagem, atualizando telas de terceiros sem duplicar dados na tela do autor da ação.
* 🗺️ **Criação Inline:** Conversão fluida de botões em formulários de criação direto no Dashboard, com persistência atrelada ao usuário autenticado.

---

## 🛠️ Stack Tecnológica

### Frontend (Client)
* **React** (via Vite)
* **Tailwind CSS** + Lucide Icons (Styling & UI)
* **Zustand** (State Management para Optimistic UI)
* **Socket.io-client** (Comunicação bidirecional)
* **Clerk React SDK** (Autenticação)

### Backend (Server)
* **Node.js** + **Express** (API REST)
* **Prisma ORM** (Modelagem e Migrations)
* **PostgreSQL** (Banco de Dados Relacional)
* **Socket.io** (Servidor de WebSockets com Rooms dinâmicas)
* **Clerk Backend SDK** (Validação de JWT no Middleware e Sockets)

---

## 🏗️ Arquitetura de Dados em Tempo Real

Para garantir consistência e velocidade, o NomadSync adota o seguinte fluxo de ciclo de vida da informação:

1. **Ação do Usuário:** O Zustand atualiza o estado local do React instantaneamente.
2. **Emissão (Socket):** O frontend emite o evento contendo os dados e o `tripId` para o servidor.
3. **Persistência Segura:** O backend recebe o evento, verifica a integridade e persiste a alteração no PostgreSQL via Prisma (ex: reordenação de rotas ou criação de novos registros).
4. **Broadcast Seletivo:** O backend notifica *apenas os outros clientes* presentes na mesma "Room" (usando o `tripId`), acionando os "ouvintes" do Socket no frontend deles para buscarem a atualização no Zustand.

---

## 🚀 Como Executar o Projeto Localmente

### 1. Requisitos Prévios
* [Node.js](https://nodejs.org/en/) (v18 ou superior)
* Um banco de dados **PostgreSQL** rodando (local ou via Docker)
* Conta gratuita no [Clerk](https://clerk.com/) (Para obter as chaves de API `Publishable Key` e `Secret Key`)

### 2. Configurando o Backend (API & Sockets)
Abra um terminal na pasta `backend`:

```bash
# Instale as dependências
npm install
```

Crie um arquivo .env na raiz da pasta backend com as seguintes variáveis:

```bash
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nomadsync_db?schema=public"
CLERK_SECRET_KEY=sk_test_sua_chave_secreta_aqui
```

Gere o cliente do Prisma, rode as migrações e inicie o servidor:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```
O servidor estará escutando na porta 3333

### 3. Configurando o Frontend (React)

```bash
# Instale as dependências
npm install
```

Crie um arquivo .env.local na raiz da pasta frontend:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_sua_chave_publica_aqui
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse o aplicativo em http://localhost:5173.

📱 Roadmap e Próximos Passos
[x] Autenticação e Rotas Privadas (Clerk)

[x] CRUD de Destinos com Persistência no PostgreSQL

[x] Sincronização em Tempo Real (Socket.io)

[x] Suporte a Múltiplas Viagens (Dashboard Dinâmico)

[ ] Integração Mobile: Aplicativo complementar em Flutter compartilhando os mesmos WebSockets.

[ ] Sistema de Convites: Permissão para convidar outros usuários do Clerk para o mesmo Roteiro.

<p align="center">
Desenvolvido com dedicação e muito código limpo por Rodrigo Santos Santiago.
</p>