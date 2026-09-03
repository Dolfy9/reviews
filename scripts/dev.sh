#!/usr/bin/env bash
set -euo pipefail

corepack enable

[ -f .env ] || cp .env.example .env

corepack pnpm docker:dev
