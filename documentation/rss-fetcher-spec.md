# Forbes RSS Fetcher — Implementation Spec

## Overview

Replace the current two-service RSS pipeline (`rss-sync` container + rss.app SaaS dependency) with a
single consolidated `rss-sync` container that fetches Forbes directly using a **Playwright headless
Chromium** browser. Cloudflare bot protection is bypassed because a real Chromium browser produces a
genuine TLS fingerprint and solves JS challenges automatically.

rss.app is eliminated entirely. No third-party SaaS. No separate fetcher service.

---

## Why the Current Setup Needs Replacing

### Current architecture

```
rss.app (external SaaS)
    └── polled by → rss-sync container (node:20-alpine)
                        └── writes to → Directus articles collection
```

### Problems

| Problem | Detail |
|---|---|
| **rss.app costs money** | Free tier is limited; paid plans required for reliable polling |
| **Third-party dependency** | If rss.app goes down or changes its feed format, the pipeline silently breaks |
| **`FORBES_RSS_URL` is a secret** | The rss.app feed URL must be stored in `.env.directus` and kept out of git |
| **`NODE_TLS_REJECT_UNAUTHORIZED=0`** | Required because rss.app's cert chain is not in the Alpine CA bundle — a security smell |
| **`npm install` on every boot** | The `node:20-alpine` image installs `@directus/sdk` at startup via `npm install --silent`, adding ~10–20s cold-start delay and a writable `node_modules_rss` volume |
| **Direct Forbes feed is blocked** | `https://www.forbes.com/sites/hannahabraham/feed/` is behind Cloudflare bot protection; plain HTTP fetches return 403 or a Turnstile HTML challenge |

---

## New Architecture

```
rss-sync container (Playwright + Node.js)
    │
    ├── Chromium (headless) ──fetch──▶ https://www.forbes.com/sites/hannahabraham/feed/
    │       └── real TLS fingerprint, solves CF JS challenge, returns XML
    │
    └── Node.js sync logic ──writes──▶ Directus articles collection
```

One container. No external SaaS. No TLS workarounds.

---

## What Gets Scrapped

| File / Config | Disposition |
|---|---|
| `directus/rss-sync.mjs` | **Replaced** — rewritten to use Playwright instead of plain `fetch` |
| `package_rss.json` | **Replaced** — deps change from `@directus/sdk` only to `playwright` + `@directus/sdk` |
| `node_modules_rss/` (Docker volume) | **Removed** — the new image bakes deps in at build time; no runtime `npm install` |
| `FORBES_RSS_URL` env var | **Removed** — URL is hardcoded (it's Hannah's own public Forbes author page, not a secret) |
| `NODE_TLS_REJECT_UNAUTHORIZED=0` env var | **Removed** — no longer needed |
| rss.app account / subscription | **Cancelled** |

---

## New File Layout

```
hannah-portfolio/
├── rss-sync/
│   ├── Dockerfile          ← NEW: builds the Playwright image
│   ├── package.json        ← NEW: replaces package_rss.json
│   └── sync.mjs            ← NEW: replaces directus/rss-sync.mjs
├── directus/
│   └── rss-sync.mjs        ← DELETED (or kept for reference, not used)
├── package_rss.json        ← DELETED
├── docker-compose.yml      ← UPDATED
├── docker-compose.prod.yml ← UPDATED
└── cloudbuild.yaml         ← UPDATED
```

---

## Spec: `rss-sync/Dockerfile`

```dockerfile
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY sync.mjs ./

CMD ["node", "sync.mjs", "--server"]
```

### Key decisions

- **`mcr.microsoft.com/playwright:v1.44.0-jammy`** — Microsoft's official Playwright image. Ships
  Chromium, its system dependencies, and Node.js 20. No manual browser install step needed.
- **`--omit=dev`** — production install only; no test deps in the image.
- **Deps baked in at build time** — eliminates the `npm install --silent` on every container start.
- **Pin to a specific Playwright version tag** — avoids surprise breakage from image updates.

---

## Spec: `rss-sync/package.json`

```json
{
  "name": "hannah-rss-sync",
  "version": "2.0.0",
  "type": "module",
  "private": true,
  "dependencies": {
    "@directus/sdk": "^21.1.0",
    "playwright": "^1.44.0"
  }
}
```

---

## Spec: `rss-sync/sync.mjs`

