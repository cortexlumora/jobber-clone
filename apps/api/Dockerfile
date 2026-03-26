FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/dto/package.json ./packages/dto/
COPY packages/zod/package.json ./packages/zod/
COPY packages/common/package.json ./packages/common/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter api build

COPY apps/api/start.sh ./apps/api/
RUN chmod +x ./apps/api/start.sh

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["./start.sh"]
