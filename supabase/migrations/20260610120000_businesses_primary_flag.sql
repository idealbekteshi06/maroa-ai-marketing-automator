-- AUDIT_2026-06-10.md §9.4 — businesses de-dupe + primary-business marker.
--
-- WHERE TO RUN: the EXTERNAL Supabase project that serves production
-- (VITE_SUPABASE_URL → zqhyrbttuqkvmdewiytf.supabase.co). This repo holds the
-- migration so it ships reviewed and version-controlled; executing it needs
-- service-role/owner access (the frontend's publishable key cannot run DDL).
--
-- WHY: users can own multiple businesses rows (a duplicate-creation bug wrote
-- second rows for some accounts). The frontend now picks onboarded-first /
-- oldest (src/lib/business.ts); this migration makes that choice durable and
-- enforced at the database.
--
-- DELIBERATELY NOT A DELETE: duplicate rows may own FK'd data
-- (generated_content.business_id etc.). Deleting them would orphan or cascade
-- that content. Mark a single primary instead; merge/cleanup is a manual,
-- per-account decision (checklist at the bottom).

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- Backfill: exactly one primary per user — prefer onboarded, then oldest.
-- (Same ordering the frontend uses, so behavior does not change on cutover.)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id
           ORDER BY onboarding_complete DESC NULLS LAST,
                    created_at ASC NULLS LAST,
                    id ASC
         ) AS rn
  FROM public.businesses
)
UPDATE public.businesses b
SET is_primary = (r.rn = 1)
FROM ranked r
WHERE b.id = r.id;

-- Enforce at most one primary per user from now on.
CREATE UNIQUE INDEX IF NOT EXISTS businesses_one_primary_per_user
  ON public.businesses (user_id)
  WHERE is_primary;

-- ── Post-migration follow-ups (manual) ──────────────────────────────────────
-- 1. Frontend phase 2 (separate PR, ONLY after this runs in prod): order
--    business reads by is_primary DESC first; do not select is_primary before
--    then — PostgREST 400s on unknown columns.
-- 2. Per-account duplicate merge checklist:
--    a. SELECT id, business_name, onboarding_complete, created_at
--       FROM public.businesses WHERE user_id = :uid ORDER BY created_at;
--    b. Repoint child rows (generated_content, contacts, post_drafts,
--       business_photos, …) from the duplicate id to the primary id.
--    c. Only then delete the duplicate row.
