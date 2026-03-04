#!/usr/bin/env node
/**
 * setup.mjs — One-shot Directus bootstrap
 * ----------------------------------------
 * Run ONCE after completing the Directus setup wizard at http://localhost:8055/admin/setup
 *
 * This script:
 *   1. Authenticates with admin email + password
 *   2. Creates all 3 collections (articles, testimonials, site_settings)
 *   3. Adds all required fields to each collection
 *   4. Grants the Public policy read access on all 3 collections
 *   5. Seeds all placeholder content
 *
 * Usage:
 *   node directus/setup.mjs
 *
 * Optional overrides:
 *   DIRECTUS_URL=http://localhost:8055 \
 *   DIRECTUS_EMAIL=admin@hannah.com   \
 *   DIRECTUS_PASSWORD=admin1234       \
 *   node directus/setup.mjs
 */

import {
    createDirectus, rest, authentication,
    createCollection, createField,
    createPermission, readPolicies,
    createItems, updateSingleton,
    withToken,
} from '@directus/sdk';

const URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const EMAIL = process.env.DIRECTUS_EMAIL || 'admin@hannah.com';
const PASSWORD = process.env.DIRECTUS_PASSWORD || 'admin1234';

// ─── helpers ─────────────────────────────────────────────────────────────────

const client = createDirectus(URL).with(authentication()).with(rest());

async function login() {
    console.log(`🔐  Logging in as ${EMAIL} …`);
    await client.login({ email: EMAIL, password: PASSWORD });
    console.log('✅  Authenticated.');
}

async function tryCreate(label, fn) {
    try {
        await fn();
        console.log(`   ✓  ${label}`);
    } catch (e) {
        const msg = e?.errors?.[0]?.message || e?.message || String(e);
        if (msg.includes('already exists') || msg.includes('UNIQUE') || msg.includes('duplicate')) {
            console.log(`   ⏭  ${label} — already exists, skipping.`);
        } else {
            console.warn(`   ⚠  ${label} — ${msg}`);
        }
    }
}

// ─── 1. COLLECTIONS ───────────────────────────────────────────────────────────

async function createCollections() {
    console.log('\n📦  Creating collections …');

    await tryCreate('articles', () =>
        client.request(createCollection({
            collection: 'articles',
            meta: { icon: 'article', singleton: false },
            schema: {},
            fields: [],
        }))
    );

    await tryCreate('testimonials', () =>
        client.request(createCollection({
            collection: 'testimonials',
            meta: { icon: 'format_quote', singleton: false },
            schema: {},
            fields: [],
        }))
    );

    await tryCreate('site_settings', () =>
        client.request(createCollection({
            collection: 'site_settings',
            meta: { icon: 'settings', singleton: true },
            schema: {},
            fields: [],
        }))
    );
}

// ─── 2. FIELDS ────────────────────────────────────────────────────────────────

function field(name, type, interfaceName, extra = {}) {
    return {
        field: name,
        type,
        meta: { interface: interfaceName, ...extra },
        schema: { is_nullable: true, ...(extra.schema || {}) },
    };
}

async function createFields() {
    console.log('\n🗂   Creating fields …');

    // ── articles ──────────────────────────────────────────────────────────────
    const articleFields = [
        field('title', 'string', 'input', { required: true }),
        field('publication', 'string', 'input', { required: true }),
        field('category', 'string', 'input'),
        field('date', 'date', 'datetime'),
        field('url', 'string', 'input'),
        field('excerpt', 'text', 'input-multiline', { note: 'Article teaser shown in the archive grid' }),
        field('rss_guid', 'string', 'input', { note: 'RSS <guid> for deduplication — do not edit manually', hidden: true }),
        field('card_color', 'string', 'input'),
        field('accent_color', 'string', 'input'),
        field('sort', 'integer', 'input-default-value', { hidden: false }),
        field('is_featured', 'boolean', 'boolean', { note: 'Show in Card Shuffler' }),
        field('is_headline', 'boolean', 'boolean', { note: 'Show in Typewriter Feed' }),
        field('image', 'uuid', 'file-image'),
    ];
    for (const f of articleFields) {
        await tryCreate(`articles.${f.field}`, () =>
            client.request(createField('articles', f))
        );
    }

    // ── testimonials ──────────────────────────────────────────────────────────
    const testimonialFields = [
        field('quote', 'text', 'input-multiline', { required: true }),
        field('author', 'string', 'input', { required: true }),
        field('job_title', 'string', 'input'),
        field('publication', 'string', 'input'),
        field('rating', 'integer', 'input'),
        field('category', 'string', 'input'),
        field('bg_color', 'string', 'input'),
        field('accent_color', 'string', 'input'),
        field('is_dark', 'boolean', 'boolean', { note: 'Dark card variant' }),
        field('sort', 'integer', 'input'),
    ];
    for (const f of testimonialFields) {
        await tryCreate(`testimonials.${f.field}`, () =>
            client.request(createField('testimonials', f))
        );
    }

    // ── site_settings ─────────────────────────────────────────────────────────
    const settingsFields = [
        field('hero_descriptor', 'text', 'input-multiline'),
        field('hero_stat_years', 'string', 'input'),
        field('hero_stat_articles', 'string', 'input'),
        field('hero_stat_publications', 'string', 'input'),
        field('hero_availability', 'boolean', 'boolean', { note: 'Open For Commissions' }),
        field('about_line1', 'string', 'input'),
        field('about_line2', 'string', 'input'),
        field('about_bio', 'text', 'input-multiline'),
        field('contact_email', 'string', 'input'),
        field('contact_description', 'text', 'input-multiline'),
        field('social_linkedin', 'string', 'input'),
        field('social_twitter', 'string', 'input'),
        field('social_instagram', 'string', 'input'),
    ];
    for (const f of settingsFields) {
        await tryCreate(`site_settings.${f.field}`, () =>
            client.request(createField('site_settings', f))
        );
    }
}

