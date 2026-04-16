# Nginx Reverse Proxy — Feature Specification

## Overview

Add an Nginx container as the single public entry point for the hannah-portfolio stack. Nginx terminates HTTP (and optionally HTTPS/TLS) traffic and routes to the correct upstream based on hostname or path. No service other than Nginx exposes a host port.

---

## 1. Goals

- Single container handles all inbound traffic on ports 80 (and 443 for TLS).
- Frontend (`/`) and Directus CMS (`/cms` or subdomain) accessible through Nginx.
- All other containers removed from host-port exposure (`expose:` only, not `ports:`).
- Local dev and production compose files both benefit.
- Zero-downtime restarts via `nginx -s reload`.

---

## 2. Routing Table

| Public path / host         | Upstream                        | Notes                                         |
|----------------------------|---------------------------------|-----------------------------------------------|
| `http://<host>/`           | `frontend:4173`                 | SPA — serve index.html for all unmatched paths |
| `http://<host>/cms/`       | `directus:8055`                 | Strip `/cms` prefix before proxying            |
| `http://<host>/assets/`    | `directus:8055`                 | Directus file assets (no prefix strip needed)  |
| `http://<host>/rss-status` | `rss-sync:3000`                 | Optional health/status endpoint                |

> **Alternative (subdomain) routing** — if a real domain is available, prefer `cms.domain.com → directus` and `www.domain.com → frontend` to avoid the `/cms` prefix complexity.

---

## 3. File Layout

```
hannah-portfolio/
├── nginx/
│   ├── nginx.conf          # Main Nginx config (included by default)
│   └── conf.d/
│       └── default.conf    # Server block(s)
├── docker-compose.yml      # Updated (local dev)
└── docker-compose.prod.yml # Updated (production VM)
```

---

## 4. `nginx/conf.d/default.conf` — Detailed Specification

```nginx
# ── Upstreams ─────────────────────────────────────────────────────────────────
upstream frontend_upstream {
    server frontend:4173;
}

upstream directus_upstream {
    server directus:8055;
}

upstream rss_upstream {
    server rss-sync:3000;
}

# ── HTTP Server ───────────────────────────────────────────────────────────────
server {
    listen 80;
    server_name _;           # Catch-all; replace with real domain in prod

    # ── Frontend (SPA fallback) ───────────────────────────────────────────────
    location / {
        proxy_pass         http://frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # WebSocket support (Vite HMR in dev)
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
    }

    # ── Directus CMS (path-based) ─────────────────────────────────────────────
    location /cms/ {
        # Strip /cms prefix so Directus receives /
        rewrite ^/cms/(.*)$ /$1 break;

        proxy_pass         http://directus_upstream;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # Required for Directus to generate correct public URLs
        proxy_set_header   X-Forwarded-Host  $host;

        # Large uploads (images via RSS sync)
        client_max_body_size 50M;
    }

    # ── Directus assets (served from /assets/, no prefix to strip) ───────────
    location /assets/ {
        proxy_pass         http://directus_upstream;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # Cache static assets aggressively
        proxy_cache_valid  200 1d;
        add_header         Cache-Control "public, max-age=86400, immutable";
    }

    # ── RSS Sync health/status (optional, internal-facing) ───────────────────
    location /rss-status {
        proxy_pass         http://rss_upstream/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
    }
}
```

### Key config decisions

- **`rewrite ^/cms/(.*)$ /$1 break`** — Directus is not configured to run under a sub-path, so the prefix must be stripped before the request reaches it.
- **`X-Forwarded-Host`** — Directus uses this to generate absolute URLs (e.g. asset links returned by the API). Without it, it generates `http://directus:8055/assets/...` URLs which are unreachable from the browser.
- **`client_max_body_size 50M`** — RSS sync uploads cover images; default 1 MB would reject them.
- **`Upgrade` / `Connection`** — Vite dev server uses WebSocket for HMR; these headers pass the upgrade through.

---

## 5. `nginx/nginx.conf` — Main Config

```nginx
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile           on;
    keepalive_timeout  65;
    gzip               on;
    gzip_types         text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    include /etc/nginx/conf.d/*.conf;
}
```

---

## 6. `docker-compose.yml` Changes

### New `nginx` service

```yaml
nginx:
  image: nginx:1.27-alpine
  container_name: hannah_nginx
  restart: unless-stopped
  ports:
    - "80:80"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/conf.d:/etc/nginx/conf.d:ro
  depends_on:
    - frontend
    - directus
    - rss-sync
```

### Ports to remove from other services

