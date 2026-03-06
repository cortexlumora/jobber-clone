# WorkPulse

Field service management platform.

## Environments

| Environment | Frontend URL |
|------------|-------------|
| Dev | https://workpulse-dev.cortexlumora.com |
| QA | https://workpulse-qa.cortexlumora.com |
| Staging | https://workpulse-staging.cortexlumora.com |

## Apps & Packages

- `apps/app` — Main web application (Vite + React)
- `apps/api` — API server (Hono)
- `packages/db` — Database schema & client (Drizzle + PostgreSQL)
- `packages/zod` — Shared validation schemas
- `packages/dto` — Shared DTOs and response types

## Getting Started

```sh
pnpm install
docker compose up -d
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:migrate
pnpm dev
```
