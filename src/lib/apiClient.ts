import { externalSupabase } from "@/integrations/supabase/external-client";

const RAW_API_BASE = (import.meta.env.VITE_API_BASE as string) ?? "";

/** In dev, use same-origin requests + Vite proxy so Railway CORS does not block the browser. */
const API_BASE = import.meta.env.DEV ? "" : RAW_API_BASE;

export function getApiBase(): string {
  return API_BASE;
}

/** Get the current Supabase session JWT for authenticated backend calls. */
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await externalSupabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function apiPost<T>(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T> {
  const auth = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${endpoint}`);
  return res.json() as Promise<T>;
}

export async function apiGet<T>(
  endpoint: string,
  signal?: AbortSignal
): Promise<T> {
  const auth = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${endpoint}`, { headers: { ...auth }, signal });
  if (!res.ok) throw new Error(`API error ${res.status}: ${endpoint}`);
  return res.json() as Promise<T>;
}

export function apiFireAndForget(
  path: string,
  body: Record<string, unknown>
): void {
  getAuthHeaders().then((auth) => {
    fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify(body),
      keepalive: true,
    })
      .then(async (res) => {
        if (res.ok) return;
        // Surface non-2xx fire-and-forget responses for ops visibility.
        // We don't await — just leave a console.warn that Sentry/PostHog can scrape.
        console.warn("[apiFireAndForget]", path, "non-OK response", res.status);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("[apiFireAndForget]", path, "failed:", message);
      });
  });
}

export async function apiPatch(
  endpoint: string,
  body: Record<string, unknown>
): Promise<void> {
  const auth = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${endpoint}`);
}

export function createAbortController(): AbortController {
  return new AbortController();
}

/** server expects user_id — this is auth.user.id = businesses.id */
export async function postGenerate(
  userId: string,
  action: string,
  payload?: Record<string, unknown>
): Promise<unknown> {
  return apiPost("/api/generate", {
    user_id: userId,
    action,
    ...(payload ?? {}),
  });
}

export async function postCheckout(
  userId: string,
  plan: string
): Promise<{ checkout_url: string; transaction_id?: string }> {
  return apiPost("/api/checkout", { user_id: userId, plan });
}

export async function getBrandDna(businessId: string): Promise<unknown> {
  const auth = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE}/api/business/${encodeURIComponent(businessId)}/brand-dna`,
    { headers: { ...auth } }
  );
  if (!res.ok) throw new Error(`API error ${res.status}: brand-dna`);
  return res.json();
}

/**
 * GET /api/business/:businessId/brand-voice
 * Returns the typed brand voice anchor used by the BrandVoiceCard component.
 */
export interface BrandVoiceDto {
  tone: string;
  do_use: string[];
  do_not_use: string[];
  customer_phrases: string[];
  updated_at: string | null;
  confidence: number | null;
  derived_from: string | null;
}

export interface CronHealthSlot {
  last_run_at: string | null;
  healthy: boolean;
  age_hours: number | null;
}

export interface CronHealthDto {
  generated_at: string;
  content_generation: CronHealthSlot;
  competitor_monitor: CronHealthSlot;
  analytics_snapshot: CronHealthSlot;
  lead_scoring: CronHealthSlot;
  retention_emails: CronHealthSlot;
  win_notifications: CronHealthSlot;
}

export async function getCronHealth(
  businessId: string,
  signal?: AbortSignal,
): Promise<CronHealthDto | null> {
  const auth = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE}/api/cron-health/${encodeURIComponent(businessId)}`,
    { headers: { ...auth }, signal },
  );
  if (!res.ok) return null;
  return (await res.json()) as CronHealthDto;
}

export async function getBrandVoice(
  businessId: string,
  signal?: AbortSignal
): Promise<BrandVoiceDto | null> {
  const auth = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE}/api/business/${encodeURIComponent(businessId)}/brand-voice`,
    { headers: { ...auth }, signal }
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { voice: BrandVoiceDto | null };
  return json?.voice ?? null;
}

export interface GeneratedContentRow {
  id?: string;
  content_theme?: string;
  instagram_caption?: string;
  facebook_post?: string;
  image_url?: string;
  quality_score?: number;
}

/**
 * Synchronous content generation — awaits the full backend flow and returns
 * the actual generated row, or throws with a real error message.
 */
export async function generateContentNow(
  businessId: string,
  userId: string,
  email?: string,
  signal?: AbortSignal
): Promise<GeneratedContentRow> {
  const auth = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/content/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ business_id: businessId, user_id: userId, email: email ?? "" }),
    signal,
  });
  const json = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    content?: GeneratedContentRow;
    error?: { code?: string; message?: string };
  };
  if (!res.ok || !json?.ok) {
    const msg = json?.error?.message || `API error ${res.status}: /api/content/generate`;
    throw new Error(msg);
  }
  return json.content ?? {};
}

export async function buildBrandVoice(businessId: string): Promise<BrandVoiceDto | null> {
  const auth = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/webhook/build-brand-voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ business_id: businessId }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: build-brand-voice`);
  const json = (await res.json()) as { ok: boolean; voice: BrandVoiceDto | null };
  return json?.voice ?? null;
}

export async function postProductUpload(
  businessId: string,
  plan: string,
  imageUrls: string[],
  userId: string
): Promise<unknown> {
  return apiPost("/webhook/product-upload", {
    business_id: businessId,
    user_id: userId,
    plan,
    product_images: imageUrls,
  });
}

export async function postBuildBrandDna(
  businessId: string,
  userId: string
): Promise<unknown> {
  return apiPost("/webhook/build-brand-dna", {
    business_id: businessId,
    user_id: userId,
  });
}

export async function postBuildCalendar(
  businessId: string,
  plan: string,
  month: number,
  year: number,
  userId: string
): Promise<unknown> {
  return apiPost("/webhook/build-calendar", {
    business_id: businessId,
    user_id: userId,
    plan,
    month,
    year,
  });
}
