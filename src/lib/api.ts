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

// ─── Workflow #1 — Daily Content Engine ──────────────────────
// All endpoints below are called by the new src/pages/workflows/* UIs. The
// Railway backend must implement them as specified in LEARNINGS.md §3 WF1.

/** Run the 06:00 strategic decision phase manually (dev + "run now" button). */
export const wf1RunStrategicDecision = (data: { businessId: string; forceReplan?: boolean }) =>
  post<{ runId: string; analysis: unknown; concepts: unknown[] }>(
    "/webhook/wf1-strategic-decision",
    data,
  );

/** Fetch the current daily plan (concepts + status) for a business. */
export const wf1GetDailyPlan = (params: { business_id: string; date?: string }) =>
  get<{
    date: string;
    status: "draft" | "queued" | "awaiting_approval" | "published" | "skipped";
    analysis: {
      brandMaturity: string;
      narrativeArc: string;
      culturalOpportunity: string;
      funnelStagesNeedingAttention: string[];
      underservedPillars: string[];
      targetEmotions: string[];
      reasoning: string;
    };
    concepts: Array<{
      id: string;
      platform: string;
      format: string;
      pillar: string;
      funnelStage: string;
      emotion: string;
      coreIdea: string;
      hook: string;
      cta: string;
      framework: string;
      whyThisWhyNow: string;
      predictedEngagementRange: [number, number];
      riskLevel: "low" | "medium" | "high";
      qualityScore: number | null;
      status: "pending" | "approved" | "rejected" | "published";
      generatedAsset?: {
        caption: string;
        hashtags: string[];
        visualBrief: unknown;
        postingTime: { localTime: string; rationale: string };
        predictedQualityScore: number;
      } | null;
    }>;
  }>("/webhook/wf1-plan-get", params);

/** Generate the platform-native asset for an approved concept. */
export const wf1GenerateAsset = (data: { businessId: string; conceptId: string }) =>
  post<{ assetId: string; qualityScore: number }>(
    "/webhook/wf1-generate-asset",
    data,
  );

/** Approve or reject a concept or a generated asset (feeds the learning loop). */
export const wf1Decision = (data: {
  businessId: string;
  conceptId: string;
  decision: "approve" | "reject" | "edit";
  editedCaption?: string;
  reason?: string;
}) => post("/webhook/wf1-decision", data);

/** Fetch learning-loop state: winning + anti-patterns, hashtag bank, prediction accuracy. */
export const wf1GetLearningState = (params: { business_id: string }) =>
  get<{
    winningPatterns: Array<{ trait: string; lift: number; sampleSize: number }>;
    antiPatterns: Array<{ trait: string; drag: number; sampleSize: number }>;
    hashtagBank: Array<{ tag: string; platform: string; avgReach: number; usages: number }>;
    predictionAccuracy: { mae: number; sampleSize: number };
  }>("/webhook/wf1-learning-state", params);

/** Update the autonomy mode for this business. */
export const wf1SetAutonomyMode = (data: {
  businessId: string;
  mode: "full_autopilot" | "hybrid" | "approve_everything";
  hybridWindowHours?: number;
}) => post("/webhook/wf1-autonomy-mode", data);

// ─── Workflow #13 — Weekly Strategy Brief ────────────────────
// Backend spec in LEARNINGS.md §3 WF13.

export type Wf13BriefStatus =
  | "queued"
  | "aggregating"
  | "synthesizing"
  | "polishing"
  | "awaiting_review"
  | "approved"
  | "delivered"
  | "rejected";

export interface Wf13BriefSummary {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: Wf13BriefStatus;
  subjectLine: string | null;
  headline: string | null;
  wordCount: number | null;
  generatedAt: string | null;
  deliveredAt: string | null;
}

