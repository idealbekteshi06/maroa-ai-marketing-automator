// Demo data — makes every page look professional when no real data exists
// Used as fallback when API returns empty or errors

export const DEMO_IDEAS = [
  {
    id: "d1", idea: "Programi 'Sill një shok - merr 1 muaj falas' me QR kode", category: "Referral Program",
    priority: "high", estimated_impact: "25-40 anëtarë të rinj brenda 1 muaji",
    how_to_execute: "1. Krijo karta referale me QR kod unik.\n2. Shpërnda te anëtarët ekzistues.\n3. Shpërblje me 1 muaj falas.",
    budget_required: "€50", time_to_results: "1-4 javë", status: "new"
  },
  {
    id: "d2", idea: "Event 'Open Day' me demonstrime falas dhe DJ live", category: "Local Event",
    priority: "high", estimated_impact: "40-60 vizitorë, 20-30 regjistrime",
    how_to_execute: "1. Organizoje një të shtunë me klasa falas çdo 45 min.\n2. Promovo 10 ditë para me €50 ads.\n3. Ofroje deal 40% zbritje vetëm atë ditë.",
    budget_required: "€150", time_to_results: "2 javë", status: "new"
  },
  {
    id: "d3", idea: "Fushatë Google Ads me gjeotargeting hiperlokal", category: "Paid Advertising",
    priority: "high", estimated_impact: "15-25 regjistrime brenda 1 muaji",
    how_to_execute: "1. Targetro 'palestër Prishtina' dhe terma lokale.\n2. Budget €5-7/ditë.\n3. Landing page me ofertë speciale.",
    budget_required: "€120", time_to_results: "1-2 javë", status: "in_progress"
  },
  {
    id: "d4", idea: "Partneritet me biznese lokale për kuponë ekskluzivë", category: "Local Partnerships",
    priority: "medium", estimated_impact: "25-40 walk-ins brenda 3 javësh",
    how_to_execute: "1. Kontakto 15-20 biznese lokale pranë palestrës.\n2. Ofro 2 javë falas për stafin e tyre.\n3. Vendos flyers në lokalet e tyre.",
    budget_required: "€80", time_to_results: "1-3 javë", status: "new"
  },
  {
    id: "d5", idea: "Video testimoniale nga anëtarë vendas si Instagram Reels", category: "Social Media",
    priority: "medium", estimated_impact: "20-35 regjistrime brenda 3 javësh",
    how_to_execute: "1. Filmo 5-7 anëtarë të kënaqur (30-60 sekonda).\n2. Posto organikisht + €10-15/video si ads.\n3. Targetro Prishtinën.",
    budget_required: "€100", time_to_results: "1-3 javë", status: "completed"
  }
];

export const DEMO_ORCHESTRATION_LOGS = [
  { task: "social_post", success: true, reason: "Daily content — Tuesday best posting day", created_at: new Date(Date.now() - 3600000).toISOString() },
  { task: "competitor_check", success: true, reason: "Weekly competitor monitoring", created_at: new Date(Date.now() - 7200000).toISOString() },
  { task: "content_calendar", success: true, reason: "Planning this week's content", created_at: new Date(Date.now() - 86400000).toISOString() },
  { task: "ai_seo", success: true, reason: "SEO optimization for local keywords", created_at: new Date(Date.now() - 172800000).toISOString() },
  { task: "ideas", success: true, reason: "Weekly marketing ideas refresh", created_at: new Date(Date.now() - 259200000).toISOString() },
];

export const DEMO_OPPORTUNITIES = [
  { type: "holiday", priority: "high", title: "Upcoming holiday — create campaign now", action: "Generate holiday promotion content" },
  { type: "posting_gap", priority: "urgent", title: "No post in 3 days — reach dropping", action: "Generate and schedule a post today" },
  { type: "referral_missing", priority: "medium", title: "No referral program set up", action: "Set up referral program to grow word of mouth" },
];

export const DEMO_HEALTH = {
  score: 62,
  categories: [
    { name: "Profile Completeness", score: 14, max: 20, tip: "Complete your brand voice settings" },
    { name: "Posting Consistency", score: 12, max: 20, tip: "Post at least 3 times this week" },
    { name: "Content Variety", score: 10, max: 20, tip: "Try video content for higher engagement" },
    { name: "Engagement Tracking", score: 14, max: 20, tip: "Connect your Instagram for analytics" },
    { name: "Competitive Position", score: 12, max: 20, tip: "Add 2 competitors to track" },
  ],
  recommendations: [
    "Complete your brand voice settings",
    "Post at least 3 times this week",
    "Connect your Instagram account",
    "Add 2 competitors to track",
  ],
};

export const DEMO_INTELLIGENCE = {
  signals: 127,
  content_wins: 18,
  insights: [
    "Albanian posts perform 3x better than English",
    "Transformation content gets most engagement",
    "Morning audience most active 6-8am",
  ],
};

export const DEMO_PERFORMANCE = {
  this_week: { posts: 6, estimated_reach: 8400, campaigns: 2, time_saved_hours: 12, cost_saved_eur: 540 },
  last_week: { posts: 4, estimated_reach: 5200, campaigns: 1, time_saved_hours: 8, cost_saved_eur: 360 },
};
