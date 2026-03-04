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
RUN apk add --no-cache python3 make g++ && npm ci --legacy-peer-deps

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

# Only copy what's needed to serve the static files
COPY --from=builder /app/dist ./dist

# Install a lightweight static server globally
RUN npm install -g serve

EXPOSE 4173

# Serve the application from the /dist folder
# Cloud Run injects the $PORT environment variable, defaulting to 4173
CMD sh -c "serve -s dist -l ${PORT:-4173}"