This is a full rewrite of `directus/rss-sync.mjs`. All existing behaviour is preserved; only the
feed-fetching mechanism changes.

### Preserved from existing `rss-sync.mjs`

| Feature | Notes |
|---|---|
| XML parser (`extractTag`, `extractAttr`, `parseItems`, `parseItem`) | Identical — Forbes RSS structure hasn't changed |
| Image download + upload to Directus Files | Identical — plain `fetch` works fine for CDN images (not Cloudflare-protected) |
| Deduplication by URL (`fetchExistingUrls`) | Identical |
| Article creation with `publication: 'Forbes'`, `is_headline: false`, `is_featured: false` | Identical |
| `--server` mode with `POST /sync` and `GET /health` endpoints | Identical |
| `--watch` mode | Identical |
| `--reset` mode | Identical |
| One-shot default (no flag) | Identical |
| `DRY_RUN` env var | Identical |
| `SYNC_INTERVAL_MS` env var (default 6h) | Identical |
| `SERVER_PORT` env var (default 3000) | Identical |
| `DIRECTUS_URL` env var | Identical |
| `DIRECTUS_TOKEN` env var | Identical |
| 409 guard against concurrent syncs in server mode | Identical |

### What changes: `fetchFeed()` function

The current implementation:

```js
// OLD — plain fetch, blocked by Cloudflare
const res = await fetch(FORBES_RSS_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HannahPortfolioBot/1.0)' },
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
xml = await res.text();
```

The new implementation:

```js
// NEW — Playwright headless Chromium
import { chromium } from 'playwright';

const FORBES_FEED_URL = 'https://www.forbes.com/sites/hannahabraham/feed/';
const MAX_RETRIES     = parseInt(process.env.FETCH_MAX_RETRIES || '3', 10);

async function fetchFeed() {
    const browser = await chromium.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const page = await browser.newPage();

            try {
                await page.setExtraHTTPHeaders({
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                });

                await page.goto(FORBES_FEED_URL, {
                    waitUntil: 'networkidle',
                    timeout:   30_000,
                });

                const content = await page.content();

                // Validate we got XML, not a Cloudflare challenge page
                if (!content.includes('<rss') && !content.includes('<feed')) {
                    console.warn(`  ⚠️  Attempt ${attempt}: got HTML instead of XML — retrying…`);
                    await page.close();
                    await new Promise(r => setTimeout(r, 3_000 * attempt));
                    continue;
                }

                // page.content() wraps XML in an HTML shell; extract the raw XML
                const xml = await page.evaluate(() => document.body.innerText);
                await page.close();
                return xml;

            } catch (err) {
                await page.close();
                if (attempt === MAX_RETRIES) throw err;
                console.warn(`  ⚠️  Attempt ${attempt} failed: ${err.message} — retrying…`);
                await new Promise(r => setTimeout(r, 3_000 * attempt));
            }
        }

        throw new Error(`Feed fetch failed after ${MAX_RETRIES} attempts`);
    } finally {
        await browser.close();
    }
}
```

### New function: `fetchOgImage(articleUrl, browser)`

Forbes's RSS feed **does not include image tags** — no `<media:content>`, no `<enclosure>`, no
`<img>` in `<description>`. All 11 existing articles in Directus have `image: null`, confirming
this has never worked. The cover image exists only in each article page's
`<meta property="og:image">` tag.

Since the Playwright browser is already running during a sync, fetching `og:image` from each
article page is a low-cost addition — one extra `page.goto()` per new article:

```js
async function fetchOgImage(articleUrl, browser) {
    const page = await browser.newPage();
    try {
        await page.goto(articleUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 20_000,
        });
        return await page.evaluate(() => {
            const el = document.querySelector('meta[property="og:image"]');
            return el ? el.getAttribute('content') : null;
        });
    } catch (err) {
        console.warn(`    ⚠️  og:image fetch failed for ${articleUrl}: ${err.message}`);
        return null;
    } finally {
        await page.close();
    }
}
```

**Call site** — inside the per-article import loop, replacing the current `item.imageUrl` check:

```js
// After fetchFeed() returns XML and items are parsed, but before Directus writes:
// Pass the open browser instance into the loop.

for (const item of newItems) {
    // Fetch og:image from the article page (Forbes RSS has no image tags)
    if (!item.imageUrl) {
        item.imageUrl = await fetchOgImage(item.url, browser);
    }
    // ... rest of loop unchanged (uploadImageToDirectus, createItem)
}
```

