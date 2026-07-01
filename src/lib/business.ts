/**
 * A user can legitimately own MORE THAN ONE businesses row (the bug class
 * audited in AUDIT_2026-06-10.md §1: `.eq("user_id", …).maybeSingle()` makes
 * PostgREST error on the multi-row result, which broke login and left
 * businessId null app-wide).
 *
 * Always read businesses as a LIST (optionally server-ordered with
 * `.order("onboarding_complete", { ascending: false }).order("created_at",
 * { ascending: true })`) and pick the primary row with this helper:
 * the first onboarded business wins, else the first (oldest) row.
 */
export function pickPrimaryBusiness<T extends { onboarding_complete?: boolean | null }>(
  rows: T[] | null | undefined,
): T | null {
  const list = rows ?? [];
  return list.find((r) => !!r.onboarding_complete) ?? list[0] ?? null;
}
