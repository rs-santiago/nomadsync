# ✈️ NomadSync

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Testing-Vitest-yellow?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![Sentry](https://img.shields.io/badge/Monitoring-Sentry-red?style=for-the-badge&logo=sentry)](https://sentry.io/)

![NomadSync Cover](https://via.placeholder.com/1200x400/0f172a/ffffff?text=NomadSync+-+Real-time+Collaborative+Trip+Planning)

> **NomadSync** is a professional-grade SaaS platform for collaborative trip planning. Built with a focus on high performance, seamless UX, and distributed real-time synchronization.

---

## 🏛️ Architecture & Engineering Principles

Unlike simple CRUD applications, NomadSync is built on **Clean Architecture** and **SOLID** principles to ensure scalability and maintainability.

* **Decoupled Business Logic:** All core rules are contained within **Use Cases**, making them independent of the framework (Express) or database (Prisma).
* **Dependency Injection:** Services and Repositories are injected into controllers via constructors, enabling high testability and modularity.
* **Repository Pattern:** Data access is abstracted through interfaces, ensuring the application is ready for potential database migrations or multi-source data fetching.



## ✨ Key Features

* 🔒 **Multi-Trip & Private Ownership:** Strict data isolation managed via **Clerk Auth**. Users only have access to trips they own or were invited to.
* ⚡ **Optimistic UI:** Leveraging **Zustand** for state management, the UI updates instantly before server confirmation, providing a "zero-latency" feeling.
* 📡 **Real-time Collaboration:** Secure WebSockets with JWT verification. Uses `socket.broadcast.to(tripId)` for selective synchronization within trip rooms, avoiding "echo effects" for the sender.
* 🗺️ **Context-Aware Mapping:** Integrated location services that automatically fetch coordinates and high-quality destination covers during planning.

## 🛡️ Reliability & Observability

* **Unit Testing (Vitest):** Robust test suite covering Use Cases, Controllers, and Middlewares, ensuring 100% reliability on critical business paths.
* **Safety Gate (Husky):** Pre-commit and Pre-push hooks automated to prevent pushing broken code or failing tests to production.
* **Error Monitoring (Sentry):** Full observability with real-time error tracking and performance profiling. Every production exception is logged with full stack trace context.

## 🛠️ Tech Stack

### Frontend (Client)
* **React** (Vite) & **Tailwind CSS**
* **Zustand** (State management for Optimistic UI)
* **Socket.io-client** (Bidirectional communication)
* **Clerk SDK** (Authentication & Session management)

### Backend (Server)
* **Node.js & Express** (RESTful API)
* **Prisma ORM** (PostgreSQL)
* **Socket.io** (Real-time engine with dynamic Rooms)
* **Vitest** (Unit Testing framework)
* **Sentry** (APM & Error tracking)

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v18+) & PostgreSQL
* Clerk Account (for `Publishable Key` and `Secret Key`)

### 2. Backend Setup
```bash
# Install dependencies
npm install

# Setup environment variables (.env)
DATABASE_URL="postgresql://user:pass@localhost:5432/nomadsync_db"
CLERK_SECRET_KEY=sk_test_...
SENTRY_DSN=https://...

# Database & Migrations
npx prisma generate
npx prisma migrate dev

# Run Tests
npm run test:ci

# Start Development Server
npm run dev
```
### 3. Frontend Setup
```bash
# Install dependencies
npm install

# Setup environment variables (.env.local)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Start Frontend
npm run dev
```

## 📱 Roadmap
[x] Clerk Auth & Private Routes

[x] Real-time Trip Synchronization

[x] Clean Architecture Refactor

[x] Unit Test Suite & Husky Automation

[ ] Invitation System: Allow trip owners to invite collaborators via email.

[ ] Mobile App: Complementary Flutter app sharing the same WebSocket engine.

<p align="center">
Built with passion and clean code by <b>Rodrigo Santos Santiago</b>.
</p>