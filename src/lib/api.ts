import { apiPost as corePost, apiFireAndForget, getApiBase } from "./apiClient";

async function post<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
  return corePost<T>(path, body);
}

async function get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  const base = getApiBase();
  const url = new URL(`${base}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `API error ${res.status}`);
  }
  return res.json();
}

/** Fire-and-forget POST — logs but never throws */
function fire(path: string, body: Record<string, unknown>): void {
  apiFireAndForget(path, body);
}

// ─── Auth / Signup ───────────────────────────────────────────
export const newUserSignup = (data: Record<string, unknown>) =>
  post("/webhook/new-user-signup", data);

export const signupWebhook = (data: Record<string, unknown>) =>
  fire("/webhook/maroa-signup-2026", data);

export const instantContent = (data: Record<string, unknown>) =>
  fire("/webhook/maroa-content-2026", data);

// ─── Onboarding / Account ────────────────────────────────────
export const accountConnected = (data: Record<string, unknown>) =>
  post("/webhook/account-connected", data);

// ─── Content ─────────────────────────────────────────────────
export const generateContent = (data: Record<string, unknown>) =>
  post("/webhook/instant-content", data);

export const approveContent = (data: Record<string, unknown>) =>
  fire("/webhook/content-approved", data);

export const contentGenerate = (data: Record<string, unknown>) =>
  post("/webhook/content-generate", data);

export const getContentPieces = (params: Record<string, string>) =>
  get("/webhook/content-pieces-get", params);

export const approveContentPiece = (data: Record<string, unknown>) =>
  post("/webhook/content-approve", data);

// ─── Campaigns / Ads ─────────────────────────────────────────
export const createCampaigns = (data: Record<string, unknown>) =>
  post("/webhook/create-campaigns", data);

export const budgetUpdated = (data: Record<string, unknown>) =>
  fire("/webhook/budget-updated", data);

export const metaCampaignCreate = (data: Record<string, unknown>) =>
  post("/webhook/meta-campaign-create", data);

export const metaCampaignActivate = (data: Record<string, unknown>) =>
  post("/webhook/meta-campaign-activate", data);

export const metaCampaignOptimize = (data: Record<string, unknown>) =>
  post("/webhook/meta-campaign-optimize", data);

export const getMetaCampaigns = (params: Record<string, string>) =>
  get("/webhook/meta-campaigns-get", params);

export const googleCampaignCreate = (data: Record<string, unknown>) =>
  post("/webhook/google-campaign-create", data);

export const googleCampaignActivate = (data: Record<string, unknown>) =>
  post("/webhook/google-campaign-activate", data);

export const googleCampaignOptimize = (data: Record<string, unknown>) =>
  post("/webhook/google-campaign-optimize", data);

export const getGoogleCampaigns = (params: Record<string, string>) =>
  get("/webhook/google-campaigns-get", params);

// ─── Ad Creatives ────────────────────────────────────────────
export const getAdCreatives = (params: Record<string, string>) =>
  get("/webhook/ad-creatives-get", params);

export const updateAdCreative = (data: Record<string, unknown>) =>
  post("/webhook/ad-creative-update", data);

export const generateAdCreative = (data: Record<string, unknown>) =>
  post("/webhook/ad-creative-generate", data);

export const getAbTests = (params: Record<string, string>) =>
  get("/webhook/ab-tests-get", params);

// ─── Competitors ─────────────────────────────────────────────
export const competitorCheck = (data: Record<string, unknown>) =>
  post("/webhook/competitor-check", data);

export const competitorAnalyze = (data: Record<string, unknown>) =>
  post("/webhook/competitor-analyze", data);

export const getCompetitorReport = (params: Record<string, string>) =>
  get("/webhook/competitor-report-get", params);

// ─── Landing Pages ───────────────────────────────────────────
export const generateLandingPage = (data: Record<string, unknown>) =>
  post("/webhook/generate-landing-page", data);

// ─── Analytics ───────────────────────────────────────────────
export const analyticsSnapshot = (data: Record<string, unknown>) =>
  post("/webhook/analytics-snapshot", data);

export const analyticsReport = (data: Record<string, unknown>) =>
  post("/webhook/analytics-report", data);

export const getAnalytics = (params: Record<string, string>) =>
  get("/webhook/analytics-get", params);

// ─── Social OAuth ────────────────────────────────────────────
export const metaOauthExchange = (data: Record<string, unknown>) =>
  post("/meta-oauth-exchange", data);

export const linkedinOauthExchange = (data: Record<string, unknown>) =>
  post("/webhook/linkedin-oauth-exchange", data);

export const tiktokOauthExchange = (data: Record<string, unknown>) =>
  post("/webhook/tiktok-oauth-exchange", data);

// ─── Social Publishing ───────────────────────────────────────
export const linkedinPublish = (data: Record<string, unknown>) =>
  post("/webhook/linkedin-publish", data);

export const tiktokPublish = (data: Record<string, unknown>) =>
  post("/webhook/tiktok-publish", data);

// ─── Email ───────────────────────────────────────────────────
export const emailSequenceCreate = (data: Record<string, unknown>) =>
  post("/webhook/email-sequence-create", data);

export const emailEnroll = (data: Record<string, unknown>) =>
  post("/webhook/email-enroll", data);

export const emailTrigger = (data: Record<string, unknown>) =>
  post("/webhook/email-trigger", data);

export const emailSequenceProcess = (data: Record<string, unknown>) =>
  post("/webhook/email-sequence-process", data);

export const getNoOpenCandidates = (params: Record<string, string>) =>
  get("/webhook/no-open-candidates", params);

// ─── Contacts / CRM ─────────────────────────────────────────
export const contactCreate = (data: Record<string, unknown>) =>
  post("/webhook/contact-create", data);

export const contactUpdate = (data: Record<string, unknown>) =>
  post("/webhook/contact-update", data);

export const contactImport = (data: Record<string, unknown>) =>
  post("/webhook/contact-import", data);

export const getContacts = (params: Record<string, string>) =>
  get("/webhook/contacts-get", params);

export const contactActivityLog = (data: Record<string, unknown>) =>
  post("/webhook/contact-activity-log", data);

// ─── Pipeline / Deals ────────────────────────────────────────
export const getPipeline = (params: Record<string, string>) =>
  get("/webhook/pipeline-get", params);

export const dealCreate = (data: Record<string, unknown>) =>
  post("/webhook/deal-create", data);

export const dealStageUpdate = (data: Record<string, unknown>) =>
  post("/webhook/deal-stage-update", data);

// ─── SEO ─────────────────────────────────────────────────────
export const seoAudit = (data: Record<string, unknown>) =>
  post("/webhook/seo-audit", data);

export const getSeoRecommendations = (params: Record<string, string>) =>
  get("/webhook/seo-recommendations-get", params);

export const seoRecommendationApply = (data: Record<string, unknown>) =>
  post("/webhook/seo-recommendation-apply", data);

// ─── CRO ─────────────────────────────────────────────────────
export const croAnalyze = (data: Record<string, unknown>) =>
  post("/webhook/cro-analyze", data);

export const croGenerateCopy = (data: Record<string, unknown>) =>
  post("/webhook/cro-generate-copy", data);

// ─── Video ───────────────────────────────────────────────────
export const videoScriptGenerate = (data: Record<string, unknown>) =>
  post("/webhook/video-script-generate", data);

export const videoGenerateRunway = (data: Record<string, unknown>) =>
  post("/webhook/video-generate-runway", data);

export const getVideoStatus = (params: Record<string, string>) =>
  get("/webhook/video-status", params);

export const getVideos = (params: Record<string, string>) =>
  get("/webhook/videos-get", params);

// ─── Brand Memory ────────────────────────────────────────────
export const brandMemoryStore = (data: Record<string, unknown>) =>
  post("/webhook/brand-memory-store", data);

export const brandMemoryRetrieve = (data: Record<string, unknown>) =>
  post("/webhook/brand-memory-retrieve", data);

export const brandMemoryTrain = (data: Record<string, unknown>) =>
  post("/webhook/brand-memory-train", data);

// ─── Reviews ─────────────────────────────────────────────────
export const reviewRequestSend = (data: Record<string, unknown>) =>
  post("/webhook/review-request-send", data);

export const reviewResponseGenerate = (data: Record<string, unknown>) =>
  post("/webhook/review-response-generate", data);

export const reviewResponsePublish = (data: Record<string, unknown>) =>
  post("/webhook/review-response-publish", data);

export const getReviews = (params: Record<string, string>) =>
  get("/webhook/reviews-get", params);

// ─── Billing ─────────────────────────────────────────────────
export const getBillingPlans = () => get("/api/billing/plans");

// ─── Organizations / White-label ─────────────────────────────
export const orgCreate = (data: Record<string, unknown>) =>
  post("/webhook/org-create", data);

export const getOrg = (params: Record<string, string>) =>
  get("/webhook/org-get", params);

export const orgAddWorkspace = (data: Record<string, unknown>) =>
  post("/webhook/org-add-workspace", data);

export const orgInviteMember = (data: Record<string, unknown>) =>
  post("/webhook/org-invite-member", data);

export const orgWhiteLabelUpdate = (data: Record<string, unknown>) =>
  post("/webhook/org-white-label-update", data);

export const whiteLabelUpdate = (data: Record<string, unknown>) =>
  post("/webhook/white-label-update", data);

export const getWhiteLabel = (params: Record<string, string>) =>
  get("/webhook/white-label-get", params);
