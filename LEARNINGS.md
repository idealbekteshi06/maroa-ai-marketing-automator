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

#### WF1 — Daily Content Engine

Cron: daily 06:00 local (aggregation) → 07:00 local (strategic decision, Opus) → 07:30 local (per-concept generation, Sonnet) → quality gate → autonomy routing.

| Method | Path | Purpose |
|---|---|---|
| POST | `/webhook/wf1-strategic-decision` | Manual "run now" → runs the Phase 2 strategist prompt. Body `{ businessId, forceReplan? }`. Returns `{ runId, analysis, concepts[] }`. |
| GET  | `/webhook/wf1-plan-get` | Fetch today's plan. Query `?business_id=…&date=YYYY-MM-DD`. Returns full plan with concepts + generated assets + quality scores. |
| POST | `/webhook/wf1-generate-asset` | Trigger Phase 3 platform generation for an approved concept. Body `{ businessId, conceptId }`. |
| POST | `/webhook/wf1-decision` | Approve/reject/edit a concept. Feeds the learning loop. |
| GET  | `/webhook/wf1-learning-state` | Returns winning patterns, anti-patterns, hashtag bank, prediction accuracy. |
| POST | `/webhook/wf1-autonomy-mode` | Update autonomy mode (full_autopilot / hybrid / approve_everything). |

Supabase tables (in addition to §3.1): `wf1_daily_plans`, `wf1_concepts`, `wf1_generated_assets`, `wf1_learning_patterns`, `wf1_hashtag_bank`, `wf1_autonomy_settings`.

Backend must import `src/lib/prompts/foundation.ts` + `src/lib/prompts/workflow_1_daily_content.ts` verbatim (shared npm package or monorepo symlink). Do NOT paraphrase the system prompt.

#### WF13 — Weekly Strategy Brief

Cron schedule:
- **Sunday 18:00 local** — data aggregation (produces `WeeklyContextBundle` — see prompt module types).
- **Sunday 22:00 local** — Phase 2 strategic synthesis (Opus). Writes `StrategySynthesis` JSON.
- **Sunday 22:30 local** — Phase 3 client-voice polish (Sonnet). Writes `BriefDeliverable` JSON.
- **Monday 07:00 local** — delivery if `autonomy_mode = auto_send` or brief approved. Sends via configured channels (email, Slack, WhatsApp, dashboard_only, PDF).
- **If `review_first` and not approved by Tuesday 12:00 local** — second gentle nudge to approver.
- **First Monday of month** — monthly rollup (30-day window).
- **Every 90 days** — quarterly strategic review.

| Method | Path | Purpose |
|---|---|---|
| POST | `/webhook/wf13-generate-brief` | Trigger synthesis on-demand. Body `{ businessId, weekStart? }`. Returns `{ briefId, status }`. |
| GET  | `/webhook/wf13-latest-brief` | Current week's brief for business. Returns full `Wf13BriefDetail` or null. |
| GET  | `/webhook/wf13-brief-history` | Paginated past briefs. Query `business_id, limit, before, q`. |
| POST | `/webhook/wf13-brief-decision` | Approve/edit/reject when autonomy is `review_first`. |
| POST | `/webhook/wf13-plan-action-decision` | One-click approve/reject/defer on a next-week plan action. |
| POST | `/webhook/wf13-delivery-settings` | Save autonomy mode + channels + recipients + schedule + tone/depth/length preferences. |
| GET  | `/webhook/wf13-delivery-settings-get` | Load delivery settings. |

**Supabase migrations for WF13:**