**Why `domcontentloaded` instead of `networkidle`:**
`og:image` is in the `<head>` and present in the initial HTML payload — no JS execution needed.
`domcontentloaded` is significantly faster (~2–3s vs ~8–10s per page) and sufficient here.

**Forbes CDN images are not Cloudflare-protected.** `downloadImage()` (plain `fetch`) works
fine for `https://imageio.forbes.com/...` URLs — no Playwright needed for the download step.

**Scope guard:** `fetchOgImage` is only called for articles where `imageUrl` is null after
RSS parsing. If Forbes ever adds `<media:content>` to their feed in future, the RSS value
takes precedence and the extra page load is skipped.

### Why `--no-sandbox`

GCE VMs run containers as non-root inside Docker's default user namespace. Chromium's sandbox
requires Linux user namespaces to be set up correctly; `--no-sandbox` disables the sandbox to
allow the browser to launch inside a standard Docker container. This is the standard practice for
CI/CD and containerised Playwright environments.

### Why `browser.close()` in `finally`

Chromium processes are not automatically killed when the Node.js parent closes. Without explicit
`browser.close()`, the container accumulates zombie Chromium processes over multiple sync cycles,
eventually exhausting memory.

### New env vars

| Variable | Default | Description |
|---|---|---|
| `FETCH_MAX_RETRIES` | `3` | Playwright fetch attempts before giving up |

### Removed env vars

| Variable | Reason |
|---|---|
| `FORBES_RSS_URL` | No longer configurable — Forbes author feed URL is a constant, not a secret |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Eliminated with rss.app |

---

## Spec: `docker-compose.yml` Changes

### Remove `rss-sync` service, add new `rss-sync` service

```yaml
# REMOVE this entire service:
rss-sync:
  image: node:20-alpine
  container_name: hannah_rss_sync
  restart: unless-stopped
  working_dir: /app
  env_file:
    - .env.directus
  volumes:
    - ./directus:/app/directus:ro
    - ./node_modules_rss:/app/node_modules
    - ./package_rss.json:/app/package.json:ro
  environment:
    DIRECTUS_URL: "http://directus:8055"
    SYNC_INTERVAL_MS: "21600000"
    SERVER_PORT: "3000"
    NODE_TLS_REJECT_UNAUTHORIZED: "0"
  command: ["sh", "-c", "npm install --silent && node directus/rss-sync.mjs --server"]
  expose:
    - "3000"
  depends_on:
    - directus
```

```yaml
# ADD this replacement:
rss-sync:
  build:
    context: ./rss-sync
    dockerfile: Dockerfile
  container_name: hannah_rss_sync
  restart: unless-stopped
  env_file:
    - .env.directus
  environment:
    DIRECTUS_URL: "http://directus:8055"
    SYNC_INTERVAL_MS: "21600000"
    SERVER_PORT: "3000"
  expose:
    - "3000"
  depends_on:
    - directus
```

### Remove the `node_modules_rss` volume mount and named volume

The `node_modules_rss:/app/node_modules` bind mount and any `node_modules_rss:` entry under
`volumes:` are deleted. Dependencies are baked into the image.

### Remove `FORBES_RSS_URL` from `.env.directus`

The variable is no longer read. Remove it from `.env.directus` and `.env.directus.example` to
avoid confusion.

---

## Spec: `docker-compose.prod.yml` Changes

### Add `rss-sync` service (currently absent from prod)

```yaml
rss-sync:
  image: asia-south1-docker.pkg.dev/${PROJECT_ID}/portfolio/rss-sync:latest
  container_name: hannah_rss_sync_prod
  restart: always
  env_file:
    - .env
  environment:
    DIRECTUS_URL: "http://directus:8055"
    SYNC_INTERVAL_MS: "21600000"
    SERVER_PORT: "3000"
  mem_limit: 700m
  expose:
    - "3000"
  depends_on:
    - directus
```

### Memory limit rationale

`700m` caps the container's RSS usage. Chromium at rest uses ~50–80 MB; during a feed fetch it
spikes to ~400–600 MB. The 700m cap gives headroom for the spike while preventing runaway growth.
With 2 GB RAM + 2 GB swap on the VM, this leaves comfortable headroom for Directus (~200 MB) and
the OS/Docker daemon (~300 MB).

