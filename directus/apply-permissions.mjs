#!/usr/bin/env node
/**
 * apply-permissions.mjs — Idempotent public read permission enforcer
 * ------------------------------------------------------------------
 * Guarantees the Directus Public policy always has read access on all
 * collections the frontend needs. Safe to run on every deploy:
 *   - Finds the public policy by icon (not hardcoded ID — works across envs)
 *   - For each required collection: if permission exists → PATCH fields=['*']
 *                                   if missing         → POST to create it
 *
 * Usage:
 *   DIRECTUS_URL=http://34.100.194.88/cms \
 *   DIRECTUS_EMAIL=admin@example.com \
 *   DIRECTUS_PASSWORD=yourpassword \
 *   node directus/apply-permissions.mjs
 *
 * Exit codes: 0 = success, 1 = fatal error
 */

const BASE     = (process.env.DIRECTUS_URL || 'http://localhost:8055').replace(/\/$/, '');
const EMAIL    = process.env.DIRECTUS_EMAIL    || 'admin@example.com';
const PASSWORD = process.env.DIRECTUS_PASSWORD || 'changeme123';

const COLLECTIONS = ['articles', 'testimonials', 'site_settings', 'directus_files'];

// Fields that must exist in the articles collection
const REQUIRED_ARTICLE_FIELDS = [
    { field: 'excerpt', type: 'text', meta: { interface: 'input-multiline', note: 'Article teaser shown in the archive grid' }, schema: { is_nullable: true } },
];

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function login() {
    const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const body = await res.json();
    if (!res.ok || !body.data?.access_token) {
        throw new Error(`Login failed (${res.status}): ${JSON.stringify(body.errors || body)}`);
    }
    return body.data.access_token;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n🔐  Logging in to ${BASE} as ${EMAIL} …`);
    const token = await login();
    const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    console.log('✅  Authenticated.\n');

    // 1. Ensure required fields exist in the articles collection
    console.log('🗂   Ensuring required article fields exist …');
    const existingFieldsRes = await fetch(`${BASE}/fields/articles`, { headers: h });
    const existingFieldsBody = await existingFieldsRes.json();
    const existingFieldNames = new Set((existingFieldsBody.data || []).map(f => f.field));

    for (const fieldDef of REQUIRED_ARTICLE_FIELDS) {
        if (existingFieldNames.has(fieldDef.field)) {
            console.log(`   ⏭  articles.${fieldDef.field} — already exists, skipping.`);
        } else {
            const fr = await fetch(`${BASE}/fields/articles`, {
                method: 'POST', headers: h,
                body: JSON.stringify(fieldDef),
            });
            const fb = await fr.json();
            if (fr.ok) {
                console.log(`   ✅  CREATED  articles.${fieldDef.field}`);
            } else {
                console.error(`   ❌  Failed to create articles.${fieldDef.field}:`, JSON.stringify(fb));
            }
        }
    }
    console.log();

    // 2. Find the public policy — match by icon='public' (stable across Directus versions)
    const polRes = await fetch(`${BASE}/policies?filter[icon][_eq]=public&limit=5`, { headers: h });
    const polBody = await polRes.json();
    const publicPolicy = polBody.data?.[0];

    if (!publicPolicy) {
        throw new Error('Could not locate the Public policy. Check your Directus version or policy setup.');
    }
    console.log(`📋  Public policy found: id=${publicPolicy.id}  name="${publicPolicy.name}"\n`);

    // 3. Fetch all existing permissions on the public policy
    const permRes = await fetch(
        `${BASE}/permissions?filter[policy][_eq]=${publicPolicy.id}&limit=100`,
        { headers: h }
    );
    const permBody = await permRes.json();
    const existing = permBody.data || [];
    console.log(`🔍  Found ${existing.length} existing permission(s) on Public policy.\n`);

    // 4. For each required collection: create or patch to fields=['*']
    let ok = true;
    for (const collection of COLLECTIONS) {
        const perm = existing.find(p => p.collection === collection && p.action === 'read');

        if (perm) {
            // Already exists — PATCH to ensure fields=['*'] (covers partial grants)
            const patchRes = await fetch(`${BASE}/permissions/${perm.id}`, {
                method: 'PATCH',
                headers: h,
                body: JSON.stringify({ fields: ['*'] }),
            });
            if (patchRes.ok) {
                console.log(`✅  PATCHED  ${collection}:read → fields=['*']  (id: ${perm.id})`);
            } else {
                const err = await patchRes.json();
                console.error(`❌  PATCH failed for ${collection}:`, JSON.stringify(err));
                ok = false;
            }
        } else {
            // Missing — create it
            const createRes = await fetch(`${BASE}/permissions`, {
                method: 'POST',
                headers: h,
                body: JSON.stringify({
                    policy: publicPolicy.id,
                    collection,
                    action: 'read',
                    fields: ['*'],
                }),
            });
            const createBody = await createRes.json();
            if (createRes.ok) {
                console.log(`✅  CREATED  ${collection}:read → fields=['*']  (id: ${createBody.data?.id})`);
            } else {
                console.error(`❌  CREATE failed for ${collection}:`, JSON.stringify(createBody));
                ok = false;
            }
        }
    }

    // 5. Flush Directus server cache so updated permissions take effect immediately
    console.log('\n🧹  Flushing Directus cache …');
    const flushRes = await fetch(`${BASE}/utils/cache/clear`, {
        method: 'POST',
        headers: h,
    });
    if (flushRes.ok || flushRes.status === 204) {
        console.log('✅  Cache flushed.\n');
    } else {
        const flushBody = await flushRes.text();
        console.warn(`⚠️   Cache flush returned HTTP ${flushRes.status}: ${flushBody}`);
    }

    // 6. Verify — unauthenticated GET on each collection
    console.log('\n🔍  Verifying public read access (unauthenticated) …');
    let allGood = true;
    for (const collection of COLLECTIONS) {
        // directus_files is a system collection — served at /files, not /items/directus_files
        let endpoint;
        if (collection === 'directus_files') {
            endpoint = `${BASE}/files?limit=1`;
        } else if (collection === 'site_settings') {
            endpoint = `${BASE}/items/${collection}`;
        } else {
            endpoint = `${BASE}/items/${collection}?limit=1`;
        }
        const res = await fetch(endpoint);
        const icon = res.ok ? '✅' : '❌';
        console.log(`   ${icon}  ${collection}: HTTP ${res.status}`);
        if (!res.ok) allGood = false;
    }

    if (!ok || !allGood) {
        throw new Error('One or more permissions could not be applied. See errors above.');
    }

    console.log('\n✅  All public read permissions confirmed.\n');
}

main().catch(err => {
    console.error('\n❌  Fatal:', err.message);
    process.exit(1);
});