```sql
create type wf13_brief_status as enum (
  'queued', 'aggregating', 'synthesizing', 'polishing',
  'awaiting_review', 'approved', 'delivered', 'rejected'
);

create type wf13_autonomy_mode as enum ('auto_send', 'review_first', 'manual');

create table weekly_briefs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  status wf13_brief_status not null default 'queued',
  subject_line text,
  headline text,
  executive_summary text,
  biggest_insight text,
  strategic_question text,
  whats_coming_preview text,
  word_count int,
  data_sources text[] not null default '{}',
  frameworks_cited text[] not null default '{}',
  context_bundle jsonb not null default '{}', -- the raw WeeklyContextBundle
  synthesis jsonb,    -- the StrategySynthesis output from Opus
  deliverable jsonb,  -- the BriefDeliverable output from Sonnet
  generated_at timestamptz,
  delivered_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz not null default now(),
  unique (business_id, week_start)
);
create index on weekly_briefs (business_id, week_start desc);

create table brief_kpi_cards (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references weekly_briefs(id) on delete cascade,
  key text not null,
  label text not null,
  value text not null,
  vs_last_week numeric,
  vs_benchmark numeric,
  vs_goal numeric,
  sparkline numeric[] not null default '{}',
  sort_order int not null default 0
);

create table brief_wins (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references weekly_briefs(id) on delete cascade,
  headline text not null,
  evidence text not null,
  causal_analysis text not null,
  framework_lever text not null,
  protection_plan text not null,
  sort_order int not null default 0
);

create table brief_losses (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references weekly_briefs(id) on delete cascade,
  headline text not null,
  evidence text not null,
  root_cause text not null,
  framework_diagnosis text not null,
  remediation_plan text not null,
  consequence_if_ignored text not null,
  sort_order int not null default 0
);

create table brief_plan_actions (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references weekly_briefs(id) on delete cascade,
  action text not null,
  why_now text not null,
  expected_impact_low numeric not null,
  expected_impact_high numeric not null,
  expected_impact_metric text not null,
  effort_hours numeric not null,
  owner text not null check (owner in ('ai', 'founder', 'team')),
  deadline date not null,
  one_click_approve boolean not null default true,
  metric text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'deferred')),
  decided_at timestamptz,
  decided_by uuid
);

create table brief_risks (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references weekly_briefs(id) on delete cascade,
  risk text not null,
  leading_indicator text not null,
  probability_hint text not null check (probability_hint in ('low', 'medium', 'high')),
  mitigation text not null
);

create table brief_sections (
  -- generic catch-all for whatChanged / marketContext / kpiNarrative
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references weekly_briefs(id) on delete cascade,
  section_type text not null,
  payload jsonb not null,
  sort_order int not null default 0
);

create table brief_deliveries (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references weekly_briefs(id) on delete cascade,
  channel text not null check (channel in ('email', 'slack', 'whatsapp', 'dashboard_only', 'pdf')),
  recipient jsonb not null, -- { name, email?, slackUserId?, whatsappE164? }
  delivered_at timestamptz,
  opened_at timestamptz,
  error text
);
create index on brief_deliveries (brief_id);

create table brief_settings (
  business_id uuid primary key references businesses(id) on delete cascade,
  autonomy_mode wf13_autonomy_mode not null default 'review_first',
  channels text[] not null default '{email}',
  recipients jsonb not null default '[]',
  delivery_day text not null default 'monday',
  delivery_local_time time not null default '07:00',
  preferred_length text not null default 'standard',
  tone_preference text not null default 'direct',
  technical_depth text not null default 'intermediate',
  language text not null default 'en',
  updated_at timestamptz not null default now()
);
```

**Data sources the backend aggregator must pull (per WeeklyContextBundle fields):**
- Social: Meta Graph (IG/FB reach + engagement + follower count), LinkedIn Marketing API, TikTok Business API, Twitter v2.
- Ads: Meta Marketing API (spend, ROAS, CPA, CTR), Google Ads API, LinkedIn Ads API.
- Email: ESP webhook events (Sendgrid/Mailgun/Resend) aggregated over week.
- Website: GA4 Data API (sessions, conversion rate, landing pages, bounce).
- Pipeline: internal Supabase tables from WF2 (leads, mql/sql, opportunities, stages).
- Revenue: Stripe API (mrr, arr, churn, ltv from customer cohorts) or Shopify Orders API for DTC.
- Reviews: Google Business Profile API, Yelp, TripAdvisor, Trustpilot (per industry).
- GBP: Google Business Profile Performance API.
- Competitive: WF5 output tables.
- Customer voice: WF8 output tables.
- Cultural: TimeDB calendar API + Google Trends + news RSS.

**Framework import requirement:** Backend Opus call MUST prepend the full `buildSystemPrompt(ctx, addendum)` output from `workflow_13_weekly_brief.ts`. The `FOUNDATION_SYSTEM_PROMPT` from `foundation.ts` is the canonical strategic framework — do not paraphrase in the backend.

