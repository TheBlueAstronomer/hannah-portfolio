# Forbes RSS Sync

Automatically imports new Forbes articles by Hannah into the Directus `articles` collection.

---

## How it works

The `rss-sync` Docker service runs `directus/rss-sync.mjs` in `--server` mode, which does two things simultaneously:

1. **Scheduled sync** — polls the Forbes RSS proxy feed every 6 hours automatically.
2. **On-demand HTTP endpoint** — listens on `http://rss-sync:3000` (internal Docker network) so a Directus Flow can trigger an immediate sync at any time from the CMS UI.

For each new RSS item it:
- Deduplicates by URL (never imports the same article twice)
- Downloads the article's main image and uploads it to Directus Files
- Creates a record in `articles` with `is_headline: false` and `is_featured: false`

Hannah then logs into the CMS and toggles `is_headline` / `is_featured` on whichever articles she wants to promote.

---

## Setup

### 1. Get an RSS proxy URL

Because Forbes uses Cloudflare bot protection, the feed must be proxied:

1. Go to [rss.app](https://rss.app) and create a free account.
2. Create a new feed pointing at: `https://www.forbes.com/sites/hannahabraham/feed/`
3. Copy the generated proxy URL (looks like `https://rss.app/feeds/xxxxxxxxxx.xml`).

### 2. Configure environment variables

Add the following to your `.env.directus` file:

```env
DIRECTUS_TOKEN=<your-admin-static-token>
FORBES_RSS_URL=https://rss.app/feeds/replace-with-your-feed-id.xml
```

To generate a `DIRECTUS_TOKEN`: Directus Admin → **Settings → API Tokens → Create Token**.

### 3. Start the service

```bash
docker compose up rss-sync
```

On first boot it installs `@directus/sdk` into the isolated `node_modules_rss/` volume, then starts syncing.

---

## On-demand sync from the CMS (Directus Flow)

This lets Hannah press a button inside the Directus admin to trigger an immediate sync without waiting for the next scheduled run.

### Create the Flow

1. **Directus Admin → Flows → Create Flow**
2. **Name:** `Sync Forbes RSS`
3. **Trigger:** Manual
   - Location: `Global` (shows the button in the top toolbar of any page)
   - *(or choose `Collections` → `articles` to scope it to the articles list)*
4. Click **Save & Continue**

### Add the Webhook operation

5. Click the **+** node after the trigger
6. Choose operation type: **Webhook / Request**
7. Configure:
   - **Method:** `POST`
   - **URL:** `http://rss-sync:3000/sync`
   - **Headers:** `Content-Type: application/json`
   - **Request Body:** *(leave empty)*
8. Click **Save**

### Save and test

9. Click **Save** on the Flow.
10. Navigate to **Content → Articles** (or any page if you chose Global).
11. A **"Sync Forbes RSS"** button appears in the toolbar.
12. Click it — the sync runs immediately and new articles appear in the list.

The Flow operation will show the JSON response from the sync:
```json
{ "ok": true, "imported": 2, "skipped": 0 }
```
Or if already up to date:
```json
{ "ok": true, "imported": 0, "skipped": 0, "message": "Already up to date" }
```

---

## Manual one-shot run (without Docker)

```bash
DIRECTUS_URL=http://localhost:8055 \
DIRECTUS_TOKEN=your-token \
FORBES_RSS_URL=your-rss-app-url \
node directus/rss-sync.mjs
```

Add `DRY_RUN=true` to parse and log without writing anything to Directus.

---

## Environment variables reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DIRECTUS_URL` | Yes | `http://localhost:8055` | Directus instance URL |
| `DIRECTUS_TOKEN` | Yes | — | Admin static token |
| `FORBES_RSS_URL` | Yes | — | rss.app proxy feed URL |
| `SYNC_INTERVAL_MS` | No | `21600000` (6h) | Polling interval in milliseconds |
| `SERVER_PORT` | No | `3000` | HTTP port for on-demand endpoint |
| `DRY_RUN` | No | `false` | Parse and log without writing to Directus |
