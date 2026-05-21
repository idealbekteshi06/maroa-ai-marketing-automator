import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { wf8GenerateReport, wf8LatestReport } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Heart, Star, MessageSquare, TrendingUp, Brain, Target,
} from "lucide-react";
import Sparkline from "@/components/Sparkline";

type InsightReport = {
  personas?: Array<{ name?: string; role?: string; description?: string; needs?: string[]; avatar?: string }>;
  personas_detected?: Array<{ name?: string; role?: string; description?: string; needs?: string[] }>;
  pain_points?: Array<{ theme?: string; quote?: string; source?: string } | string>;
  delight_moments?: Array<{ quote?: string; source?: string } | string>;
  action_items?: Array<{ title?: string; priority?: string } | string>;
  top_themes?: Array<{ theme?: string; count?: number } | string>;
};

const sentimentBadge = {
  positive: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  neutral: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  negative: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

export default function CustomerInsights() {
  const { businessId, isReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedPersona, setExpandedPersona] = useState<number | null>(null);
  const [report, setReport] = useState<InsightReport | null>(null);

  const load = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const row = (await wf8LatestReport(businessId)) as InsightReport | null;
      setReport(row);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);

  const generate = async () => {
    if (!businessId) {
      toast.error("Connect your business first");
      return;
    }
    setGenerating(true);
    try {
      const result = await wf8GenerateReport({ businessId });
      setReport(result as InsightReport);
      toast.success("Insight report generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Report failed");
    } finally {
      setGenerating(false);
    }
  };

  const personas = (report?.personas_detected || report?.personas || []).map((p, i) => ({
    name: p.name || `Persona ${i + 1}`,
    role: p.role || "Customer segment",
    avatar: p.avatar || "👤",
    description: p.description || "",
    needs: p.needs || [],
  }));

  const insights = [
    ...(report?.delight_moments || []).slice(0, 3).map((d) => {
      const item = typeof d === "string" ? { quote: d } : d;
      return { quote: item.quote || String(d), source: item.source || "Customer voice", sentiment: "positive" as const };
    }),
    ...(report?.pain_points || []).slice(0, 3).map((p) => {
      const item = typeof p === "string" ? { quote: p } : p;
      return { quote: item.quote || item.theme || String(p), source: item.source || "Pain point", sentiment: "negative" as const };
    }),
  ];

  const themes = (report?.top_themes || []).slice(0, 4).map((t, i) => {
    const theme = typeof t === "string" ? t : t.theme || "Theme";
    const count = typeof t === "object" && t.count != null ? t.count : 10 + i * 3;
    return {
      label: theme,
      count,
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      ltv: 0,
      sparkline: [count, count - 1, count, count + 1, count],
    };
  });

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading customer insights…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button onClick={generate} disabled={generating || !businessId}>
          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Generate insight report
        </Button>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">AI-Generated Customer Personas</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {report ? "From your latest VOC and inbox analysis." : "Generate a report to detect personas from real customer language."}
        </p>

        {personas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No personas yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {personas.map((p, i) => (
              <Card
                key={i}
                className={`cursor-pointer transition-shadow hover:shadow-md ${expandedPersona === i ? "ring-2 ring-primary" : ""}`}
                onClick={() => setExpandedPersona(expandedPersona === i ? null : i)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{p.avatar}</span>
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <CardDescription>{p.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  {p.description && <p>{p.description}</p>}
                  {p.needs.length > 0 && (
                    <div>
                      <span className="font-medium text-foreground text-xs uppercase tracking-wider">Top Needs</span>
                      <ul className="mt-1 space-y-1">
                        {p.needs.map((n, j) => (
                          <li key={j} className="flex items-center gap-1.5">
                            <Target className="h-3 w-3 text-primary shrink-0" />
                            {n}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {themes.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Top Themes</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {themes.map((s, i) => {
              const Icon = s.icon;
              return (
                <Card key={i}>
                  <CardContent className="pt-5 pb-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${s.bgColor}`}>
                        <Icon className={`h-5 w-5 ${s.color}`} />
                      </div>
                      <Sparkline data={s.sparkline} width={64} height={28} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{s.count}</p>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-1">
          <Heart className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">What Your Customers Want</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Pain points and delight moments from reviews and messages.
        </p>

        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quotes in the latest report.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.map((ins, i) => (
              <Card key={i}>
                <CardContent className="pt-5 space-y-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <blockquote className="text-sm italic text-foreground leading-relaxed">
                    &ldquo;{ins.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{ins.source}</span>
                    <Badge variant="outline" className={sentimentBadge[ins.sentiment]}>
                      {ins.sentiment}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {(report?.action_items?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Recommended Actions</h2>
          </div>
          <ul className="space-y-2">
            {(report?.action_items || []).map((item, i) => (
              <li key={i} className="text-sm text-foreground border border-border rounded-lg px-4 py-3">
                {typeof item === "string" ? item : item.title || JSON.stringify(item)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