export interface Wf13BriefDetail extends Wf13BriefSummary {
  executiveSummary: string;
  kpiNarrative: Array<{ metric: string; value: string; context: string; meaning: string }>;
  wins: Array<{
    headline: string;
    evidence: string;
    causalAnalysis: string;
    frameworkLever: string;
    protectionPlan: string;
  }>;
  losses: Array<{
    headline: string;
    evidence: string;
    rootCause: string;
    frameworkDiagnosis: string;
    remediationPlan: string;
    consequenceIfIgnored: string;
  }>;
  whatChanged: Array<{ observation: string; vsBaseline: string; signal: string }>;
  marketContext: Array<{ event: string; implication: string; actionable: boolean }>;
  biggestInsight: string;
  nextWeekPlan: Array<{
    id: string;
    action: string;
    whyNow: string;
    expectedImpact: { low: number; high: number; metric: string };
    effortHours: number;
    owner: "ai" | "founder" | "team";
    deadline: string;
    oneClickApprove: boolean;
    metric: string;
    status: "pending" | "approved" | "rejected" | "deferred";
  }>;
  whatsComingPreview: string;
  riskWatch: Array<{
    risk: string;
    leadingIndicator: string;
    probabilityHint: "low" | "medium" | "high";
    mitigation: string;
  }>;
  strategicQuestion: string;
  dataSources: string[];
  frameworksCited: string[];
  kpiCards: Array<{
    key: string;
    label: string;
    value: string;
    vsLastWeek: number;
    vsBenchmark: number;
    vsGoal?: number;
    sparkline: number[];
  }>;
}

/** Trigger synthesis now (used by manual mode and "regenerate" button). */
export const wf13GenerateBrief = (data: { businessId: string; weekStart?: string }) =>
  post<{ briefId: string; status: Wf13BriefStatus }>("/webhook/wf13-generate-brief", data);

/** Fetch the latest (current week) brief for a business. */
export const wf13GetLatestBrief = (params: { business_id: string }) =>
  get<Wf13BriefDetail | null>("/webhook/wf13-latest-brief", params);

/** Paginated history of past briefs. */
export const wf13GetBriefHistory = (params: {
  business_id: string;
  limit?: string;
  before?: string;
  q?: string;
}) =>
  get<{
    items: Wf13BriefSummary[];
    nextCursor: string | null;
  }>("/webhook/wf13-brief-history", params);

/** Approve / reject / edit a brief when autonomy mode is review_first. */
export const wf13BriefDecision = (data: {
  businessId: string;
  briefId: string;
  decision: "approve" | "edit" | "reject";
  editedSections?: Partial<{
    executiveSummary: string;
    biggestInsight: string;
    strategicQuestion: string;
  }>;
  reason?: string;
}) => post("/webhook/wf13-brief-decision", data);

/** Delivery settings: autonomy mode + channels + recipients + schedule. */
export const wf13SaveDeliverySettings = (data: {
  businessId: string;
  autonomyMode: "auto_send" | "review_first" | "manual";
  channels: Array<"email" | "slack" | "whatsapp" | "dashboard_only" | "pdf">;
  recipients: Array<{ name: string; email?: string; slackUserId?: string; whatsappE164?: string }>;
  deliveryDay: "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
  deliveryLocalTime: string; // "07:00"
  preferredLength: "brief" | "standard" | "detailed";
  tonePreference: "formal" | "casual" | "direct";
  technicalDepth: "layman" | "intermediate" | "expert";
  language: string;
}) => post("/webhook/wf13-delivery-settings", data);

export const wf13GetDeliverySettings = (params: { business_id: string }) =>
  get<{
    autonomyMode: "auto_send" | "review_first" | "manual";
    channels: Array<"email" | "slack" | "whatsapp" | "dashboard_only" | "pdf">;
    recipients: Array<{ name: string; email?: string; slackUserId?: string; whatsappE164?: string }>;
    deliveryDay: string;
    deliveryLocalTime: string;
    preferredLength: "brief" | "standard" | "detailed";
    tonePreference: "formal" | "casual" | "direct";
    technicalDepth: "layman" | "intermediate" | "expert";
    language: string;
  }>("/webhook/wf13-delivery-settings-get", params);

/** Approve / reject a specific next-week plan action (one-click). */
export const wf13PlanActionDecision = (data: {
  businessId: string;
  briefId: string;
  actionId: string;
  decision: "approve" | "reject" | "defer";
}) => post("/webhook/wf13-plan-action-decision", data);

// ─── Workflow #15 — AI Brain (Conversational Command Center) ───
// Backend spec in LEARNINGS.md §3 WF15.

