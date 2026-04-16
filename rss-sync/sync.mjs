#!/usr/bin/env node
/**
 * sync.mjs
 * --------
 * Fetches the Forbes RSS feed for Hannah Abraham using a Playwright headless
 * Chromium browser (bypasses Cloudflare bot protection) and imports new articles
 * into the Directus `articles` collection.
 *
 * For each new RSS item it:
 *   1. Checks whether the article URL already exists in Directus (dedup)
 *   2. Fetches the article page to extract <meta property="og:image"> (Forbes RSS
 *      does not include image tags — cover images are only in the article HTML)
 *   3. Downloads the image from the Forbes CDN
 *   4. Uploads the image to Directus Files → gets back a file UUID
 *   5. Creates a new record in the `articles` collection with:
 *        is_headline: false  ← Hannah toggles this manually in the CMS
 *        is_featured: false  ← Hannah toggles this manually in the CMS
 *
 * Usage (manual one-shot):
 *   DIRECTUS_URL=http://localhost:8055 \
 *   DIRECTUS_TOKEN=<admin-static-token> \
 *   node sync.mjs
 *
 * Modes (pass as CLI flag):
 *   (none)    — run sync once and exit
 *   --watch   — run sync on a repeating interval (SYNC_INTERVAL_MS)
 *   --server  — run sync on a repeating interval AND expose a POST /sync HTTP
 *               endpoint so Directus Flows can trigger an on-demand sync from
 *               the CMS UI via a Manual Flow button
 *   --reset   — delete ALL existing articles and their linked images, then run
 *               a fresh sync. Use this for a clean reimport.
 *
 * Required env vars:
 *   DIRECTUS_URL      — e.g. http://localhost:8055 (or http://directus:8055 inside Docker)
 *   DIRECTUS_TOKEN    — Directus admin static token (Settings → API Tokens)
 *
 * Optional env vars:
 *   SYNC_INTERVAL_MS  — polling interval in --watch/--server mode (default: 21600000 = 6 h)
 *   SERVER_PORT       — HTTP port for --server mode (default: 3000)
 *   FETCH_MAX_RETRIES — Playwright fetch attempts before giving up (default: 3)
 *   DRY_RUN           — set to "true" to parse and log without writing to Directus
 */

import http from 'node:http';
import { chromium } from 'playwright';
import { createDirectus, rest, staticToken, readItems, createItem, deleteItems, deleteFiles } from '@directus/sdk';

// ─── Config ───────────────────────────────────────────────────────────────────

const DIRECTUS_URL    = process.env.DIRECTUS_URL   || 'http://localhost:8055';
const DIRECTUS_TOKEN  = process.env.DIRECTUS_TOKEN;
const DRY_RUN         = process.env.DRY_RUN === 'true';
const SYNC_INTERVAL   = parseInt(process.env.SYNC_INTERVAL_MS || '21600000', 10); // 6 hours
const SERVER_PORT     = parseInt(process.env.SERVER_PORT || '3000', 10);
const FETCH_MAX_RETRIES = parseInt(process.env.FETCH_MAX_RETRIES || '3', 10);

const FORBES_FEED_URL = 'https://www.forbes.com/sites/hannahabraham/feed/';

if (!DIRECTUS_TOKEN) {
    console.error('❌  DIRECTUS_TOKEN is required. Generate one in Directus → Settings → API Tokens.');
    process.exit(1);
}

// ─── Directus client ──────────────────────────────────────────────────────────

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

// ─── XML parser (no npm deps — hand-rolled for predictable RSS structure) ─────

/**
 * Extracts the text content of the first occurrence of <tagName>...</tagName>.
 * Handles CDATA: <![CDATA[...]]>
 */
function extractTag(xml, tagName) {
    const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(re);
    if (!match) return null;
    const raw = match[1].trim();
    const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
    return cdata ? cdata[1].trim() : raw;
}

/**
 * Extracts the value of an attribute from the first matching self-closing or
 * opening tag, e.g. <media:content url="..."> or <enclosure url="...">.
 */
function extractAttr(xml, tagName, attrName) {
    const re = new RegExp(`<${tagName}[^>]+${attrName}="([^"]+)"`, 'i');
    const match = xml.match(re);
    return match ? match[1] : null;
}

/**
 * Splits raw RSS XML into individual <item>...</item> blocks.
 */
