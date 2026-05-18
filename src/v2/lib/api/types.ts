/**
 * Maroa shared API types — partial mirror of §10.4 tables.
 * Full table coverage is added incrementally per module.
 */
export type Plan = "free" | "starter" | "growth" | "agency";
export type BusinessStatus = "active" | "paused" | "archived";

export interface Business {
  id: string;
  user_id: string;
  name: string | null;
  business_name: string | null;
  plan: Plan;
  status: BusinessStatus;
  autopilot_enabled: boolean;
  monthly_budget: number | null;
  primary_goal: string | null;
  onboarding_step: number | null;
  weekly_forecast: unknown;
  created_at: string;
}

export interface HealthScore {
  score: number; // 0–100
  dimensions?: Record<string, number>;
  updated_at?: string;
}

export interface PerformanceSummary {
  revenue_30d: number;
  revenue_delta_7d?: number;
  pipeline_value?: number;
  active_campaigns?: number;
  sparkline?: number[];
}

export interface DashboardEvent {
  id: string;
  business_id: string;
  event_type: string;
  title: string;
  narrative?: string;
  created_at: string;
  action?: { label: string; href: string } | null;
}

export interface Opportunity {
  id: string;
  title: string;
  why: string;
  expected_impact?: string;
  href?: string;
}
