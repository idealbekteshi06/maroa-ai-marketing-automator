# Maroa.ai frontend refactor — Step 1 audit

## Current codebase stats

| Metric | Count |
|--------|-------|
| Total files (tsx/ts/css) | ~120 |
| Page-level components (src/pages/) | 15 |
| Dashboard sub-page components | 34 |
| UI primitives (src/components/ui/) | 52 (shadcn + 10 custom M-prefixed) |
| Shared components (src/components/) | ~20 |
| Hooks | 4 |
| Lib/utils | 9 |
| Sidebar nav items | 33 |

## Current sidebar (all 33 items, 7 groups)

**Quick access (1):** Mission Control

**Marketing (8):** Social Hub, AI Campaigns, Content, Email, Referral Program, Lead Magnets, Launch Campaign, Marketing Ideas

**Intelligence (6):** Competitors, SEO, AI SEO, Customer Research, Schema Markup, SEO Pages

**Customers (2):** CRM & Leads, Reviews

**Optimize (4):** Pricing Strategy, A/B Tests, Free Tools, Popups

**Automation (9):** AI Brain, Instant Campaign, Community, Sales Assets, RevOps, Onboarding CRO, Upgrade CRO, Signup CRO, AI Orchestrator

**Account (2):** Health Score, Settings

## Target sidebar (7 items)

1. Mission Control `/`
2. Approvals `/approvals` [badge: pending count]
3. Studio `/studio`
4. Growth `/growth` (tabs: Leads, Revenue, Content, Ads)
5. Market intel `/intel` (tabs: Competitors, SEO, Reviews)
6. Connections `/connections`
7. AI Brain `/brain`

Bottom: Settings, theme toggle, workspace switcher

## Where the 26 removed items go

| Removed item | Absorbed into | Access method |
|-------------|---------------|---------------|
| Social Hub | Growth > Content tab | AI Brain / direct URL |
| AI Campaigns | Growth > Ads tab | AI Brain / direct URL |
| Content | Growth > Content tab | AI Brain / direct URL |
| Email | Growth > Content tab | AI Brain / direct URL |
| Marketing Ideas | AI Brain chat | AI Brain / direct URL |
| Referral Program | hidden | AI Brain / direct URL |
| Lead Magnets | hidden | AI Brain / direct URL |
| Launch Campaign | hidden | AI Brain / direct URL |
| Competitors | Market intel > Competitors tab | AI Brain / direct URL |
| SEO | Market intel > SEO tab | AI Brain / direct URL |
| AI SEO | Market intel > SEO tab | AI Brain / direct URL |
| Customer Research | hidden | AI Brain / direct URL |
| Schema Markup | Market intel > SEO tab | AI Brain / direct URL |
| SEO Pages | Market intel > SEO tab | AI Brain / direct URL |
| CRM & Leads | Growth > Leads tab | AI Brain / direct URL |
| Reviews | Market intel > Reviews tab | AI Brain / direct URL |
| Pricing Strategy | hidden | AI Brain / direct URL |
| A/B Tests | hidden | AI Brain / direct URL |
| Free Tools | hidden | AI Brain / direct URL |
| Popups | hidden | AI Brain / direct URL |
| Instant Campaign | hidden | AI Brain / direct URL |
| Community | hidden | AI Brain / direct URL |
| Sales Assets | hidden | AI Brain / direct URL |
| RevOps | hidden | AI Brain / direct URL |
| Onboarding CRO | hidden | AI Brain / direct URL |
| Upgrade CRO | hidden | AI Brain / direct URL |
| Signup CRO | hidden | AI Brain / direct URL |
| AI Orchestrator | hidden | AI Brain / direct URL |
| Health Score | Mission Control metric card | AI Brain / direct URL |

## Current Mission Control problems (confirmed in code)

**File:** `src/components/dashboard/DashboardOverview.tsx` (498 lines)

1. **Metric cards show "0" with broken subtexts** (line 315-319)
   - "Increases as AI publishes content" — grammatically broken
   - "AI will take actions today" when 0 — makes AI seem dead
   - No trend arrows, no deltas, no context

2. **ProfileScore component takes up significant space** (line 347)
   - Full card with progress bar, locked features list
   - Dominates the page when incomplete

3. **PendingApprovals is buried** (line 350)
   - No media preview, no AI reasoning
   - Just a list of titles

