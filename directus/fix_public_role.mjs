#!/usr/bin/env node
/**
 * fix_public_access.mjs
 * ---------------------
 * In Directus 11 the "Public" access policy (id: abf8a154-...) defines what
 * unauthenticated requests can read.  The permissions we created are ON that
 * policy — we just need to confirm they are saved correctly.
 *
 * This script:
 *   1. Logs in
 *   2. Lists the permissions on the Public policy to confirm they exist
 *   3. If any collection is missing read permission, creates it
 */
const BASE = process.env.DIRECTUS_URL || 'http://localhost:8055';
const EMAIL = process.env.DIRECTUS_EMAIL || 'admin@hannah.com';
const PASSWORD = process.env.DIRECTUS_PASSWORD || 'admin1234';

const PUBLIC_POLICY_ID = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17';
const COLLECTIONS = ['articles', 'testimonials', 'site_settings'];

// Login
const lr = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const { data: { access_token: token } } = await lr.json();
const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

// Get existing permissions for the public policy
const pr = await fetch(`${BASE}/permissions?filter[policy][_eq]=${PUBLIC_POLICY_ID}&limit=50`, { headers: h });
const { data: existingPerms } = await pr.json();
console.log('Existing perms on Public policy:', existingPerms?.map(p => `${p.collection}:${p.action}`));

// Ensure read permission exists for each collection
for (const collection of COLLECTIONS) {
    const already = existingPerms?.find(p => p.collection === collection && p.action === 'read');
    if (already) {
        console.log(`✅  ${collection}:read already exists (id: ${already.id})`);
    } else {
        console.log(`➕  Creating read permission for ${collection} …`);
        const cr = await fetch(`${BASE}/permissions`, {
            method: 'POST', headers: h,
            body: JSON.stringify({ policy: PUBLIC_POLICY_ID, collection, action: 'read', fields: ['*'] }),
        });
        const cd = await cr.json();
        if (cr.ok) {
            console.log(`✅  Created: ${collection}:read (id: ${cd.data?.id})`);
        } else {
            console.error(`❌  Failed for ${collection}:`, JSON.stringify(cd));
        }
    }
}

// Quick verification — test the public API
console.log('\n🔍  Verifying public API access …');
for (const col of COLLECTIONS) {
    const endpoint = col === 'site_settings'
        ? `${BASE}/items/${col}`
        : `${BASE}/items/${col}?limit=1`;
    const res = await fetch(endpoint);
    console.log(`   ${col}: HTTP ${res.status} ${res.ok ? '✅' : '❌'}`);
}
