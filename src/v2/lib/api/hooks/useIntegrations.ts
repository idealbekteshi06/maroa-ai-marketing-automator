/**
 * Live connection status for a business.
 *
 *   GET /api/business/:businessId/integrations   (Supabase JWT)
 *   → { ok, integrations:[{ key,label,connected,status,detail }],
 *       connected_count, recommended_action }
 *
 * Casing note (per backend contract): the path segment is the raw businessId
 * value — follow each endpoint's casing exactly, it is inconsistent per route.
 *
 * The query never throws: on failure it resolves to an EMPTY payload with
 * `ok:false` so the page can show an honest "couldn't load" hint without
 * blanking unrelated surfaces (e.g. the Settings profile page also reads this).
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

export type IntegrationStatus = "healthy" | "degraded" | "disconnected";

/** Keys returned by the backend today. Other keys render generically. */
export type IntegrationKey =
  | "meta"
  | "google"
  | "linkedin"
  | "email"
  | "higgsfield"
  | "brand_memory";

export interface Integration {
  key: string;
  label: string;
  connected: boolean;
  status: IntegrationStatus;
  detail?: string;
}

export interface IntegrationsResponse {
  ok: boolean;
  integrations: Integration[];
  connected_count: number;
  recommended_action?: string | null;
}

const EMPTY: IntegrationsResponse = {
  ok: false,
  integrations: [],
  connected_count: 0,
  recommended_action: null,
};

export function useIntegrations(businessId: string | undefined) {
  return useQuery<IntegrationsResponse>({
    queryKey: ["integrations", businessId],
    enabled: !!businessId,
    staleTime: 30_000,
    queryFn: () =>
      api
        .get<IntegrationsResponse>(`/api/business/${businessId}/integrations`)
        .catch(() => EMPTY),
  });
}
