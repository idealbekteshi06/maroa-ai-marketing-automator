# Maroa.ai — Build Learnings, Decisions & Handoff Log

_Started 2026-04-13. Maintained continuously per execution order in MAROA_15_WORKFLOWS_V2 and MAROA_REFACTOR_BRIEF_V2._

---

## 0. Structural reality of this repo (critical context)

This repo (`maroa-ai-marketing-automator`) is **not** a monolith. Audit confirmed:

- **Stack**: Vite 5 + React 18 + React Router 6 + TypeScript (non-strict) + Tailwind + shadcn. Not Next.js.
- **Backend is out-of-repo**: All workflow logic, orchestration, scheduled jobs, AI prompt execution, API credentials, and Supabase migrations live on a Railway service at `https://maroa-api-production.up.railway.app` and are triggered via ~72 fire-and-forget or req/res webhook endpoints defined in `src/lib/api.ts`.
- **Supabase is external**: `src/integrations/supabase/external-client.ts` points at a hardcoded project (`zqhyrbttuqkvmdewiytf.supabase.co`). No migrations, no schema.sql, no Drizzle/Prisma in this repo. `types.ts` is empty.
- **Edge functions in repo** are limited to: `stripe-webhook`, `chat`, `check-subscription`, `create-checkout`, `meta-oauth-callback`, `customer-portal`. None of the 15 workflows live here.

**Implication for this build-out**: "implementing a workflow" in this repo means:
1. **Strategic framework prompt modules** in `src/lib/prompts/` — the exact AI prompts with the 8 foundation principles, industry playbooks, and Cialdini/JTBD/Kahneman/StoryBrand psychology layer the spec mandates. These are the durable strategic asset. The frontend calls the backend, which loads these prompt modules at runtime (requires a minor backend change to read them from the client-shipped bundle or a shared package; alternative: duplicate in backend repo — logged below as handoff delta).
2. **API client methods** in `src/lib/api.ts` for every new endpoint a workflow needs.
3. **Dashboard UI** for each workflow, following FRONTEND_PROMPT_V2 exactly.
4. **Backend handoff spec** in this file (section 3 below) enumerating exactly what the Railway team must add: new endpoints, new Supabase tables, new cron jobs, new integrations. Without that, the frontend screens are shells.

I will NOT build shell backend code in this frontend repo — it would run nowhere. Instead, every backend delta is logged in section 3 of this file as a precise handoff.

---

## 1. Audit table — Maroa 15 workflows vs. current repo

| # | Workflow | Status | Frontend evidence | Backend evidence (via api.ts calls) | Gap |
|---|----------|--------|-------------------|-------------------------------------|-----|
| 1 | Daily Content Engine | **Partial** | `DashboardContent.tsx`, `DashboardSocialHub.tsx` | `generateContent`, `instantContent`, `publishPost` webhooks | No strategic framework prompt module, no multi-platform sequencing per spec, no approval queue wiring, no psychology layer |
| 2 | Lead Scoring | **Partial** | `DashboardCRM.tsx`, `DashboardRevOps.tsx` | `/api/contacts`, `createContact` | No scoring model, no enrichment, no routing rules UI |
| 3 | Ad Optimization | **Partial** | `DashboardAds.tsx`, `DashboardCampaigns.tsx` | `metaCampaignCreate/Activate/Optimize`, `googleCampaignCreate/Activate/Optimize` | No daily optimization loop, no creative rotation, no budget reallocation UI, no CAC/LTV framework |
| 4 | Reviews & Reputation | **Built-shell** | `DashboardReviews.tsx` | `getReviews`, `respondReview` | No AI response generation per brand voice, no sentiment analysis UI, no local SEO tie-in |
| 5 | Competitor Intelligence | **Built-shell** | `DashboardCompetitors.tsx` | `competitorAnalyze`, `competitorMonitor` | No weekly digest, no ad library scraping, no positioning map |
| 6 | Local + Digital Presence | **Missing** | — | — | No Google Business Profile sync, no schema markup generator, no citation management, no NAP consistency check |
| 7 | Email Lifecycle | **Partial** | `DashboardEmail.tsx` | `emailSequenceCreate`, `emailEnroll`, `emailTrigger` | No behavioral triggers, no lifecycle stages, no deliverability monitoring |
| 8 | Customer Insights | **Partial** | `DashboardResearch.tsx` | `researchRun` | No JTBD interview engine, no review mining, no persona generation |
| 9 | Unified Inbox | **Missing** | — | — | No multi-channel aggregation, no conversation threading, no assignment |
| 10 | Higgsfield Studio | **Missing** | — | — | No Segmind client, no generation queue, no variant UI, no brand guardrails |
| 11 | Smart Routing | **Missing** | — | — | No routing rules, no SLA tracking, no escalation |
| 12 | Launch Orchestrator | **Partial** | `DashboardLaunch.tsx` | `launchCampaign` | No pre-launch/launch/post-launch phases, no dependency graph |
| 13 | Weekly Strategy Brief | **Missing** | — | — | No weekly report generation, no KPI narrative, no action items |
| 14 | Budget/ROI Optimizer | **Partial** | `DashboardHealthScore.tsx` | `healthScore` | No budget forecasting, no channel ROI comparison, no reallocation engine |
| 15 | AI Brain (orchestrator) | **Built-shell** | `DashboardAIBrain.tsx`, `AIChatAssistant.tsx` | `/api/orchestrator/log`, `/api/orchestrator/run` | No streaming SSE chat, no multi-workflow coordination UI, no decision log |

