FROM node:20-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune api --docker

FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter api build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist/index.js .
EXPOSE 3001
CMD ["node", "index.js"]
