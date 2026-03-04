#!/usr/bin/env node
/**
 * add-rss-fields.mjs — Idempotent migration
 * ------------------------------------------
 * Adds `excerpt` and `rss_guid` fields to the existing `articles` collection
 * in a live Directus instance. Safe to re-run — skips fields that already exist.
 *
 * Usage:
 *   DIRECTUS_URL=http://34.100.194.88 \
 *   DIRECTUS_EMAIL=admin@hannah.com   \
 *   DIRECTUS_PASSWORD=admin1234       \
 *   node directus/add-rss-fields.mjs
 */

import {
    createDirectus, rest, authentication,
    createField,
} from '@directus/sdk';

const URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const EMAIL = process.env.DIRECTUS_EMAIL || 'admin@hannah.com';
const PASSWORD = process.env.DIRECTUS_PASSWORD || 'admin1234';

const client = createDirectus(URL).with(authentication()).with(rest());

async function tryCreate(label, fn) {
    try {
        await fn();
        console.log(`   ✓  ${label}`);
    } catch (e) {
        const msg = e?.errors?.[0]?.message || e?.message || String(e);
        if (
            msg.includes('already exists') ||
            msg.includes('UNIQUE') ||
            msg.includes('duplicate')
        ) {
            console.log(`   ⏭  ${label} — already exists, skipping.`);
        } else {
            console.warn(`   ⚠  ${label} — ${msg}`);
        }
    }
}

async function main() {
    console.log(`\n🔐  Logging in as ${EMAIL} …`);
    await client.login({ email: EMAIL, password: PASSWORD });
    console.log('✅  Authenticated.\n');

    console.log('📋  Adding RSS fields to articles collection …');

    // excerpt — the article teaser shown in the archive grid
    await tryCreate('articles.excerpt', () =>
        client.request(createField('articles', {
            field: 'excerpt',
            type: 'text',
            meta: {
                interface: 'input-multiline',
                note: 'Article teaser / description shown in the archive grid',
            },
            schema: { is_nullable: true },
        }))
    );

    // rss_guid — unique identifier from the RSS <guid> element, used for deduplication
    await tryCreate('articles.rss_guid', () =>
        client.request(createField('articles', {
            field: 'rss_guid',
            type: 'string',
            meta: {
                interface: 'input',
                note: 'RSS <guid> — used for deduplication; do not edit manually',
                hidden: true,
            },
            schema: {
                is_nullable: true,
                is_unique: true,
            },
        }))
    );

    console.log('\n✅  Migration complete!\n');
}

main().catch(err => {
    console.error('\n❌  Fatal:', err?.errors || err.message);
    process.exit(1);
});
