#Requires -Version 7
$ErrorActionPreference = "Stop"

$corepack = "corepack"
& $corepack enable

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}

& $corepack pnpm docker:dev
