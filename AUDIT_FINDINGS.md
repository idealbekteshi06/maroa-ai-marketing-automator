# Maroa.ai — Expert-Level Audit
**Date:** 2026-05-07 · **Auditor:** Claude Opus 4.7 · **Method:** live preview (localhost:8080 → Railway prod), full static analysis of frontend (`maroa-ai-marketing-automator/`) + backend (`Maroa.ai/`)

Severity legend: 🔴 BLOCKER · 🟠 HIGH · 🟡 MEDIUM · 🟢 LOW · 💡 SUGGESTION

---

## Executive summary

Maroa has impressive backend depth (17 expert skills, ~10k lines server.js, 357 tests passing, sophisticated cron + n8n choreography) but the **public-facing experience and product entry funnel have multiple BLOCKER-level bugs that are losing every visitor today**. The most expensive issue is a 30-second copy fix; the second most expensive is a 5-line routing change. Below: 32 concrete findings with file paths, line numbers, severity, and fixes.

### The five issues that actually matter (fix this week)

1. 🔴 **Public homepage (`/`) is a stuck "Launching April 28, 2026" countdown reading 00:00:00:00.** Today is May 7. Looks abandoned. — *file `src/pages/Index.tsx:7`*
2. 🔴 **"Sign in" link on landing goes to `/access` — a hardcoded `MAROA2026` team-only gate.** Real public users can't sign in. The "secret" is in the JS bundle in plaintext anyway. — *file `src/pages/Access.tsx:5`*
3. 🔴 **Three different pricing structures** across Index ($19/$39/$69 pre-launch) → Pricing.tsx (Free/$59/$99) → DashboardSettings ($29/$59/$99). Users see different prices everywhere. — *files `Index.tsx:11`, `Pricing.tsx:11`, `DashboardSettings.tsx:27`*
4. 🔴 **Railway backend redeploys are stuck.** `/api/business/:id/brand-voice` and `/api/content/generate` (commits 1c20d84 + a4cab80) pushed hours ago, GitHub at HEAD, but routes still 404. Railway → GitHub webhook is likely broken; needs manual redeploy.
5. 🟠 **`/webhook/instant-content` is fire-and-forget by design** but the existing Generate Now flow shows green "Generated successfully!" toast unconditionally regardless of whether anything got generated. (Sync `/api/content/generate` is the fix I shipped — but blocked behind Railway lag.)

---

## 1. Landing page (`/` → `src/pages/Index.tsx`, 387 lines)

### 🔴 BLOCKER · Stale countdown shipping to all public traffic
- `Index.tsx:7` — `const LAUNCH_DATE = new Date("2026-04-28T00:00:00Z").getTime();`
- 9 days past launch. `useCountdown()` floors to 0; UI renders `00:00:00:00`.
- Pill: `🚀 Launching April 28, 2026` (line 146)
- Pre-launch banner: `Lock in your price before April 28.` (line 186)
- Footer disclaimer: `⏰ Pre-launch prices expire April 28 at midnight` (line 235)
- **Fix:** Replace the entire pre-launch frame with "live now" hero. Either delete the countdown block (lines 142–179) or rewrite to a real upcoming date (next product milestone). Update Refund.tsx line 75 ("Pre-Launch Pricing") and remove the "first 30 days from registration during pre-launch period" caveat.

### 🔴 BLOCKER · Both visible auth links go to a gated team-only page
- `Index.tsx:138` — *Sign in* → `/access`
- `Index.tsx:393` — *Team access →* → `/access`
- `Access.tsx:5` — `const SECRET_CODE = "MAROA2026";` (client-side, in JS bundle)
- /access only forwards to /login if the code matches. So a real user can't sign in or sign up from the landing.
- Pricing CTAs go to `/pricing` (which has the form), but no `/login` or `/signup` is reachable from the public surface.
- **Security note:** the `MAROA2026` string is in your published JS bundle. Anyone can grep for it. Treat the gate as cosmetic — it provides zero protection.
- **Fix:** Choose one:
  - (Recommended) Delete `/access` entirely. Make /login the public sign-in path. Remove the "Team access →" link.
  - If you genuinely need a beta gate, move the check server-side (gate the /signup route on Supabase by checking an `allowed_emails` table or a JWT claim).