| Service     | Before               | After                 |
|-------------|----------------------|-----------------------|
| `directus`  | `ports: - "8055:8055"` | `expose: ["8055"]`  |
| `frontend`  | `ports: - "4173:4173"` | `expose: ["4173"]`  |
| `rss-sync`  | already `expose: ["3000"]` | no change         |

### `VITE_DIRECTUS_URL` correction

The frontend now reaches Directus through Nginx (in the browser), so `VITE_DIRECTUS_URL` in the build arg must point to the **public-facing** URL:

```yaml
# docker-compose.yml (local dev)
ARG VITE_DIRECTUS_URL=http://localhost/cms

# docker-compose.prod.yml (production)
ARG VITE_DIRECTUS_URL=http://<VM_PUBLIC_IP>/cms
```

> This is a **build-time arg baked into the Vite bundle**. Changing it requires a rebuild of the frontend image.

---

## 7. `docker-compose.prod.yml` Changes

Same pattern as dev:

- Add `nginx` service, expose port 80 (and 443 for TLS — see §9).
- Remove `ports:` from `directus` and `frontend`; replace with `expose:`.
- Update `CORS_ORIGIN` in Directus env to `http://<domain>` (no port).
- Update `VITE_DIRECTUS_URL` build arg to `http://<domain>/cms`.

---

## 8. `cloudbuild.yaml` Changes

The build arg passed to Docker must be updated:

```yaml
- '--build-arg'
- 'VITE_DIRECTUS_URL=http://34.100.194.88/cms'   # was :8055
```

---

## 9. TLS / HTTPS (production upgrade path)

Two options once a domain is pointed at the VM:

### Option A — Certbot sidecar (recommended for a single VM)

1. Add a `certbot` service to `docker-compose.prod.yml` using `certbot/certbot` image.
2. Mount `/etc/letsencrypt` and `/var/www/certbot` as shared volumes with the Nginx container.
3. Add an ACME challenge `location /.well-known/acme-challenge/` block in `default.conf`.
4. Add a second `server` block on port 443 with `ssl_certificate` / `ssl_certificate_key` pointing at the Let's Encrypt certs.
5. Add a `443:443` port mapping to the Nginx service.
6. Schedule `certbot renew` via a cron job or a Docker periodic container.

### Option B — Cloudflare proxy (zero-cert-management)

1. Point the domain's A record to the VM IP.
2. Enable Cloudflare's orange-cloud proxy.
3. Nginx only handles HTTP (port 80); Cloudflare terminates TLS publicly.
4. Optionally enable Cloudflare → origin strict mode with an Origin Certificate.

---

## 10. Directus `PUBLIC_URL` env variable

When Directus sits behind a reverse proxy at a sub-path (`/cms`), it must know its public root so generated links are correct. Add to the `directus` service env:

```yaml
PUBLIC_URL: "http://localhost/cms"   # dev
PUBLIC_URL: "http://<domain>/cms"    # prod
```

---

## 11. Implementation Checklist

- [x] Create `nginx/nginx.conf`
- [x] Create `nginx/conf.d/default.conf`
- [x] Update `docker-compose.yml` — add nginx service, remove direct ports from directus/frontend
- [x] Update `docker-compose.prod.yml` — same structural changes
- [x] Add `PUBLIC_URL` to `directus` env in both compose files
- [x] Update `VITE_DIRECTUS_URL` build arg in both compose files and `cloudbuild.yaml`
- [x] Update `CORS_ORIGIN` in `docker-compose.prod.yml` to use the `/cms`-routed URL
- [x] `cloudbuild.yaml` — deploy `nginx/` directory to VM via `gcloud compute scp`
- [ ] Smoke-test: `curl http://localhost/` → 200 (frontend)
- [ ] Smoke-test: `curl http://localhost/cms/server/health` → `{"status":"ok"}`
- [ ] Smoke-test: asset URL from API returns a real image, not a 302 to an internal host
- [ ] (Optional) TLS setup via Certbot or Cloudflare

---

## 12. Risk / Gotchas

| Risk | Mitigation |
|------|------------|
| Directus generates internal asset URLs (`directus:8055/assets/...`) | Set `PUBLIC_URL` and `X-Forwarded-Host` header |
| SPA routes 404 on hard refresh | Nginx `location /` already proxy-passes to `serve -s dist` which handles fallback; no extra try_files needed |
| `VITE_DIRECTUS_URL` is baked at build time | Must rebuild frontend image after changing; document clearly |
| `/cms/` rewrite breaks Directus admin panel CSS/JS self-references | Test admin panel at `http://localhost/cms/admin`; if broken, switch to subdomain routing instead |
| rss-sync writes asset URLs using `DIRECTUS_URL=http://directus:8055` | Internal container-to-container URL — this is correct and should remain unchanged |
