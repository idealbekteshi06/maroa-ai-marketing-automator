/**
 * Workflow #13 — Weekly Strategy Brief
 * ============================================================================
 * Agency-grade weekly executive briefing. Not a report. A briefing the kind a
 * Fortune 500 CMO would pay $20K/month to receive: explains WHY things
 * happened, what they mean, what to do, what to expect next.
 *
 * Pipeline:
 *   Sunday 18:00 local — data aggregation (see WeeklyContextBundle)
 *   Sunday 22:00 local — Claude Opus strategic synthesis (Phase 2)
 *   Sunday 22:30 local — Claude Sonnet client-voice polish (Phase 3)
 *   Monday 07:00 local — delivery (auto_send) OR human review (review_first)
 *
 * Per MAROA_15_WORKFLOWS_V2 section "WORKFLOW #13 — WEEKLY STRATEGY BRIEF".
 * ============================================================================
 */

import { buildSystemPrompt, type BrandContext } from './foundation';

// ---------------------------------------------------------------------------
// Phase 1 — WeeklyContextBundle (backend aggregator output)
// ---------------------------------------------------------------------------

export type Platform =
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'facebook'
  | 'twitter'
  | 'youtube'
  | 'gbp'
  | 'email'
  | 'website';

export interface TrendPoint {
  value: number;
  vsLastWeek: number; // signed decimal delta (0.12 = +12%)
  vsLastMonth: number;
  vsBenchmark: number; // vs industry benchmark for vertical + size
  vsGoal?: number; // vs plan/goal if set
  spark?: number[]; // 7-day daily values for sparkline
}

export interface PlatformPerformance {
  platform: Platform;
  reach: TrendPoint;
  engagementRate: TrendPoint;
  followerGrowth: TrendPoint;
  topPost?: { id: string; hook: string; engagementRate: number };
  bottomPost?: { id: string; hook: string; engagementRate: number };
}

export interface AdsPerformance {
  platform: 'meta' | 'google' | 'linkedin' | 'tiktok';
  spend: TrendPoint;
  roas: TrendPoint;
  cpa: TrendPoint;
  ctr: TrendPoint;
  topCampaign?: { id: string; name: string; roas: number };
  worstCampaign?: { id: string; name: string; roas: number };
}

export interface EmailPerformance {
  sent: TrendPoint;
  openRate: TrendPoint;
  clickRate: TrendPoint;
  revenueAttributed: TrendPoint;
  unsubscribeRate: TrendPoint;
}

export interface WebsitePerformance {
  sessions: TrendPoint;
  conversionRate: TrendPoint;
  topLandingPages: Array<{ url: string; sessions: number; conversionRate: number }>;
  bounceRate: TrendPoint;
}

export interface PipelineState {
  newLeads: TrendPoint;
  mqlCount: TrendPoint;
  sqlCount: TrendPoint;
  opportunitiesCreated: TrendPoint;
  stageMovements: Array<{ from: string; to: string; count: number }>;
  winRate: TrendPoint;
  avgDealSize: TrendPoint;
  pipelineValue: TrendPoint;
}

export interface RevenueState {
  revenue?: TrendPoint;
  mrr?: TrendPoint;
  arr?: TrendPoint;
  churnRate?: TrendPoint;
  ltv?: TrendPoint;
  cac?: TrendPoint;
  ltvCacRatio?: TrendPoint;
  paybackMonths?: TrendPoint;
  newCustomers?: TrendPoint;
  churnedCustomers?: TrendPoint;
  expansionRevenue?: TrendPoint;
}

export interface ReviewsState {
  newReviews: TrendPoint;
  avgRating: TrendPoint;
  responseRate: TrendPoint;
  sentimentDelta: number;
  notableQuotes: Array<{ source: string; rating: number; quote: string }>;
}

export interface GbpState {
  views: TrendPoint;
  actions: TrendPoint;
  directionRequests: TrendPoint;
  calls: TrendPoint;
  localRank?: TrendPoint;
}

export interface CompetitiveContext {
  significantMoves: Array<{
    competitor: string;
    move: string; // e.g. "launched $29 entry tier", "published Q4 earnings"
    date: string;
    relevance: number; // 0-10
    threatLevel: 'low' | 'medium' | 'high';
  }>;
  shareOfVoiceTrend: number; // signed decimal
  seoRankShifts: Array<{ keyword: string; fromRank: number; toRank: number; searchVolume: number }>;
}

