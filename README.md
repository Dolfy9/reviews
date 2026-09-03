# Product Reviews Platform

A full-stack product review system (Amazon/Alza style) built with TypeScript, NestJS, React, Vite, PostgreSQL + pgvector, Redis, MinIO, and Docker.

## Quick Start

1. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

2. Start the development stack with hot reload:

   ```bash
   pnpm docker:dev
   ```

   Or on Windows without global pnpm:

   ```powershell
   .\scripts\dev.ps1
   ```

3. Open the services:
   - Web: `http://localhost:3000`
   - API: `http://localhost:3001`
   - API docs: `http://localhost:3001/api/docs`
   - MinIO console: `http://localhost:9001` (login with `minioadmin` / `minioadmin`)

4. Run migrations and seed:

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

## Production

```bash
cp .env.example .env
# edit .env
pnpm docker:prod
```

## Documentation

- [`AGENTS.md`](./AGENTS.md) – instructions for AI coding agents
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) – system architecture and data flow
- [`docs/API.md`](./docs/API.md) – API conventions and endpoints
- [`docs/SETUP.md`](./docs/SETUP.md) – detailed setup, troubleshooting, and environment variables
- [`docs/CODEMAP.md`](./docs/CODEMAP.md) – semantic map of source files

## Stack

| Layer      | Tech                                                                                    |
| ---------- | --------------------------------------------------------------------------------------- |
| Monorepo   | pnpm workspaces + Turborepo                                                             |
| Backend    | NestJS 10, Prisma, PostgreSQL + pgvector, Redis, MinIO                                  |
| Frontend   | React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Zustand                        |
| Search     | PostgreSQL full-text search + optional pgvector semantic search (local ONNX embeddings) |
| Validation | Zod (shared between frontend and backend)                                               |
| Tests      | Jest, Vitest, Playwright                                                                |

## Scripts

See [`package.json`](./package.json) for all scripts.
