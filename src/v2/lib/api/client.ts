/**
 * Maroa API client. Wraps fetch, attaches Supabase JWT, normalizes errors,
 * retries idempotent GETs with exponential backoff (2x).
 *
 * §10.1 base URL: VITE_API_BASE / VITE_API_BASE_URL (default Railway production)
 * §10.2 auth: Authorization: Bearer <supabase JWT>
 *             /webhook/* additionally needs x-webhook-secret (server-side proxy in prod)
 */
import { externalSupabase } from "@/integrations/supabase/external-client";

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

const RAILWAY_API_DEFAULT = "https://maroa-api-production.up.railway.app";
const RAW_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.trim() ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  RAILWAY_API_DEFAULT;
/** In dev, same-origin + Vite proxy (see vite.config.ts). */
const BASE_URL = import.meta.env.DEV ? "" : RAW_BASE;

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await externalSupabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  retries?: number;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const pathPart = path.startsWith("/") ? path : `/${path}`;
  let href: string;
  if (path.startsWith("http")) {
    href = path;
  } else if (BASE_URL) {
    href = `${BASE_URL}${pathPart}`;
  } else if (typeof window !== "undefined") {
    href = `${window.location.origin}${pathPart}`;
  } else {
    href = pathPart;
  }
  const url = new URL(href);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function normalizeError(res: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  const b = body as { code?: string; message?: string; error?: string; details?: unknown } | null;
  return {
    status: res.status,
    code: b?.code ?? `HTTP_${res.status}`,
    message: b?.message ?? b?.error ?? res.statusText ?? "Request failed",
    details: b?.details,
  };
}

export async function apiRequest<T>(
  path: string,
  { body, query, retries = 2, headers, method = "GET", ...rest }: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, query);
  const auth = await authHeader();
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...auth,
    ...(headers as Record<string, string> | undefined),
  };

  const isIdempotent = method === "GET";
  const maxAttempts = isIdempotent ? retries + 1 : 1;
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        ...rest,
        method,
        headers: finalHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) {
        lastError = await normalizeError(res);
        // retry on 5xx / network only
        if (isIdempotent && res.status >= 500 && attempt < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
          continue;
        }
        throw lastError;
      }
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    } catch (err) {
      if ((err as ApiError).status) throw err;
      // network error
      lastError = {
        status: 0,
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network failure",
      };
      if (isIdempotent && attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError ?? { status: 0, code: "UNKNOWN", message: "Unknown error" };
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"]) =>
    apiRequest<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