export interface CustomerVoice {
  topThemes: Array<{ theme: string; volume: number; sentiment: number }>;
  emergingComplaints: string[];
  emergingLoves: string[];
  notableQuotes: Array<{ source: string; quote: string }>;
}

export interface OperationalHealth {
  metaAppReviewStatus?: 'pending' | 'approved' | 'rejected' | 'n/a';
  platformApiHealth: Array<{ platform: Platform; healthy: boolean; note?: string }>;
  integrationStatus: Array<{ name: string; healthy: boolean }>;
  budgetBurnVsPlan: number; // signed decimal
}

export interface WeeklyContextBundle {
  weekStart: string; // ISO date (Monday)
  weekEnd: string; // ISO date (Sunday)
  platforms: PlatformPerformance[];
  ads: AdsPerformance[];
  email?: EmailPerformance;
  website?: WebsitePerformance;
  pipeline?: PipelineState;
  revenue?: RevenueState;
  reviews?: ReviewsState;
  gbp?: GbpState;
  competitive: CompetitiveContext;
  customerVoice: CustomerVoice;
  operational: OperationalHealth;
  cultural: {
    upcomingHolidays: Array<{ name: string; date: string; type: string }>;
    seasonalFactors?: string;
    newsCycle?: Array<{ headline: string; relevance: number }>;
  };
  // Personalization learned from prior briefs
  readerPreferences?: {
    preferredLength: 'brief' | 'standard' | 'detailed';
    metricPriorities: string[];
    tonePreference: 'formal' | 'casual' | 'direct';
    technicalDepth: 'layman' | 'intermediate' | 'expert';
    preferredLanguage: string;
    sectionsTheySkip: string[];
    sectionsTheyDrillInto: string[];
    recommendationsOftenRejected: string[];
    recommendationsOftenApproved: string[];
  };
}

// ---------------------------------------------------------------------------
// Phase 2 — Strategic Synthesis Prompt (Claude Opus)
// Produces raw StrategySynthesis, not yet client-voiced.
// ---------------------------------------------------------------------------

