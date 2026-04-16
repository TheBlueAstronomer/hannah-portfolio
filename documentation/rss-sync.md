# Forbes RSS Sync

Automatically imports new Forbes articles by Hannah into the Directus `articles` collection.

> **Implementation spec:** See [`rss-fetcher-spec.md`](./rss-fetcher-spec.md) for the full
> Playwright-based implementation plan that replaces the previous rss.app setup.

---

## How it works

The `rss-sync` Docker service runs `rss-sync/sync.mjs` in `--server` mode, which does two things
simultaneously:

1. **Scheduled sync** — uses a Playwright headless Chromium browser to fetch
   `https://www.forbes.com/sites/hannahabraham/feed/` directly every 6 hours, bypassing
   Cloudflare bot protection.
2. **On-demand HTTP endpoint** — listens on `http://rss-sync:3000` (internal Docker network) so a
   Directus Flow can trigger an immediate sync from the CMS UI at any time.

For each new RSS item it:
- Deduplicates by URL (never imports the same article twice)
- Downloads the article's main image and uploads it to Directus Files
- Creates a record in `articles` with `is_headline: false` and `is_featured: false`

Hannah then logs into the CMS and toggles `is_headline` / `is_featured` on whichever articles she
wants to promote.

---

## Setup

### 1. Configure environment variables

Add the following to your `.env.directus` file:

```env
DIRECTUS_TOKEN=<your-admin-static-token>
```

To generate a `DIRECTUS_TOKEN`: Directus Admin → **Settings → API Tokens → Create Token**.

No RSS proxy URL is needed — the service fetches Forbes directly.

### 2. Start the service

```bash
docker compose up rss-sync
```

The service builds a Playwright image with Chromium baked in and starts syncing immediately.

---

## Triggering a sync manually

### From the Directus CMS (Hannah's interface)

A Manual Flow gives Hannah a **"Sync Forbes RSS"** button in the Articles collection toolbar.

**One-time setup in Directus Admin:**

1. **Flows → Create Flow**
2. **Name:** `Sync Forbes RSS` | **Trigger:** Manual | **Location:** `Collections` → `articles`
3. **Save & Continue**
4. Click **+** → Operation: **Webhook / Request**
5. Method: `POST` | URL: `http://rss-sync:3000/sync` | Headers: `Content-Type: application/json`
6. **Save**

The Flow responds with:
```json
{ "ok": true, "imported": 2, "skipped": 0 }
```

### From the command line (operator)

```bash
# Health check (through Nginx, public)
curl http://34.100.194.88/rss-status

# Trigger sync (SSH into VM first — POST /sync is internal-only)
gcloud compute ssh portfolio-vm --zone=asia-south1-a
sudo docker exec hannah_rss_sync_prod \
  wget -qO- --post-data='{}' --header='Content-Type: application/json' \
  http://localhost:3000/sync

# Dry run — parse and log without writing to Directus
sudo docker run --rm \
  --network hannah-portfolio_default \
  -e DIRECTUS_URL=http://directus:8055 \
  -e DIRECTUS_TOKEN=<token> \
  -e DRY_RUN=true \
  asia-south1-docker.pkg.dev/<PROJECT_ID>/portfolio/rss-sync:latest \
  node sync.mjs

# Reset — delete all articles and reimport from scratch
sudo docker run --rm \
  --network hannah-portfolio_default \
  -e DIRECTUS_URL=http://directus:8055 \
  -e DIRECTUS_TOKEN=<token> \
  asia-south1-docker.pkg.dev/<PROJECT_ID>/portfolio/rss-sync:latest \
  node sync.mjs --reset
```

---

## Environment variables reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DIRECTUS_URL` | Yes | `http://localhost:8055` | Directus instance URL |
| `DIRECTUS_TOKEN` | Yes | — | Admin static token |
| `SYNC_INTERVAL_MS` | No | `21600000` (6h) | Polling interval in milliseconds |
| `SERVER_PORT` | No | `3000` | HTTP port for on-demand endpoint |
| `FETCH_MAX_RETRIES` | No | `3` | Playwright fetch retries before giving up |
| `DRY_RUN` | No | `false` | Parse and log without writing to Directus |