function parseItems(xml) {
    const items = [];
    const re = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = re.exec(xml)) !== null) {
        items.push(match[1]);
    }
    return items;
}

/**
 * Parses a single RSS <item> block into a structured object.
 * Note: Forbes RSS does not include image tags — imageUrl will always be null
 * here; fetchOgImage() handles image discovery separately.
 */
function parseItem(itemXml) {
    let imageUrl =
        extractAttr(itemXml, 'media:content', 'url') ||
        extractAttr(itemXml, 'enclosure', 'url') ||
        null;

    if (!imageUrl) {
        const desc = extractTag(itemXml, 'description') || '';
        const imgMatch = desc.match(/<img[^>]+src="([^"]+)"/i);
        if (imgMatch) imageUrl = imgMatch[1];
    }

    const rawDesc = extractTag(itemXml, 'description') || '';
    const excerpt = rawDesc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500) || null;

    const pubDateRaw = extractTag(itemXml, 'pubDate');
    let date = null;
    if (pubDateRaw) {
        const parsed = new Date(pubDateRaw);
        if (!isNaN(parsed)) {
            date = parsed.toISOString().slice(0, 10);
        }
    }

    return {
        title:    extractTag(itemXml, 'title'),
        url:      extractTag(itemXml, 'link') || extractTag(itemXml, 'guid'),
        date,
        excerpt,
        imageUrl,
    };
}

// ─── Playwright: feed fetch ───────────────────────────────────────────────────

/**
 * Launches a headless Chromium browser and fetches the Forbes RSS feed XML.
 * Retries up to FETCH_MAX_RETRIES times with exponential backoff.
 * Returns the raw RSS XML string.
 */
async function fetchFeed() {
    const browser = await chromium.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
        for (let attempt = 1; attempt <= FETCH_MAX_RETRIES; attempt++) {
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

                if (!content.includes('<rss') && !content.includes('<feed')) {
                    console.warn(`  ⚠️  Attempt ${attempt}: got HTML instead of XML (Cloudflare challenge?) — retrying…`);
                    await page.close();
                    await new Promise(r => setTimeout(r, 3_000 * attempt));
                    continue;
                }

                // page.content() wraps the XML in an HTML shell — extract just the raw XML text
                const xml = await page.evaluate(() => document.body.innerText);
                await page.close();
                return xml;

            } catch (err) {
                await page.close();
                if (attempt === FETCH_MAX_RETRIES) throw err;
                console.warn(`  ⚠️  Attempt ${attempt} failed: ${err.message} — retrying…`);
                await new Promise(r => setTimeout(r, 3_000 * attempt));
            }
        }

        throw new Error(`Feed fetch failed after ${FETCH_MAX_RETRIES} attempts`);
    } finally {
        await browser.close();
    }
}

// ─── Playwright: og:image fetch ───────────────────────────────────────────────

/**
 * Opens an article page in a new browser tab and extracts the og:image URL.
 * Forbes RSS feeds contain no image tags — cover images are only available
 * via <meta property="og:image"> in the article HTML.
 *
 * Uses domcontentloaded (not networkidle) because og:image is in <head> and
 * present in the initial HTML payload — no JS execution needed.
 *
 * Returns the og:image URL string, or null if not found / on error.
 */
async function fetchOgImage(articleUrl, browser) {
    const page = await browser.newPage();
    try {
        await page.goto(articleUrl, {
            waitUntil: 'domcontentloaded',
            timeout:   20_000,
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

// ─── Image helpers ────────────────────────────────────────────────────────────

/**
 * Downloads an image from a URL and returns { buffer, contentType, ext }.
 * Forbes CDN images (imageio.forbes.com) are not Cloudflare-protected —
 * plain fetch works fine here.
 */
async function downloadImage(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    let res;
    try {
        res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HannahPortfolioBot/1.0)' },
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timer);
    }
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status} ${url}`);
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());
    const urlPath = new URL(url).pathname;
    const urlFilename = urlPath.split('/').pop().split('?')[0] || '';
    const ext = urlFilename.includes('.') ? urlFilename.split('.').pop().split('?')[0] : 'jpg';
    return { buffer, contentType, ext };
}

/**
 * Uploads an image to Directus Files via the REST /files endpoint.
 * Returns the Directus file UUID.
 */
async function uploadImageToDirectus(imageUrl, title) {
    const { buffer, contentType, ext } = await downloadImage(imageUrl);
    const safeName = (title || 'article-image').replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    const filename = `${safeName}.${ext}`;

    const form = new FormData();
    form.append('file', new Blob([buffer], { type: contentType }), filename);
    form.append('folder', '');

    const res = await fetch(`${DIRECTUS_URL}/files`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
        body: form,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Directus file upload failed: ${res.status} — ${text}`);
    }

    const json = await res.json();
    return json.data.id;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

