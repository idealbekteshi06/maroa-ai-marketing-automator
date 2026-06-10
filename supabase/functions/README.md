# Edge functions — status & policy (AUDIT_2026-06-10.md §6 / §13 A-3)

Decision: **RETAIN all functions for now.** Four of six have no callers in this
frontend (`create-checkout`, `customer-portal`, `check-subscription`,
`stripe-webhook`) because billing moved to the Railway `/api/checkout` path —
but "no frontend caller" does NOT prove "dead": `stripe-webhook` is invoked BY
STRIPE (signature-verified, writes plans via service role), and the deployed
copies on Supabase are independent of this repo's source. Deleting blind risks
silent billing breakage.

Referenced by this frontend today: `chat` (DashboardPublish), and
`meta-oauth-callback` (DashboardSocial) — keep both.

## Decommission checklist (run before deleting any of the four)
1. Stripe dashboard → Developers → Webhooks: is any endpoint pointing at
   `https://<project>.functions.supabase.co/stripe-webhook`? If yes, the
   function is LIVE — migrate the webhook to the Railway backend first.
2. Supabase dashboard → Edge Functions → invocation logs (30 days): zero
   invocations for `create-checkout` / `customer-portal` /
   `check-subscription`?
3. Confirm Railway `/api/checkout` handles all plans end-to-end (Starter /
   Growth / Agency) including the post-payment plan write that
   `stripe-webhook` performs today.
4. Only then: `supabase functions delete <name>` AND remove the source dir
   here in the same PR.
