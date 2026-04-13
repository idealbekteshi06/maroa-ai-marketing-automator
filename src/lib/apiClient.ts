const RAW_API_BASE = (import.meta.env.VITE_API_BASE as string) ?? "";

/** In dev, use same-origin requests + Vite proxy so Railway CORS does not block the browser. */
const API_BASE = import.meta.env.DEV ? "" : RAW_API_BASE;

export function getApiBase(): string {
  return API_BASE;
}

export async function apiPost<T>(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${API_BASE}${endpoint}`, { signal });
  if (!res.ok) throw new Error(`API error ${res.status}: ${endpoint}`);
  return res.json() as Promise<T>;
}

export function apiFireAndForget(
  path: string,
  body: Record<string, unknown>
): void {
  void fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

export async function apiPatch(
  endpoint: string,
  body: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(
    `${API_BASE}/api/business/${encodeURIComponent(businessId)}/brand-dna`
  );
  if (!res.ok) throw new Error(`API error ${res.status}: brand-dna`);
  return res.json();
}

export async function postProductUpload(
  businessId: string,
  plan: string,
  imageUrls: string[],
  userId: string
): Promise<unknown> {
  return apiPost("/webhook/product-upload", {
    business_id: businessId,
    user_id: userId, // server expects user_id — this is auth.user.id = businesses.id
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
    user_id: userId, // server expects user_id — this is auth.user.id = businesses.id
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
    user_id: userId, // server expects user_id — this is auth.user.id = businesses.id
    plan,
    month,
    year,
  });
}