/**
 * Returns the set of article URLs already stored in Directus.
 * Uses pagination to handle large collections reliably.
 */
async function fetchExistingUrls() {
    const existing = new Set();
    let page = 1;
    const limit = 200;

    while (true) {
        const items = await directus.request(
            readItems('articles', {
                fields: ['url'],
                filter: { url: { _nnull: true } },
                limit,
                page,
            })
        );
        if (!items || items.length === 0) break;
        for (const item of items) {
            if (item.url) existing.add(item.url);
        }
        if (items.length < limit) break;
        page++;
    }

    return existing;
}

// ─── Core sync logic ──────────────────────────────────────────────────────────

async function syncWithResult() {
    const now = new Date().toISOString();
    console.log(`\n🔄  [${now}] Starting Forbes RSS sync …`);
    console.log(`    Feed:     ${FORBES_FEED_URL}`);
    console.log(`    Directus: ${DIRECTUS_URL}`);
    if (DRY_RUN) console.log('    ⚠️  DRY RUN — no writes will be made.');

    // 1. Fetch RSS feed via Playwright
    let xml;
    try {
        console.log('    Launching Chromium to fetch feed…');
        xml = await fetchFeed();
        console.log('    ✅  Feed fetched successfully.');
    } catch (err) {
        throw new Error(`Failed to fetch RSS feed: ${err.message}`);
    }

    // 2. Parse items
    const rawItems = parseItems(xml);
    if (rawItems.length === 0) {
        console.log('ℹ️   No items found in feed.');
        return { imported: 0, skipped: 0, message: 'No items in feed' };
    }
    console.log(`    Found ${rawItems.length} item(s) in feed.`);

    const parsed = rawItems.map(parseItem).filter(i => i.title && i.url);

    // 3. Load existing URLs for deduplication
    let existingUrls;
    try {
        existingUrls = await fetchExistingUrls();
    } catch (err) {
        throw new Error(`Could not read existing articles: ${err.message}`);
    }
    console.log(`    ${existingUrls.size} existing article URL(s) loaded for dedup.`);

    // 4. Filter to genuinely new articles
    const newItems = parsed.filter(item => !existingUrls.has(item.url));
    if (newItems.length === 0) {
        console.log('✅  No new articles to import.');
        return { imported: 0, skipped: 0, message: 'Already up to date' };
    }
    console.log(`    ${newItems.length} new article(s) to import.`);

    // 5. Import each new article — reuse a single browser for all og:image fetches
    let imported = 0;
    let skipped  = 0;
    let ogBrowser = null;

    try {
        if (!DRY_RUN) {
            console.log('    Launching Chromium for og:image fetches…');
            ogBrowser = await chromium.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
        }

        for (const item of newItems) {
            console.log(`\n  → "${item.title}"`);
            console.log(`    URL:   ${item.url}`);
            console.log(`    Date:  ${item.date}`);

            if (DRY_RUN) {
                console.log('    ⏭  Skipped (dry run).');
                skipped++;
                continue;
            }

            // 5a. Fetch og:image if the RSS item didn't provide one (always the case for Forbes)
            if (!item.imageUrl && ogBrowser) {
                console.log(`    🔍  Fetching og:image from article page…`);
                item.imageUrl = await fetchOgImage(item.url, ogBrowser);
                console.log(`    🖼  og:image: ${item.imageUrl || '(none found)'}`);
            }

            // 5b. Upload image (best effort — article is still created if image fails)
            let imageUuid = null;
            if (item.imageUrl) {
                try {
                    imageUuid = await uploadImageToDirectus(item.imageUrl, item.title);
                    console.log(`    ✅  Image uploaded → ${imageUuid}`);
                } catch (err) {
                    console.warn(`    ⚠️  Image upload failed (article will be created without image): ${err.message}`);
                }
            }

            // 5c. Create article record
            try {
                await directus.request(createItem('articles', {
                    title:       item.title,
                    publication: 'Forbes',
                    category:    'FORBES',
                    date:        item.date,
                    url:         item.url,
                    excerpt:     item.excerpt,
                    image:       imageUuid,
                    is_headline: false,
                    is_featured: false,
                }));
                console.log(`    ✅  Article created.`);
                imported++;
            } catch (err) {
                console.error(`    ❌  Failed to create article: ${err?.errors?.[0]?.message || err.message}`);
                skipped++;
            }
        }
    } finally {
        if (ogBrowser) await ogBrowser.close();
    }

    console.log(`\n✅  Sync complete — ${imported} imported, ${skipped} skipped.\n`);
    return { imported, skipped };
}

