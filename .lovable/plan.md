## Goal

Make `/app` the only dashboard, pixel-consistent with the landing page (same blue, type, radii, spacing), modeled best-in-class per module, every button wired to the real backend, every legacy useful module folded under the new shell, then retire `/dashboard`.

## Design parity (locks before any UI work)

- Primary = landing page blue (existing `--m-primary`/landing `--primary`); single accent, no other colors.
- Type = same stack as landing (Inter / system); same scale, same tracking.
- Radii = `12px` cards, `10px` controls, `999px` pills (match landing buttons).
- Spacing rhythm = 4/8/12/16/24/32 (match landing).
- Light default, dark toggleable. Theme toggle already in Topbar.
- All colors via tokens in `src/styles/tokens.css` + `src/index.css`. No raw hex in components.

## Wave 1 — Shell + design parity

- Reconcile `src/styles/tokens.css` with landing tokens: confirm `--m-primary` == landing `--primary` in both light and dark; lock radii, shadows, spacing.
- `AppShell` polish: 1px hairlines, frosted Topbar on scroll, sidebar active-state pill, SubNav becomes segmented control, BottomBar haptic-style ripples on mobile.
- `CommandPalette` (⌘K): real index of routes, contacts, content pieces, products; live results.
- `FloatingBrain`: confirms `chat` edge function, streaming UI, quick-action chips.
- `PageHeader` upgrade: subtitle, breadcrumb, action slot, sticky on scroll.

## Wave 2 — Today

Already strong; finishing touches only:
- Add edit-in-place caption + schedule directly in `ReviewDrawer`.
- Add "what changed since you last visited" diff row.
- Live websocket / polling refresh on `dashboard-events`.
- Skeleton → content cross-fade.

## Wave 3 — Studio + Products + Higgsfield (the big one)

End-to-end product → creative pipeline.

**Products library** (`/app/studio/products`)
- Real backend: new `products` table on external Supabase (id, business_id, name, description, price, sku, photos jsonb, status, created_at). Replace `localStorage`.
- Drag-and-drop / file-upload to Supabase Storage bucket `product-photos` (signed URLs).
- Bulk import via CSV.
- Per-product page: edit metadata, manage photos, "Generate campaign" CTA.

**Higgsfield pipeline**
- On photo add: auto-call `vetCustomerAsset` → score across 8 dimensions, show ring.
- Auto-branch via `smartProcessAsset`: use_as_is / Soul I2I enhance / regen fresh / reject.
- Show original vs generated side-by-side with verdict chips.
- "Regenerate with different style" + "Send to Posts" buttons.
- Real-time progress (polling `getVideoStatus` style for image jobs if exposed; otherwise toast-driven).

**Campaigns** (`/app/studio/campaigns` — new sub-route)
- Pick product(s) → AI proposes Meta + Google campaigns with creative variants from product photos.
- Wired to `metaCampaignCreate`, `googleCampaignCreate`, `createCampaigns`.
- Status board: draft / queued / live / paused / completed.

**Studio sub-pages polish**
- Posts (Content): kanban (Draft → Approval → Scheduled → Live), real `getContentPieces`, drag to reschedule.
- Calendar: full-week + month, color-coded by platform, drag-to-reschedule.
- Library: Pinterest-grid of generated media, filter by source (Higgsfield / Runway / uploaded).
- Video: Runway-style generator UI wired to `videoGenerateRunway` + `getVideos`.
- Brand: voice trainer, examples, do/don't, wired to `brandMemoryStore` + `brandMemoryTrain`.

## Wave 4 — Growth + Audience (best-in-class per module)

| Sub-page | Modeled after | Real backend |
|---|---|---|
| Growth → Ads | Meta Ads Manager (lite) | `getMetaCampaigns`, `getGoogleCampaigns`, `adOptimizerAuditCampaign` |
| Growth → SEO | Ahrefs Site Audit | `getSeoRecommendations`, `seoRecommendationApply`, `seoAudit` |
| Growth → CRO | Hotjar Insights | `croAnalyze`, `croGenerateCopy` |
| Growth → Landing Pages | Framer | `generateLandingPage` + Supabase `landing_pages` table |
| Growth → Competitors | SimilarWeb | `competitorCheck`, `getCompetitorReport` |
| Growth → Analytics | Linear Insights | `getAnalytics`, `analyticsSnapshot` |
| Growth → Forecast | Pry Financials | `analyticsReport` |
| Audience → Inbox | Front | external Supabase `messages` table (split panel, AI reply) |
| Audience → Contacts | **HubSpot Contacts** | `getContacts`, `contactCreate`, `contactImport` |
| Audience → Pipeline | HubSpot Deals (kanban) | `getPipeline`, `dealCreate`, `dealStageUpdate` |
| Audience → Email | Klaviyo | `emailSequenceCreate`, `emailEnroll`, `getNoOpenCandidates` |
| Audience → Reviews | Birdeye | `getReviews`, `reviewResponseGenerate`, `reviewResponsePublish` |

Every page: real data, skeleton → empty → error → success states, design-token consistent.

## Wave 5 — Settings + final wiring + retire `/dashboard`

- Profile / Brand / Connections / Autopilot / Team / Billing / Notifications — each gets its own real page (currently most reuse `Settings.tsx` stub).
- Wire remaining handler stubs: `editApprovalItem`, `editContentPost`, `schedulePost`, `dismissGrowthRecommendation`, `explainGrowthRecommendation`, `viewCompetitorSignal`, `viewSeoOpportunity`, `explainBrainDecision`, `editBusinessProfile`, `editBrandVoice`, `manageConnectedAccount`.
- Add new edge function `brain-explain` for decision narratives.
- `/dashboard` → 301 redirect to `/app`. Delete unused legacy pages once parity is confirmed.

## Technical notes

- **No raw hex** in components — only tokens.
- **Hooks**: extend `src/v2/lib/api/hooks/` with one hook file per module (`useAds.ts`, `useSeo.ts`, `useContacts.ts`, `usePipeline.ts`, `useReviews.ts`, `useProducts.ts`, `useCampaigns.ts`).
- **Migrations needed**: `products` table + GRANTs + RLS + `product-photos` storage bucket on external Supabase. Will be done in the wave 3 step.
- **Order of operations**: build pages against real hooks; if a backend route 404s, the hook returns empty + we render the polished empty state. No mock data anywhere.
- **Verification**: after each wave, `tsc --noEmit` + visit each route + check console.

## Sequencing

I'll ship Wave 1 + Wave 3 (Studio/Products) first since they're the visible delta you asked for, then Wave 4 module by module, then Wave 5 cleanup. I'll keep going wave by wave without asking — just tell me to pause or pivot if anything looks wrong.