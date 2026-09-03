# Architecture

## High-level flow

```
User
  │
  ▼
Nginx (prod) / Vite dev server (dev)
  │
  ├── /          → React SPA static assets
  └── /api/*     → NestJS API
         │
         ├── Auth / Users / Products / Reviews / Search / Uploads / Admin / Health
         │
         ├── Prisma → PostgreSQL + pgvector
         ├── ioredis → Redis
         └── minio client → MinIO
```

## Backend architecture

The API is organized as NestJS feature modules. Each feature contains:

- `*.controller.ts` – route handlers and DTO typing.
- `*.service.ts` – business logic.
- `*.repository.ts` – database access (Prisma).
- `dto/` – local DTOs / Zod schema re-exports.
- `*.guard.ts` / `*.strategy.ts` – auth where needed.

Shared validation rules live in `packages/shared/src/schemas` and are imported by both backend and frontend.

## Search

PostgreSQL provides full-text search via `to_tsvector` and GIN indexes. Optional semantic search uses `pgvector` with 384-dimensional embeddings from the `BAAI/bge-small-en-v1.5` model. Hybrid mode merges full-text rank and vector cosine distance using reciprocal rank fusion.

Semantic search can be disabled with `SEMANTIC_SEARCH_ENABLED=false` for low-spec or offline machines.

## Frontend architecture

React SPA with TanStack Query for server state, Zustand for auth, React Router for navigation, and React Hook Form + Zod for forms. API calls go through an Axios client that handles credentials and errors.

## Data storage

- PostgreSQL: all relational and vector data.
- Redis: rate limiting, optional caching, BullMQ job queues.
- MinIO: S3-compatible object storage for product and review images.
