# Maroa Dashboard — Build Plan

This is a very large spec (27 routes, 180+ endpoints, full Apple design system, realtime, i18n, plan gating). The current project already has a Lovable Cloud–wired dashboard against a different backend (Railway + external Supabase). Shipping all of §1–§22 in a single pass would produce thousands of lines of code, break the existing working app, and almost certainly miss the acceptance bar in §21.

I'm proposing a phased approach so each phase is shippable and reviewable. Confirm the phase plan (and whether to keep or replace the current code) before I start.

## Key decisions needed before coding

1. **Greenfield vs. evolve?** The existing app has ~80 dashboard components wired to Railway + an external Supabase project (`zqhyrbttuqkvmdewiytf`). The spec assumes a new backend at `api.maroa.ai`. Options:
   - **A. Greenfield rewrite** under `src/v2/` with a new router, keep old code untouched until cutover. (Cleaner, matches spec exactly.)
   - **B. Evolve in place** — replace shell, design tokens, and rewire api client; migrate modules one by one. (Less throwaway code, messier transition.)
   - **Default if you don't pick:** A (greenfield).

2. **Backend reality.** Does `https://api.maroa.ai` actually exist and serve every endpoint in §10.3 today? If not, I'll wire the client but screens will sit in empty/error states until the backend lands. Spec says "no mocks" — I'll honor that.

3. **Webhook secret.** Spec §16 says webhook secret must stay server-side via a Supabase edge function proxy. I'll build that proxy (one edge function `webhook-proxy` that forwards `/webhook/*` with the secret attached). Confirm OK.

## Phase plan

### Phase 1 — Foundation (this PR)
- Design tokens (§2): typography scale, HSL color vars (light+dark), spacing, radii, elevation, glass, motion timings, Apple-styled Recharts theme.
- `lib/api/client.ts` with JWT + error envelope + retry.
- `lib/api/types.ts` + zod schemas for the 10 core tables (businesses, generated_content, ad_campaigns, contacts, deals, reviews, analytics_snapshots, learning_logs, win_notifications, inbox_messages).
- AppShell: glass topbar, 256/64 sidebar with all groups from §3.2, command palette skeleton, autopilot toggle, plan badge, workspace switcher.
- Supabase auth pages (`/auth/sign-in`, `/auth/callback`, `/auth/check-email`) + protected route wrapper.
- One end-to-end vertical slice: **Home `/`** with real KPIs from `/api/health`, `/api/performance/summary`, `/webhook/pipeline-get`, `/webhook/dashboard-events` + realtime channel.
- Webhook proxy edge function.

### Phase 2 — Creative cluster
Content Studio (+ approval sheet, scoring radar, regenerate), Calendar, Library, Brand DNA, Video Studio.

### Phase 3 — Growth cluster
Ads (Meta+Google, creatives, A/B, audit), SEO, CRO, Landing Pages, Lead Magnets, Referrals.

### Phase 4 — Audience cluster
CRM, Pipeline, Email Sequences, Reviews, Inbox.

### Phase 5 — Intelligence cluster
Analytics, Competitors, Forecasting, AI Brain, Strategy.

### Phase 6 — Platform & polish
Integrations, Team (agency), Billing (Paddle), Settings, Notifications, Waitlist, i18n scaffolding, plan gating sweep, perf budget pass, a11y pass, Lighthouse run, acceptance checklist §21.

### Phase 7 — Onboarding wizard
8-step glass wizard with progress ring + research kickoff (deferred until after Phase 1 because it depends on the new shell + auth being live).

## Phase 1 scope detail

Files I'd create/replace:
- `src/styles/tokens.css` — full token set §2.2–§2.6
- `tailwind.config.ts` — typography scale, radii, color mapping to vars, motion easing
- `src/lib/api/client.ts`, `src/lib/api/types.ts`, `src/lib/schemas/*.ts`
- `src/lib/api/hooks/{useBusinesses,useHealth,useDashboardEvents,usePipeline,usePerformance}.ts`
- `src/components/shell/{AppShell,Sidebar,Topbar,CommandPalette,AutopilotToggle,WorkspaceSwitcher,PlanBadge,AIChatPanel}.tsx`
- `src/components/common/{PageHeader,KpiCard,Sparkline,RadialGauge,GlassCard,EmptyState,StatusBadge}.tsx`
- `src/components/charts/{AppleAreaChart,AppleLineChart}.tsx`
- `src/pages/v2/Home.tsx`, `src/pages/v2/auth/{SignIn,Callback,CheckEmail}.tsx`
- `src/router.tsx` (new — coexists with old `App.tsx` routes for now; greenfield routes live under same paths but old routes get removed in Phase 6 cutover)
- `supabase/functions/webhook-proxy/index.ts`

Existing files left untouched in Phase 1: every `src/components/dashboard/*`, `src/pages/Dashboard.tsx`, `src/pages/Onboarding.tsx`, current Railway api client.

Estimated size: ~25 new files, ~3,500 LOC. One reviewable PR.

## What I need from you

Reply with:
1. **A** (greenfield) or **B** (evolve in place)?
2. Is `api.maroa.ai` live today, or do screens sit empty until it ships?
3. OK to add the `webhook-proxy` edge function?
4. Anything to deprioritize (e.g., skip i18n, skip white-label, skip video studio for v1)?

Once you confirm, I'll execute Phase 1 in one pass.
