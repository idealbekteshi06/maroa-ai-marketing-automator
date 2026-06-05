# Dashboard rebuild — Apple feel, best-of-breed per area

## Goal
A dashboard that feels like Apple (calm, focused, generous spacing, soft depth, no neon), with each area modeled on the best SaaS in that category, fully wired to the backend we already have. No fake data — if a feature isn't connected yet, the panel shows a real empty state with a clear next action.

## Information architecture — 6 areas
Rename + regroup the sidebar so it reads like a product, not a list of pages:

1. **Home** — Today's pulse (modeled on Apple Watch Activity + Linear inbox)
2. **Content** — Posts, calendar, library, brand voice (modeled on Notion Calendar + Buffer)
3. **Studio** — Product → AI creative pipeline, Higgsfield, video (modeled on Linear + Runway)
4. **Ads** — Meta/IG/TikTok campaigns, budget, creatives (modeled on Meta Ads Manager, denser)
5. **CRM** — Inbox, Contacts, Pipeline, Deals (modeled on HubSpot Sales Hub)
6. **Growth** — SEO, competitors, keywords, referrals (modeled on Semrush + Ahrefs)
7. **Settings** (footer-pinned) — Profile, Brand, Connections, Billing, Team, Notifications

A "Brain" floating action stays available everywhere (Claude-powered, already wired).

## Home page (priority #1, ship first)
Apple Activity-style hero with three "rings":
- **Reach** (today's impressions vs goal)
- **Engagement** (likes + comments + DMs vs goal)
- **Pipeline** (new leads + deal movement vs goal)

Below the rings:
- **"What needs you" inbox** — single chronological stream: approvals waiting, DMs awaiting reply, posts about to publish, ad anomalies, deal nudges. Each row has a one-tap action (Approve / Reply / Pause / Snooze).
- **Today's schedule strip** — horizontal timeline of scheduled posts/campaigns for the next 24h with status pills.
- **AI brief card** — 3-bullet Claude summary of "what changed since yesterday" + 1 recommended action.

Empty states matter: each card has a real "connect X / write your first post / import contacts" CTA when data is missing.

## Design system — match landing page exactly
- Same Inter type ramp, same primary blue (#1877F2), same radii (rounded-xl / 2xl), same shadow tokens.
- Replace neon/electric accents with the landing's calm palette.
- Standard page chrome: 24px outer padding, 16px card padding, 1px hairline borders, frosted topbar, segmented sub-nav per area.
- Motion: 200–300ms ease-out fades and small translates only. No bounce, no parallax.

## Best-in-class per area (after Home)
- **CRM** → port + restyle to HubSpot Sales Hub: Contacts table (filters, segments, list views), Contact drawer (timeline, deals, notes, recent posts they engaged with), Deals kanban (already drafted), Inbox split-pane.
- **Growth** → Semrush-style: domain overview, keyword rankings table, competitor gap, top pages, backlink overview. Pulls from the Semrush connector when connected; clean "Connect Semrush" CTA otherwise.
- **Ads** → Meta Ads Manager-style table: campaign / ad-set / ad tree, spend, ROAS, CPC, status pills, pause/resume actions. Uses existing Meta tokens.
- **Content** → Notion Calendar-style month/week view + Buffer-style queue.
- **Studio** → Linear-style pipeline: products → vetting → generated → approved → scheduled.

## Real wiring (no fake data)
- Replace every mock array with the existing hooks in `src/v2/lib/api/hooks/`.
- Add the missing hooks for: today rings, "what needs you" inbox, today schedule, AI brief. Each calls the real edge function or external Supabase table; if it 404s, the UI shows the empty state.
- Add a `getTodayDigest` edge function that aggregates today's metrics from external Supabase in one call (perf).

## Technical notes
- All edits live under `src/v2/` (shell, pages, hooks, components). No raw hex in components — extend `tokens.css` with any missing landing-page tokens first.
- Sidebar rename happens in `src/v2/components/shell/SideNav.tsx` + router section labels.
- Home rebuilt in `src/v2/pages/Today.tsx` using new `<RingHero/>`, `<NeedsYouInbox/>`, `<TodayStrip/>`, `<AIBriefCard/>` components in `src/v2/pages/today/`.
- Each area gets its own `src/v2/pages/<area>/index.tsx` shell with segmented sub-nav.
- Build verified via `tsc --noEmit` after each area; visual QA via browser preview.

## Order of work
1. Tokens reconciled with landing + sidebar renamed to the 6 areas.
2. **Home** rebuilt end-to-end (rings + inbox + strip + brief) with real hooks + empty states.
3. CRM polished to HubSpot pattern (Contacts/Inbox/Pipeline already drafted).
4. Growth wired to Semrush connector.
5. Ads, Content, Studio polished.
6. Settings restructured + retire `/dashboard`.

After Home ships I'll pause for your sign-off before moving to area 2.
