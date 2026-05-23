## Goal

Make `/app` the entire product: every backend capability accessible, Apple-clean, light by default with dark toggle, mobile-first, SEO-friendly, single blue accent. Landing page untouched. Retire `/dashboard`.

## Honest constraint

The backend exposes ~165 routes across 14 domains. Doing every screen + full wiring in one pass means I will not match Apple-level polish on every detail. I will prioritize: (1) shell + design system, (2) the flows you called out (Today, Content, Higgsfield Product Library), (3) Growth/Ads/SEO, (4) CRM/Email/Competitors/Settings. Everything will be present, typed, and wired — depth of polish drops in later sections. You'll be able to iterate per page after.

---

## 1. Design system (foundation everything else depends on)

- New token layer in `src/index.css` + `tailwind.config.ts`:
  - Light: bg `#FBFBFD`, surface `#FFFFFF`, text `#1D1D1F`, border `#E5E5EA`, muted `#86868B`
  - Dark: bg `#000000`, surface `#1C1C1E`, text `#F5F5F7`, border `#2C2C2E`, muted `#8E8E93`
  - Single accent `--accent-blue` = same blue used on landing (read from current landing token, not invented)
  - Type scale (SF-style): 34/28/22/17/15/13, system font stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter`)
  - Radii: 10 / 14 / 20. Shadows: subtle 1-layer only. No gradients.
- Theme: default **light**, topbar toggle (light / dark / system). Persist in `localStorage`. Extend existing `useTheme`.
- Primitives in `src/v2/components/ui/`: `Button`, `Card`, `Sheet`, `Drawer`, `Dialog`, `Tabs`, `Input`, `Select`, `Toggle`, `Skeleton`, `EmptyState`, `Toast`. All consume tokens only — no raw colors.
- Mobile: bottom tab bar < 768px (5 tabs), sidebar ≥ 768px. Safe-area insets, 44px hit targets.

## 2. Information architecture (final /app map)

Top-level (5 tabs, same as today):
- **Today** — single-screen morning view
- **Studio** (rename from Content) — Posts, Calendar, Library, Video, **Products**, Brand
- **Growth** — Ads, SEO, CRO, Landing Pages, Lead Magnets, Referrals, Competitors, Analytics, Forecast
- **Audience** (new tab, folded from CRM/Email) — Inbox, Contacts, Pipeline, Email Sequences, Reviews
- **Settings** — Profile, Brand, Integrations, Team, Billing, Notifications, AI Brain config

That's 6 tabs. On mobile, Audience collapses into a "More" sheet so the bottom bar stays 5. AI Brain becomes a floating assistant button (bottom-right) reachable from every page — not its own tab.

All legacy `/dashboard/*` routes redirect into the new IA. `/dashboard` route + every component under `src/components/dashboard/` is removed.

## 3. Product Library + Higgsfield pipeline (the flow you described)

New section under Studio → Products.

- **Upload**: drag-drop or file picker. Multiple products. Each product = `{ name, description, category, photos[], hero_photo_id }`. Stored via existing external Supabase media path used by `src/lib/api.ts` upload helpers; product metadata in a new `products` table on the external DB (I'll add the migration on the API side later — for now stored in business `brand_dna.products` JSON which already exists).
- **Auto-pipeline** on upload, per photo:
  1. `vetCustomerAsset(businessId, imageUrl, contentTheme)` → 8-dim verdict
  2. Branch on verdict automatically:
     - `use_as_is` → mark ready, skip Higgsfield
     - `enhance_via_higgsfield` → call `smartProcessAsset` (Soul I2I) using returned `i2i_prompts`
     - `regenerate_fresh` → call `/webhook/generate-image` with full MCSLA prompt + product description as reference
     - `reject` → show reason, ask for new photo
  3. Generated assets land in Library, tagged with `product_id`
- **Product detail page**: gallery, vetter scorecards (collapsed by default), "Generate post", "Generate ad creative", "Generate video" — each opens the existing generators pre-filled with the chosen product photo
- **Campaign integration**: in Content composer and Ads composer, a "Use product" picker pulls from this library and runs the same pipeline if the chosen photo isn't pre-vetted
- Uses existing endpoints — no backend changes:
  - `vetCustomerAsset`, `smartProcessAsset` (already in `api.ts`)
  - `/webhook/generate-image`, `/webhook/score-image`, `/webhook/ad-creative-generate`
  - `/webhook/higgsfield-self-test` for a "connection healthy" indicator in Settings → Integrations

## 4. Page-by-page wiring (every backend module surfaced)

For each page below: real hook (no mocks), loading skeletons, empty state with next-step CTA, error envelope handling, primary action in topbar.

| Page | Endpoints |
|---|---|
| Today | `wf1GetDailyPlan`, `useHealth`, `useDashboardEvents`, `useOpportunities`, pending approvals from `getContentPieces?status=pending_approval` |
| Studio · Posts | `getContentPieces`, `generateContent`, `approveContentPiece`, `rejectContentPiece`, `requestContentChanges`, `batchApprove/Reject` |
| Studio · Calendar | `useCalendar`, `schedulePost` |
| Studio · Library | `useLibrary` + filter by product |
| Studio · Video | `useVideoJobs`, video generator |
| Studio · Products | (new — see §3) |
| Studio · Brand | `getBrandVoice`, `/webhook/build-brand-voice`, brand memory store/retrieve/train |
| Growth · Ads | Meta + Google: create/activate/optimize/get, `adOptimizerAuditCampaign`, ad creatives, A/B tests |
| Growth · SEO | `useSeo`, `/webhook/seo-audit`, `/webhook/seo-recommendations-get` |
| Growth · CRO | `useCro`, recommendations apply |
| Growth · Landing Pages | `useLandingPages`, `/webhook/generate-landing-page` |
| Growth · Lead Magnets | `useLeadMagnets` |
| Growth · Referrals | `useReferrals` |
| Growth · Competitors | `/webhook/competitor-analyze`, `/webhook/competitor-report-get`, `/webhook/competitor-check` |
| Growth · Analytics | `/webhook/analytics-snapshot/report/get` |
| Growth · Forecast | `/webhook/revenue-forecast`, `/webhook/attribute-revenue` |
| Audience · Inbox | existing inbox endpoints |
| Audience · Contacts | `/webhook/contacts-get`, create/update/import, activity log |
| Audience · Pipeline | `/webhook/pipeline-get`, deal create/stage-update |
| Audience · Email Sequences | sequence create/process, enroll, trigger |
| Audience · Reviews | reviews endpoints |
| Settings · Profile | business CRUD |
| Settings · Brand | links to Studio · Brand |
| Settings · Integrations | Meta/Google/LinkedIn/TikTok/Twitter OAuth start endpoints + status, Higgsfield self-test |
| Settings · Team | org-get, org-add-workspace, org-invite-member, white-label |
| Settings · Billing | `/api/billing/plans`, `/api/checkout` (Paddle), legacy Stripe customer portal |
| Settings · Notifications | preferences |
| Floating AI Brain | `wf1SetAutonomyMode`, brain chat → existing `chat` edge function, decision log from `useDashboardEvents` |

## 5. Data layer cleanup

- Keep `src/v2/lib/data/types.ts` + page-data hooks pattern.
- Delete `mocks.ts` and every mock fallback. Empty → empty state, never fake data.
- Replace placeholder `handlers.ts` bodies with real mutations from `src/lib/api.ts`. Names stay the same so call sites don't change.
- Add `useProducts`, `useProduct`, `useProductPipeline` hooks.
- All mutations use React Query `useMutation` with toast on success/error + cache invalidation.

## 6. Performance + SEO + a11y

- Code-split each top-level tab (already lazy).
- `useSEO` per page: unique title, description, canonical. `<h1>` per page, semantic landmarks, focus rings on all interactives, ARIA labels on icon-only buttons.
- Skeletons sized to final content to avoid CLS.
- Images: `loading="lazy"`, explicit dimensions, `srcset` where we control the asset.
- Keyboard: `⌘K` palette (already exists), `g t` / `g s` / `g g` / `g a` / `g ,` jump shortcuts.

## 7. Cleanup

- Remove `/dashboard` route from `src/App.tsx` (already redirects — also delete the legacy `Dashboard.tsx` page and unused `src/components/dashboard/*` files).
- Update `mem://index.md`: drop "Meta Design System" core rule, add Apple design system rule. Remove "5-tab" claim (now 6 desktop / 5 mobile).

## Order of execution (single build mode pass)

1. Tokens + theme + primitives (§1)
2. Shell, sidebar, topbar, bottom-bar, theme toggle, command palette refresh (§2)
3. Today + Studio (Posts, Calendar, Library, Brand) (§4)
4. **Products + Higgsfield pipeline** (§3)
5. Growth section (Ads → Forecast)
6. Audience section (Inbox → Reviews)
7. Settings (all tabs) + floating AI Brain
8. Mock removal, route cleanup, memory update
9. QA pass on light + dark + 375px viewport

## Technical notes

- No backend changes. Everything wires to existing `src/lib/api.ts` + Railway endpoints + external Supabase.
- Products metadata piggybacks on `brand_dna.products` JSON until a real `products` table exists server-side.
- Higgsfield auto-pipeline runs client-side orchestration of existing endpoints; if a `/webhook/product-pipeline` endpoint is added later, swap one hook.
- All new UI under `src/v2/`. No edits to `src/integrations/supabase/*` files.
