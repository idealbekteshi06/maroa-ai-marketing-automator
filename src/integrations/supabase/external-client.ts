import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://zqhyrbttuqkvmdewiytf.supabase.co';
const FALLBACK_KEY = 'sb_publishable_4O2w1ObpYPQ7eOIlOhwl5A_8GxCt-gs';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const EXTERNAL_SUPABASE_URL =
  typeof rawUrl === 'string' && rawUrl.startsWith('https://') ? rawUrl : FALLBACK_URL;
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const EXTERNAL_SUPABASE_ANON_KEY =
  typeof rawKey === 'string' && rawKey.length > 20 ? rawKey : FALLBACK_KEY;

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
