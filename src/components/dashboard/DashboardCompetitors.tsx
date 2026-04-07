import { useEffect, useState, useCallback, useRef } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Target, Loader2, Trophy, Lightbulb, Compass, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Insight {
  id: string; competitor_doing_well: string | null; gap_opportunity: string | null;
  content_to_steal: string | null; positioning_tip: string | null; recorded_at: string;
  recommendation?: string | null;
}

function timeAgo(d: string) {
  if (!d) return "—";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  const days = Math.floor(s / 86400);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

function formatBullets(text: string | null): string[] {
  if (!text) return [];
  return text.split(";").map(s => s.trim()).filter(s => s.length > 0);
}

export default function DashboardCompetitors() {
  const { businessId, isReady } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState("");
  const [competitors, setCompetitors] = useState<{ name: string; website?: string }[]>([]);
  const [expandedCounter, setExpandedCounter] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [howOpen, setHowOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const fetchInsights = useCallback(async () => {
    if (!businessId || !isReady) return;
    setLoading(true);
    const [insRes, bizRes] = await Promise.all([
      externalSupabase.from("competitor_insights").select("*").eq("business_id", businessId).order("recorded_at", { ascending: false }).limit(10),
      externalSupabase.from("businesses").select("competitors").eq("id", businessId).maybeSingle(),
    ]);
    setInsights((insRes.data as Insight[]) ?? []);
    // Parse competitors
    try {
      const raw = bizRes.data?.competitors;
      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCompetitors(parsed.map((c: any) => typeof c === "string" ? { name: c } : c));
        else setCompetitors(raw.split(",").map((n: string) => ({ name: n.trim() })));
      } else if (Array.isArray(raw)) {
        setCompetitors(raw.map((c: any) => typeof c === "string" ? { name: c } : c));
      } else {
        setCompetitors([]);
      }
    } catch { setCompetitors([]); }
    setLoading(false);
  }, [businessId, isReady]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  const handleAnalyze = async () => {
    if (!businessId) return;
    setAnalyzing(true);
    const msgs = ["Reading competitor websites...", "Analyzing content strategy...", "Finding your advantage...", "Writing counter strategy..."];
    let msgIdx = 0;
    setAnalyzeMsg(msgs[0]);
    const msgTimer = setInterval(() => { msgIdx = (msgIdx + 1) % msgs.length; setAnalyzeMsg(msgs[msgIdx]); }, 4000);

    try {
      toast("🎯 AI is analyzing competitors...");
      await fetch("https://maroa-api-production.up.railway.app/webhook/competitor-check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });
      // Poll for new results
      const startCount = insights.length;
      let elapsed = 0;
      pollRef.current = setInterval(async () => {
        elapsed += 5000;
        const { data } = await externalSupabase.from("competitor_insights").select("id").eq("business_id", businessId);
        if ((data?.length ?? 0) > startCount) {
          clearInterval(pollRef.current);
          clearInterval(msgTimer);
          toast.success("✓ Analysis complete!");
          setAnalyzing(false);
          fetchInsights();
          return;
        }
        if (elapsed >= 90000) {
          clearInterval(pollRef.current);
          clearInterval(msgTimer);
          toast("Analysis running in background — check back soon");
          setAnalyzing(false);
        }
      }, 5000);
    } catch {
      clearInterval(msgTimer);
      toast.error("Analysis failed — try again");
      setAnalyzing(false);
    }
  };

  useEffect(() => () => { clearInterval(pollRef.current); }, []);

  const latest = insights[0];
  const history = insights.slice(1, 6);
  const navTo = (tab: string) => window.dispatchEvent(new CustomEvent("dashboard-navigate", { detail: tab }));

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-lg skeleton" />)}</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <Button size="sm" className="h-9 text-xs" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Analyzing...</> : "Run Analysis"}
        </Button>
      </div>

      {analyzing && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium text-primary">{analyzeMsg}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">This takes about 60 seconds</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {insights.length === 0 && competitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12 px-6 text-center">
          <Target className="h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Start monitoring your competitors</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">Add competitor websites in Settings. AI analyzes them every Sunday and alerts you to changes.</p>
          <Button size="sm" className="mt-4" onClick={() => navTo("settings")}>Add Competitors in Settings</Button>
        </div>
      ) : (
        <>
          {/* Latest report */}
          {latest && (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground">Latest Intelligence Report</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">🕐 Updated {timeAgo(latest.recorded_at)}</span>
                  <span className="text-[11px] text-muted-foreground">• Next: Sunday</span>
                </div>
              </div>
              <div className="grid gap-0 sm:grid-cols-2">
                {[
                  { icon: Target, color: "text-primary", label: "YOUR GAP OPPORTUNITY", value: latest.gap_opportunity },
                  { icon: Compass, color: "text-primary", label: "YOUR COUNTER MOVE", value: latest.positioning_tip },
                  { icon: Trophy, color: "text-warning", label: "WHAT THEY DO WELL", value: latest.competitor_doing_well },
                  { icon: Lightbulb, color: "text-warning", label: "CONTENT IDEAS", value: latest.content_to_steal },
                ].filter(s => s.value).map((s, i) => {
                  const isCounterMove = s.label === "YOUR COUNTER MOVE";
                  const bullets = !isCounterMove ? formatBullets(s.value!) : [];
                  const text = isCounterMove ? s.value! : "";
                  const preview = text.slice(0, 180);
                  const hasMore = text.length > 180;

                  return (
                    <div key={i} className="p-5 border-b border-r border-border last:border-0 [&:nth-child(2)]:border-r-0 [&:nth-child(4)]:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                      </div>
                      {bullets.length > 0 ? (
                        <ul className="space-y-1.5">
                          {bullets.slice(0, expandedCounter ? undefined : 4).map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-[13px] text-foreground leading-relaxed">
                              <span className="text-primary mt-0.5 shrink-0">→</span><span>{item}</span>
                            </li>
                          ))}
                          {bullets.length > 4 && (
                            <button onClick={() => setExpandedCounter(!expandedCounter)} className="text-[11px] text-primary hover:underline">
                              {expandedCounter ? "← Show less" : `+ ${bullets.length - 4} more`}
                            </button>
                          )}
                        </ul>
                      ) : (
                        <div>
                          <p className="text-[13px] text-foreground leading-relaxed">
                            {expandedCounter || !hasMore ? text : preview + "..."}
                          </p>
                          {hasMore && (
                            <button onClick={() => setExpandedCounter(!expandedCounter)} className="text-[11px] text-primary hover:underline mt-1">
                              {expandedCounter ? "← Show less" : "Read more →"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Competitors being monitored */}
          {competitors.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Competitors Being Monitored</h3>
              <div className="space-y-2">
                {competitors.map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      {c.website && (
                        <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline flex items-center gap-1">
                          {c.website.replace(/^https?:\/\//, "").slice(0, 30)}<ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">Monitored weekly ✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous Analyses */}
          {history.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Previous Analyses</h3>
              <div className="space-y-2">
                {history.map(ins => (
                  <div key={ins.id} className="rounded-lg border border-border bg-card overflow-hidden">
                    <button
                      onClick={() => setExpandedHistory(expandedHistory === ins.id ? null : ins.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-medium text-foreground shrink-0">
                          {new Date(ins.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {(ins.gap_opportunity || ins.positioning_tip || "Analysis")?.slice(0, 80)}...
                        </span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${expandedHistory === ins.id ? "rotate-180" : ""}`} />
                    </button>
                    {expandedHistory === ins.id && (
                      <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                        {ins.gap_opportunity && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Gap Opportunity</p>
                            <ul className="space-y-1">{formatBullets(ins.gap_opportunity).map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-foreground"><span className="text-primary">→</span>{b}</li>
                            ))}</ul>
                          </div>
                        )}
                        {ins.positioning_tip && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Counter Move</p>
                            <p className="text-xs text-foreground leading-relaxed">{ins.positioning_tip}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* How This Works — collapsed by default */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <button onClick={() => setHowOpen(!howOpen)} className="flex w-full items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
          <span className="text-sm font-semibold text-foreground">How does this work?</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${howOpen ? "rotate-180" : ""}`} />
        </button>
        {howOpen && (
          <div className="px-5 pb-4 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every Sunday, your AI reads competitor websites, analyzes their content and offers, identifies gaps in their strategy, and creates specific recommendations for you to gain an advantage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
