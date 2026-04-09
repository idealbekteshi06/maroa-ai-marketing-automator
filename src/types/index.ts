export interface BusinessProfile {
  user_id: string;
  business_name: string;
  business_type: string;
  business_description?: string;
  business_stage?: string;
  usp?: string;
  tagline?: string;
  brand_values?: string[];
  physical_locations?: { city: string; neighborhood?: string; country?: string }[];
  country?: string;
  operation_model?: string;
  service_area?: string;
  ad_targeting_area?: string[];
  primary_language: string;
  audience_age_min?: number;
  audience_age_max?: number;
  audience_gender?: string;
  audience_description?: string;
  pain_points?: string[];
  desired_outcome?: string;
  customer_language?: string;
  objections?: string[];
  products?: Product[];
  current_offer?: string;
  seasonal_offers?: string;
  primary_goal?: string;
  secondary_goal?: string;
  monthly_budget?: string;
  tone_keywords?: string[];
  brand_personality?: string[];
  words_always_use?: string[];
  words_never_use?: string[];
  emoji_usage?: string;
  competitors?: Competitor[];
  busiest_days?: string[];
  quietest_days?: string[];
  business_hours?: Record<string, { open: string; close: string }>;
  website_url?: string;
  booking_link?: string;
  profile_score?: number;
  plan?: string;
  email?: string;
}

export interface Product {
  name: string;
  price?: string;
  description?: string;
  is_bestseller?: boolean;
  category?: string;
}

export interface Competitor {
  name: string;
  city?: string;
  social?: string;
}

export interface MarketingIdea {
  id?: string;
  idea: string;
  category: string;
  priority: "high" | "medium" | "low";
  estimated_impact?: string;
  how_to_execute?: string;
  budget_required?: string;
  time_to_results?: string;
  status?: "new" | "in_progress" | "completed";
  created_at?: string;
}

export interface OrchestrationLog {
  id?: string;
  user_id: string;
  task: string;
  success: boolean;
  reason?: string;
  result?: string;
  created_at: string;
}

export interface IntelligenceSignal {
  key: string;
  value: string;
  type: string;
  updated: string;
}

export interface HealthScore {
  total: number;
  profile_score?: number;
  posting_score?: number;
  variety_score?: number;
  engagement_score?: number;
  competitive_score?: number;
  recommendations?: string[];
}

export interface Opportunity {
  type: string;
  priority: "urgent" | "high" | "medium" | "low";
  title: string;
  action: string;
}

export interface Campaign {
  theme?: string;
  campaign_name?: string;
  summary?: string;
  schedule?: ScheduleItem[];
  emails?: EmailItem[];
  ad_copy?: AdCopy[];
}

export interface ScheduleItem {
  day: number;
  title: string;
  description: string;
  channel: string;
}

export interface EmailItem {
  subject: string;
  preview: string;
  send_day: number;
}

export interface AdCopy {
  headline: string;
  description: string;
  cta: string;
  platform: string;
}
