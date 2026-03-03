#!/usr/bin/env node
/**
 * probe_api.mjs — inspect Directus 11 roles + policies structure
 */
const base = 'http://localhost:8055';

const l = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hannah.com', password: 'admin1234' })
});
const ld = await l.json();
const token = ld.data?.access_token;
if (!token) { console.error('Login failed:', ld); process.exit(1); }

const h = { Authorization: 'Bearer ' + token };

const r = await fetch(base + '/roles?limit=20', { headers: h });
const roles = await r.json();
console.log('ROLES:', JSON.stringify(roles.data?.map(x => ({ id: x.id, name: x.name, policies: x.policies })), null, 2));

const p = await fetch(base + '/policies?limit=20', { headers: h });
const pols = await p.json();
console.log('POLICIES:', JSON.stringify(pols.data?.map(x => ({ id: x.id, name: x.name })), null, 2));