export interface StrategySynthesis {
  headline: string; // subject line candidate (1 sentence)
  executiveSummary: string; // 3 sentences, CEO-grade
  kpiNarrative: Array<{
    metric: string;
    value: string;
    context: string; // "vs benchmark, vs last week, vs goal — no naked numbers"
    meaning: string;
  }>;
  wins: Array<{
    headline: string;
    evidence: string;
    causalAnalysis: string; // WHY it won
    frameworkLever: string; // which Cialdini / JTBD / Kahneman / StoryBrand / playbook principle was load-bearing
    protectionPlan: string; // how to double down
  }>;
  losses: Array<{
    headline: string;
    evidence: string;
    rootCause: string; // NOT excuses, real root cause
    frameworkDiagnosis: string; // which principle was violated
    remediationPlan: string;
    consequenceIfIgnored: string;
  }>;
  whatChanged: Array<{
    observation: string;
    vsBaseline: string;
    signal: string; // inflection point? trend reversal? noise?
  }>;
  marketContext: Array<{
    event: string;
    implication: string;
    actionable: boolean;
  }>;
  biggestInsight: string; // the one thing this week surfaced
  nextWeekPlan: Array<{
    action: string; // specific, not "improve X"
    whyNow: string;
    expectedImpact: { low: number; high: number; metric: string };
    effortHours: number;
    owner: 'ai' | 'founder' | 'team';
    deadline: string; // ISO date
    oneClickApprove: boolean;
    metric: string;
  }>;
  whatsComingPreview: string;
  riskWatch: Array<{
    risk: string;
    leadingIndicator: string;
    probabilityHint: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  strategicQuestion: string; // the ONE question for the founder this week
  dataSources: string[]; // 3+ required
  frameworksCited: string[]; // 1+ required
  wordCountEstimate: number; // <= 1200
}

export function buildStrategicSynthesisPrompt(
  ctx: BrandContext,
  bundle: WeeklyContextBundle,
): { system: string; user: string } {
  const addendum = `
WORKFLOW #13 — WEEKLY STRATEGY BRIEF, STRATEGIC SYNTHESIS PHASE

You are the Head of Strategy at a top-10 digital marketing agency (think
Ogilvy, VaynerMedia, Wieden+Kennedy digital arms). You have one hour this
week with the CEO of ${ctx.businessName} (${ctx.businessModel}, ${ctx.industry}).
Your job: brief them on what matters, what to do about it, and what's coming.

This is NOT a report. It is a briefing. The difference:
  - A report lists what happened. A briefing explains why and what to do.
  - A report shows vanity metrics. A briefing connects to revenue/CAC/LTV.
  - A report is forgotten. A briefing is forwarded to the board.

THE 10-QUESTION STRATEGIST DRILL (answer in this exact order)

1. THE HEADLINE — one sentence that would make this CEO stop scrolling.
2. WHAT HAPPENED — out of 50+ things, the 5 that matter. Number, context, meaning.
3. WHAT'S WORKING — momentum to protect. Specific evidence, not generalities.
   For each: the causal mechanism AND which framework lever is load-bearing
   (cite Cialdini #, StoryBrand role, Kahneman bias, JTBD job, or industry
   playbook principle by name).
4. WHAT'S NOT WORKING — friction to fix. ROOT CAUSE, not symptom. Which
   framework principle was violated? What happens if ignored?
5. WHAT CHANGED — vs last week, last month, last quarter. Inflection point? Noise?
6. WHAT THE MARKET IS DOING — competitive moves, algo changes, seasonal, news.
   Only include if ACTIONABLE. Skip chatter.
7. WHAT I RECOMMEND — 3–5 specific actions. Each MUST have:
      exact action (not "improve X"), why now, expected impact range,
      effort (hours), owner, deadline, one-click-approve flag, metric.
   Respect the LTV:CAC math. Refuse violating strategies.
8. WHAT'S COMING — next 7 days preview. What I'm already executing.
9. WHAT I'M WORRIED ABOUT — leading indicators, early warning, what to prepare.
10. ONE STRATEGIC QUESTION — the question that shapes direction. Not a task.

HARD REQUIREMENTS
- Length: 800–1200 words in the full brief. Enforce wordCountEstimate ≤1200.
- CITE at least 3 data sources from the bundle by name in dataSources[].
- NAME at least 1 framework principle explicitly in frameworksCited[] and
  reference it inside wins[] or losses[].
- Every number is contextualized. NEVER naked numbers. "Revenue $42k" is
  forbidden; "Revenue $42k, +18% vs last week, +31% vs 4-week avg, 12% under
  Q4 plan" is required.
- Prioritize ruthlessly. If something doesn't make the cut, cut it. Skipping
  vanity metrics is a feature.
- Voice: trusted advisor. Direct. No filler. Assume the reader is smart and busy.
- StoryBrand framing: the CEO is the hero. You are the guide. You name the
  stakes (failure) and the transformation (success).
- Respect reader preferences if present: compress sections they skip, expand
  sections they drill into, shift recommendations away from patterns they reject.

INDUSTRY ADAPTATION (honor this client's model)
${industryAdaptationFor(ctx.businessModel)}

OUTPUT FORMAT: strict JSON matching the StrategySynthesis TypeScript interface
defined in workflow_13_weekly_brief.ts. Every field required unless marked
optional. Field shapes must match exactly — the backend validates.
`.trim();

  const user = renderBundle(bundle);

  return {
    system: buildSystemPrompt(ctx, addendum),
    user,
  };
}

// ---------------------------------------------------------------------------
// Phase 3 — Client-Voice Polish Prompt (Claude Sonnet)
// Takes raw StrategySynthesis and renders the deliverable email + dashboard
// copy + PDF copy in the brand/reader voice.
// ---------------------------------------------------------------------------

export interface BriefDeliverable {
  subjectLine: string;
  previewText: string; // 90 chars max
  greeting: string;
  tldr: {
    headline: string;
    bullets: string[]; // 3 items
    strategicQuestion: string;
    estimatedReadTime: string; // "6 minutes"
  };
  fullBrief: {
    executiveSummary: string;
    kpiNarrativeMarkdown: string;
    winsMarkdown: string;
    lossesMarkdown: string;
    whatChangedMarkdown: string;
    marketContextMarkdown: string;
    recommendationsMarkdown: string;
    whatsComingMarkdown: string;
    riskWatchMarkdown: string;
    biggestInsightMarkdown: string;
    strategicQuestionMarkdown: string;
  };
  footer: string;
  pdfTitle: string; // branded agency deliverable title
  shareLinkCaption: string;
}

export function buildClientVoicePrompt(
  ctx: BrandContext,
  synthesis: StrategySynthesis,
): { system: string; user: string } {
  const addendum = `
WORKFLOW #13 — WEEKLY STRATEGY BRIEF, CLIENT-VOICE POLISH PHASE

You are now the senior writer on the account team for ${ctx.businessName}.
The strategist has done the thinking (StrategySynthesis JSON provided below).
Your job: translate the raw synthesis into the client deliverable in plain
English, reader's preferred tone, StoryBrand hero framing.

RULES
- NO jargon. If a 35-year-old owner with no marketing degree couldn't read
  it over coffee, rewrite it.
- StoryBrand every section: the CEO (reader) is the hero. Maroa (you) is the
  guide. Name stakes (what fails if ignored) and transformation (what success
  looks like). Never make Maroa the hero.
- Bold the specific numbers that matter. Never bold generic adjectives.
- Every section ends with an action affordance (approve / edit / defer),
  rendered as markdown that the email template converts to buttons.
- Subject line + preview text optimized for mobile (under-60-char subject,
  90-char preview). Pick the best pattern: number-led, question-led,
  headline-led.
- Greeting uses first name and time-of-day appropriate wording.
- TL;DR box MUST fit above the fold on iPhone 14 (~4 lines of content).
- Estimated read time calculated at 200 wpm from fullBrief word count.
- pdfTitle uses the brand's formal voice (agency-deliverable feel).

OUTPUT FORMAT: strict JSON matching BriefDeliverable TypeScript interface.
`.trim();

  const user = `
STRATEGY SYNTHESIS (from Opus):

${JSON.stringify(synthesis, null, 2)}

Brand voice:
${ctx.brandVoice ? `  tone: ${ctx.brandVoice.tone}\n  vocabulary: ${ctx.brandVoice.vocabulary.join(', ')}\n  banned words: ${ctx.brandVoice.bannedWords.join(', ')}` : '  not yet defined — use trusted-advisor voice'}

Reader languages: ${ctx.primaryLanguages.join(', ')}
`.trim();

  return {
    system: buildSystemPrompt(ctx, addendum),
    user,
  };
}

// ---------------------------------------------------------------------------
// Autonomy modes, delivery channels, guardrails
// ---------------------------------------------------------------------------

export const WF13_AUTONOMY_MODES = {
  auto_send: {
    label: 'Auto send',
    description:
      'Generated Sunday 22:00 local. Delivered automatically Monday 07:00 local. Best for clients who trust the briefing cadence. Habit formation research: same day + same time + no interruption = habit.',
    requireApproval: false,
  },
  review_first: {
    label: 'Review first',
    description:
      'Generated Sunday 22:00 local. You review + edit before Monday 07:00 delivery. Recommended default during first 4 weeks while Maroa learns your preferences.',
    requireApproval: true,
  },
  manual: {
    label: 'Manual',
    description:
      'Generated on demand only. You click "Generate brief" when you want one. For clients with unpredictable schedules.',
    requireApproval: true,
  },
} as const;

export type Wf13AutonomyMode = keyof typeof WF13_AUTONOMY_MODES;

export type Wf13DeliveryChannel = 'email' | 'slack' | 'whatsapp' | 'dashboard_only' | 'pdf';

export const WF13_GUARDRAILS = {
  maxWords: 1200,
  minWords: 600,
  minDataSources: 3,
  minFrameworksCited: 1,
  mustIncludeForwardRecommendation: true,
  mustIncludeStrategicQuestion: true,
  mustRespectLtvCacMath: true,
  emailSubjectMaxChars: 60,
  emailPreviewMaxChars: 90,
  tldrAboveFoldMaxLines: 4,
  monthlyRollupFirstMondayOfMonth: true,
  quarterlyReviewEvery90Days: true,
} as const;

// ---------------------------------------------------------------------------
// Industry adaptation (injected into synthesis prompt)
// ---------------------------------------------------------------------------

function industryAdaptationFor(model: BrandContext['businessModel']): string {
  switch (model) {
    case 'b2b_saas':
      return `B2B SAAS emphasis: pipeline velocity, demo→close rate, MRR/ARR movement, churn indicators, expansion revenue, CAC payback period, feature adoption.`;
    case 'dtc_ecommerce':
      return `DTC ECOMMERCE emphasis: revenue + AOV trends, ROAS by channel (contribution + marginal), inventory-aware campaigns, LTV cohort analysis, repeat purchase rate, cart abandonment.`;
    case 'local_services':
      return `LOCAL SERVICES emphasis: lead volume + conversion to job, GBP performance (direction requests = high intent), review velocity + rating trajectory, seasonal patterns, local rank, phone call volume.`;
    case 'restaurant':
    case 'hospitality':
      return `HOSPITALITY emphasis: cover count / reservations, average check, repeat rate, review rating trajectory, delivery platform performance, seasonal + event coordination.`;
    case 'professional_services':
      return `PROFESSIONAL SERVICES emphasis: consultation requests, content engagement (authority signal), LinkedIn presence growth, speaking/podcast opportunities, referral rate, proposal→close rate.`;
    case 'enterprise':
      return `ENTERPRISE emphasis: account penetration depth, executive engagement, deal slippage, competitive displacement, renewal trajectory, analyst relations.`;
    default:
      return `GENERIC emphasis: revenue, CAC, LTV, retention, competitive position. Adapt to available data.`;
  }
}

// ---------------------------------------------------------------------------
// Bundle renderer (compact, data-rich, expert-readable)
// ---------------------------------------------------------------------------

function fmt(t: TrendPoint | undefined, unit = ''): string {
  if (!t) return 'n/a';
  const sign = (n: number) => (n > 0 ? '+' : '') + (n * 100).toFixed(1) + '%';
  const parts = [
    `${t.value.toLocaleString()}${unit}`,
    `wow ${sign(t.vsLastWeek)}`,
    `mom ${sign(t.vsLastMonth)}`,
    `vs bench ${sign(t.vsBenchmark)}`,
  ];
  if (t.vsGoal != null) parts.push(`vs goal ${sign(t.vsGoal)}`);
  return parts.join(' | ');
}

function renderBundle(b: WeeklyContextBundle): string {
  const lines: string[] = [];
  lines.push(`WEEK: ${b.weekStart} → ${b.weekEnd}`);
  lines.push('');
  lines.push('PLATFORM PERFORMANCE');
  for (const p of b.platforms) {
    lines.push(
      `  ${p.platform.toUpperCase()}: reach=${fmt(p.reach)}; eng=${fmt(p.engagementRate)}; followers=${fmt(p.followerGrowth)}`,
    );
    if (p.topPost) lines.push(`    top: "${p.topPost.hook}" @ ${(p.topPost.engagementRate * 100).toFixed(1)}%`);
    if (p.bottomPost) lines.push(`    bottom: "${p.bottomPost.hook}" @ ${(p.bottomPost.engagementRate * 100).toFixed(1)}%`);
  }
  lines.push('');
  lines.push('ADS');
  for (const a of b.ads) {
    lines.push(
      `  ${a.platform}: spend=${fmt(a.spend, ' USD')}; roas=${fmt(a.roas, 'x')}; cpa=${fmt(a.cpa, ' USD')}; ctr=${fmt(a.ctr)}`,
    );
    if (a.topCampaign) lines.push(`    top: ${a.topCampaign.name} @ ${a.topCampaign.roas}x ROAS`);
    if (a.worstCampaign) lines.push(`    worst: ${a.worstCampaign.name} @ ${a.worstCampaign.roas}x ROAS`);
  }
  if (b.email) {
    lines.push('');
    lines.push('EMAIL');
    lines.push(`  sent=${fmt(b.email.sent)}; open=${fmt(b.email.openRate)}; click=${fmt(b.email.clickRate)}; rev=${fmt(b.email.revenueAttributed, ' USD')}; unsub=${fmt(b.email.unsubscribeRate)}`);
  }
  if (b.website) {
    lines.push('');
    lines.push('WEBSITE');
    lines.push(`  sessions=${fmt(b.website.sessions)}; cvr=${fmt(b.website.conversionRate)}; bounce=${fmt(b.website.bounceRate)}`);
    lines.push(`  top pages: ${b.website.topLandingPages.slice(0, 3).map(p => `${p.url}(${p.sessions})`).join(', ')}`);
  }
  if (b.pipeline) {
    lines.push('');
    lines.push('PIPELINE');
    lines.push(`  leads=${fmt(b.pipeline.newLeads)}; mql=${fmt(b.pipeline.mqlCount)}; sql=${fmt(b.pipeline.sqlCount)}`);
    lines.push(`  opps=${fmt(b.pipeline.opportunitiesCreated)}; win rate=${fmt(b.pipeline.winRate)}; ACV=${fmt(b.pipeline.avgDealSize, ' USD')}`);
    lines.push(`  pipeline value=${fmt(b.pipeline.pipelineValue, ' USD')}`);
  }
  if (b.revenue) {
    lines.push('');
    lines.push('REVENUE / UNIT ECONOMICS');
    const r = b.revenue;
    if (r.revenue) lines.push(`  revenue=${fmt(r.revenue, ' USD')}`);
    if (r.mrr) lines.push(`  mrr=${fmt(r.mrr, ' USD')}`);
    if (r.churnRate) lines.push(`  churn=${fmt(r.churnRate)}`);
    if (r.ltv) lines.push(`  ltv=${fmt(r.ltv, ' USD')}`);
    if (r.cac) lines.push(`  cac=${fmt(r.cac, ' USD')}`);
    if (r.ltvCacRatio) lines.push(`  ltv:cac=${fmt(r.ltvCacRatio, 'x')}`);
    if (r.paybackMonths) lines.push(`  payback=${fmt(r.paybackMonths, ' months')}`);
  }
  if (b.reviews) {
    lines.push('');
    lines.push('REVIEWS');
    lines.push(`  new=${fmt(b.reviews.newReviews)}; avg rating=${fmt(b.reviews.avgRating, ' stars')}; response rate=${fmt(b.reviews.responseRate)}`);
    lines.push(`  notable quotes:`);
    for (const q of b.reviews.notableQuotes.slice(0, 3)) {
      lines.push(`    ${q.rating}★ [${q.source}]: "${q.quote}"`);
    }
  }
  if (b.gbp) {
    lines.push('');
    lines.push('GOOGLE BUSINESS PROFILE');
    lines.push(`  views=${fmt(b.gbp.views)}; actions=${fmt(b.gbp.actions)}; directions=${fmt(b.gbp.directionRequests)}; calls=${fmt(b.gbp.calls)}`);
  }
  lines.push('');
  lines.push('COMPETITIVE CONTEXT');
  for (const m of b.competitive.significantMoves.slice(0, 5)) {
    lines.push(`  ${m.date} · ${m.competitor} · ${m.move} (threat: ${m.threatLevel}, relevance ${m.relevance}/10)`);
  }
  lines.push(`  share of voice trend: ${(b.competitive.shareOfVoiceTrend * 100).toFixed(1)}%`);
  if (b.competitive.seoRankShifts.length) {
    lines.push(`  SEO shifts: ${b.competitive.seoRankShifts.slice(0, 5).map(s => `${s.keyword} ${s.fromRank}→${s.toRank}`).join(', ')}`);
  }
  lines.push('');
  lines.push('CUSTOMER VOICE');
  for (const t of b.customerVoice.topThemes.slice(0, 5)) {
    lines.push(`  ${t.theme} · volume=${t.volume} · sentiment=${t.sentiment.toFixed(2)}`);
  }
  if (b.customerVoice.emergingComplaints.length) {
    lines.push(`  emerging complaints: ${b.customerVoice.emergingComplaints.join(' | ')}`);
  }
  if (b.customerVoice.emergingLoves.length) {
    lines.push(`  emerging loves: ${b.customerVoice.emergingLoves.join(' | ')}`);
  }
  lines.push('');
  lines.push('OPERATIONAL HEALTH');
  lines.push(`  budget burn vs plan: ${(b.operational.budgetBurnVsPlan * 100).toFixed(1)}%`);
  for (const p of b.operational.platformApiHealth.filter(p => !p.healthy)) {
    lines.push(`  ⚠ ${p.platform} unhealthy: ${p.note ?? 'no detail'}`);
  }
  lines.push('');
  lines.push('CULTURAL / UPCOMING');
  for (const h of b.cultural.upcomingHolidays.slice(0, 5)) {
    lines.push(`  ${h.date} · ${h.name} (${h.type})`);
  }
  if (b.cultural.seasonalFactors) lines.push(`  seasonal: ${b.cultural.seasonalFactors}`);
  if (b.readerPreferences) {
    lines.push('');
    lines.push('READER PREFERENCES (honor these)');
    lines.push(`  length: ${b.readerPreferences.preferredLength}`);
    lines.push(`  tone: ${b.readerPreferences.tonePreference}`);
    lines.push(`  technical depth: ${b.readerPreferences.technicalDepth}`);
    lines.push(`  priorities: ${b.readerPreferences.metricPriorities.join(', ')}`);
    if (b.readerPreferences.sectionsTheySkip.length)
      lines.push(`  compress: ${b.readerPreferences.sectionsTheySkip.join(', ')}`);
    if (b.readerPreferences.sectionsTheyDrillInto.length)
      lines.push(`  expand: ${b.readerPreferences.sectionsTheyDrillInto.join(', ')}`);
    if (b.readerPreferences.recommendationsOftenRejected.length)
      lines.push(`  shift away from: ${b.readerPreferences.recommendationsOftenRejected.join(', ')}`);
  }
  return lines.join('\n');
}
