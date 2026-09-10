# Product Reviews Platform

A full-stack, production-ready product review system built with TypeScript, NestJS, React, Vite, PostgreSQL + pgvector, Redis, MinIO, and Docker. The platform supports public catalog browsing, full-text and semantic search, user-generated reviews with image uploads, admin moderation, and an automated data-mining pipeline for seeding products from public APIs.

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack & rationale](#tech-stack--rationale)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Production deployment](#production-deployment)
- [Environment variables](#environment-variables)
- [Testing](#testing)
- [API documentation](#api-documentation)
- [Data seeding & mining](#data-seeding--mining)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

The application is a single-page application (SPA) backed by a REST API. Visitors can search and browse products, read reviews, and authenticate to write their own reviews. Administrators can moderate reviews, manage users, and run a real-time data feed that imports products from sources such as Open Food Facts, iTunes, and Open Library.

## Features

### Public catalog

- Browse a paginated product catalog with sorting by newest, rating, review count, price ascending, and price descending.
- Filter products by category, subcategory, and minimum average rating.
- View product details, including images, description, price, average rating, review count, and rich metadata.

### Search

- `fulltext` mode: PostgreSQL `to_tsvector` with `word:*` prefix matching plus `ILIKE` substring fallback. Exact and prefix matches on product names are boosted to rank the most relevant results first.
- `semantic` mode: cosine-distance search over 384-dimensional embeddings generated locally with the `BAAI/bge-small-en-v1.5` ONNX model via `fastembed`.
- `hybrid` mode: weighted reciprocal-rank fusion that gives keyword and prefix matches strong priority while still surfacing semantically related products.
- Autocomplete on the home page runs in `fulltext` mode for fast suggestions.

### Reviews

- Authenticated users can create one review per product with a 1-5 star rating, title, content, image attachments, and pros/cons lists.
- Users can edit or delete their own reviews.
- All users can vote reviews as helpful or not helpful.
- Reviews are created with `PENDING` status and become `APPROVED` after admin moderation (admins can also pre-approve).

### Images

- Review images are uploaded directly to an S3-compatible MinIO bucket using presigned URLs, offloading storage and bandwidth from the API.
- Product images and review galleries are displayed with lightbox support.

### Authentication

- JWT access and refresh tokens are stored in `HttpOnly` cookies for XSS protection.
- Role-based access control (`USER`, `ADMIN`) is enforced with NestJS guards.
- Token refresh is handled automatically by the frontend auth hook.

### Admin dashboard

- Moderate pending, approved, and rejected reviews; approve, reject, or delete them.
- List and update user roles.
- View database statistics.
- Run a live data-mining job with server-sent event (SSE) progress updates; retry logic and graceful failure handling are built in for flaky external APIs.

### Data mining

- Mines real products from Open Food Facts, iTunes Movies, iTunes Podcasts, iTunes Apps, and Open Library.
- Generates synthetic reviews for imported products with real ratings to seed content.
- Computes product embeddings for semantic search as products are inserted.

## Tech stack & rationale

| Layer                  | Technology                                                      | Why it was chosen                                                                                                                              |
| ---------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo**           | pnpm workspaces                                                 | Single source of truth for shared Zod schemas and TypeScript types; fast, disk-space-efficient package installs.                               |
| **Backend framework**  | NestJS 10                                                       | Modular, dependency-injected Node.js framework with built-in support for guards, pipes, interceptors, and OpenAPI/Swagger.                     |
| **ORM / migrations**   | Prisma                                                          | Type-safe database client, declarative schema, and reliable migrations. Raw queries are used where PostgreSQL full-text features are required. |
| **Database**           | PostgreSQL 16 + pgvector                                        | Relational storage plus native vector support for semantic search without a separate vector database.                                          |
| **Search**             | PostgreSQL `tsvector`/`tsquery` + ONNX embeddings (`fastembed`) | Full-text search is fast and consistent with the database; local ONNX embeddings avoid external API costs and latency.                         |
| **Cache / queues**     | Redis                                                           | Rate limiting and ready for BullMQ background queues if needed.                                                                                |
| **Object storage**     | MinIO                                                           | S3-compatible, self-hosted, and easily replaceable with AWS S3 in production. Presigned URLs keep credentials server-side.                     |
| **Frontend framework** | React 18 + Vite                                                 | Fast hot module replacement, small production bundles, and modern React patterns.                                                              |
| **Styling**            | Tailwind CSS                                                    | Utility-first CSS for responsive, consistent UI with dark-mode support.                                                                        |
| **Server state**       | TanStack Query                                                  | Caching, background refetching, deduplication, and loading/error states out of the box.                                                        |
| **Client state**       | Zustand                                                         | Minimal, type-safe global state for auth and UI state.                                                                                         |
| **Forms**              | React Hook Form + Zod                                           | High-performance forms with shared validation schemas between frontend and backend.                                                            |
| **Validation**         | Zod (`@product-reviews/shared`)                                 | Single schema source shared by API, frontend, and any future consumers.                                                                        |
| **API docs**           | Swagger/OpenAPI                                                 | Auto-generated from NestJS controllers with typed response DTOs.                                                                               |
| **Containerization**   | Docker Compose                                                  | Identical development and production environments; explicit service dependencies and health checks.                                            |
| **Testing**            | Jest (API), Vitest (unit), Playwright (E2E)                     | Layered testing from pure functions to full browser flows against the production Docker stack.                                                 |

## Architecture

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

### Backend modules

Each feature module lives under `apps/api/src/modules/<feature>/` and follows the controller → service → repository → Prisma pattern:

- `*.controller.ts` — route handlers, DTO typing, Swagger decorators, guards.
- `*.service.ts` — business logic and orchestration.
- `*.repository.ts` — Prisma queries (the only layer that imports `@prisma/client`).
- `dto/index.ts` — local Nest-specific DTOs and Zod schema re-exports.
- `guards/` / `strategies/` — authentication and authorization where required.

Global middleware and guards in `apps/api/src/main.ts` and `app.module.ts`:

- `helmet` for security headers.
- `cookieParser` for JWT cookie extraction.
- `ZodValidationPipe` for request validation.
- `ThrottlerGuard` for rate limiting (100 requests per 60 seconds per IP).
- `RolesGuard` for role-based access control.
- Swagger UI at `/api/docs`.

### Frontend structure

Feature folders under `apps/web/src/`:

- `components/` — reusable UI components.
- `pages/` — top-level route components.
- `api/` — typed Axios clients per domain.
- `hooks/` — shared React hooks (auth, toasts, etc.).
- `store/` — Zustand stores.
- `lib/` — pure utility functions.

## Project structure

```
.
├── apps/
│   ├── api/              # NestJS API, Prisma schema, migrations, seed
│   └── web/              # React SPA, Vite, Tailwind, components, pages
├── docker/               # Docker Compose files and Postgres init scripts
├── docs/                 # Architecture, API, setup, and code map docs
├── packages/
│   └── shared/           # Zod schemas and TypeScript types used by both apps
├── scripts/              # Cross-platform helpers
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Getting started

### Prerequisites

- Node.js 22+
- Docker Desktop or Docker Engine with Compose v2
- pnpm (via `corepack enable`)
- Git

### 1. Configure environment variables

Create a `.env` file at the repository root. The minimal required variables are listed in the [Environment variables](#environment-variables) section.

### 2. Install dependencies

```bash
corepack enable
corepack pnpm install
```

### 3. Start the development stack

```bash
corepack pnpm docker:dev
```

On Windows without a global pnpm installation:

```powershell
.\scripts\dev.ps1
```

### 4. Run migrations and seed data

In another terminal:

```bash
corepack pnpm db:migrate
corepack pnpm db:seed
```

### 5. Open the services

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Swagger UI: `http://localhost:3001/api/docs`
- MinIO console: `http://localhost:9001` (default `minioadmin` / `minioadmin`)
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### Seed credentials

| Email               | Password       | Role  |
| ------------------- | -------------- | ----- |
| `admin@example.com` | `Password123!` | Admin |
| `alice@example.com` | `Password123!` | User  |
| `bob@example.com`   | `Password123!` | User  |

## Production deployment

1. Generate a strong `JWT_SECRET` and fill out all required environment variables.
2. Set `NODE_ENV=production`.
3. Review `docker/docker-compose.prod.yml` and update external hostnames/ports if needed.
4. Start the production stack:

```bash
corepack pnpm docker:prod
```

The production web container serves the built React SPA from Nginx and proxies `/api/*` requests to the API container. The API container runs the compiled NestJS application.

### Migrating production data

Run migrations against the running `api` container:

```bash
docker compose -f docker/docker-compose.prod.yml exec api pnpm --filter @product-reviews/api exec prisma migrate deploy
```

### Replacing MinIO with S3

In production, set the `MINIO_*` variables to point to your S3-compatible provider and keep `MINIO_BUCKET` as the target bucket. Presigned URL generation in `apps/api/src/modules/uploads/uploads.service.ts` will continue to work with any S3-compatible endpoint.

## Environment variables

| Variable                  | Required | Default                  | Purpose                                                                                            |
| ------------------------- | :------: | ------------------------ | -------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`            |   Yes    | —                        | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@localhost:5432/product_reviews` |
| `REDIS_URL`               |   Yes    | `redis://redis:6379`     | Redis connection string                                                                            |
| `MINIO_ENDPOINT`          |   Yes    | —                        | MinIO/S3 endpoint host (`minio:9000` inside Docker)                                                |
| `MINIO_ACCESS_KEY`        |   Yes    | —                        | MinIO/S3 access key                                                                                |
| `MINIO_SECRET_KEY`        |   Yes    | —                        | MinIO/S3 secret key                                                                                |
| `MINIO_BUCKET`            |   Yes    | `product-reviews`        | Bucket name for image uploads                                                                      |
| `MINIO_USE_SSL`           |    No    | `false`                  | Whether to use HTTPS for MinIO/S3                                                                  |
| `MINIO_PUBLIC_URL`        |    No    | `http://localhost:9000`  | Public base URL for uploaded images                                                                |
| `JWT_SECRET`              |   Yes    | —                        | Secret for signing JWT tokens                                                                      |
| `JWT_ACCESS_EXPIRATION`   |    No    | `15m`                    | Access token lifetime                                                                              |
| `JWT_REFRESH_EXPIRATION`  |    No    | `7d`                     | Refresh token lifetime                                                                             |
| `SEMANTIC_SEARCH_ENABLED` |    No    | `true`                   | Enables local ONNX embedding generation for semantic search                                        |
| `EMBEDDING_MODEL`         |    No    | `BAAI/bge-small-en-v1.5` | ONNX embedding model name                                                                          |
| `EMBEDDING_DIMENSION`     |    No    | `384`                    | Embedding vector dimension                                                                         |
| `CORS_ORIGIN`             |    No    | `http://localhost:3000`  | CORS origin for the API in development                                                             |

## Testing

### Unit and integration tests

```bash
corepack pnpm test
```

This runs Jest for the API and Vitest for the web app.

### End-to-end tests

The E2E suite runs Playwright against the production Docker stack. Start the stack first, then:

```bash
corepack pnpm test:e2e
```

### Type checking, linting, and formatting

```bash
corepack pnpm type-check
corepack pnpm lint
corepack pnpm format
```

## API documentation

Interactive Swagger UI is available at `/api/docs` when the API is running. All request and response schemas are generated from the shared Zod schemas and NestJS DTOs, ensuring the docs stay in sync with the code.

## Data seeding & mining

The seed script creates seed users and may import an initial product set. For larger, real-world data, use the admin dashboard to run the mining pipeline. Each source is fetched, normalized, and inserted into PostgreSQL with an embedding vector. Live progress is streamed via SSE to the admin page.

## Troubleshooting

- `ECONNREFUSED` on API startup: PostgreSQL or Redis is not healthy yet. Docker Compose `depends_on` with `condition: service_healthy` should resolve this; if not, restart the `api` service.
- MinIO uploads fail: ensure the bucket exists. The `minio-init` service creates it automatically.
- Slow first startup: `fastembed` downloads the ONNX model on first use. The model is cached in a Docker volume.
- Search returns no results for short terms: the engine now uses prefix (`word:*`) and substring matching; re-run `db:seed` or `db:migrate` if the underlying schema changed.
- Browser console `401` on `/auth/me`: this is expected for unauthenticated visitors.

## License

MIT