### Add `nginx` `depends_on` for `rss-sync`

```yaml
nginx:
  depends_on:
    - frontend
    - directus
    - rss-sync     # ← add this
```

---

## Spec: `cloudbuild.yaml` Changes

### Add step: build and push `rss-sync` image

Insert before the existing deploy step:

```yaml
# 2b. Build the rss-sync image
- name: 'gcr.io/cloud-builders/docker'
  args:
    - 'build'
    - '-t'
    - 'asia-south1-docker.pkg.dev/$PROJECT_ID/portfolio/rss-sync:$COMMIT_SHA'
    - '-t'
    - 'asia-south1-docker.pkg.dev/$PROJECT_ID/portfolio/rss-sync:latest'
    - './rss-sync'
  id: 'build-rss-sync'

# 2c. Push the rss-sync image
- name: 'gcr.io/cloud-builders/docker'
  args:
    - 'push'
    - '--all-tags'
    - 'asia-south1-docker.pkg.dev/$PROJECT_ID/portfolio/rss-sync'
  id: 'push-rss-sync'
  waitFor: ['build-rss-sync']
```

### Update deploy step: copy `rss-sync/` to VM

```bash
# Add to the scp block:
gcloud compute scp --recurse rss-sync portfolio-vm:/tmp/ --zone=asia-south1-a --quiet

# Add to the ssh block:
cp -r /tmp/rss-sync /opt/hannah-portfolio/
```

### Add image to the `images:` list

```yaml
images:
  - 'asia-south1-docker.pkg.dev/$PROJECT_ID/portfolio/frontend:$COMMIT_SHA'
  - 'asia-south1-docker.pkg.dev/$PROJECT_ID/portfolio/frontend:latest'
  - 'asia-south1-docker.pkg.dev/$PROJECT_ID/portfolio/rss-sync:$COMMIT_SHA'   # ← add
  - 'asia-south1-docker.pkg.dev/$PROJECT_ID/portfolio/rss-sync:latest'        # ← add
```

---

## Spec: `nginx/conf.d/default.conf` Changes

The existing `/rss-status` location block already routes to `rss-sync:3000`. No change needed —
the service name and port are unchanged.

---

## Spec: `.env.directus` / `.env.directus.example` Changes

### Remove

```env
FORBES_RSS_URL=https://rss.app/feeds/...   # ← delete this line
```

### Keep

```env
DIRECTUS_TOKEN=<admin-static-token>
# All other existing vars unchanged
```

---

## VM Resource Impact

| Container | Idle RAM | Peak RAM (during fetch) |
|---|---|---|
| `hannah_directus_prod` | ~200 MB | ~210 MB |
| `hannah_frontend_prod` | ~40 MB | ~40 MB |
| `hannah_rss_sync_prod` (new) | ~80 MB | ~600 MB (capped at 700 MB) |
| OS + Docker daemon | ~280 MB | ~280 MB |
| **Total** | **~600 MB / 2 GB** | **~1.13 GB / 2 GB + 2 GB swap** |

Peak fetch occurs for ~30 seconds once every 6 hours. The rest of the time the container sits at
~80 MB. Swap is only touched during that 30-second window.

---

## Manual Trigger — All Surfaces

The `--server` mode (default in both dev and prod) keeps the HTTP server running alongside the
scheduled interval. Three surfaces can trigger a sync on demand:

### 1. Directus Flow button (primary — Hannah's interface)

A Manual Flow in the Directus admin gives Hannah a one-click sync button inside the CMS.
Directus calls `http://rss-sync:3000/sync` **directly over the internal Docker network** — it
never goes through Nginx. This is intentional: the endpoint is not public-facing.

**Setup steps (one-time, in Directus Admin):**

1. **Flows → Create Flow**
2. **Name:** `Sync Forbes RSS`
3. **Trigger:** Manual
   - Location: `Collections` → select `articles`
   - *(This scopes the button to the Articles list page where Hannah works)*
4. **Save & Continue**
5. Click **+** after the trigger node
6. Operation type: **Webhook / Request**
7. Configure:
   - Method: `POST`
   - URL: `http://rss-sync:3000/sync`
   - Headers: `Content-Type: application/json`
   - Body: *(empty)*
8. **Save**

The **"Sync Forbes RSS"** button then appears in the toolbar of the Articles collection.
The Flow's operation log shows the JSON result:

```json
{ "ok": true, "imported": 2, "skipped": 0 }
```

