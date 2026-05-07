# Frontend choice: Lovable wins

**Date:** 2026-05-05
**Status:** Decided

## Two candidates evaluated

| Candidate | Path | Stack | Verdict |
|---|---|---|---|
| **Lovable** (THIS repo) | `/Users/bekteshi/Desktop/maroa-ai-marketing-automator/src/` | Vite + React 18 + shadcn (radix) + Tailwind 3 + React Query + Supabase Auth | ✅ Chosen |
| Next.js Pro rebuild | `./maroa-frontend/` | Next 16 + React 19 + framer-motion + recharts + Tailwind 4 + zustand | ❌ Archived |

## Why Lovable wins

| Factor | Lovable | Next.js Pro |
|---|---|---|
| Deployed live | maroa-ai-marketing-automator.lovable.app | not deployed |
| Page coverage | 30+ pages, all 17 backend skills wired | 14 pages, half missing |
| Onboarding | Balkan-first V3 with browser-language detection + localStorage resume | generic stub |
| Backend wiring | `src/lib/apiClient.ts` already wired | would need full rewrite |
| Customer-ready | now | 1-2 months of rebuild |
| Stack risk | mature React 18 + Tailwind 3 | bleeding edge React 19 + Next 16 + Tailwind 4 |
| Premium animations | can layer in via framer-motion (optional) | already built but moot if app isn't shipped |

The "premium feel" gap that Next.js Pro claimed to solve can be added to Lovable in a day via framer-motion + recharts (already installed) + a few new components. Migrating to Next.js Pro would mean 1-2 months of regressions on a deployed customer product. Not a trade Maroa can afford.

## Path forward — A+++ elevation on Lovable

### The single biggest UX gap (audit finding)

Post-signup, after the WelcomeModal closes, the customer lands on an empty dashboard. The 17 backend skills are running invisibly. **No "wow" moment.** This is the #1 fix.

### What's being added (this PR series)

1. **`LiveAgentActivityFeed.tsx`** — replaces the blank moment. Shows the AI thinking out loud:
   - "Reading your Google reviews… found 23"
   - "Brand voice: warm, family-owned cafe"
   - "Top customer phrase: 'parking is hard but worth it' (8x)"
   - "Drafting your first 3 captions…"
   - "Done. Want to publish, edit, or queue?"

2. **`AnimatedMetric.tsx`** — count-up + sparkline primitive, reusable across Mission Control, Insights, Customers tabs.

3. **`PsychologyBadge.tsx`** — surfaces the marketing-psychology layer (Cialdini's 7 + Kahneman biases). Each generated piece of content shows which principles were applied, e.g. *Social Proof · Loss Aversion*.

4. **`DecisionNarrative.tsx`** — reusable AI-reasoning panel. Used by ad-optimizer, weekly scorecard, advisor outputs.

### What is NOT being changed

- The 30 existing pages (no risk to deployed app)
- The sidebar navigation (already follows Hick's Law — 7 primary items)
- The onboarding flow (Balkan-first V3 is solid)
- The auth flow (already production-grade)

### What was archived

- `./maroa-frontend/` — the Next.js Pro rebuild. Kept on disk for reference but not deployed and not maintained going forward.

## Activation

The new components are added to `src/components/` but only wired into the Dashboard once verified by the user via `npm run dev` preview. No customer-facing change until manual sign-off.