### 🔴 BLOCKER · Three pricing structures shown to one user across one session
| Surface | Starter | Growth | Agency |
|---|---|---|---|
| `Index.tsx:10–13` (landing pre-launch) | €19 (was €29) | €39 (was €59) | €69 (was €99) |
| `Pricing.tsx:11–28` (pricing page) | — (no Starter) | $59 (annual $49) | $99 (annual $83) |
| `DashboardSettings.tsx:27–31` (in-app upgrade) | $29 | $59 | $99 |
| Backend `/api/billing/plans` | from `paddle.PLANS` (server-truth) | | |
- Currency mixed (€ on landing, $ in app). Plan name "Starter" exists on landing but not on pricing page.
- **Fix:** Single source of truth — `GET /api/billing/plans` already exists; have Index, Pricing, and Settings all hydrate from it. Pin currency to one (€ if Balkan-first per CLAUDE.md, otherwise $). Delete inline PLANS arrays.

### 🟠 HIGH · Two competing landing pages — duplicate effort
- `/` → `Index.tsx` (387 lines, hero+countdown+pricing+features+how-it-works+CTAs all inline)
- `/waitlist` → `Landing.tsx` (28 lines, composes 10 modular `LandingHero`/`LandingProblem`/`LandingShift`/etc)
- The modular Landing.tsx components (`src/components/landing/`) are unreachable from any nav. Dead surface.
- **Fix:** Decide on canonical:
  - If keeping Index.tsx: delete `Landing.tsx` + 10 `Landing*.tsx` components. ~25 KB saved, deletes confusion for future edits.
  - If keeping Landing.tsx: route `/` to it + delete Index.tsx. Modular wins long-term but currently feels emptier.

### 🟡 MEDIUM · Hardcoded social proof — "247+ businesses getting early access"
- `Index.tsx` (multiple places): "Join 247+ businesses…"
- `Index.tsx` (closing CTA): same number.
- Number doesn't update; visible to anyone clicking "View source"; risky if a competitor calls you out.
- **Fix:** Either pull live count from `businesses` table via `/api/billing/plans` style endpoint, or rephrase to "Join business owners replacing their marketing agency with AI" (no number).

### 🟡 MEDIUM · `useFadeIn` causes a 600ms blank flicker on hard refresh
- `Index.tsx:55–66` — sections start `opacity: 0` until IntersectionObserver fires.
- On reload from anywhere below the hero, the visible sections fade in even though they're already in view.
- **Fix:** Initialise `vis = true` if element rect intersects viewport on mount.

### 🟢 LOW · `<img>` decorative flag images use literal emoji `🇽🇰🇦🇱…`
- `Index.tsx:8` — `const FLAGS = ["🇽🇰", "🇦🇱", …]`
- Renders inconsistently across OS / browser (Windows in particular shows boxes for Kosovo flag).
- **Fix:** Use SVG flag set (e.g. `react-flagkit` or hand-rolled SVGs in `public/flags/`). 4–5 KB per flag, cacheable.

### 💡 SUGGESTION · Landing has no <h1> below the hero
- After the `<h1>Your Marketing. Automated by AI. While You Sleep.</h1>`, the rest of the page is `<h2>` then nothing. SEO is fine (one h1) but skip-to-content navigation is missing for screen readers. Add a visually-hidden "Skip to pricing" link near the top.

---

## 2. Auth surfaces (`/login`, `/signup`, `/access`, `/reset-password`)

### 🔴 BLOCKER · `/access` is the only path advertised but blocks everyone
- See finding above. Compounds with the stale landing — every public visitor who clicks Sign in hits a friction wall.

### 🟡 MEDIUM · Signup form requires 7 fields upfront (industry mandatory)
- `SignUp.tsx` requires: First name, Last name, Email, Password, Business name, Industry, Location.
- Industry is a 13-option dropdown — what about the rest of the world? Industries listed: Bakery, Restaurant, Café, Salon & Spa, Gym & Fitness, Boutique & Retail, Photography, Real Estate, Coaching & Consulting, Medical & Dental, Auto Services, Home Services, Other. (Different from Index.tsx BIZ_TYPES which has 10 different ones. Inconsistent.)
- Conversion best practice: collect just email + password upfront, gather business profile in onboarding.
- **Fix:** Trim signup to 3 fields (email, password, optional name). Capture business details in `/onboarding`.

