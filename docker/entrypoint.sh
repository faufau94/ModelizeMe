#!/bin/sh
set -e

# ─── Wait for MySQL ──────────────────────────────────
echo "⏳ Waiting for MySQL to be ready..."
MAX_RETRIES=30
RETRY_INTERVAL=2
RETRIES=0

while [ $RETRIES -lt $MAX_RETRIES ]; do
  if node -e "
    const net = require('net');
    const s = new net.Socket();
    s.setTimeout(2000);
    s.connect(${DB_PORT:-3306}, '${DB_HOST:-db}', () => { s.destroy(); process.exit(0); });
    s.on('error', () => process.exit(1));
    s.on('timeout', () => { s.destroy(); process.exit(1); });
  " 2>/dev/null; then
    echo "✅ MySQL is ready!"
    break
  fi
  RETRIES=$((RETRIES + 1))
  echo "   Attempt $RETRIES/$MAX_RETRIES - retrying in ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done

if [ $RETRIES -eq $MAX_RETRIES ]; then
  echo "❌ MySQL did not become ready in time. Exiting."
  exit 1
fi

# ─── Run Prisma migrations ───────────────────────────
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "🚀 Starting application..."
exec "$@"