or if already up to date:

```json
{ "ok": true, "imported": 0, "skipped": 0, "message": "Already up to date" }
```

> **Note:** `http://rss-sync:3000` resolves because Directus and rss-sync are on the same
> Docker network. This URL is not reachable from outside the stack.

### 2. curl via Nginx health route (operator/debug)

The `/rss-status` Nginx location proxies to `rss-sync:3000`. Only `GET /` (health) is exposed
this way — `POST /sync` is intentionally not forwarded through Nginx to avoid public exposure.

```bash
# Health check (public, through Nginx)
curl http://34.100.194.88/rss-status
# { "ok": true }
```

If you need to trigger a sync from outside the VM without touching Directus, SSH in and use
option 3 below instead.

### 3. docker exec one-shot (operator)

```bash
# SSH into the VM first
gcloud compute ssh portfolio-vm --zone=asia-south1-a

# Trigger sync directly against the container's port
sudo docker exec hannah_rss_sync_prod \
  wget -qO- --post-data='{}' \
  --header='Content-Type: application/json' \
  http://localhost:3000/sync

# Or run a one-shot container with DRY_RUN to inspect without writing
sudo docker run --rm \
  --network hannah-portfolio_default \
  -e DIRECTUS_URL=http://directus:8055 \
  -e DIRECTUS_TOKEN=<token> \
  -e DRY_RUN=true \
  asia-south1-docker.pkg.dev/<PROJECT_ID>/portfolio/rss-sync:latest \
  node sync.mjs
```

### 4. `--reset` mode (nuclear option)

Deletes **all** existing articles and linked images, then runs a fresh sync. Use only when
reimporting from scratch.

```bash
sudo docker run --rm \
  --network hannah-portfolio_default \
  -e DIRECTUS_URL=http://directus:8055 \
  -e DIRECTUS_TOKEN=<token> \
  asia-south1-docker.pkg.dev/<PROJECT_ID>/portfolio/rss-sync:latest \
  node sync.mjs --reset
```

---

## Implementation Order

1. Create `rss-sync/package.json`
2. Create `rss-sync/sync.mjs` (rewrite of `directus/rss-sync.mjs`)
3. Create `rss-sync/Dockerfile`
4. Update `docker-compose.yml` — replace `rss-sync` service, remove `node_modules_rss` volume
5. Update `docker-compose.prod.yml` — add `rss-sync` service with `mem_limit`
6. Update `cloudbuild.yaml` — add build/push/deploy steps for `rss-sync` image
7. Update `.env.directus` and `.env.directus.example` — remove `FORBES_RSS_URL`
8. Delete `package_rss.json`
9. Delete `directus/rss-sync.mjs` (or archive it)
10. Local smoke test: `docker compose build rss-sync && docker compose up rss-sync`
11. Deploy via Cloud Build

---

## Smoke Tests

### Local

```bash
# Build and start the new service in isolation
docker compose build rss-sync
docker compose up rss-sync directus

# Health check
curl http://localhost:3000/health
# Expected: {"ok":true}

# On-demand sync
curl -X POST http://localhost:3000/sync
# Expected: {"ok":true,"imported":<n>,"skipped":0}

# Dry run (no Directus writes)
docker compose run --rm -e DRY_RUN=true rss-sync node sync.mjs
```

### Production

```bash
# After deploy
curl http://34.100.194.88/rss-status
# Expected: {"ok":true}

# Tail logs for first sync
gcloud compute ssh portfolio-vm --zone=asia-south1-a --command \
  "sudo docker logs -f hannah_rss_sync_prod"
```

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Forbes changes their Cloudflare configuration and starts blocking headless Chromium | Playwright's `undetected` mode; retry logic with exponential backoff; monitor logs |
| Chromium OOM-kills other containers | `mem_limit: 700m` in prod; 2 GB swap as safety net |
| Playwright image (~1.5 GB) slows Cloud Build | Artifact Registry caches layers; add a `--cache-from` pull step as with the frontend |
| `browser.close()` not called on unhandled rejection | `try/finally` block in `fetchFeed()` guarantees cleanup |
| Feed XML is returned wrapped in HTML by Chromium | Use `page.evaluate(() => document.body.innerText)` to extract raw XML content |
| Forbes feed URL changes | Single constant `FORBES_FEED_URL` in `sync.mjs` — one-line fix |
