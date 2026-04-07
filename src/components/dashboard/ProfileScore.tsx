import { useState, useEffect } from "react";
import { CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileScoreProps {
  businessId: string;
  userId?: string;
}

interface ScoreData {
  score: number;
  unlocked: string[];
  locked: string[];
  next_unlock: string | null;
  missing_for_next: string[];
  thresholds: Record<string, { required: number; unlocked: boolean }>;
}

const featureLabels: Record<string, string> = {
  social_posts: "Social Media Posts",
  email_sms: "Email & SMS Campaigns",
  paid_ads: "Paid Advertising",
  full_autopilot: "Full Autopilot",
  premium_accuracy: "Premium Accuracy",
};

export default function ProfileScore({ businessId, userId }: ProfileScoreProps) {
  const [data, setData] = useState<ScoreData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    fetch(`https://maroa-api-production.up.railway.app/api/onboarding/score/${userId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, [userId]);

  if (!data || data.score === 0) return null;

  const pct = data.score;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-meta">
      <div className="flex items-center gap-4">
        {/* Circular progress */}
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-primary" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.5s ease" }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">{pct}%</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Profile Completeness</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data.next_unlock
              ? `Complete ${(data.thresholds[data.next_unlock]?.required || 0) - pct}% more to unlock ${featureLabels[data.next_unlock] || data.next_unlock}`
              : "All features unlocked!"}
          </p>
        </div>
      </div>

      {/* Feature list */}
      <div className="mt-3 space-y-1.5">
        {Object.entries(data.thresholds).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            {val.unlocked ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className={val.unlocked ? "text-foreground" : "text-muted-foreground"}>
              {featureLabels[key] || key}
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground">{val.required}%</span>
          </div>
        ))}
      </div>

      {data.score < 100 && (
        <button
          onClick={() => navigate("/onboarding")}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          Complete Profile <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
