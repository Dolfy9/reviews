# Agent Instructions

This is a TypeScript monorepo for a product reviews platform. Before editing any file, read this document and the docs linked in [Context links](#context-links).

## Project overview

The project contains a NestJS REST API (`apps/api`), a React + Vite SPA (`apps/web`), and a shared package (`packages/shared`) with Zod schemas and TypeScript types. Infrastructure is containerized with Docker Compose. PostgreSQL includes the `pgvector` extension for optional semantic search using local ONNX embeddings.

## Commands

All commands run from the repo root.

- Install dependencies: `corepack pnpm install`
- Start dev (hot reload): `corepack pnpm docker:dev`
- Start prod: `corepack pnpm docker:prod`
- Stop all stacks: `corepack pnpm docker:down`
- Run migrations: `corepack pnpm db:migrate`
- Seed data: `corepack pnpm db:seed`
- Type check: `corepack pnpm type-check`
- Lint: `corepack pnpm lint`
- Test: `corepack pnpm test`
- E2E: `corepack pnpm test:e2e`
- Format code: `corepack pnpm format`
- Update code map: `corepack pnpm codemap`

## Project structure

- `apps/api/` – NestJS backend, Prisma schema, migrations, feature modules.
- `apps/web/` – React SPA, Vite config, feature folders, shadcn/ui components.
- `packages/shared/` – Zod schemas and TypeScript types used by both apps. Must remain framework-agnostic.
- `docker/` – Docker Compose files, Nginx config, Postgres init scripts.
- `docs/` – Architecture, API, setup, and per-area docs.
- `scripts/` – Cross-platform helpers for dev/prod and code-map generation.

## Code style

- **Package manager**: pnpm via corepack. Never use `npm` or `yarn` for this repo.
- **TypeScript**: strict mode, no `any`, no unchecked indexed access.
- **Formatting**: Prettier with default config. Run `pnpm format` before committing.
- **Naming**: camelCase variables/functions, PascalCase classes/components, kebab-case files, UPPER_SNAKE for constants.
- **Imports**: absolute workspace aliases (`@product-reviews/shared`) for shared code, relative imports inside the same app.
- **Backend pattern**: feature module → controller → service → repository → Prisma.
- **Frontend pattern**: feature folder with `api/`, `components/`, `hooks/`, `types/`, `utils/`.

## Testing

- Backend: Jest + Supertest. Mock Prisma with a typed `DeepMockProxy`.
- Frontend: Vitest + React Testing Library + MSW for API mocking.
- E2E: Playwright against the Docker prod stack.
- Add or update tests for the code you change.

## Context links

Read before modifying:

| Area                   | Doc                              |
| ---------------------- | -------------------------------- |
| Backend modules        | `docs/backend/modules.md`        |
| Frontend routing/state | `docs/frontend/routing-state.md` |
| API design             | `docs/API.md`                    |
| Architecture           | `docs/ARCHITECTURE.md`           |
| Setup / env            | `docs/SETUP.md`                  |
| File map               | `docs/CODEMAP.md`                |

## Do not modify

- `.env` files (secrets).
- `prisma/migrations/` files by hand — generate with Prisma Migrate.
- `pnpm-lock.yaml` except through `corepack pnpm install`.
- `docs/CODEMAP.md` directly — run `pnpm codemap` or update descriptions manually only if the generator cannot infer them.

## Git workflow

- Branch from `main`.
- Branch prefixes: `feat/`, `fix/`, `docs/`, `chore/`.
- Commit messages: Conventional Commits, e.g. `feat(products): add MinIO image upload`.
- All commits must pass `pnpm lint` and `pnpm type-check`.
