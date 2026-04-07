import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE as string;

interface Props {
  featureType: "social_posts" | "email_sms" | "paid_ads" | "full_autopilot";
  className?: string;
}

const thresholds: Record<string, number> = {
  social_posts: 30,
  email_sms: 50,
  paid_ads: 70,
  full_autopilot: 90,
};

const featureNames: Record<string, string> = {
  social_posts: "social post",
  email_sms: "email",
  paid_ads: "ad campaign",
  full_autopilot: "autopilot",
};

export default function ProfileIncompleteWarning({ featureType, className }: Props) {
  const { businessId } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const required = thresholds[featureType] || 30;

  useEffect(() => {
    if (!businessId || !API_BASE) return;
    fetch(`${API_BASE}/api/onboarding/score/${businessId}`)
      .then(r => r.json())
      .then(d => setScore(d.score ?? 0))
      .catch(() => setScore(0));
  }, [businessId]);

  if (score === null || score >= required) return null;

  return (
    <div className={`flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3 ${className || ""}`}>
      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-medium text-foreground">
          Profile {score}% complete — {required}% needed for accurate {featureNames[featureType]} results
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("dashboard-navigate", { detail: "settings" }))}
          className="text-xs text-primary hover:underline mt-0.5"
        >
          Complete your profile →
        </button>
      </div>
    </div>
  );
}
