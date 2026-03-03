# ─── Frontend Dockerfile ──────────────────────────────────────────────────────
# Multi-stage build:
#   Stage 1 (builder) — installs deps and builds the Vite app
#   Stage 2 (runner)  — serves the built dist/ with `vite preview`
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .

# Build args passed in at build-time (docker-compose environment vars won't
# be available during the Vite build, so we bake them in here).
ARG VITE_DIRECTUS_URL=http://localhost:8055
ENV VITE_DIRECTUS_URL=${VITE_DIRECTUS_URL}

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Only copy what's needed to run `vite preview`
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.js ./

EXPOSE 4173

# vite preview listens on 127.0.0.1 by default; pass --host to bind 0.0.0.0
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