#### WF15 — AI Brain (Conversational Command Center)

The Chief of Staff. Streaming SSE chat + tool use + approval gates + three-layer memory (short / medium / long-term via Pinecone) + intelligent model routing (Haiku / Sonnet / Opus).

| Method | Path | Purpose |
|---|---|---|
| GET  | `/webhook/wf15-conversations` | List conversations for a business. |
| GET  | `/webhook/wf15-conversation-get` | Fetch messages in a conversation. |
| POST | `/webhook/wf15-conversation-create` | Create a new conversation. |
| POST | `/webhook/wf15-send-message` | Post a user message. Returns `{ assistantMessageId, streamUrl }`. Client opens EventSource on `streamUrl`. |
| POST | `/webhook/wf15-tool-decision` | Approve/reject a pending tool call. |
| POST | `/webhook/wf15-explain` | Render senior-strategist teaching mode for a past decision. |
| GET  | `/webhook/wf15-decision-log` | Paginated log of every action Brain has taken. |
| POST | `/webhook/wf15-upload-attachment` | Multipart upload for voice/image/file attachments. |

**SSE stream event shapes** (server-sent events on the streamUrl):
```
event: token        data: { delta: string }
event: reasoning    data: { delta: string }
event: tool_call    data: { toolCall: <ToolCall> }
event: tool_update  data: { id, progress?: {percent, note}, status? }
event: tool_result  data: { id, result?, status }
event: done         data: { messageId, modelUsed, costUsd }
event: error        data: { message }
```

**Supabase migrations for WF15:**
```sql
create type brain_message_role as enum ('user', 'assistant', 'system', 'tool');
create type brain_model as enum ('haiku', 'sonnet', 'opus');
create type brain_tool_status as enum (
  'pending', 'running', 'completed', 'failed', 'awaiting_approval', 'rejected'
);

create table brain_conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  title text not null default 'New conversation',
  last_message_at timestamptz not null default now(),
  message_count int not null default 0,
  created_at timestamptz not null default now()
);
create index on brain_conversations (business_id, last_message_at desc);

create table brain_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references brain_conversations(id) on delete cascade,
  role brain_message_role not null,
  content text not null default '',
  reasoning text,
  model_used brain_model,
  cost_usd numeric,
  created_at timestamptz not null default now()
);
create index on brain_messages (conversation_id, created_at);

create table brain_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references brain_messages(id) on delete cascade,
  modality text not null check (modality in ('voice','image','url','file')),
  url text not null,
  mime_type text not null,
  name text,
  transcription text,
  ocr_text text,
  scraped_summary text
);

create table brain_tool_calls (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references brain_messages(id) on delete cascade,
  tool text not null,
  input_summary text not null,
  input_payload jsonb not null default '{}',
  status brain_tool_status not null default 'pending',
  progress jsonb,
  result jsonb,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  requires_approval boolean not null default false,
  rationale text,
  alternatives_considered text[] not null default '{}',
  approved_by uuid,
  approved_at timestamptz
);
create index on brain_tool_calls (status) where status in ('awaiting_approval','pending','running');

create table brain_decision_log (
  -- mirror of meaningful actions for the auditable decision log sidebar
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  message_id uuid references brain_messages(id),
  trigger text not null check (trigger in ('cron','user','event')),
  summary text not null,
  workflow text not null,
  tools_used text[] not null default '{}',
  outcome text not null check (outcome in ('success','failure','rejected','awaiting_approval')),
  model_used brain_model not null,
  cost_usd numeric not null default 0,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index on brain_decision_log (business_id, created_at desc);

create table brain_owner_preferences (
  business_id uuid primary key references businesses(id) on delete cascade,
  verbosity text not null default 'standard' check (verbosity in ('terse','standard','verbose')),
  technical_depth text not null default 'intermediate',
  language text not null default 'en',
  topics_of_high_interest text[] not null default '{}',
  recommendations_often_rejected text[] not null default '{}',
  recommendations_often_approved text[] not null default '{}',
  morning_checkin_enabled boolean not null default true,
  morning_checkin_hour int not null default 7,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz not null default now()
);
```

