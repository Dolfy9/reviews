# CODEMAP

This file is a semantic mirror of the source tree. Each entry describes what a file or directory is responsible for. Run `pnpm codemap` to regenerate the skeleton after structural changes.

> Last updated: during Phase 1 scaffold.

## `apps/api/`

NestJS backend. Entry point is `src/main.ts`.

## `apps/web/`

React + Vite frontend. Entry point is `src/main.tsx`.

## `packages/shared/`

Zod schemas and TypeScript types shared between API and web. Must not import framework-specific code.

## `docker/`

Docker Compose files, Nginx config, and Postgres init scripts.

## `scripts/`

Cross-platform helpers and the code-map generator.
