import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, RefreshCw } from "lucide-react";
import { apiGet, createAbortController } from "@/lib/apiClient";
import { SUCCESS_MESSAGES } from "@/lib/errorMessages";

interface CategoryScore {
  label: string;
  score: number;
  max: number;
  tips: string[];
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

const defaultCategories: CategoryScore[] = [
  {
    label: "Profile Completeness",
    score: 0,
    max: 20,
    tips: ["Add your business logo and cover photo", "Complete all business information fields", "Connect all social media accounts"],
  },
  {
    label: "Posting Consistency",
    score: 0,
    max: 20,
    tips: ["Enable autopilot to post consistently", "Maintain at least 3 posts per week", "Use the content calendar to plan ahead"],
  },
  {
    label: "Content Variety",
    score: 0,
    max: 20,
    tips: ["Mix images, videos, and carousels", "Include educational and promotional content", "Try different content themes each week"],
  },
  {
    label: "Engagement Tracking",
    score: 0,
    max: 20,
    tips: ["Respond to comments within 24 hours", "Track engagement rate weekly", "Set up review request automation"],
  },
  {
    label: "Competitive Position",
    score: 0,
    max: 20,
    tips: ["Add at least 3 competitors to track", "Review competitor insights weekly", "Apply AI recommendations from competitor analysis"],
  },
];

export default function DashboardHealth() {
  const { businessId, isReady } = useAuth();
  const [score, setScore] = useState(0);
  const [categories, setCategories] = useState<CategoryScore[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = useCallback(async (signal?: AbortSignal): Promise<void> => {
    if (!businessId || !isReady) { setLoading(false); return; }
    try {
      const data = await apiGet<Record<string, unknown>>(`/api/health/${businessId}`, signal);

      const totalScore = data.score ?? data.total_score ?? 0;
      setScore(totalScore);

      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories.map((c: Record<string, unknown>, i: number) => ({
          label: (c.label as string) || (c.name as string) || defaultCategories[i]?.label || `Category ${i + 1}`,
          score: (c.score as number) ?? 0,
          max: (c.max as number) ?? 20,
          tips: (c.tips as string[]) || (c.recommendations as string[]) || defaultCategories[i]?.tips || [],
        })));
      } else {
        // Calculate score from available data
        const cats = defaultCategories.map((cat) => {
          const catScore = data[cat.label.toLowerCase().replace(/\s+/g, "_")] ?? cat.score;
          return { ...cat, score: catScore };
        });
        setCategories(cats);
        if (!totalScore) {
          setScore(cats.reduce((sum, c) => sum + c.score, 0));
        }
      }
    } catch {
      // Fallback to demo health data
      try {
        const { DEMO_HEALTH } = await import("@/lib/demoData");
        setScore(DEMO_HEALTH.score);
        setCategories(DEMO_HEALTH.categories.map(c => ({ label: c.name, score: c.score, max: c.max, tips: [c.tip] })));
      } catch {
        setScore(defaultCategories.reduce((sum, c) => sum + c.score, 0));
      }
    } finally {
      setLoading(false);
    }
  }, [businessId, isReady]);

  useEffect(() => {
    const controller = createAbortController();
    void fetchHealth(controller.signal);
    return () => controller.abort();
  }, [fetchHealth]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHealth();
    setRefreshing(false);
    toast.success(SUCCESS_MESSAGES.GENERATED);
  };

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  // SVG circle math
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

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
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

      {/* Circular Score */}
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="relative inline-flex items-center justify-center">
          <svg width="200" height="200" className="-rotate-90">
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="12"
            />
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

      {/* Category Bars */}
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
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {cat.tips.length > 0 && (
                <div className="mt-3 space-y-1">
                  {cat.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[11px] text-muted-foreground mt-0.5 shrink-0">-</span>
                      <p className="text-[11px] text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Score Meaning */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">What Your Score Means</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { range: "0 - 40", label: "Needs urgent attention", color: "bg-destructive", textColor: "text-destructive" },
            { range: "41 - 70", label: "Good start", color: "bg-warning", textColor: "text-warning" },
            { range: "71 - 90", label: "Strong foundation", color: "bg-success", textColor: "text-success" },
            { range: "91 - 100", label: "Elite performance", color: "bg-primary", textColor: "text-primary" },
          ].map((tier) => (
            <div
              key={tier.range}
              className={`flex items-center gap-3 rounded-lg p-3 ${score >= parseInt(tier.range) && score <= parseInt(tier.range.split(" - ")[1] || "100") ? "border border-border bg-muted/50" : ""}`}
            >
              <span className={`h-3 w-3 rounded-full ${tier.color} shrink-0`} />
              <div>
                <p className={`text-xs font-semibold ${tier.textColor}`}>{tier.range}</p>
                <p className="text-[11px] text-muted-foreground">{tier.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
