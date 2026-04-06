# ============================================
# Stage 1: Builder - install all deps & build
# ============================================
FROM node:22-slim AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --ignore-scripts --network-timeout 100000

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
# prisma generate déjà fait, on lance uniquement nuxt build
# (prisma migrate deploy se fait au runtime via entrypoint.sh)
RUN npx nuxt prepare && npx nuxt build

# ============================================
# Stage 2: Production deps only (native modules)
# ============================================
FROM node:22-slim AS prod-deps

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile --ignore-scripts --network-timeout 100000

COPY prisma ./prisma/
RUN npx prisma generate

# ============================================
# Stage 3: Runner - minimal production image
# ============================================
FROM node:22-slim AS runner

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

WORKDIR /app

# Built Nuxt output
COPY --from=builder --chown=appuser:appgroup /app/.output ./.output

# Production node_modules (bcrypt, prisma native bindings)
COPY --from=prod-deps --chown=appuser:appgroup /app/node_modules ./node_modules

# Prisma schema + migrations
COPY --from=prod-deps --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=prod-deps --chown=appuser:appgroup /app/package.json ./

# WebSocket server
COPY --from=builder --chown=appuser:appgroup /app/server/websocket-server.js ./server/

# Entrypoint script
COPY --chown=appuser:appgroup docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

EXPOSE 3000

USER appuser

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