// ─── 3. PUBLIC READ PERMISSIONS ───────────────────────────────────────────────

async function setPermissions() {
    console.log('\n🔓  Setting public read permissions …');

    // Find the built-in $public policy
    const policies = await client.request(readPolicies({ filter: { name: { _eq: '$public' } } }));
    const publicPolicy = policies?.[0];

    if (!publicPolicy) {
        console.warn('   ⚠  Could not find $public policy — set permissions manually in Directus admin.');
        return;
    }

    for (const collection of ['articles', 'testimonials', 'site_settings']) {
        await tryCreate(`public read → ${collection}`, () =>
            client.request(createPermission({
                policy: publicPolicy.id,
                collection,
                action: 'read',
                fields: ['*'],
            }))
        );
    }
}

// ─── 4. SEED DATA ─────────────────────────────────────────────────────────────

async function seedArticles() {
    console.log('\n🌱  Seeding articles …');
    const articles = [
        { title: "BAFTA-Winning Director Lakshmipriya Devi On 'Boong': 'Everyone Told Me Not To Make It'", publication: 'Forbes', category: 'FEATURE — FORBES', date: '2026-02-28', url: 'https://www.forbes.com/sites/hannahabraham/2026/02/28/bafta-winning-director-lakshmipriya-devi-on-boong-everyone-told-me-not-to-make-it/', card_color: '#C3C0D8', accent_color: '#584B77', sort: 1, is_featured: true, is_headline: false },
        { title: "'Mufasa' Songwriter Lin-Manuel Miranda On Working With Barry Jenkins & Why The 'Hamilton' Parallel Is A Myth", publication: 'Deadline', category: 'INTERVIEW — DEADLINE', date: '2024-12-01', url: 'https://deadline.com/feature/mufasa-the-lion-king-lin-manuel-miranda-interview-1236242723/', card_color: '#E8E4F0', accent_color: '#3D3460', sort: 2, is_featured: true, is_headline: true },
        { title: "The Very Beginning Of Outstation: Inside India's Most Ambitious Boyband", publication: 'Forbes', category: 'LONG READ — FORBES', date: '2026-02-27', url: 'https://www.forbes.com/sites/hannahabraham/2026/02/27/the-very-beginning-of-outstation/', card_color: '#F4F0FA', accent_color: '#584B77', sort: 3, is_featured: true, is_headline: false },
        { title: '2026 Actor Awards Shake Up The Oscar Race: A Category-By-Category Breakdown', publication: 'Forbes', category: 'ANALYSIS — FORBES', date: '2026-03-01', url: 'https://www.forbes.com/sites/hannahabraham/2026/03/01/what-the-actor-awards-2026-tell-us-about-the-oscar-race-a-category-by-category-breakdown/', card_color: '#DDD9EF', accent_color: '#3D3460', sort: 4, is_featured: true, is_headline: false },
        { title: "'Munjya' Star Sharvari On Finding Success In Bollywood & Her Desire To Work With Greta Gerwig", publication: 'Deadline', category: 'INTERVIEW — DEADLINE', date: '2024-07-01', url: 'https://deadline.com/2024/07/munjya-sharvari-bollywood-greta-gerwig-yrf-alia-bhatt-1235999575/', card_color: '#EAE7F5', accent_color: '#584B77', sort: 5, is_featured: true, is_headline: false },
        { title: 'CJ ENM CEO On $800M Content Strategy, IP Transformation And Hollywood Ambitions', publication: 'Forbes', category: 'FEATURE — BUSINESS INSIDER', date: '2026-02-16', url: 'https://www.forbes.com/sites/hannahabraham/2026/02/16/cj-enm-ceo-on-800m-content-strategy-ip-transformation/', card_color: '#C8C5DE', accent_color: '#3D3460', sort: 6, is_featured: false, is_headline: true },
        { title: "'Kalki 2898 AD': Inside the Prabhas-Starring Sci-Fi Epic That Is One Of India's Most Expensive Movies Of All Time.", publication: 'Forbes', category: 'FEATURE', date: '2024-06-01', url: null, card_color: '#E8E4F0', accent_color: '#3D3460', sort: 7, is_featured: false, is_headline: true },
        { title: "Somali director Mo Harawe on history-making Cannes title 'The Village Next To Paradise': \"For 70% of the crew, it was their first time on a film set.\"", publication: 'Deadline', category: 'INTERVIEW', date: '2024-05-01', url: null, card_color: '#F4F0FA', accent_color: '#584B77', sort: 8, is_featured: false, is_headline: true },
        { title: "Vicky McClure steps out of her comfort zone in Paramount+ thriller 'Insomnia' — and talks candidly about life after Line Of Duty.", publication: 'Forbes', category: 'INTERVIEW', date: '2024-05-01', url: null, card_color: '#DDD9EF', accent_color: '#3D3460', sort: 9, is_featured: false, is_headline: true },
        { title: "Harrison Ford fights back tears accepting the SAG Life Achievement Award: 'It's a little early.'", publication: 'Forbes', category: 'AWARDS', date: '2026-02-01', url: null, card_color: '#EAE7F5', accent_color: '#584B77', sort: 10, is_featured: false, is_headline: true },
        { title: "Bad Bunny's Super Bowl halftime show: every cultural reference, broken down — and what it means for Latin music in 2026.", publication: 'Forbes', category: 'ANALYSIS', date: '2026-02-10', url: null, card_color: '#C8C5DE', accent_color: '#3D3460', sort: 11, is_featured: false, is_headline: true },
    ];
    await tryCreate('articles batch', () => client.request(createItems('articles', articles)));
}

