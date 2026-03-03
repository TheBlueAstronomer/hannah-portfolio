#!/usr/bin/env node
/**
 * seed_testimonials.mjs
 * ---------------------
 * Seeds the Directus `testimonials` collection with the portfolio's default
 * review cards. Run ONCE after creating the collection in Directus.
 *
 * Usage:
 *   DIRECTUS_URL=http://localhost:8055 \
 *   DIRECTUS_TOKEN=<admin-static-token> \
 *   node directus/seed/seed_testimonials.mjs
 */

import { createDirectus, rest, staticToken, createItems } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
    console.error('❌  DIRECTUS_TOKEN env var is required.');
    process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

const testimonials = [
    {
        quote:
            "Hannah does not merely review films — she translates them. Her analysis of the year's best cinema gave readers a framework for understanding cinema they didn't know they needed.",
        author: 'Marcus Delray',
        job_title: 'Editor-in-Chief',
        publication: 'Criterion Quarterly',
        rating: 5,
        bg_color: '#FAFAFE',
        accent_color: 'var(--color-violet)',
        category: 'Press Review',
        is_dark: false,
        sort: 1,
    },
    {
        quote:
            'When we publish Hannah, our traffic spikes and our inbox fills. She has an extraordinary gift for identifying the cultural current before it crests. Our readers trust her completely.',
        author: 'Sophia Chen-Nakamura',
        job_title: 'Digital Director',
        publication: 'ELLE Magazine',
        rating: 5,
        bg_color: 'var(--color-charcoal)',
        accent_color: 'var(--color-periwinkle)',
        category: 'Client Testimonial',
        is_dark: true,
        sort: 2,
    },
    {
        quote:
            'In seven years of commissioning entertainment journalism, Hannah stands apart. Her interviews are unflinching, warm, and always reveal something the subject did not know they were willing to share.',
        author: 'Priya Radhakrishnan',
        job_title: 'Features Editor',
        publication: 'The Cultural Review',
        rating: 5,
        bg_color: '#F0EEF8',
        accent_color: 'var(--color-violet)',
        category: 'Editorial Endorsement',
        is_dark: false,
        sort: 3,
    },
];

async function seed() {
    console.log(`🌱  Connecting to Directus at ${DIRECTUS_URL} …`);
    try {
        const result = await directus.request(createItems('testimonials', testimonials));
        console.log(`✅  Seeded ${result.length} testimonials.`);
    } catch (err) {
        console.error('❌  Seed failed:', err?.errors || err.message);
        process.exit(1);
    }
}

seed();
