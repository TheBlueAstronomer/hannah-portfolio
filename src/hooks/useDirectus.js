/**
 * useDirectus.js
 * Generic React hooks for fetching Directus collections and singletons.
 *
 * Usage:
 *   const { data, loading, error } = useDirectus('testimonials', { sort: ['sort'] });
 *   const { settings, loading } = useSiteSettings();
 */

import { useState, useEffect } from 'react';
import { readItems, readSingleton } from '@directus/sdk';
import { directus } from '../directus';

// ─── Generic collection hook ──────────────────────────────────────────────────

export function useDirectus(collection, query = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        directus
            .request(readItems(collection, query))
            .then((res) => {
                if (!cancelled) setData(res ?? []);
            })
            .catch((err) => {
                if (!cancelled) {
                    console.warn(`[useDirectus] Failed to fetch "${collection}":`, err?.message ?? err);
                    setError(err);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collection]);

    return { data, loading, error };
}

// ─── Singleton hook (site_settings) ──────────────────────────────────────────

const SETTINGS_FIELDS = [
    'hero_descriptor',
    'hero_stat_years',
    'hero_stat_articles',
    'hero_stat_publications',
    'hero_availability',
    'about_line1',
    'about_line2',
    'about_bio',
    'contact_email',
    'contact_description',
    'social_linkedin',
    'social_twitter',
    'social_instagram',
];

export function useSiteSettings() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true); // true by default — no setState needed in effect
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        directus
            .request(readSingleton('site_settings', { fields: SETTINGS_FIELDS }))
            .then((res) => {
                if (!cancelled) setSettings(res ?? null);
            })
            .catch((err) => {
                if (!cancelled) {
                    console.warn('[useSiteSettings] Failed to fetch site_settings:', err?.message ?? err);
                    setError(err);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    return { settings, loading, error };
}
