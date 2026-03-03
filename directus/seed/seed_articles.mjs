#!/usr/bin/env node
/**
 * seed_articles.mjs
 * -----------------
 * Seeds the Directus `articles` collection with the portfolio's placeholder
 * article data. Run this after the collection has been created in Directus.
 *
 * Usage (from the project root):
 *   DIRECTUS_URL=http://localhost:8055 \
 *   DIRECTUS_TOKEN=<admin-static-token> \
 *   node directus/seed/seed_articles.mjs
 *
 * Or via Docker Compose:
 *   docker compose exec directus \
 *     node /directus/seed/seed_articles.mjs
 */

import { createDirectus, rest, staticToken, createItems } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
    console.error('❌  DIRECTUS_TOKEN env var is required. Generate one in Directus → Settings → API Tokens.');
    process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

// ─────────────────────────────────────────────────────────────────────────────
// Seed data — mirrors the PLACEHOLDER_COVERS constant in Portfolio.jsx
// ─────────────────────────────────────────────────────────────────────────────

const articles = [
    {
        title: "BAFTA-Winning Director Lakshmipriya Devi On 'Boong': 'Everyone Told Me Not To Make It'",
        publication: 'Forbes',
        category: 'FEATURE — FORBES',
        date: '2026-02-28',
        url: 'https://www.forbes.com/sites/hannahabraham/2026/02/28/bafta-winning-director-lakshmipriya-devi-on-boong-everyone-told-me-not-to-make-it/',
        card_color: '#C3C0D8',
        accent_color: '#584B77',
        sort: 1,
        is_featured: true,
        is_headline: false,
    },
    {
        title: "'Mufasa' Songwriter Lin-Manuel Miranda On Working With Barry Jenkins & Why The 'Hamilton' Parallel Is A Myth",
        publication: 'Deadline',
        category: 'INTERVIEW — DEADLINE',
        date: '2024-12-01',
        url: 'https://deadline.com/feature/mufasa-the-lion-king-lin-manuel-miranda-interview-1236242723/',
        card_color: '#E8E4F0',
        accent_color: '#3D3460',
        sort: 2,
        is_featured: true,
        is_headline: true,
    },
    {
        title: "The Very Beginning Of Outstation: Inside India's Most Ambitious Boyband",
        publication: 'Forbes',
        category: 'LONG READ — FORBES',
        date: '2026-02-27',
        url: 'https://www.forbes.com/sites/hannahabraham/2026/02/27/the-very-beginning-of-outstation/',
        card_color: '#F4F0FA',
        accent_color: '#584B77',
        sort: 3,
        is_featured: true,
        is_headline: false,
    },
    {
        title: '2026 Actor Awards Shake Up The Oscar Race: A Category-By-Category Breakdown',
        publication: 'Forbes',
        category: 'ANALYSIS — FORBES',
        date: '2026-03-01',
        url: 'https://www.forbes.com/sites/hannahabraham/2026/03/01/what-the-actor-awards-2026-tell-us-about-the-oscar-race-a-category-by-category-breakdown/',
        card_color: '#DDD9EF',
        accent_color: '#3D3460',
        sort: 4,
        is_featured: true,
        is_headline: false,
    },
    {
        title: "'Munjya' Star Sharvari On Finding Success In Bollywood & Her Desire To Work With Greta Gerwig",
        publication: 'Deadline',
        category: 'INTERVIEW — DEADLINE',
        date: '2024-07-01',
        url: 'https://deadline.com/2024/07/munjya-sharvari-bollywood-greta-gerwig-yrf-alia-bhatt-1235999575/',
        card_color: '#EAE7F5',
        accent_color: '#584B77',
        sort: 5,
        is_featured: true,
        is_headline: false,
    },
    {
        title: 'CJ ENM CEO On $800M Content Strategy, IP Transformation And Hollywood Ambitions',
        publication: 'Forbes',
        category: 'FEATURE — BUSINESS INSIDER',
        date: '2026-02-16',
        url: 'https://www.forbes.com/sites/hannahabraham/2026/02/16/cj-enm-ceo-on-800m-content-strategy-ip-transformation-and-no-other-choice-oscar-disappointment/',
        card_color: '#C8C5DE',
        accent_color: '#3D3460',
        sort: 6,
        is_featured: false,
        is_headline: true,
    },
    // ── Typewriter-only headlines ────────────────────────────────────────────────
    {
        title: "'Kalki 2898 AD': Inside the Prabhas-Starring Sci-Fi Epic That Is One Of India's Most Expensive Movies Of All Time.",
        publication: 'Forbes',
        category: 'FEATURE',
        date: '2024-06-01',
        url: null,
        card_color: '#E8E4F0',
        accent_color: '#3D3460',
        sort: 7,
        is_featured: false,
        is_headline: true,
    },
    {
        title: "Somali director Mo Harawe on history-making Cannes title 'The Village Next To Paradise': \"For 70% of the crew, it was their first time on a film set.\"",
        publication: 'Deadline',
        category: 'INTERVIEW',
        date: '2024-05-01',
        url: null,
        card_color: '#F4F0FA',
        accent_color: '#584B77',
        sort: 8,
        is_featured: false,
        is_headline: true,
    },
    {
        title: "Vicky McClure steps out of her comfort zone in Paramount+ thriller 'Insomnia' — and talks candidly about life after Line Of Duty.",
        publication: 'Forbes',
        category: 'INTERVIEW',
        date: '2024-05-01',
        url: null,
        card_color: '#DDD9EF',
        accent_color: '#3D3460',
        sort: 9,
        is_featured: false,
        is_headline: true,
    },
    {
        title: "Harrison Ford fights back tears accepting the SAG Life Achievement Award: 'It's a little early.'",
        publication: 'Forbes',
        category: 'AWARDS',
        date: '2026-02-01',
        url: null,
        card_color: '#EAE7F5',
        accent_color: '#584B77',
        sort: 10,
        is_featured: false,
        is_headline: true,
    },
    {
        title: "Bad Bunny's Super Bowl halftime show: every cultural reference, broken down — and what it means for Latin music in 2026.",
        publication: 'Forbes',
        category: 'ANALYSIS',
        date: '2026-02-10',
        url: null,
        card_color: '#C8C5DE',
        accent_color: '#3D3460',
        sort: 11,
        is_featured: false,
        is_headline: true,
    },
];

async function seed() {
    console.log(`🌱  Connecting to Directus at ${DIRECTUS_URL} …`);
    try {
        const result = await directus.request(createItems('articles', articles));
        console.log(`✅  Seeded ${result.length} articles.`);
    } catch (err) {
        console.error('❌  Seed failed:', err?.errors || err.message);
        process.exit(1);
    }
}

seed();
