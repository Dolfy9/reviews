# Setup Guide

## Prerequisites

- Node.js 22+ (use `.nvmrc`)
- Docker Desktop or Docker Engine + Compose v2
- pnpm (via `corepack enable`)
- Git

## First run

1. Clone the repo and enter the directory.
2. Run the unified start command:

   ```bash
   npm run dev
   ```

   `npm run dev` will:
   1. Enable corepack and install dependencies.
   2. Create a `.env` file from `.env.example` if one does not exist.
   3. Start the Docker development stack.
   4. Wait for the API to be healthy.
   5. Run Prisma migrations.
   6. Seed demo data (skipped if data already exists).
   7. Stream container logs.

   The first run will pull/build Docker images and download the ONNX model. On subsequent starts, the existing database volume is reused and seeding is skipped.

3. Open the services:
   - Web: `http://localhost:3000`
   - API: `http://localhost:3001`
   - Swagger: `http://localhost:3001/api/docs`
   - MinIO console: `http://localhost:9001`
   - PostgreSQL: `localhost:5432`
   - Redis: `localhost:6379`

4. Seed credentials:

   | Email               | Password       | Role  |
   | ------------------- | -------------- | ----- |
   | `admin@example.com` | `Password123!` | Admin |
   | `alice@example.com` | `Password123!` | User  |
   | `bob@example.com`   | `Password123!` | User  |

## Production

To run in production mode with the same defaults:

```bash
npm run prod
```

`npm run prod` will install dependencies, create `.env` if needed, build the production Docker images, start the stack, run migrations, and seed demo data if the database is empty.

For a real deployment, review `docker/docker-compose.prod.yml`, generate a strong `JWT_SECRET`, and configure `MINIO_*` values to point to your S3-compatible provider if you are not using the bundled MinIO container.

### Re-seeding

If you need to wipe data and re-seed, set `RESET=true`:

```bash
docker compose -f docker/docker-compose.dev.yml exec api RESET=true pnpm --filter @product-reviews/api exec tsx prisma/seed.ts
```

## Environment variables

Create a `.env` file at the repository root before starting Docker. All variables are consumed by `docker/docker-compose.dev.yml`, `docker/docker-compose.prod.yml`, and `apps/api/src/config/env.schema.ts`.

| Variable                  | Required | Default                    | Purpose                                                                                            |
| ------------------------- | :------: | -------------------------- | -------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`            |   Yes    | —                          | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@localhost:5432/product_reviews` |
| `REDIS_URL`               |   Yes    | `redis://redis:6379`       | Redis connection string                                                                            |
| `MINIO_ENDPOINT`          |   Yes    | —                          | MinIO/S3 endpoint host (`minio:9000` inside Docker)                                                |
| `MINIO_ACCESS_KEY`        |   Yes    | —                          | MinIO/S3 access key                                                                                |
| `MINIO_SECRET_KEY`        |   Yes    | —                          | MinIO/S3 secret key                                                                                |
| `MINIO_BUCKET`            |   Yes    | `product-reviews`          | Bucket name for image uploads                                                                      |
| `MINIO_USE_SSL`           |    No    | `false`                    | Whether to use HTTPS for MinIO/S3                                                                  |
| `MINIO_PUBLIC_URL`        |    No    | `http://localhost:9000`    | Public base URL for uploaded images                                                                |
| `JWT_SECRET`              |   Yes    | —                          | Secret for signing JWT tokens                                                                      |
| `JWT_ACCESS_EXPIRATION`   |    No    | `15m`                      | Access token lifetime                                                                              |
| `JWT_REFRESH_EXPIRATION`  |    No    | `7d`                       | Refresh token lifetime                                                                             |
| `SEMANTIC_SEARCH_ENABLED` |    No    | `true`                     | Enables local ONNX embedding generation for semantic search                                        |
| `EMBEDDING_MODEL`         |    No    | `BAAI/bge-small-en-v1.5`   | ONNX embedding model name                                                                          |
| `EMBEDDING_DIMENSION`     |    No    | `384`                      | Embedding vector dimension                                                                         |
| `CORS_ORIGIN`             |    No    | `http://localhost:3000`    | CORS origin for the API in development                                                             |
| `WEB_PORT`                |    No    | `80` (prod) / `3000` (dev) | Host port mapped to the web container                                                              |
| `API_PORT`                |    No    | `3001`                     | Host port mapped to the API container                                                              |

### Example `.env`

```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/product_reviews
REDIS_URL=redis://redis:6379
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=product-reviews
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://localhost:9000
JWT_SECRET=change-me-to-a-long-random-string
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
SEMANTIC_SEARCH_ENABLED=true
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
EMBEDDING_DIMENSION=384
CORS_ORIGIN=http://localhost:3000
WEB_PORT=3000
API_PORT=3001
```

## Useful commands

- `npm run dev` — start the development stack
- `npm run prod` — start the production stack
- `corepack pnpm docker:down` — stop all Docker services
- `corepack pnpm db:migrate` — run Prisma migrations in the dev `api` container
- `corepack pnpm db:seed` — run seed data in the dev `api` container
- `corepack pnpm db:studio` — open Prisma Studio
- `corepack pnpm docker:logs` — follow Docker dev logs
- `corepack pnpm db:reset` — stop and remove volumes, then restart dev and re-seed

## Testing

### Unit / integration

```bash
corepack pnpm test
```

### End-to-end

E2E tests run with Playwright against the production Docker stack.

1. Make sure browsers are installed:

   ```bash
   corepack pnpm --filter web exec playwright install chromium
   ```

2. Start the production stack:

   ```bash
   npm run prod
   ```

3. Run the E2E suite:

   ```bash
   corepack pnpm test:e2e
   ```

## Windows notes

- PowerShell scripts are provided in `scripts/`.
- File watching in Docker Desktop for Windows may require `CHOKIDAR_USEPOLLING=true`, which is already set in `docker-compose.dev.yml`.

## Troubleshooting

- `ECONNREFUSED` on API startup: PostgreSQL or Redis is not healthy yet. Docker Compose `depends_on` with `condition: service_healthy` should handle this; if not, restart the `api` service.
- MinIO uploads fail: ensure the bucket exists (created automatically by the `minio-init` service at startup).
- Slow first startup: `fastembed` downloads the ONNX model on first use. The model is cached in a Docker volume.
- Search returns no results for short terms: the engine now uses prefix (`word:*`) and substring matching; re-run `db:seed` or `db:migrate` if the underlying schema changed.
- Browser console `401` on `/auth/me`: this is expected for unauthenticated visitors.
- E2E failures: verify the production stack is running and accessible at `http://localhost:3000` and `http://localhost:3001/api/health` before running `pnpm test:e2e`.
