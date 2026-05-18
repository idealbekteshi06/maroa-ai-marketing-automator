import { useQuery } from "@tanstack/react-query";
import { api } from "../client";
import type {
  HealthScore,
  PerformanceSummary,
  DashboardEvent,
  Opportunity,
} from "../types";

export function useHealth(userId: string | undefined) {
  return useQuery({
    queryKey: ["health", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: () => api.get<HealthScore>(`/api/health/${userId}`),
  });
}

export function usePerformanceSummary(userId: string | undefined) {
  return useQuery({
    queryKey: ["performance-summary", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: () => api.get<PerformanceSummary>(`/api/performance/summary/${userId}`),
  });
}

export function useDashboardEvents(businessId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard-events", businessId],
    enabled: !!businessId,
    staleTime: 15_000,
    queryFn: () =>
      api.get<DashboardEvent[]>(`/webhook/dashboard-events`, { business_id: businessId }),
  });
}

export function useOpportunities(userId: string | undefined) {
  return useQuery({
    queryKey: ["opportunities", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: () => api.get<Opportunity[]>(`/api/opportunities/${userId}`),
  });
}
