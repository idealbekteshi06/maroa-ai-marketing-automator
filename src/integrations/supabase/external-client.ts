import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://zqhyrbttuqkvmdewiytf.supabase.co';
const FALLBACK_KEY = 'sb_publishable_4O2w1ObpYPQ7eOIlOhwl5A_8GxCt-gs';

// This client must point at Maroa's external auth/database project.
// Do not fall back to Lovable Cloud's default Vite env vars here,
// or OAuth/session flows will hit the wrong backend.
const rawUrl = import.meta.env.VITE_EXTERNAL_SUPABASE_URL;
const EXTERNAL_SUPABASE_URL =
  typeof rawUrl === 'string' && rawUrl.startsWith('https://') ? rawUrl : FALLBACK_URL;
const rawKey =
  import.meta.env.VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY;
const EXTERNAL_SUPABASE_ANON_KEY =
  typeof rawKey === 'string' && rawKey.length > 20 ? rawKey : FALLBACK_KEY;

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