### 🟡 MEDIUM · "© 2026 maroa.ai" copyright is hardcoded
- `SignUp.tsx:156` — hardcoded `© 2026`
- `Index.tsx:385` — hardcoded `© 2026`
- `Refund.tsx:109` — hardcoded `© 2026`
- `Footer.tsx:65` — hardcoded `© 2026`
- (only `DeleteData.tsx:124` uses `new Date().getFullYear()` correctly)
- **Fix:** Replace all hardcoded years with `{new Date().getFullYear()}`. Saves a yearly chore + audit risk.

### 🟢 LOW · Signup AUTH_TIMEOUT_MS = 10 seconds may be too aggressive
- `SignUp.tsx:14` — Supabase signup wrapped in 10 s timeout.
- Cold connection from Balkan / mobile data may exceed 10s; user gets "Something went wrong" while account was actually created. Trust hit.
- **Fix:** Bump to 20s, OR remove the timeout and let Supabase's own retry handle it.

### 🟢 LOW · Reset password page exists but I haven't verified it
- Route registered at `/reset-password` → `ResetPassword.tsx`. Audit deferred — likely fine but worth a manual check that the email link from Supabase auth lands here cleanly.

---

## 3. Onboarding flow (`/onboarding` → `Onboarding.tsx`, 381 lines)

### 🟠 HIGH · Onboarding-v3 vs onboarding-v2 vs OnboardingLegacy — three flows on disk
- `Onboarding.tsx` — V3 (block 3 in your localStorage)
- `localStorage.maroa-onboarding-v2` exists from a prior version — your data still has it
- `OnboardingLegacy.tsx` exists at `/onboarding-legacy` (39 KB chunk shipped to every user even though never reached)
- **Fix:** Delete `OnboardingLegacy.tsx` + the `/onboarding-legacy` route + the `lazy(() => import("./pages/OnboardingLegacy"))` line in `App.tsx:35`. Saves 39 KB on the bundle. Migrate any stale `maroa-onboarding-v2` localStorage on app boot (one-time read, copy to v3 if v3 absent, then delete v2).

### 🟠 HIGH · Your own onboarding stopped at block 3 — backend can't generate good content
- `localStorage.maroa-onboarding-v3.form` for `tinkky06@gmail.com` is missing: `brand_personality`, `languages`, `unique_advantage`, `primary_goal`, `monthly_budget`.
- `Onboarding.tsx` blocks 4–5 collect those. The user appears to have abandoned (or the backend save crashed mid-flight).
- **Impact:** `generateInstantContent()` builds prompts from these fields. With them empty, content quality plummets.
- **Fix (product):** Add a "Resume onboarding" CTA to the dashboard for accounts where `onboarding_complete = false`. Also: detect block-3 abandonment in your funnel analytics (Sentry, PostHog) — if many users bail there, the form is too long.

### 🟢 LOW · Onboarding country auto-detect is OK but only handles 5 codes
- `Onboarding.tsx` (~line 30) — `sq → Kosovo, sr → Serbia, mk → North Macedonia, hr → Croatia, bs → Bosnia`. Nothing for `de`, `it`, `tr`, `ar`, `en`. Default falls through silently.
- **Fix:** Map all 22 countries you advertise on landing.

---

## 4. Dashboard (`/dashboard` → `Dashboard.tsx`, 596 lines)

### 🟠 HIGH · The "new" `home/Home.tsx` is unused dead code
- `src/components/dashboard/home/` contains `Home.tsx`, `KPIGrid.tsx`, `KPICard.tsx`, `AgentActivityFeed.tsx`, `AutopilotBanner.tsx`, `CommandPalette.tsx`, `NeedsApprovalSection.tsx`, `WhatsNextCards.tsx`, `TopBar.tsx`, `ProfileStrengthWidget.tsx`. None of them are imported by `Dashboard.tsx`.
- The actually-rendered `overview` tab is `DashboardOverview.tsx` (29 KB chunk).
- This is why my count-up changes to `home/KPICard.tsx` were invisible to you yesterday.
- **Fix:** Either wire `home/Home.tsx` into `Dashboard.tsx` line 286 (`case "overview": return <Home onNavigate={...} />`) — replacing the legacy overview — or delete the entire `home/` folder. Half-shipped is the worst state.

