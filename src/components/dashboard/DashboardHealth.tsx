import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, RefreshCw } from "lucide-react";
import { apiGet, createAbortController } from "@/lib/apiClient";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

interface CategoryScore {
  label: string;
  score: number;
  max: number;
  tips: string[];
}

interface HealthApiResponse {
  total?: number;
  profile?: number;
  posting?: number;
  variety?: number;
  engagement?: number;
  competitive?: number;
  recommendations?: string[];
}

function getScoreColor(score: number): string {
  if (score <= 40) return "#EF4444";
  if (score <= 70) return "#F59E0B";
  return "#22C55E";
}

function getScoreLabel(score: number): { title: string; description: string } {
  if (score <= 40) return { title: "Needs Urgent Attention", description: "Your marketing has significant gaps. Focus on the red categories below to improve quickly." };
  if (score <= 70) return { title: "Good Start", description: "You have a solid foundation. Address the medium-priority items to level up your marketing." };
  if (score <= 90) return { title: "Strong Foundation", description: "Your marketing is performing well. Fine-tune the remaining areas for maximum impact." };
  return { title: "Elite Performance", description: "Outstanding! Your marketing machine is running at peak efficiency." };
}

function getCategoryColor(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct <= 40) return "bg-destructive";
  if (pct <= 70) return "bg-warning";
  return "bg-success";
}

const CATEGORY_DEFS: { key: keyof HealthApiResponse; label: string; max: number }[] = [
  { key: "profile", label: "Profile Completeness", max: 20 },
  { key: "posting", label: "Posting Consistency", max: 20 },
  { key: "variety", label: "Content Variety", max: 20 },
  { key: "engagement", label: "Engagement Tracking", max: 20 },
  { key: "competitive", label: "Competitive Position", max: 20 },
];

export default function DashboardHealth() {
  const { user, isReady } = useAuth();
  const [score, setScore] = useState(0);
  const [categories, setCategories] = useState<CategoryScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchHealth = useCallback(async (signal?: AbortSignal): Promise<void> => {
    if (!user?.id || !isReady) {
      setLoading(false);
      return;
    }
    setLoadError(null);
    try {
      const data = await apiGet<HealthApiResponse>(`/api/health/${user.id}`, signal);
      const totalScore = data.total ?? 0;
      setScore(totalScore);
      const recs = data.recommendations ?? [];
      setCategories(
        CATEGORY_DEFS.map((def, i) => ({
          label: def.label,
          score: (data[def.key] as number) ?? 0,
          max: def.max,
          tips: recs[i] ? [recs[i]] : [],
        })),
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setLoadError(ERROR_MESSAGES.LOAD_FAILED);
      setScore(0);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isReady]);

  useEffect(() => {
    const controller = createAbortController();
    void fetchHealth(controller.signal);
    return () => controller.abort();
  }, [fetchHealth]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHealth();
    setRefreshing(false);
    if (!loadError) toast.success(SUCCESS_MESSAGES.GENERATED);
  };

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-14 rounded-lg skeleton" />
        <div className="flex justify-center"><div className="h-52 w-52 rounded-full skeleton" /></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 rounded-lg skeleton" />)}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => void fetchHealth()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 page-enter">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Marketing Health Score</h2>
            <p className="text-xs text-muted-foreground">How well-optimized is your marketing</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
          Refresh Score
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="relative inline-flex items-center justify-center">
          <svg width="200" height="200" className="-rotate-90">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="12" />
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{score}</span>
            <span className="text-xs text-muted-foreground mt-1">/ 100</span>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold text-foreground">{scoreLabel.title}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">{scoreLabel.description}</p>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const pct = cat.max > 0 ? Math.round((cat.score / cat.max) * 100) : 0;
          const barColor = getCategoryColor(cat.score, cat.max);
          return (
            <div key={cat.label} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-foreground">{cat.label}</h4>
                <span className="text-sm font-bold text-foreground">{cat.score}/{cat.max}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                <div className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
              </div>
              {cat.tips.length > 0 && (
                <div className="mt-3 space-y-1">
                  {cat.tips.map((tip, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground">{tip}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
