import { useQuery } from "@tanstack/react-query";
import { api } from "../client";
import type { Business } from "../types";

/**
 * TODO(backend): no GET /api/businesses endpoint listed in §10.3.
 * Using /api/context/:userId as the closest source until backend adds one.
 */
interface ContextResponse {
  business?: Business;
  businesses?: Business[];
}

export function useBusinesses(userId: string | undefined) {
  return useQuery({
    queryKey: ["businesses", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const ctx = await api.get<ContextResponse>(`/api/context/${userId}`);
      return ctx.businesses ?? (ctx.business ? [ctx.business] : []);
    },
  });
}

export function useCurrentBusiness(userId: string | undefined) {
  const q = useBusinesses(userId);
  return { ...q, business: q.data?.[0] ?? null };
}
