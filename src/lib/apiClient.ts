const API_BASE = "https://maroa-api-production.up.railway.app";

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

export function createAbortController(): AbortController {
  return new AbortController();
}
