# Setup Guide

## Prerequisites

- Node.js 22+ (use `.nvmrc`)
- Docker Desktop or Docker Engine + Compose v2
- pnpm (via `corepack enable`)
- Git

## First run

1. Clone the repo and enter the directory.
2. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

3. Install dependencies:

   ```bash
   corepack enable
   corepack pnpm install
   ```

4. Start the dev stack:

   ```bash
   corepack pnpm docker:dev
   ```

5. In another terminal, run migrations and seed:

   ```bash
   corepack pnpm db:migrate
   corepack pnpm db:seed
   ```

6. Seed credentials:

   | Email               | Password       | Role  |
   | ------------------- | -------------- | ----- |
   | `admin@example.com` | `Password123!` | Admin |
   | `alice@example.com` | `Password123!` | User  |
   | `bob@example.com`   | `Password123!` | User  |

## Services

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/api/docs`
- MinIO console: `http://localhost:9001`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Useful commands

- Stop: `corepack pnpm docker:down`
- Reset database: `corepack pnpm db:reset`
- View logs: `corepack pnpm docker:logs`
- Open Prisma Studio: `corepack pnpm db:studio`

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
   corepack pnpm docker:prod
   ```

3. Run the E2E suite:

   ```bash
   corepack pnpm test:e2e
   ```

## Windows notes

- PowerShell scripts are provided in `scripts/`.
- File watching in Docker Desktop for Windows may require `CHOKIDAR_USEPOLLING=true`, which is already set in `docker-compose.dev.yml`.

## Production

1. Generate a strong `JWT_SECRET` and fill out all environment variables.
2. Set `NODE_ENV=production`.
3. Configure real S3-compatible storage if needed by pointing `MINIO_*` values at your provider.
4. Review `docker/docker-compose.prod.yml` and adjust ports, volumes, or replicas for your environment.
5. Start the stack:

   ```bash
   corepack pnpm docker:prod
   ```

6. Run migrations against the running API container:

   ```bash
   docker compose -f docker/docker-compose.prod.yml exec api pnpm --filter @product-reviews/api exec prisma migrate deploy
   ```

The production web container is an Nginx server that serves the built React SPA and proxies `/api/*` requests to the API container (`apps/web/nginx.conf`).

## Troubleshooting

- `ECONNREFUSED` on API startup: PostgreSQL or Redis is not healthy yet. Docker Compose `depends_on` with `condition: service_healthy` should handle this; if not, restart the `api` service.
- MinIO uploads fail: ensure the bucket exists (created automatically by the `minio-init` service at startup).
- Slow first startup: `fastembed` downloads the ONNX model on first use. The model is cached in a Docker volume.
- Search returns no results for short terms: the engine now uses prefix (`word:*`) and substring matching; re-run `db:seed` or `db:migrate` if the underlying schema changed.
- Browser console `401` on `/auth/me`: this is expected for unauthenticated visitors.
- E2E failures: verify the production stack is running and accessible at `http://localhost:3000` and `http://localhost:3001/api/health` before running `pnpm test:e2e`.
