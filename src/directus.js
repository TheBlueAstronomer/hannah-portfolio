// directus.js — Directus SDK client
// Talks to the self-hosted Directus CMS container.
// The `articles` collection is configured as publicly readable,
// so no auth token is required for read operations.

import { createDirectus, rest } from '@directus/sdk';

export const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';

export const directus = createDirectus(DIRECTUS_URL).with(rest());