export type BrainMessageRole = "user" | "assistant" | "system" | "tool";
export type BrainModel = "haiku" | "sonnet" | "opus";
export type BrainToolStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "awaiting_approval"
  | "rejected";

export interface BrainMessageDto {
  id: string;
  role: BrainMessageRole;
  content: string;
  attachments?: Array<{
    id: string;
    modality: "voice" | "image" | "url" | "file";
    url: string;
    mimeType: string;
    name?: string;
    transcription?: string;
    ocrText?: string;
    scrapedSummary?: string;
  }>;
  toolCalls?: Array<{
    id: string;
    tool: string;
    inputSummary: string;
    status: BrainToolStatus;
    progress?: { percent: number; note: string };
    result?: unknown;
    error?: string;
    startedAt: string;
    completedAt?: string;
    requiresApproval: boolean;
    rationale?: string;
    alternativesConsidered?: string[];
  }>;
  reasoning?: string;
  modelUsed?: BrainModel;
  costUsd?: number;
  createdAt: string;
}

export interface BrainConversation {
  id: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
}

/** List all conversations for a business. */
export const wf15ListConversations = (params: { business_id: string }) =>
  get<{ items: BrainConversation[] }>("/webhook/wf15-conversations", params);

/** Fetch messages in a conversation. */
export const wf15GetConversation = (params: { business_id: string; conversation_id: string }) =>
  get<{
    conversation: BrainConversation;
    messages: BrainMessageDto[];
  }>("/webhook/wf15-conversation-get", params);

/** Create a new conversation. */
export const wf15CreateConversation = (data: { businessId: string; initialMessage?: string }) =>
  post<{ conversationId: string }>("/webhook/wf15-conversation-create", data);

/**
 * Send a message. Returns an SSE stream URL + server-assigned message id.
 * The client opens an EventSource to that URL and receives streaming tokens,
 * tool-call events, and a final done event.
 *
 * Stream event shapes (server-sent events):
 *   event: token       data: { delta: string }
 *   event: reasoning   data: { delta: string }           // shown in "explain" panel
 *   event: tool_call   data: { toolCall: ToolCall }      // start of a tool invocation
 *   event: tool_update data: { id, progress, status }    // progress update
 *   event: tool_result data: { id, result, status }      // result (or awaiting_approval)
 *   event: done        data: { messageId, modelUsed, costUsd }
 *   event: error       data: { message }
 */
export const wf15SendMessage = (data: {
  businessId: string;
  conversationId: string;
  content: string;
  attachmentIds?: string[];
}) =>
  post<{
    assistantMessageId: string;
    streamUrl: string; // absolute or path; client opens EventSource
  }>("/webhook/wf15-send-message", data);

/** Approve or reject a pending tool call (when requiresApproval=true). */
export const wf15ToolDecision = (data: {
  businessId: string;
  toolCallId: string;
  decision: "approve" | "reject";
  edits?: Record<string, unknown>;
}) => post("/webhook/wf15-tool-decision", data);

/** Explain a past decision — renders senior-strategist teaching mode. */
export const wf15ExplainDecision = (data: {
  businessId: string;
  messageId: string;
}) =>
  post<{
    decision: string;
    evidence: string[];
    alternatives: Array<{ option: string; why_rejected: string }>;
    nextStep: string;
  }>("/webhook/wf15-explain", data);

/** Decision log — searchable history of actions Brain has taken. */
export const wf15DecisionLog = (params: {
  business_id: string;
  limit?: string;
  kind?: string;
  before?: string;
}) =>
  get<{
    items: Array<{
      id: string;
      createdAt: string;
      trigger: "cron" | "user" | "event";
      summary: string;
      workflow: string;
      toolsUsed: string[];
      outcome: "success" | "failure" | "rejected" | "awaiting_approval";
      modelUsed: BrainModel;
      costUsd: number;
    }>;
    nextCursor: string | null;
  }>("/webhook/wf15-decision-log", params);

/** Upload a multimodal attachment (voice/image/file). Returns attachment id. */
export const wf15UploadAttachment = (data: FormData) =>
  fetch(`${getApiBase()}/webhook/wf15-upload-attachment`, {
    method: "POST",
    body: data,
  }).then((r) => r.json() as Promise<{ id: string; modality: string; url: string }>);
