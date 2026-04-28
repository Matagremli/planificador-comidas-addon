#!/bin/sh
set -eu

cd /app
umask 077

export NODE_ENV=production
export PORT=8099
export HOSTNAME=0.0.0.0
export DATABASE_URL="file:/data/dev.db"

mkdir -p /data

if [ ! -f /data/dev.db ]; then
  node scripts/bootstrap-db.mjs
  node prisma/seed.mjs
fi

exec npm run start -- --hostname 0.0.0.0 --port 8099
