# ══════════════════════════════════════════════════════
#  ExpertMRI Marketing Dashboard — Production Dockerfile
# ══════════════════════════════════════════════════════

# ── Stage 1: Build shared + server + client ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json tsconfig.base.json ./

# Copy workspace packages
COPY shared/ shared/
COPY server/ server/
COPY client/ client/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Build shared
RUN npm run build -w shared

# Build server (TypeScript → dist)
RUN npm run build -w server

# Build client (Vite → client/dist)
RUN npm run build -w client


# ── Stage 2: Production runtime ──
FROM node:20-alpine AS production

# Install init system for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json tsconfig.base.json ./

# Copy workspace package.json files
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/shared/dist shared/dist
COPY --from=builder /app/server/dist server/dist
COPY --from=builder /app/client/dist client/dist
COPY --from=builder /app/shared/package.json shared/package.json

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Give permission to entire app directory (fixes logs EACCES)
RUN chown -R appuser:appgroup /app

USER appuser

# Environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start server
CMD ["dumb-init", "node", "server/dist/index.js"]