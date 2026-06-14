import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://zqhyrbttuqkvmdewiytf.supabase.co';
const FALLBACK_KEY = 'sb_publishable_4O2w1ObpYPQ7eOIlOhwl5A_8GxCt-gs';

/**
 * Trim whitespace and strip accidental surrounding quotes. Vercel values are
 * frequently pasted *with* their quotes (`"https://…"`) or a stray placeholder
 * (git history: VITE_SUPABASE_URL was once literally the string
 * `npx vercel env add VITE_SUPABASE_URL`), which then failed validation and
 * silently fell back. Cleaning first turns a recoverable paste error into a
 * usable value instead of a fallback.
 */
function clean(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/^['"]+|['"]+$/g, '').trim();
}

/** First non-empty cleaned value from the candidate env vars. */
function pick(...raws: unknown[]): string {
  for (const r of raws) {
    const c = clean(r);
    if (c) return c;
  }
  return '';
}

// Canonical names first, then the legacy / alternate names a real Vercel project
// might actually carry. The un-prefixed SUPABASE_* names injected by the
// Supabase↔Vercel integration are bridged into VITE_SUPABASE_* at build time by
// vite.config.ts (Vite never exposes un-prefixed vars to the client bundle), so
// reading the VITE_-prefixed names here is sufficient.
const envUrl = pick(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
);
const envKey = pick(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
);

const urlValid = envUrl.startsWith('https://');
const keyValid = envKey.length > 20;

/** Resolved, validated values — import these instead of reading import.meta.env
 *  directly so every caller gets the same sanitization + fallback behaviour. */
export const SUPABASE_URL = urlValid ? envUrl : FALLBACK_URL;
export const SUPABASE_PUBLISHABLE_KEY = keyValid ? envKey : FALLBACK_KEY;

// The fallbacks are public publishable values kept as a deploy safety net
// (.env is no longer committed), but silently masking a missing/garbage env var
// made misconfiguration invisible (audit §7) — so say exactly what's wrong and
// how to fix it.
if (!urlValid || !keyValid) {
  const problems: string[] = [];
  if (!urlValid) {
    problems.push(
      envUrl
        ? `VITE_SUPABASE_URL is not a valid https URL (got "${envUrl}")`
        : 'VITE_SUPABASE_URL is missing',
    );
  }
  if (!keyValid) {
    problems.push(
      envKey
        ? 'VITE_SUPABASE_PUBLISHABLE_KEY looks too short to be valid'
        : 'VITE_SUPABASE_PUBLISHABLE_KEY is missing',
    );
  }
  console.warn(
    `[supabase] using built-in fallback project — ${problems.join('; ')}. ` +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the Vercel ' +
      'project (for the deployed environment) and redeploy. Env vars are baked ' +
      'in at build time, so a value added after the last build needs a new deploy.',
  );
}

export const externalSupabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
