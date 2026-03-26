#!/bin/sh
set -eu

cd /app/packages/db
pnpm db:generate
pnpm db:migrate

cd /app/apps/api
node dist/index.js
