import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://zqhyrbttuqkvmdewiytf.supabase.co';
const FALLBACK_KEY = 'sb_publishable_4O2w1ObpYPQ7eOIlOhwl5A_8GxCt-gs';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const EXTERNAL_SUPABASE_URL =
  typeof rawUrl === 'string' && rawUrl.startsWith('https://') ? rawUrl : FALLBACK_URL;
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const EXTERNAL_SUPABASE_ANON_KEY =
  typeof rawKey === 'string' && rawKey.length > 20 ? rawKey : FALLBACK_KEY;

// The fallbacks are public publishable values kept as a deploy safety net
// (.env is no longer committed), but silently masking a missing env var made
// misconfiguration invisible (audit §7) — so at least say it out loud.
if (EXTERNAL_SUPABASE_URL === FALLBACK_URL || EXTERNAL_SUPABASE_ANON_KEY === FALLBACK_KEY) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY missing — using built-in fallback project.'
  );
}

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
