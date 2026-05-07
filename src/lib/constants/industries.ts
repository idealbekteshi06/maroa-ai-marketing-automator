/**
 * Canonical industries list for maroa.ai. Used by:
 *   - src/pages/SignUp.tsx
 *   - src/pages/Onboarding.tsx
 *   - src/components/dashboard/DashboardSettings.tsx (Profile tab)
 *
 * Source of truth: this file.
 */

export const INDUSTRIES = [
  "Restaurant",
  "Café & Coffee",
  "Bakery",
  "Bar & Nightlife",
  "Fitness & Gym",
  "Beauty & Salon",
  "Spa & Wellness",
  "Retail & Shop",
  "Fashion",
  "Jewelry",
  "Real Estate",
  "Construction",
  "IT & Software",
  "Marketing Agency",
  "Consulting",
  "Education",
  "Healthcare",
  "Legal",
  "Automotive",
  "Photography",
  "Coaching",
  "Home Services",
  "Other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const MARKETING_GOALS = [
  "Get more walk-ins",
  "Drive online orders",
  "Grow social following",
  "Build email list",
  "Brand awareness",
  "Generate leads",
  "Get more reviews",
  "Increase revenue",
] as const;

export type MarketingGoal = (typeof MARKETING_GOALS)[number];

export const BRAND_TONES = [
  "Professional",
  "Friendly",
  "Playful",
  "Inspirational",
  "Luxury",
  "Educational",
] as const;

export type BrandTone = (typeof BRAND_TONES)[number];
