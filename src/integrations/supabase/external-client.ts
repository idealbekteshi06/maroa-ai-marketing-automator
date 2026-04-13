import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://zqhyrbttuqkvmdewiytf.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_4O2w1ObpYPQ7eOIlOhwl5A_8GxCt-gs';

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