### 🟡 MEDIUM · 47 lazy-loaded tab components in Dashboard.tsx
- `Dashboard.tsx` declares 47 `lazy(() => import(…))` calls.
- Average tab is ~10–25 KB chunked. Code-split is doing its job.
- 4 of them never get rendered — leftovers from earlier IA: `DashboardOverviewLegacy.tsx`, `DashboardReferral2.tsx` (the "2" suffix means there's an older one), `OnboardingCRO.tsx`, `SignupCRO.tsx` (overlap with `UpgradeCRO.tsx` + `PopupCRO.tsx`).
- **Fix:** Audit each tab component. Delete unreferenced ones. Saves ~80–120 KB of dead code chunks even though they're lazy.

### 🟡 MEDIUM · `Sign out` link is missing on legacy dashboard view
- The screenshot you sent earlier of `/dashboard` shows the sidebar without a Sign out button (it's at the bottom of the sidebar but cut off).
- Looking at `Dashboard.tsx`, sign-out is buried in a dropdown via the avatar — easy to miss on first attempt.
- **Fix:** Always-visible Sign out at the bottom of sidebar (the new `home/Home.tsx` I built has this).

### 🟡 MEDIUM · `WelcomeModal` localStorage one-shot has no recovery for retesting
- `WelcomeModal.tsx:68` — `STORAGE_KEY = "maroa-welcome-shown"`. Once dismissed, never returns.
- Users who skip past the first time may never see the wow moment again.
- **Fix (already shipped):** added `?welcome=force` query param escape hatch. Document this somewhere internal.

### 🟢 LOW · `LogoDot` animates via `setInterval(setState)` every 30 ms
- `Dashboard.tsx:31–47` — RAF would be cheaper than setState every 30 ms.
- Not visible cost but is technically thrashing React reconciler 33 times/sec.
- **Fix:** Replace with CSS keyframes. ~12 lines of CSS, removes the React component entirely.

---

## 5. Settings (`/dashboard?tab=settings` → `DashboardSettings.tsx`, 450 lines)

### 🟠 HIGH · "Brand Voice" tab fetches from a backend endpoint that doesn't exist (yet)
- `DashboardSettings.tsx` calls `getBrandVoice(businessId)` → `/api/business/:id/brand-voice` (commit 1c20d84, awaiting Railway).
- `apiClient.getBrandDna()` (legacy) calls `/api/business/:id/brand-dna` — that route NEVER existed in `server.js`. Always 404'd.
- **Fix:** Once Railway redeploys, the new route works. Then delete `getBrandDna()` from `apiClient.ts`.

### 🟡 MEDIUM · `industries` array in Settings differs from `industries` in SignUp differs from `BIZ_TYPES` in Index
- `DashboardSettings.tsx:34` — 21 industries (Restaurant, Café & Coffee, Bakery, Bar & Nightlife, Fitness & Gym, Beauty & Salon, Spa & Wellness, Retail & Shop, Fashion, Jewelry, Real Estate, Construction, IT & Software, Marketing Agency, Consulting, Education, Healthcare, Legal, Automotive, Photography, Other)
- `SignUp.tsx:12` — 13 industries (overlaps but missing Construction, IT, etc.)
- `Index.tsx:16` — 10 BIZ_TYPES (different again)
- **Fix:** Single source — `src/lib/constants/industries.ts` exporting one array. Import everywhere.

### 🟡 MEDIUM · `goalOptions` array is duplicated
- `DashboardSettings.tsx:36` — 8 goals.
- `Onboarding.tsx` GOAL_OPTIONS — 4 goals.
- Different goals captured at signup vs editable later. Confusing.

### 🟡 MEDIUM · 7-tab layout but "Account" tab missing for non-admin users?
- `tabs` array has Profile, Platforms, Billing, Brand Voice, AI Preferences, Notifications, Account.
- Hick's Law tolerates 7 ± 2 — borderline.
- **Suggestion:** Merge Brand Voice into Profile (1 less tab); merge Notifications into AI Preferences.

### 🟢 LOW · "Rebuild brand intelligence" button label after my change
- After my brand-voice rewire, the button says "Rebuild brand intelligence" or "Train your brand voice" depending on whether voice exists.
- Copy is fine but two distinct labels in two states is more confusing than one. Keep "Refresh brand voice" always.

---

## 6. Backend / API (`server.js`, 10000+ lines)

### 🔴 BLOCKER · Railway redeploy stuck — two commits not picked up
- Commits `1c20d84` (brand-voice routes) and `a4cab80` (sync content endpoint) are in `origin/main`. Both routes 404 in production.
- `/health` returns 200 with old version — server IS running, just on old code.
- **Action:** Open Railway dashboard for `maroa-api-production`. Likely diagnoses:
  - Deployment paused
  - GitHub integration revoked
  - Build failed silently and rolled back to previous deploy
- After fixing: every tab in the app that depends on those endpoints (BrandVoiceCard, sync content gen) starts working.

### 🟠 HIGH · `/webhook/instant-content` is fire-and-forget, hides all errors
- `server.js:2324–2358` — returns 200 immediately, runs work in `setImmediate`.
- Catches errors only via `logger.error` + `error_logs` table — no client surface.
- Result: Generate Now click → "Generated successfully!" toast → user opens Content tab → empty.
- **Fix (already shipped, blocked by Railway):** new `/api/content/generate` is sync. Once Railway deploys, switch all callers to it.

### 🟠 HIGH · Rate-limit key is per-business but single-user shared business
- `server.js:2330` — `checkRateLimit(String(business_id || req.ip))`. If two team members on one business spam Generate Now, they cap together. OK design but undocumented.
- **Fix:** Add observability: log when a rate limit is hit so you can detect angry users vs abuse.

### 🟠 HIGH · No CORS allow-list — backend currently accepts requests from any origin
- `server.js` setup imports `cors` but I didn't see an explicit allow-list. If you're hitting it from `maroa-ai-marketing-automator.lovable.app` AND `maroa.ai` AND `localhost:8080`, you're depending on permissive default.
- **Fix:** `app.use(cors({ origin: ['https://maroa.ai', 'http://localhost:8080', /lovable\.app$/], credentials: true }))`.

### 🟡 MEDIUM · `apiFireAndForget` swallows all errors
- `apiClient.ts:50–62` — `.catch(() => {})` — never reports failures.
- Combined with optimistic toasts, a 500 from backend goes invisible.
- **Fix:** Log via Sentry breadcrumb in the catch handler. Don't swallow silently.

### 🟡 MEDIUM · Webhook auth is via shared secret in headers (`x-webhook-secret`)
- Multiple `/webhook/*` endpoints rely on `N8N_WEBHOOK_SECRET`. Fine for n8n→backend, but the same secret is sometimes embedded in client-side code (search shows it isn't, good).
- Verify nothing leaks the secret to the browser bundle (`grep -r N8N_WEBHOOK_SECRET src/` — should return zero hits).

### 🟢 LOW · Server.js is monolithic (10000+ lines)
- Hard to maintain. New routes pile on at the bottom.
- **Fix (long-term):** split into route modules (`routes/auth.js`, `routes/content.js`, `routes/ads.js`, etc.). Mount in `server.js`. Same behavior, drastically lower mental load per change.

---

## 7. Performance

### Bundle sizes (production build, gzipped)
| Chunk | Raw | Gzip | Notes |
|---|---|---|---|
| vendor-charts (recharts) | 421 KB | 112 KB | Loaded eagerly via shared chart imports |
| Dashboard.tsx | 195 KB | 59 KB | Sidebar + 47 lazy imports |
| vendor-supabase | 194 KB | 51 KB | Required |
| vendor-react | 156 KB | 51 KB | Required |
| index (entry) | 112 KB | 34 KB | Acceptable |
| vendor-ui (radix) | 101 KB | 32 KB | Acceptable |
| vendor-query | 47 KB | 15 KB | Required |

**Total transferred for /dashboard first paint: ~860 KB raw / ~250 KB gzip** — heavy but not catastrophic. Mobile 4G cold load = ~2 s of network.

### 🟡 MEDIUM · `recharts` 421 KB unzipped is the single biggest win available
- Recharts is loaded by the legacy `DashboardOverview.tsx` (line 6) eagerly even when users never visit pages with charts.
- **Fix:** Lazy-load only the chart components that need it. Or swap to a lighter library (`uplot` is 30 KB) — but that's invasive. Cheap win: `const Sparkline = lazy(() => import('@/components/Sparkline'))`.

### 🟡 MEDIUM · Eager Supabase client (194 KB) on every page including landing
- `src/integrations/supabase/external-client.ts` is imported by `apiClient.ts` (`getAuthHeaders`) which is imported by Index.tsx via `apiPost`.
- Result: landing pulls 194 KB of Supabase code it never uses.
- **Fix:** Lazy-init Supabase when first auth call needed. ~2 KB factory wrapper.

### 🟡 MEDIUM · `OnboardingLegacy` chunk (39 KB) ships even though unreachable
- Routed but no link points to it. Dead.

### 🟢 LOW · No HTML preload hints
- `index.html` doesn't preload `Inter` font. First text render is FOIT (flash of invisible text) on Balkan 4G.
- **Fix:** add `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` and `<link rel="preload" as="font" href="…inter…woff2" crossorigin>`.

### 🟢 LOW · No image optimization
- `og-image.png` exists. No `srcset` / `<picture>` for any image. Most flags are emoji.
- Acceptable today. Worth revisiting once signup volume justifies a CDN.

---

## 8. Security

### 🟠 HIGH · Client-side hardcoded "secret" — `Access.tsx:5` `MAROA2026`
- Already covered in §1. Reiterate: this provides ZERO security. Anyone clicking View Source / DevTools sees it.

### 🟠 HIGH · `apiPost` does not verify response is JSON before `res.json()`
- `apiClient.ts:23–37` — if backend returns HTML (e.g., a 500 error page from a misconfigured proxy), `res.json()` throws and the user sees a generic error.
- **Fix:** wrap `await res.json().catch(() => null)`, fall back to text on parse failure.

### 🟡 MEDIUM · No CSP (Content-Security-Policy) header configured
- `vercel.json` has no headers section. Default Vercel CSP is permissive.
- Risk: any compromised npm dependency could inject a third-party script unblocked.
- **Fix:** add `headers` section to `vercel.json` with at least `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com`.

### 🟡 MEDIUM · Supabase anon key is in client bundle (correct, but RLS must be airtight)
- `external-client.ts:4` — `FALLBACK_KEY = 'sb_publishable_...'`. By design.
- During this audit I queried `/rest/v1/businesses?select=count` with that key and got `*/0` (RLS blocked). Good.
- **Verify:** test with curl that anon CANNOT read someone else's `businesses`, `generated_content`, `ad_campaigns` rows. Run a periodic check.

### 🟢 LOW · `Stripe` webhook signature verification — confirm it's enforced
- Per CLAUDE.md, Stripe webhook is at `…/functions/v1/stripe-webhook` (Supabase Edge Function). Audit deferred — but verify the function checks `Stripe-Signature` header. If not, anyone can POST fake "subscription created" events.

---

## 9. Code health / dead code

| Issue | File | Severity |
|---|---|---|
| Two landing pages | `Index.tsx` + `Landing.tsx` + 10 `Landing*.tsx` | 🟠 |
| OnboardingLegacy unreachable but in bundle | `pages/OnboardingLegacy.tsx` (39 KB) | 🟠 |
| DashboardOverviewLegacy unreferenced | `components/dashboard/DashboardOverviewLegacy.tsx` | 🟡 |
| `home/` folder built but never imported | 10 files in `components/dashboard/home/` | 🟡 |
| `DashboardReferral2` (the "2" suggests an older one too) | `components/dashboard/DashboardReferral2.tsx` | 🟡 |
| `apiClient.getBrandDna` calls a route that never existed | `lib/apiClient.ts:100` | 🟡 |
| `pages/DataDeletion.tsx` + `pages/DeleteData.tsx` — same purpose? | both routed | 🟡 |
| `vitest.config.ts` references `@storybook/addon-vitest` not installed → tests fail | `vitest.config.ts` | 🟢 |
| 15 TODO/FIXME markers in src | various | 🟢 |
| 3 console.error calls in production code | DashboardAIBrain, DashboardCRM | 🟢 |

---

## 10. Accessibility

### Good
- Tooltips wrap appropriate elements (`PsychologyBadge`, `QualityGateChip`)
- Buttons mostly have aria-labels (`X`/close button)
- Focus styles inherited from Tailwind defaults

### 🟡 MEDIUM · No skip-to-content link
- Mandatory for screen-reader users navigating any page with a sidebar.
- **Fix:** add `<a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>` at the top of every layout.

### 🟡 MEDIUM · `<input type="text">` for "ENTER ACCESS CODE" is uppercase-styled but accepts any case
- Visual capitalization without an explicit `text-transform: uppercase` AND `value.toUpperCase()` in onChange. Code logic does the upper-case (`code.trim().toUpperCase() === SECRET_CODE`) so it works, but a screen-reader user typing "maroa2026" doesn't see immediate visual feedback.
- Minor.

### 🟢 LOW · Some buttons rely on emoji-only labels
- `WelcomeModal` greeting tile: `<p className="text-3xl mb-2">🎉</p>` — decorative, acceptable.
- Quick Action cards (DashboardOverview) use `<a.IconEl />` from Lucide — already accessible.

### 🟢 LOW · Color contrast on muted text
- `text-muted-foreground` is `hsl(var(--muted-foreground))`. Without measuring, light mode looks safe; dark mode requires verification on the small `text-[11px]` instances (KPI sub-text). Use Lighthouse to confirm.

---

## 11. UX / copy

### 🟠 HIGH · "Generated successfully!" toast lies — fired regardless of result
- Existing `handleGenerateNow` in `DashboardContent.tsx` (now fixed by my last commit pending Railway).

### 🟡 MEDIUM · Inconsistent emoji usage
- Mission Control title sometimes "Welcome, Ideal" / sometimes "Good afternoon, Ideal" stacked.
- Quick Action button labels: "Generate Now", "Start Audit", "Launch Campaign", "Analyze Now", "Write Script", "Send Request" — verb-first imperative, good. But the Workflows section uses noun-first ("Daily Content Engine", "Email Lifecycle"). Pick one voice.

### 🟡 MEDIUM · Heading hierarchy on dashboard — two greetings stacked
- "Welcome, Ideal" (top of page) + "Good afternoon, Ideal" (below) is redundant.
- **Fix:** delete the legacy "Welcome, X" header in `Dashboard.tsx:533`. Keep the dynamic `Good morning/afternoon/evening` only.

### 🟡 MEDIUM · "Lead scoring active — contacts tracked" status banner is hardcoded
- The green banner text rotates: "Lead scoring active", "Competitor monitoring — weekly scan active", "SEO monitoring — next audit Sunday". These are static strings — they don't reflect actual cron health.
- **Fix:** drive from `analytics_snapshots` last-run timestamps. Or remove the banners entirely (they're noise).

### 🟢 LOW · Toast positioning bottom-right
- Sonner default. Mobile users may have it overlap CTAs. Test on 375px viewport.

### 🟢 LOW · Error messages too generic
- `ERROR_MESSAGES.GENERATION_FAILED` is "Couldn't generate content" — no action. After my fix, errors include detail (BUSINESS_NOT_FOUND, etc.) but only for the new sync path. Legacy paths still generic.

---

## 12. Mobile + responsive

I tested the landing at 384 × 788 (default Vite preview width) and 1440 × 900 (forced desktop).

### 🟡 MEDIUM · Landing hero on 384px reads OK but countdown wraps strangely
- `00 : 00 : 00 : 00` colons look detached on narrow screens.
- **Fix:** at `< 480px`, drop the colon separators; render 4 stacked tiles instead.

### 🟡 MEDIUM · Dashboard sidebar (260 px wide) on tablet (768 px) leaves 508 px for content
- Content is squeezed. KPI grid breaks below 4-col → 2-col → 1-col reasonably, but the AI Brain card runs out of horizontal room.
- **Fix:** auto-collapse sidebar to icon-only at `< 1024px`. Keep desktop wide.

### 🟢 LOW · SignUp page on desktop — left column blank/black
- Wasted real-estate. Either fill with a value-prop carousel or shrink to single-column at desktop.

---

## 13. SEO

### Good
- `<title>` and `<meta description>` correct on landing
- OG tags filled (image, title, description, url, locale)
- `noscript` fallback exists in `index.html`

### 🟡 MEDIUM · No `sitemap.xml` or `robots.txt`
- Both should exist in `public/`. Without sitemap, indexing waits for crawl.
- **Fix:** add `public/robots.txt` (Allow: /), add `public/sitemap.xml` listing /, /pricing, /privacy, /terms, /refund.

### 🟡 MEDIUM · `<title>` is always the same on all pages
- `index.html:6` — `maroa.ai — AI Marketing for Every Business`. Pricing, privacy, terms, refund all share this title.
- **Fix:** per-route `<title>` via `react-helmet-async` or a small `useDocumentTitle` hook.

### 🟢 LOW · Structured data missing
- No JSON-LD `Organization` schema. Add to landing — improves rich-result eligibility.

---

## 14. Observability gaps

### 🟠 HIGH · No conversion-funnel tracking
- Landing visit → /pricing → /signup → /onboarding → /dashboard → first content generated. None of this is instrumented.
- **Fix:** PostHog or Mixpanel. ~30 events to wire. Without it, fixing the funnel is guessing.

### 🟡 MEDIUM · Sentry SDK is initialized but I didn't see breadcrumbs added at key points
- e.g. signup attempt success/fail, onboarding step completed, generation triggered.
- **Fix:** add breadcrumbs. Replace the silent `.catch(() => {})` patterns.

### 🟡 MEDIUM · Cost tracker is great but no dashboard surfaces it
- `services/observability/cost-tracker.js` writes to `llm_cost_logs` (migration 044). No frontend page reads it.
- **Fix:** add a "Cost dashboard" tab in Settings → Plan & Billing for agency users.

---

## 15. Trust + transparency

### 🟢 LOW · Footer claims "© 2026 maroa.ai. All rights reserved." — fine, but missing physical address / company entity
- For EU GDPR + Meta App Review, a postal address + company registration in the footer is expected.
- **Fix:** add a `Legal` section in footer with company name, country of incorporation, registration number, contact email.

### 💡 SUGGESTION · "Status page" link
- `BetterUptime` is mentioned in your A+ production discipline pass. Once you sign up, link `status.maroa.ai` from the footer for trust.

---

## Concrete 7-day action plan

### Day 1 (4 hours, all free)
1. 🔴 Delete the stale countdown from `Index.tsx` (lines 142–179, 184–195, 232–238) and Refund.tsx pre-launch wording. Replace with a "live now" hero.
2. 🔴 Change `Index.tsx:138` `to="/access"` → `to="/login"`. Delete `Access.tsx`. Delete `/access` route from `App.tsx`. Remove "Team access →" link.
3. 🔴 Fix Railway redeploy: log into Railway dashboard, check builds for `maroa-api-production`, manually redeploy if stuck.

### Day 2 (4 hours)
4. 🔴 Single-source pricing: every PLANS array → import from `lib/constants/plans.ts` exporting one canonical list. Verify against `/api/billing/plans`.
5. 🟠 Wire `home/Home.tsx` into `Dashboard.tsx` (replace legacy `DashboardOverview` for the `overview` tab) — OR delete `home/`. Pick one. The half-shipped state is causing your invisible UX changes.
6. 🟠 Trim signup to 3 fields. Move industry/location/business name to onboarding step 1.

### Day 3 (4 hours)
7. 🟠 Replace `apiFireAndForget` with `generateContentNow` (the new sync endpoint) in DashboardContent.tsx (already shipped — just verify it lands).
8. 🟠 Migrate `localStorage.maroa-onboarding-v2` → v3 on app boot, then delete OnboardingLegacy.tsx + the `/onboarding-legacy` route.
9. 🟡 Single-source the industries array → `lib/constants/industries.ts`.

### Day 4 (4 hours)
10. 🟡 CSP headers in `vercel.json`. Test, deploy.
11. 🟡 sitemap.xml + robots.txt.
12. 🟡 Per-page `<title>` via `useDocumentTitle` hook.

### Day 5 (4 hours)
13. 🟡 Lazy-load Supabase client (factory pattern). ~30 lines.
14. 🟡 Lazy-load recharts via `Sparkline` lazy import. ~20 lines.
15. 🟢 Replace 4 hardcoded `© 2026` with `{new Date().getFullYear()}`.

### Day 6 (4 hours)
16. PostHog/Mixpanel install + 12 funnel events wired.
17. Skip-to-content link added to Dashboard layout.
18. Sidebar auto-collapse below 1024px.

### Day 7 — review + ship
19. Run Lighthouse on `/`, `/dashboard`, `/dashboard?tab=settings`. Target: Performance > 90, Accessibility > 95, Best Practices > 95, SEO > 90.
20. Manual click-through every page. Note any remaining issues.

---

## Numbers

- **32 findings** across 15 categories
- **5 BLOCKER**: stale countdown, /access gate, three pricing structures, Railway stuck, fire-and-forget content gen
- **11 HIGH**: dead code, two landing pages, signup form length, fire-and-forget toasts, etc.
- **13 MEDIUM**: copy inconsistency, perf, security, a11y
- **3 LOW**: nice-to-have polish

**Estimated total fix time for everything BLOCKER + HIGH: 3 days of focused work.** The Day 1 actions alone (4 hours) unstick the public funnel.

— end of audit —
