#!/usr/bin/env node
/**
 * rss-sync.mjs — RSS Feed → Directus Auto-Catalog
 * -------------------------------------------------
 * Fetches Hannah Abraham's Forbes RSS feed and upserts new articles into the
 * Directus `articles` collection. Uses the RSS <guid> field for deduplication,
 * so this script is completely safe to run multiple times or on a schedule.
 *
 * Usage (one-shot):
 *   node directus/rss-sync.mjs
 *
 * With overrides:
 *   DIRECTUS_URL=http://34.100.194.88 \
 *   DIRECTUS_EMAIL=admin@hannah.com   \
 *   DIRECTUS_PASSWORD=admin1234       \
 *   node directus/rss-sync.mjs
 *
 * Schedule (Linux cron — every 6 hours):
 *   0 *\/6 * * * cd /srv/hannah-portfolio && node directus/rss-sync.mjs >> /var/log/rss-sync.log 2>&1
 */

import { createDirectus, rest, authentication, createItem, readItems } from '@directus/sdk';
import { parseStringPromise } from 'xml2js';

// ─── Config ───────────────────────────────────────────────────────────────────

const RSS_URL = 'https://www.forbes.com/sites/hannahabraham/feed/';
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const EMAIL = process.env.DIRECTUS_EMAIL || 'admin@hannah.com';
const PASSWORD = process.env.DIRECTUS_PASSWORD || 'admin1234';

// ─── Directus client ─────────────────────────────────────────────────────────

const directus = createDirectus(DIRECTUS_URL).with(authentication()).with(rest());

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Strip HTML tags from a string and collapse whitespace.
 */
function stripHtml(str) {
    if (!str) return '';
    return str
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Convert an RSS <pubDate> string to a YYYY-MM-DD date string.
 */
function parseDate(pubDate) {
    if (!pubDate) return null;
    try {
        return new Date(pubDate).toISOString().split('T')[0];
    } catch {
        return null;
    }
}

/**
 * Derive a category label from RSS <category> tags or the article URL.
 */
function deriveCategory(categories, url) {
    if (categories && categories.length > 0) {
        // RSS categories are topic slugs — pick the first human-readable one
        const cat = categories[0];
        const tag = typeof cat === 'string' ? cat : (cat._ || cat.$?.term || '');
        if (tag) {
            // Capitalise first letter of each word
            return tag.replace(/\b\w/g, (c) => c.toUpperCase());
        }
    }
    // Fall back to a simple heuristic from the URL path
    if (url) {
        if (/interview/i.test(url)) return 'Interview';
        if (/review/i.test(url)) return 'Review';
        if (/analysis/i.test(url)) return 'Analysis';
        if (/award/i.test(url)) return 'Awards';
    }
    return 'Feature';
}

/**
 * Fetch and parse the RSS feed. Returns an array of normalised article objects.
 */
async function fetchFeed() {
    console.log(`📡  Fetching RSS feed from ${RSS_URL} …`);
    const res = await fetch(RSS_URL, {
        headers: { 'User-Agent': 'HannahPortfolioBot/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from RSS feed`);
    const xml = await res.text();

    const parsed = await parseStringPromise(xml, { explicitArray: true, trim: true });
    const channel = parsed?.rss?.channel?.[0];
    if (!channel) throw new Error('Unexpected RSS structure — no <channel> found');

    const items = channel.item || [];
    console.log(`   Found ${items.length} items in feed.`);

    return items.map((item) => {
        const title = stripHtml(item.title?.[0]);
        const url = item.link?.[0] || item.guid?.[0]?._ || item.guid?.[0] || null;
        const guid = item.guid?.[0]?._ || item.guid?.[0] || url;
        const pubDate = item.pubDate?.[0];
        const description = item.description?.[0] || item['content:encoded']?.[0] || '';
        const categories = (item.category || []).map((c) => (typeof c === 'string' ? c : c._) || '').filter(Boolean);
        const mediaUrl = item['media:content']?.[0]?.$?.url || item['media:thumbnail']?.[0]?.$?.url || null;

        return {
            title,
            publication: 'Forbes',
            category: deriveCategory(categories, url),
            date: parseDate(pubDate),
            url,
            excerpt: stripHtml(description).slice(0, 400) || null,
            rss_guid: guid,
            // Store the RSS thumbnail URL in a temporary field we'll resolve below
            _media_url: mediaUrl,
        };
    });
}

/**
 * Return the set of rss_guid values already stored in Directus.
 */
async function fetchExistingGuids() {
    const existing = await directus.request(
        readItems('articles', {
            fields: ['rss_guid'],
            filter: { rss_guid: { _nnull: true } },
            limit: -1,
        })
    );
    return new Set(existing.map((a) => a.rss_guid).filter(Boolean));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n🚀  RSS Sync — ${new Date().toISOString()}\n${'─'.repeat(50)}`);

    // 1. Auth
    console.log(`\n🔐  Logging in as ${EMAIL} …`);
    await directus.login({ email: EMAIL, password: PASSWORD });
    console.log('✅  Authenticated.');

    // 2. Fetch feed
    const feedArticles = await fetchFeed();

    // 3. Load existing GUIDs so we can skip duplicates
    console.log('\n🔍  Checking for existing entries …');
    const existingGuids = await fetchExistingGuids();
    console.log(`   ${existingGuids.size} existing RSS-sourced articles found.`);

    // 4. Filter to only new items
    const newArticles = feedArticles.filter((a) => a.rss_guid && !existingGuids.has(a.rss_guid));
    console.log(`   ${newArticles.length} new articles to import, ${feedArticles.length - newArticles.length} skipped (already exist).`);

    if (newArticles.length === 0) {
        console.log('\n✅  Nothing new to import.\n');
        return;
    }

    // 5. Insert new articles
    console.log('\n📥  Importing new articles …');
    let imported = 0;
    let failed = 0;

    for (const article of newArticles) {
        // Strip the internal helper field before inserting
        const { _media_url, ...payload } = article;

        try {
            await directus.request(createItem('articles', {
                ...payload,
                is_featured: false,
                is_headline: false,
            }));
            console.log(`   ✓  ${article.title.slice(0, 70)}${article.title.length > 70 ? '…' : ''}`);
            imported++;
        } catch (e) {
            const msg = e?.errors?.[0]?.message || e?.message || String(e);
            if (msg.includes('UNIQUE') || msg.includes('duplicate') || msg.includes('already exists')) {
                console.log(`   ⏭  Skipped (duplicate): ${article.title.slice(0, 60)}…`);
            } else {
                console.error(`   ✗  Failed: ${article.title.slice(0, 60)}… — ${msg}`);
                failed++;
            }
        }
    }

    console.log(`\n✅  Done!  Imported: ${imported}  |  Skipped: ${feedArticles.length - newArticles.length}  |  Failed: ${failed}\n`);
}

main().catch((err) => {
    console.error('\n❌  Fatal:', err?.errors || err.message || err);
    process.exit(1);
});
