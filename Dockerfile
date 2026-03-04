# ══════════════════════════════════════════════════════
#  ExpertMRI Marketing Dashboard — Production Dockerfile
# ══════════════════════════════════════════════════════

# ── Stage 1: Build shared + server + client ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root
COPY package.json package-lock.json tsconfig.base.json ./

# Copy workspace packages
COPY shared/ shared/
COPY server/ server/
COPY client/ client/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Build shared types
RUN npm run build -w shared

# Build server (TypeScript → dist/)
RUN npm run build -w server

# Build client (Vite → client/dist/)
RUN npm run build -w client

# ── Stage 2: Production runtime ──
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

# # Copy package files
# COPY package.json package-lock.json ./
# COPY shared/package.json shared/
# COPY server/package.json server/

# # Install production dependencies only
# RUN npm ci --omit=dev --workspace=server --workspace=shared 2>/dev/null || \
#     npm ci --production --workspace=server --workspace=shared

# Copy root workspace files
COPY package.json package-lock.json tsconfig.base.json ./

# Copy full package.json files for workspaces
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json

# Install workspace production deps properly
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/shared/dist shared/dist
COPY --from=builder /app/server/dist server/dist
COPY --from=builder /app/client/dist client/dist

# Copy shared package.json for module resolution
COPY --from=builder /app/shared/package.json shared/package.json

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Create logs directory
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app/logs

USER appuser

# Environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start server with dumb-init for proper signal handling
CMD ["dumb-init", "node", "server/dist/index.js"]
