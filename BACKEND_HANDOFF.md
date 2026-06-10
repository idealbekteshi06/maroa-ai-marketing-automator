# Backend Handoff — executable closure of AUDIT_2026-06-10.md §9

Everything the frontend repo can author for the five backend/DB items is in this
file or referenced from it. Each item below states **frontend exposure on
current `main`** (verified by grep on the audited tree), the **deliverable in
this repo**, and the **operator step** that needs credentials this environment
verifiably does not have (no `maroa-api` repo access in this session — checked;
no Railway/Stripe/service-role credentials; the publishable Supabase key cannot
run DDL).

---

## 1. `GET /api/business/:businessId/integrations` → 404 (route not deployed)

- **Frontend exposure today: NONE.** No caller exists on current `main`
  (verified — connection status reads `businesses` row fields directly in
  `DashboardSocial.tsx`). This becomes relevant only when an integrations
  surface returns.
- **Deliverable — ready-to-paste Express handler** (matches the documented
  contract in the pre-restore tree, `{ ok, integrations[], connected_count,
  recommended_action }`):

```js
app.get("/api/business/:businessId/integrations", requireSupabaseJwt, async (req, res) => {
  const { businessId } = req.params;
  const { data: b, error } = await admin.from("businesses").select("*").eq("id", businessId).single();
  if (error || !b) return res.status(404).json({ ok: false, error: "BUSINESS_NOT_FOUND" });
  const integrations = [
    { key: "meta",   label: "Meta (Facebook & Instagram)", connected: !!(b.meta_access_token && b.facebook_page_id), status: b.meta_access_token ? "healthy" : "disconnected" },
    { key: "google", label: "Google Ads",                  connected: !!(b.ad_account_id || b.google_ads_id),        status: (b.ad_account_id || b.google_ads_id) ? "healthy" : "disconnected" },
    { key: "linkedin", label: "LinkedIn",                  connected: !!b.linkedin_connected,                        status: b.linkedin_connected ? "healthy" : "disconnected" },
  ];
  const connected_count = integrations.filter(i => i.connected).length;
  res.json({ ok: true, integrations, connected_count,
    recommended_action: connected_count === 0 ? "Connect Meta to unlock ads and analytics." : null });
});
```
- **Operator step:** deploy to Railway. Note `AUDIT_FINDINGS.md:17` — the
  GitHub→Railway auto-deploy webhook was observed stuck; trigger a manual
  redeploy in the Railway dashboard and re-link the webhook.

## 2. `POST /webhook/wf8-generate-report` → 500

- **Frontend exposure today: NONE.** Current `main` has no wf8 caller
  (`CustomerInsights.tsx` is static and now labeled "Sample data").
- **Deliverable:** triage runbook — reproduce with
  `curl -X POST $API/webhook/wf8-generate-report -H 'content-type: application/json' -d '{"businessId":"<uuid>"}'`,
  read the Railway deploy logs for the stack trace; the 500 (vs 404) proves the
  route exists and throws — most likely an unhandled empty-data path (no
  reviews/inbox rows for the business) or a missing env key for the LLM call.
  Wrap the handler body in try/catch and return
  `{ ok:false, error:{ code, message } }` so the frontend can render real errors.

## 3. wf1/wf2/wf4/wf13/wf15 endpoint family — specified, not implemented

- **Frontend exposure:** the workflow tabs call these and toast on failure.
- **Deliverable:** the authoritative specs already live in `LEARNINGS.md` §3
  (endpoint list, payloads, tables) and the prompt contracts in
  `src/lib/prompts/workflow_*.ts`. Implement against those; no additional
  frontend change is required (call-sites already handle errors).

## 4. Businesses de-dupe + primary-business marker

- **Deliverable — AUTHORED in this repo:**
  `supabase/migrations/20260610120000_businesses_primary_flag.sql`
  (adds `is_primary`, backfills onboarded-first/oldest — the exact ordering the
  frontend now uses — and enforces one-primary-per-user with a partial unique
  index; deliberately does NOT delete duplicates because they may own FK'd
  content; per-account merge checklist included in the file).
- **Operator step:** run it on the external Supabase project with service-role
  access, then (phase 2) a one-line frontend PR to order by `is_primary` first.

## 5. SSE auth design (`/webhook/dashboard-events`, wf15 stream)

- **Constraint:** `EventSource` cannot send an `Authorization` header — ever.
- **Deliverable — ready-to-paste middleware:** accept the Supabase JWT via
  query param for SSE routes only:

```js
async function sseAuth(req, res, next) {
  const token = req.query.token || "";
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return res.status(401).end();
  req.user = data.user;
  next();
}
// frontend follow-up (one line, after deploy):
// new EventSource(`${apiBase}/webhook/dashboard-events?business_id=${id}&token=${session.access_token}`)
```
  Trade-off (documented): tokens in query strings can reach server logs —
  scrub `token` from request logging for these routes, and keep the route
  read-only. Until deployed, the frontend already fails loud-but-graceful
  (deduped "Live updates are offline" toast).

---

## 6. Supabase edge functions — DECIDED policy

See `supabase/functions/README.md`: **retain** (default) until the Stripe
dashboard's webhook endpoint configuration is checked; decommission checklist
provided there. Rationale: `stripe-webhook/index.ts` verifies the
`stripe-signature` and writes plans with the service role — if Stripe is
configured to call the deployed copy, deleting it breaks billing silently.