**Extras in repo not in spec** (keep, move to settings or secondary nav): `DashboardPricing`, `DashboardABTests`, `DashboardFreeTools`, `DashboardPopups`, `DashboardReferral`, `DashboardLeadMagnets`, `DashboardSchema`, `DashboardSEOPages`, `DashboardOnboardingCRO`, `DashboardUpgradeCRO`, `DashboardSignupCRO`, `DashboardInstantCampaign`, `DashboardCommunity`, `DashboardSalesAssets`, `DashboardIdeas`.

**Test business**: `fea4aae5-14b4-486d-89f4-33a7d7e4ab60` (Uje Karadaku) is **not** seeded in `/src`. Decision: wire as `VITE_TEST_BUSINESS_ID` env override in `AuthContext` for dev mode only.

---

## 2. Spec→code mapping (what lives where)

| Spec section | Code location |
|--------------|---------------|
| 8 Foundation Principles + Industry Playbooks + Psychology Layer (Cialdini, JTBD, Kahneman, StoryBrand) | `src/lib/prompts/foundation.ts` (single source of truth — imported by every workflow prompt module) |
| Per-workflow prompt modules | `src/lib/prompts/workflow_<n>_<name>.ts` |
| Design tokens (V2) | `src/styles/tokens.css` |
| App shell (sidebar + topbar + mobile nav) | `src/components/shell/AppShell.tsx` (new) |
| 7-item sidebar | `src/components/shell/Sidebar.tsx` (new) |
| Mission Control home | `src/pages/MissionControl.tsx` (new) — replaces `DashboardOverview` usage |
| Approvals center | `src/pages/Approvals.tsx` (new) |
| Studio | `src/pages/Studio.tsx` (new) |
| AI Brain chat | `src/pages/AskMaroa.tsx` (new) |
| Workflow pages | `src/pages/workflows/<name>.tsx` |

---

## 3. Backend handoff delta (what Railway/Supabase team must add)

_This is the running list. Every workflow adds items here as it's built. The Railway repo must consume this file verbatim._

### 3.1 Supabase schema additions needed (all workflows)

```sql
-- Unified events table (for live activity feed + WebSocket)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  kind text not null, -- e.g. 'generation.started', 'approval.requested'
  payload jsonb not null default '{}',
  workflow text, -- '1_daily_content' etc.
  created_at timestamptz not null default now()
);
create index on events (business_id, created_at desc);

-- Unified approvals table (WF refactor brief 2.3)
create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  workflow text not null,
  entity_type text not null, -- content, ad, email, lead_reply, review_reply
  entity_id uuid not null,
  preview jsonb not null, -- {title, body, media_url, rationale}
  status text not null default 'pending', -- pending/approved/rejected/edited
  sla_at timestamptz,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid
);
create index on approvals (business_id, status, sla_at);

-- AI Brain decision log (WF15)
create table if not exists brain_decisions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  trigger text not null, -- 'cron', 'user', 'event'
  input jsonb not null,
  reasoning text not null, -- chain of thought narrative
  actions jsonb not null, -- array of {workflow, action, params}
  outcome jsonb,
  created_at timestamptz not null default now()
);
```

### 3.2 Endpoints to add (grouped per workflow, filled as each workflow is built)

_(added per workflow section below)_

---

## 4. Decisions

### 4.1 Execution order — why not front-load refactor
The user's execution order puts Workflow #1 before all remaining Phase 1 workflows, but instructs refactor brief first. I'm doing: audit → refactor shell → WF1 → WF13 → WF15 → WF2 → WF4 → Phase 2/3. Rationale: WF15 (AI Brain) depends on WF1 and WF13 outputs being in the decision log; building it third lets it orchestrate real workflows rather than stubs.

### 4.2 Strategic framework lives in frontend repo as `src/lib/prompts/foundation.ts`
Why: the spec requires every AI prompt to include the full framework. A single source of truth file prevents drift. The Railway backend must import it (either by symlink in monorepo, shared npm package, or copy-in-CI). Handoff note to Railway: the `foundation.ts` export is the canonical text — do not duplicate or paraphrase in the backend.

### 4.3 Not rebuilding the 34 dashboard sub-pages
Per REFACTOR_NOTES.md section in existing codebase and REFACTOR_BRIEF_V2 section 2.1: keep the files, drop them from sidebar, route them via direct URL only. Only the 7 primary routes get new/refactored UI in this build.

### 4.4 Test business ID wired as dev env override
Add `VITE_TEST_BUSINESS_ID=fea4aae5-14b4-486d-89f4-33a7d7e4ab60` to `.env.local`. `AuthContext` reads it and substitutes for `businessId` when `import.meta.env.DEV && VITE_TEST_BUSINESS_ID` set. Production untouched.

---

## 5. Issues / tradeoffs encountered

_(appended as the build proceeds)_

- **2026-04-13**: TypeScript is non-strict in this repo (`strict: false, noImplicitAny: false`). Decision: new files use strict typing locally via explicit annotations rather than flipping the flag (flipping would cascade hundreds of errors across existing 120 files).
- **2026-04-13**: `cmdk` already installed but unwired. Command palette will use it directly.
- **2026-04-13**: `next-themes` already wired — reuse for dark mode, do not replace.
- **2026-04-13**: No Socket.IO client in this repo. Existing "live activity" uses Supabase Realtime channel subscriptions (see `DashboardOverview.tsx:219`). Decision: keep Supabase Realtime for activity feed rather than adding Socket.IO — it's already connected, and the refactor brief's WebSocket requirement is satisfied by Realtime semantically. Delta to Railway team: emit events into the `events` table and Realtime handles the push.