**Backend integration requirements**
- Model router: call `routeModel(query, hasAttachments)` from `workflow_15_ai_brain.ts` to pick Haiku/Sonnet/Opus. Auto-escalate to Opus when query >40 words or matches strategic regex patterns.
- Pinecone: per-business namespace. Index every user message + every assistant message with non-empty reasoning + every stored brand document. Retrieve top-5 relevant chunks on every turn.
- Tool execution: all tools with `approval: true` in `BRAIN_TOOLS` must stage for approval. Never execute without confirmation.
- Sensitive-data masking: apply `WF15_GUARDRAILS.sensitiveDataMasking` regexes to user content before persisting to logs.
- Proactive messages: respect `quiet_hours` + `minHoursBetweenProactiveMessages=4` unless severity=critical.
- Cost tracking: per-message costUsd must be recorded and aggregated to enforce monthly caps (growth=500/mo, agency=unlimited fair use).

**Voice path (optional, Agency plan)**
- Whisper for voice input transcription.
- ElevenLabs for voice output (brand-appropriate voice profile).

#### WF2 — Lead Scoring & Routing

Deterministic scorer + LLM response generation. Behavioral signals (35%) dominate demographic (20%), per Marketo 2021 replicated 2024 research.

Scoring components (100 total):
- Demographic fit: 20 pts (ICP match + role authority)
- Behavioral intent: 35 pts (buying-stage signals + engagement velocity)
- Company fit: 25 pts (size + industry + funding + growth − negative signals)
- Commitment signals: 20 pts (message quality + verification)

Tiers: hot (80+, 5min SLA), warm_high (60–79, 1h), warm (40–59, 24h), cool (20–39, weekly), junk (<20, flagged but never deleted).

| Method | Path | Purpose |
|---|---|---|
| GET  | `/webhook/wf2-leads-list` | Paginated list with filters (tier/status/owner/search). Returns items + nextCursor + per-tier counts. |
| GET  | `/webhook/wf2-lead-get` | Full detail with scoring components, enrichment payload, committee data, generated draft. |
| POST | `/webhook/wf2-lead-rescore` | Re-run scoring (manual or triggered). |
| POST | `/webhook/wf2-generate-response` | LLM draft response with personalization score + predicted response rate + psychology levers used. |
| POST | `/webhook/wf2-send-response` | Send drafted message. |
| POST | `/webhook/wf2-lead-update` | Tier/status/owner/tagAsJunk/unjunk. |
| GET  | `/webhook/wf2-routing-rules-get` | Ordered routing rules for the business. |
| POST | `/webhook/wf2-routing-rules-save` | Save ordered rules (round_robin, territory, industry, deal_size, workload_balanced, account_based). |
| GET  | `/webhook/wf2-calibration` | 30-day accuracy, top predictive signal, most misleading signal, wins/losses weight attribution. |
| GET  | `/webhook/wf2-icp-get` | ICP definitions. |
| POST | `/webhook/wf2-icp-save` | Save ICP definitions (triggers rescore of all leads). |

**Supabase migrations for WF2:**
```sql
create type lead_tier as enum ('hot','warm_high','warm','cool','junk');
create type lead_status as enum (
  'new','contacted','replied','qualified','opportunity','won','lost','nurture','junk'
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  email text not null,
  first_name text, last_name text, title text,
  linkedin_url text,
  person jsonb not null default '{}',
  company jsonb not null default '{}',
  intent_signals jsonb not null default '{}',
  behavior jsonb not null default '{}',
  social jsonb not null default '{}',
  intake jsonb not null default '{}',
  email_valid boolean not null default false,
  disposable_email boolean not null default false,
  role_email boolean not null default false,
  personal_email boolean not null default false,
  tier lead_tier not null default 'cool',
  score int not null default 0,
  components jsonb not null default '{}',
  top_predictive_signals text[] not null default '{}',
  top_risk_signals text[] not null default '{}',
  owner_id uuid,
  status lead_status not null default 'new',
  sla_deadline timestamptz,
  scored_at timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on leads (business_id, tier, score desc);
create index on leads (business_id, owner_id);
create index on leads (business_id, status);
create unique index on leads (business_id, lower(email));

create table lead_responses (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  subject text not null,
  body text not null,
  personalization_score int not null,
  predicted_response_rate_low numeric,
  predicted_response_rate_high numeric,
  psychology_levers text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','awaiting_approval','sent','rejected')),
  generated_at timestamptz not null default now(),
  sent_at timestamptz,
  decided_by uuid
);

create table icp_definitions (
  business_id uuid primary key references businesses(id) on delete cascade,
  ideal_titles text[] not null default '{}',
  ideal_company_size_min int,
  ideal_company_size_max int,
  ideal_industries text[] not null default '{}',
  served_geographies text[] not null default '{}',
  deadbeat_list text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table routing_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  kind text not null check (kind in ('round_robin','territory','industry','deal_size','workload_balanced','account_based')),
  priority int not null,
  config jsonb not null default '{}',
  active boolean not null default true
);
create index on routing_rules (business_id, priority);

create table lead_outcomes (
  -- used for 30-day recalibration (logistic regression on won/lost)
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  outcome text not null check (outcome in ('won','lost','stalled','in_progress')),
  acv_usd numeric,
  closed_at timestamptz,
  original_score int not null,
  original_tier lead_tier not null,
  features_snapshot jsonb not null default '{}'
);

create table buying_committees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  company_domain text not null,
  member_lead_ids uuid[] not null default '{}',
  total_activity_score int not null default 0,
  is_active_deal boolean not null default false,
  first_contact_at timestamptz,
  last_activity_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (business_id, company_domain)
);
```