4. **Quick Actions grid is 6 manual buttons** (lines 143-150)
   - Contradicts "fully automated" positioning
   - Each fires a single webhook

5. **Activity feed exists but feels dead** (lines 427-450)
   - WebSocket subscription exists (line 219) — good foundation
   - But only listens on generated_content + contacts tables
   - No rotating AI status, no indication of live work

6. **Performance chart** (lines 387-421)
   - Empty state says "Performance tracking starts today" — fine
   - No trend comparison, no delta vs last period

7. **Setup checklist** (lines 472-495)
   - 7-step checklist dominates bottom of page
   - Can be dismissed but takes up half the viewport

## Components to change

| Component | Action | Notes |
|-----------|--------|-------|
| `src/pages/Dashboard.tsx` | Heavy refactor | Cut sidebar to 7 items, new routing |
| `src/components/dashboard/DashboardOverview.tsx` | Rebuild | New Mission Control with hero metrics, live feed, tomorrow's plan, approval preview |
| `src/components/dashboard/ProfileScore.tsx` | Minimize | Small dismissible banner, not a full card |
| `src/components/PendingApprovals.tsx` | Refactor | Move to dedicated page, keep summary widget |
| `src/components/AIBrainStatus.tsx` | Refactor | Becomes topbar status pill |
| `src/components/ThemeToggle.tsx` | Keep | Already works via next-themes |
| `src/components/Sparkline.tsx` | Keep | Good for metric cards |
| `src/components/AIStatusBar.tsx` | Replace | Merge into new AI status pill |
| `src/styles/tokens.css` | Rebuild | Full design system tokens |
| `src/index.css` | Refactor | Dark mode already uses #000 — good |
| `tailwind.config.ts` | Update | Typography, spacing tweaks |

## New components to build

| Component | Page | Priority |
|-----------|------|----------|
| AppShell (sidebar + topbar + mobile nav) | Layout | Step 3 |
| MetricCard (hero variant) | Mission Control | Step 4 |
| TomorrowPlanCard (inverted/black) | Mission Control | Step 4 |
| ApprovalPreview (top 3 widget) | Mission Control | Step 4 |
| LiveActivityFeed (enhanced) | Mission Control | Step 4 |
| AIStatusPill (topbar, animated) | Layout | Step 3 |
| CommandPalette (Cmd+K) | Layout | Step 3 |
| MobileBottomNav (5 items) | Layout | Step 3 |
| ApprovalsPage (full page) | /approvals | Step 5 |
| ApprovalCard (swipeable) | /approvals | Step 5 |
| StudioPage (3 modes) | /studio | Step 6 |
| BrainChat (streaming SSE) | /brain | Step 7 |
| GrowthPage (4 tabs) | /growth | Step 8 |
| LeadsKanban | /growth > Leads | Step 8 |
| MarketIntelPage (3 tabs) | /intel | Step 9 |
| ConnectionsPage | /connections | Step 10 |
| SettingsPage (refactored) | /settings | Step 11 |

## Components to delete from sidebar (keep files for direct URL access)

All 34 dashboard sub-page components remain as files — they just lose their sidebar entries. Routes still work via the existing tab system in Dashboard.tsx.

## Existing assets we keep as-is

- Authentication flow (AuthContext.tsx, ProtectedRoute.tsx)
- Supabase client (external-client.ts)
- API client (apiClient.ts, api.ts)
- All shadcn primitives (52 files in ui/)
- React Query setup
- Recharts integration
- Landing page components
- Onboarding flow

## Key dependencies already in package.json

- `next-themes` — theme switching (already installed, already works)
- `cmdk` — command palette (already installed, not wired to UI)
- `recharts` — charts (already used)
- `lucide-react` — icons (already used)
- `react-resizable-panels` — panels (already installed)
- `vaul` — drawer (already installed)
- `embla-carousel-react` — carousel (already installed)

## Dependencies to add

- `next-intl` or `react-i18next` — i18n (not installed)
- None else needed — the stack is already complete

## Dark mode status

Already implemented via next-themes with class strategy. CSS variables in index.css already define `.dark` with `--background: 0 0% 0%` (true black). The ThemeToggle component works. No flash-prevention script in index.html yet — needs adding.

## Summary

- **Total components:** ~120 files
- **Components to refactor:** 10
- **New components to build:** 17
- **Components to delete:** 0 (all kept for direct URL, just removed from nav)
- **Execution:** 13 steps, checkpoint after each
