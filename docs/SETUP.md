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

   | Email | Password | Role |
   | ----- | -------- | ---- |
   | `admin@example.com` | `Password123!` | Admin |
   | `alice@example.com` | `Password123!` | User |
   | `bob@example.com` | `Password123!` | User |

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

| Variable                  | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `DATABASE_URL`            | PostgreSQL connection string                   |
| `REDIS_URL`               | Redis connection string                        |
| `MINIO_*`                 | MinIO object storage settings                  |
| `JWT_SECRET`              | Secret for JWT signing                         |
| `SEMANTIC_SEARCH_ENABLED` | Toggle semantic search (default `true` in dev) |
| `EMBEDDING_MODEL`         | ONNX embedding model name                      |

## Windows notes

- PowerShell scripts are provided in `scripts/`.
- File watching in Docker Desktop for Windows may require `CHOKIDAR_USEPOLLING=true`, which is already set in `docker-compose.dev.yml`.

## Production

1. Create a strong `JWT_SECRET`.
2. Set `NODE_ENV=production`.
3. Configure real S3-compatible storage if needed (replace MinIO).
4. Run `corepack pnpm docker:prod`.

## Troubleshooting

- `ECONNREFUSED` on API startup: PostgreSQL or Redis is not healthy yet. Docker Compose `depends_on` with `condition: service_healthy` should handle this; if not, restart the `api` service.
- MinIO uploads fail: ensure the bucket exists (created automatically at startup).
- Slow first startup: `fastembed` downloads the ONNX model on first use. It is cached in a Docker volume.
