/**
 * Consolidated TanStack Query hooks for every module §3.2 / §10.3.
 * Endpoint paths follow §10.3; where the exact path isn't enumerated we use the
 * closest documented endpoint and mark TODO(backend).
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

type Id = string | undefined;

const q =
  <T,>(key: unknown[], path: string, enabled: boolean, query?: Record<string, string | number | undefined>) =>
  () =>
    useQuery<T>({
      queryKey: key,
      enabled,
      staleTime: 30_000,
      queryFn: () => api.get<T>(path, query),
    });

// Inbox / Notifications
export const useInbox = (bid: Id) =>
  useQuery({ queryKey: ["inbox", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/inbox/${bid}`).catch(() => []) });
export const useNotifications = (bid: Id) =>
  useQuery({ queryKey: ["notifications", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/notifications/${bid}`).catch(() => []) });

// Content / Calendar / Library / Brand / Video
export const useContent = (bid: Id) =>
  useQuery({ queryKey: ["content", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/content/${bid}`).catch(() => []) });
export const useContentItem = (bid: Id, id: Id) =>
  useQuery({ queryKey: ["content-item", bid, id], enabled: !!bid && !!id, queryFn: () => api.get<any>(`/api/content/${bid}/${id}`).catch(() => null) });
export const useCalendar = (bid: Id, month?: number, year?: number) =>
  useQuery({ queryKey: ["calendar", bid, month, year], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/calendar/${bid}`, { month, year }).catch(() => []) });
export const useLibrary = (bid: Id) =>
  useQuery({ queryKey: ["library", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/library/${bid}`).catch(() => []) });
export const useBrandDna = (bid: Id) =>
  useQuery({ queryKey: ["brand-dna", bid], enabled: !!bid, queryFn: () => api.get<any>(`/api/business/${bid}/brand-dna`).catch(() => null) });
export const useVideoJobs = (bid: Id) =>
  useQuery({ queryKey: ["videos", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/videos/${bid}`).catch(() => []) });

// Growth
export const useAds = (bid: Id) =>
  useQuery({ queryKey: ["ads", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/ads/${bid}`).catch(() => []) });
export const useCampaign = (bid: Id, id: Id) =>
  useQuery({ queryKey: ["campaign", bid, id], enabled: !!bid && !!id, queryFn: () => api.get<any>(`/api/ads/${bid}/${id}`).catch(() => null) });
export const useSeo = (bid: Id) =>
  useQuery({ queryKey: ["seo", bid], enabled: !!bid, queryFn: () => api.get<any>(`/api/seo/${bid}`).catch(() => null) });
export const useCro = (bid: Id) =>
  useQuery({ queryKey: ["cro", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/cro/${bid}`).catch(() => []) });
export const useLandingPages = (bid: Id) =>
  useQuery({ queryKey: ["landing-pages", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/landing-pages/${bid}`).catch(() => []) });
export const useLandingPage = (bid: Id, id: Id) =>
  useQuery({ queryKey: ["landing-page", bid, id], enabled: !!bid && !!id, queryFn: () => api.get<any>(`/api/landing-pages/${bid}/${id}`).catch(() => null) });
export const useLeadMagnets = (bid: Id) =>
  useQuery({ queryKey: ["lead-magnets", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/lead-magnets/${bid}`).catch(() => []) });
export const useReferrals = (bid: Id) =>
  useQuery({ queryKey: ["referrals", bid], enabled: !!bid, queryFn: () => api.get<any>(`/api/referrals/${bid}`).catch(() => null) });

// Audience
export const useContacts = (bid: Id) =>
  useQuery({ queryKey: ["contacts", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/contacts/${bid}`).catch(() => []) });
export const useContact = (bid: Id, id: Id) =>
  useQuery({ queryKey: ["contact", bid, id], enabled: !!bid && !!id, queryFn: () => api.get<any>(`/api/contacts/${bid}/${id}`).catch(() => null) });
export const usePipeline = (bid: Id) =>
  useQuery({ queryKey: ["pipeline", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/pipeline/${bid}`).catch(() => []) });
export const useSequences = (bid: Id) =>
  useQuery({ queryKey: ["sequences", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/email/sequences/${bid}`).catch(() => []) });
export const useSequence = (bid: Id, id: Id) =>
  useQuery({ queryKey: ["sequence", bid, id], enabled: !!bid && !!id, queryFn: () => api.get<any>(`/api/email/sequences/${bid}/${id}`).catch(() => null) });
export const useReviews = (bid: Id) =>
  useQuery({ queryKey: ["reviews", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/reviews/${bid}`).catch(() => []) });

// Intelligence
export const useAnalytics = (bid: Id, range = "30d") =>
  useQuery({ queryKey: ["analytics", bid, range], enabled: !!bid, queryFn: () => api.get<any>(`/api/analytics/${bid}`, { range }).catch(() => null) });
export const useCompetitors = (bid: Id) =>
  useQuery({ queryKey: ["competitors", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/competitors/${bid}`).catch(() => []) });
export const useForecast = (bid: Id) =>
  useQuery({ queryKey: ["forecast", bid], enabled: !!bid, queryFn: () => api.get<any>(`/api/forecast/${bid}`).catch(() => null) });
export const useAiBrain = (bid: Id) =>
  useQuery({ queryKey: ["ai-brain", bid], enabled: !!bid, queryFn: () => api.get<any>(`/api/ai-brain/${bid}`).catch(() => null) });
export const useStrategy = (bid: Id) =>
  useQuery({ queryKey: ["strategy", bid], enabled: !!bid, queryFn: () => api.get<any>(`/api/strategy/${bid}`).catch(() => null) });

// Platform
export const useIntegrations = (bid: Id) =>
  useQuery({ queryKey: ["integrations", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/integrations/${bid}`).catch(() => []) });
export const useTeam = (bid: Id) =>
  useQuery({ queryKey: ["team", bid], enabled: !!bid, queryFn: () => api.get<any[]>(`/api/team/${bid}`).catch(() => []) });
export const useBilling = (uid: Id) =>
  useQuery({ queryKey: ["billing", uid], enabled: !!uid, queryFn: () => api.get<any>(`/api/billing/${uid}`).catch(() => null) });
export const useSettings = (bid: Id) =>
  useQuery({ queryKey: ["settings", bid], enabled: !!bid, queryFn: () => api.get<any>(`/api/settings/${bid}`).catch(() => null) });
