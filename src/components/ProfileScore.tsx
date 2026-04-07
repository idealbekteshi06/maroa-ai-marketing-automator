import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_API_BASE as string;

interface ScoreData {
  score: number;
  unlocked: string[];
  locked: string[];
  next_unlock: string | null;
  missing_for_next: string[];
  thresholds: Record<string, { required: number; unlocked: boolean }>;
}

const featureLabels: Record<string, string> = {
  social_posts: "Social Posts",
  email_sms: "Email & SMS",
  paid_ads: "Paid Ads",
  full_autopilot: "Full Autopilot",
  premium_accuracy: "Premium Accuracy",
};

export default function ProfileScore({ compact }: { compact?: boolean }) {
  const { businessId } = useAuth();
  const [data, setData] = useState<ScoreData | null>(null);

  useEffect(() => {
    if (!businessId || !API_BASE) return;
    fetch(`${API_BASE}/api/onboarding/score/${businessId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, [businessId]);

  if (!data) return null;

  const circumference = 2 * Math.PI * 20;
  const filled = (data.score / 100) * circumference;
  const scoreColor = data.score >= 90 ? "text-success" : data.score >= 50 ? "text-primary" : "text-warning";

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
        <svg width="28" height="28" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="20" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
          <circle cx="22" cy="22" r="20" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference - filled}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">{data.score}% complete</p>
          {data.next_unlock && <p className="text-[10px] text-muted-foreground">Next: {featureLabels[data.next_unlock]}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
            <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 24} strokeDashoffset={(2 * Math.PI * 24) * (1 - data.score / 100)}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }} />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${scoreColor}`}>{data.score}%</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Profile Completeness</h3>
          <p className="text-xs text-muted-foreground">{data.score >= 90 ? "Fully optimized!" : `Complete more to unlock features`}</p>
        </div>
      </div>
      <div className="space-y-2">
        {Object.entries(data.thresholds).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {val.unlocked ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
              <span className={`text-xs ${val.unlocked ? "text-foreground" : "text-muted-foreground"}`}>{featureLabels[key] || key}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{val.required}%</span>
          </div>
        ))}
      </div>
      {data.score < 100 && (
        <Button size="sm" variant="outline" className="w-full mt-4 h-8 text-xs" onClick={() => window.dispatchEvent(new CustomEvent("dashboard-navigate", { detail: "settings" }))}>
          Complete Profile <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
