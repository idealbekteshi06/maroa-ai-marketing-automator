import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL = 'https://zqhyrbttuqkvmdewiytf.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaHlyYnR0dXFrdm1kZXdpeXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0ODQ4NzAsImV4cCI6MjA1ODA2MDg3MH0.jNDrLqSFpRJfAybMHi5FNJBxPR2UPJDfHc2BORjJKzU';

// Client for the user's external Supabase project
// Import this instead of the Lovable Cloud client when accessing external tables
export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