async function seedTestimonials() {
    console.log('\n🌱  Seeding testimonials …');
    const testimonials = [
        { quote: "Hannah does not merely review films — she translates them. Her analysis of the year's best cinema gave readers a framework for understanding cinema they didn't know they needed.", author: 'Marcus Delray', job_title: 'Editor-in-Chief', publication: 'Criterion Quarterly', rating: 5, bg_color: '#FAFAFE', accent_color: 'var(--color-violet)', category: 'Press Review', is_dark: false, sort: 1 },
        { quote: 'When we publish Hannah, our traffic spikes and our inbox fills. She has an extraordinary gift for identifying the cultural current before it crests. Our readers trust her completely.', author: 'Sophia Chen-Nakamura', job_title: 'Digital Director', publication: 'ELLE Magazine', rating: 5, bg_color: 'var(--color-charcoal)', accent_color: 'var(--color-periwinkle)', category: 'Client Testimonial', is_dark: true, sort: 2 },
        { quote: 'In seven years of commissioning entertainment journalism, Hannah stands apart. Her interviews are unflinching, warm, and always reveal something the subject did not know they were willing to share.', author: 'Priya Radhakrishnan', job_title: 'Features Editor', publication: 'The Cultural Review', rating: 5, bg_color: '#F0EEF8', accent_color: 'var(--color-violet)', category: 'Editorial Endorsement', is_dark: false, sort: 3 },
    ];
    await tryCreate('testimonials batch', () => client.request(createItems('testimonials', testimonials)));
}

async function seedSiteSettings() {
    console.log('\n🌱  Seeding site_settings …');
    await tryCreate('site_settings', () =>
        client.request(updateSingleton('site_settings', {
            hero_descriptor: "Freelance writer and film critic with a history of working in the publishing industry. I don't just report what happened — I uncover why it matters.",
            hero_stat_years: '7+', hero_stat_articles: '200+', hero_stat_publications: '14',
            hero_availability: true,
            about_line1: 'Standard journalism reports what happened.',
            about_line2: 'I uncover why it matters.',
            about_bio: 'After seven years covering entertainment, film festivals, and cultural shifts — I have sharpened one belief: audiences deserve more than summaries. They deserve context, nuance, and the story beneath the story.',
            contact_email: 'hannah@example.com',
            contact_description: 'Available for features, interviews, film criticism, cultural commentary, and long-form investigative journalism.',
            social_linkedin: 'https://www.linkedin.com/in/hannahrachelabraham/',
            social_twitter: 'https://twitter.com/HAN_NA_NA_NAH',
            social_instagram: 'https://www.instagram.com/han_na_na_nah/',
        }))
    );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n🚀  Directus Setup — ${URL}\n${'─'.repeat(50)}`);
    try {
        await login();
        await createCollections();
        await createFields();
        await setPermissions();
        await seedArticles();
        await seedTestimonials();
        await seedSiteSettings();
        console.log(`\n✅  Setup complete! Open ${URL} to manage content.\n`);
    } catch (err) {
        console.error('\n❌  Fatal error:', err?.errors || err.message);
        process.exit(1);
    }
}

main();