/**
 * Convenience wrapper — runs syncWithResult() and swallows the return value.
 */
async function sync() {
    try {
        await syncWithResult();
    } catch (err) {
        console.error(`❌  Sync failed: ${err.message}`);
    }
}

// ─── HTTP server (--server mode) ─────────────────────────────────────────────

/**
 * Starts a minimal HTTP server on SERVER_PORT.
 *
 * Endpoints:
 *   POST /sync   — triggers an on-demand sync; responds with JSON result summary.
 *   GET  /health — liveness check; always returns 200 { ok: true }.
 *
 * Only one sync runs at a time — concurrent POST /sync requests receive a 409.
 */
function startServer() {
    let syncInProgress = false;

    const server = http.createServer(async (req, res) => {
        const { method, url } = req;

        if (method === 'GET' && url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
            return;
        }

        if (method === 'POST' && url === '/sync') {
            if (syncInProgress) {
                res.writeHead(409, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Sync already in progress' }));
                return;
            }

            syncInProgress = true;
            console.log(`\n📥  On-demand sync triggered via POST /sync`);

            try {
                const result = await syncWithResult();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, ...result }));
            } catch (err) {
                console.error('❌  On-demand sync failed:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
            } finally {
                syncInProgress = false;
            }
            return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    });

    server.listen(SERVER_PORT, () => {
        console.log(`🌐  Server mode — listening on port ${SERVER_PORT}`);
        console.log(`    POST http://rss-sync:${SERVER_PORT}/sync  → trigger on-demand sync`);
        console.log(`    GET  http://rss-sync:${SERVER_PORT}/health → liveness check`);
    });
}

// ─── Reset (--reset mode) ────────────────────────────────────────────────────

/**
 * Deletes all articles in the `articles` collection along with any images
 * they reference in Directus Files, then runs a fresh sync.
 */
async function reset() {
    console.log('\n🗑   Reset mode — deleting all articles and linked images …');

    let articles;
    try {
        articles = await directus.request(
            readItems('articles', { fields: ['id', 'image'], limit: -1 })
        );
    } catch (err) {
        throw new Error(`Could not read articles: ${err.message}`);
    }

    if (articles.length === 0) {
        console.log('   ℹ️  No articles to delete.');
    } else {
        const articleIds = articles.map(a => a.id);
        await directus.request(deleteItems('articles', articleIds));
        console.log(`   🗑  Deleted ${articleIds.length} article(s).`);

        const imageIds = articles.map(a => a.image).filter(Boolean);
        if (imageIds.length > 0) {
            await directus.request(deleteFiles(imageIds));
            console.log(`   🗑  Deleted ${imageIds.length} image(s).`);
        }
    }

    console.log('\n🔄  Running fresh sync …');
    await syncWithResult();
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const watchMode  = process.argv.includes('--watch');
const serverMode = process.argv.includes('--server');
const resetMode  = process.argv.includes('--reset');

if (resetMode) {
    reset().then(() => process.exit(0)).catch(err => {
        console.error('❌  Reset failed:', err.message);
        process.exit(1);
    });
} else if (serverMode) {
    startServer();
    sync();
    setInterval(sync, SYNC_INTERVAL);
} else if (watchMode) {
    console.log(`🕐  Watch mode — syncing every ${SYNC_INTERVAL / 3600000}h`);
    sync();
    setInterval(sync, SYNC_INTERVAL);
} else {
    sync().then(() => process.exit(0)).catch(err => {
        console.error('❌  Unexpected error:', err);
        process.exit(1);
    });
}