**Enrichment pipeline (backend):**
1. Stage 1 validate: zerobounce/neverbounce for email, MX check, disposable detection.
2. Stage 2 identity: Clearbit/Apollo/ZoomInfo cascade (try cheap first, fall back to expensive).
3. Stage 3 behavior: aggregate from GA4 Measurement Protocol or Segment + own event table.
4. Stage 4 social: LinkedIn Sales Navigator API or equivalent.
5. Scoring: import `scoreLead()` from `workflow_2_lead_scoring.ts` and run on merged payload.
6. Routing: import `routeLead()` with loaded routing_rules + current owner loads.
7. Hot leads trigger LLM draft via `buildLeadResponsePrompt()`. Hybrid approval window = 10 min, auto-send if confidence > 0.9.

**30-day recalibration cron (Sunday 03:00 local):**
Logistic regression on last 90 days of `lead_outcomes` with features from `features_snapshot`. Updates scoring weights in Supabase metadata. Surfaces top predictive + most misleading signal via `/wf2-calibration` endpoint.

#### WF4 — Reviews & Reputation

Chief Experience Officer-grade reputation engine. 88% of consumers trust reviews as much as personal recs (BrightLocal 2024). 3.5→4.0 stars = +12% revenue (HBS). >50% response rate = +21% revenue vs non-responders (BrightLocal). 30–45% of negative reviewers UPDATE their review when response is thoughtful (Harvard).

**Platforms monitored (primary, every hour):** GBP, Facebook, Trustpilot, G2/Capterra, Yelp, TripAdvisor, Amazon, App Store, Play Store, Glassdoor. **Secondary (daily):** Reddit, Twitter/X, BBB, Consumer Affairs, industry-specific sites.

**Response SLAs by urgency:** immediate <1h (legal/safety/viral), high <6h (detailed negative, influential), medium <24h (standard), low <48h (positive/routine).

| Method | Path | Purpose |
|---|---|---|
| GET  | `/webhook/wf4-reviews-list` | List with category/platform/status filters + pending response count. |
| GET  | `/webhook/wf4-review-get` | Full detail + drafted responses. |
| POST | `/webhook/wf4-generate-response` | LLM-generate response (1 for positive/neutral, 2–3 variants for negative, 1 + escalation for critical). |
| POST | `/webhook/wf4-publish-response` | Approve and publish. |
| POST | `/webhook/wf4-dispute-review` | Draft platform dispute for fake/malicious reviews with evidence package. |
| POST | `/webhook/wf4-ignore-review` | Mark ignored (still counted in metrics). |
| POST | `/webhook/wf4-request-review` | Trigger review request to a customer (email/SMS/WhatsApp). |
| GET  | `/webhook/wf4-reputation-snapshot` | Per-platform snapshot, sentiment timeline, themes, benchmarks, top complaints. |
| GET  | `/webhook/wf4-testimonials-get` | Testimonial library (5⭐ reviews with permission state). |
| POST | `/webhook/wf4-testimonial-request-permission` | Email reviewer asking to use quote in marketing. |

