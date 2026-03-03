#!/usr/bin/env node
/**
 * seed_site_settings.mjs
 * ----------------------
 * Seeds the Directus `site_settings` singleton collection with the portfolio's
 * default content. Run ONCE after creating the collection in Directus.
 *
 * Usage:
 *   DIRECTUS_URL=http://localhost:8055 \
 *   DIRECTUS_TOKEN=<admin-static-token> \
 *   node directus/seed/seed_site_settings.mjs
 */

import { createDirectus, rest, staticToken, updateSingleton } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
    console.error('❌  DIRECTUS_TOKEN env var is required.');
    process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

const data = {
    // ── Hero section ────────────────────────────────────────────────────────────
    hero_descriptor:
        "Freelance writer and film critic with a history of working in the publishing industry. I don't just report what happened — I uncover why it matters.",
    hero_stat_years: '7+',
    hero_stat_articles: '200+',
    hero_stat_publications: '14',
    hero_availability: true,

    // ── About / Philosophy section ───────────────────────────────────────────────
    about_line1: 'Standard journalism reports what happened.',
    about_line2: 'I uncover why it matters.',
    about_bio:
        'After seven years covering entertainment, film festivals, and cultural shifts — I have sharpened one belief: audiences deserve more than summaries. They deserve context, nuance, and the story beneath the story.',

    // ── Contact / Footer section ─────────────────────────────────────────────────
    contact_email: 'hannah@example.com',
    contact_description:
        'Available for features, interviews, film criticism, cultural commentary, and long-form investigative journalism.',

    // ── Social links ─────────────────────────────────────────────────────────────
    social_linkedin: 'https://www.linkedin.com/in/hannahrachelabraham/',
    social_twitter: 'https://twitter.com/HAN_NA_NA_NAH',
    social_instagram: 'https://www.instagram.com/han_na_na_nah/',
};

async function seed() {
    console.log(`🌱  Connecting to Directus at ${DIRECTUS_URL} …`);
    try {
        await directus.request(updateSingleton('site_settings', data));
        console.log('✅  site_settings seeded successfully.');
    } catch (err) {
        console.error('❌  Seed failed:', err?.errors || err.message);
        process.exit(1);
    }
}

seed();