**Supabase migrations for WF4:**
```sql
create type review_category as enum ('positive','neutral','negative','critical');
create type review_urgency as enum ('immediate','high','medium','low');
create type review_response_status as enum (
  'pending','awaiting_approval','responded','disputed','ignored'
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  platform text not null,
  external_id text not null,
  reviewer_name text not null,
  reviewer_profile_url text,
  reviewer_account_age_days int,
  reviewer_review_count int,
  reviewer_location text,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null,
  language text not null default 'en',
  posted_at timestamptz not null,
  detected_at timestamptz not null default now(),
  category review_category not null,
  urgency review_urgency not null,
  sentiment numeric not null,
  topics text[] not null default '{}',
  authenticity_score int not null default 100,
  authenticity_flags text[] not null default '{}',
  is_suspicious boolean not null default false,
  legal_flags text[] not null default '{}',
  response_status review_response_status not null default 'pending',
  sla_deadline timestamptz,
  transaction_verified boolean,
  responded_at timestamptz,
  responded_by uuid,
  unique (business_id, platform, external_id)
);
create index on reviews (business_id, response_status, sla_deadline);
create index on reviews (business_id, category, posted_at desc);

create table review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  body text not null,
  signature_name text not null,
  signature_title text not null,
  personalization_score int not null,
  brand_voice_match_score int not null,
  word_count int not null,
  psychology_levers text[] not null default '{}',
  predicted_impact text,
  is_active boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table review_disputes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  platform text not null,
  dispute_body text not null,
  evidence_items text[] not null default '{}',
  requested_action text not null,
  status text not null default 'submitted',
  submitted_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution text
);

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  review_id uuid references reviews(id) on delete set null,
  quote text not null,
  reviewer_name text not null,
  platform text not null,
  rating int not null,
  permission_status text not null default 'not_requested' check (
    permission_status in ('not_requested','requested','granted','declined')
  ),
  permission_requested_at timestamptz,
  permission_granted_at timestamptz,
  used_in text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index on testimonials (business_id, permission_status);

create table review_request_triggers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  kind text not null check (kind in (
    'post_purchase','post_service','post_checkin','post_support_resolution','nps_promoter'
  )),
  delay_hours int not null,
  channel text not null check (channel in ('email','sms','whatsapp')),
  target_platform text not null,
  active boolean not null default true
);

create table review_requests_sent (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  customer_identifier text not null,
  trigger_id uuid references review_request_triggers(id),
  channel text not null,
  target_platform text not null,
  sent_at timestamptz not null default now(),
  clicked_at timestamptz,
  review_posted_at timestamptz,
  review_id uuid references reviews(id)
);
```

**Classification pipeline (backend):**
1. Platform hourly polling (primary) + daily (secondary) → insert into `reviews` with `response_status='pending'`.
2. LLM classification via `buildReviewClassificationPrompt()` sets category, urgency, sentiment, topics, authenticity, legalFlags.
3. If `is_suspicious` → surface dispute draft UI.
4. If `legal_flags` not empty → always `awaiting_approval`, flag to 3 stakeholders via email+SMS.
5. Otherwise → generate response via `buildReviewResponsePrompt()`.
   - Positive reviews with `brandVoiceMatchScore > 85` → eligible for auto-publish (per business autonomy setting).
   - Neutral → single draft, requires approval.
   - Negative → 2–3 variants generated, requires approval (per spec "your choice").
   - Critical → 1 draft + escalation, NEVER auto-publish.
6. On publish → call platform API to post reply. Record `responded_at`.
7. Post-publish monitoring: track if negative reviewer updates their review within 14 days (Harvard 30–45% update rate — measure locally).

**Testimonial → marketing loop:**
- 5⭐ reviews with specific, vivid language auto-flagged as testimonial candidates.
- Automated permission request email via `wf4-testimonial-request-permission`.
- Granted testimonials surfaced to WF1 (content engine) and WF10 (Studio) as approved social proof.

**Ops accountability loop:**
- Weekly: aggregate top 5 negative themes → push to ops team (email + dashboard).
- Monthly rollup into WF13 Weekly Strategy Brief "customer voice" section.

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
