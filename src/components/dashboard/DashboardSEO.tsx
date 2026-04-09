import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { externalSupabase } from "@/integrations/supabase/external-client";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Search, Loader2, CheckCircle2, Clock, Copy, Tag, Globe, FileText, Code } from "lucide-react";

interface Recommendation {
  id: string;
  business_id: string;
  url: string | null;
  type: string | null;
  current_value: string | null;
  recommended_value: string | null;
  target_keyword: string | null;
  priority: "high" | "medium" | "low";
  estimated_impact: string | null;
  status: string;
  created_at: string;
  applied_at: string | null;
}

const priorityBadge: Record<string, { bg: string; text: string }> = {
  high: { bg: "bg-destructive/10", text: "text-destructive" },
  medium: { bg: "bg-warning/10", text: "text-warning" },
  low: { bg: "bg-muted", text: "text-muted-foreground" },
};

const typeConfig: Record<string, { icon: typeof Search; label: string }> = {
  keyword_gap: { icon: Tag, label: "Keyword Gap" },
  meta_title: { icon: FileText, label: "Meta Title" },
  meta_description: { icon: FileText, label: "Meta Description" },
  schema: { icon: Code, label: "Schema" },
  technical: { icon: Globe, label: "Technical" },
};

export default function DashboardSEO() {
  const { businessId, isReady } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch recommendations directly from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!businessId) return [];
    try {
      const { data } = await externalSupabase
        .from("seo_recommendations")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data as Recommendation[]) ?? [];
    } catch {
      return [];
    }
  }, [businessId]);

  // Initial load from Supabase
  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      const recs = await fetchFromSupabase();
      setRecommendations(recs);
      setLoading(false);
    };
    load();
  }, [businessId, isReady, fetchFromSupabase]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleAudit = async () => {
    if (!businessId) return;
    setAuditing(true);
    toast("Running SEO audit...", { description: "This usually takes 30–60 seconds" });

    // 1. Trigger the async audit
    try {
      await api.seoAudit({ business_id: businessId });
    } catch {
      toast.error("Failed to start SEO audit");
      setAuditing(false);
      return;
    }

    // 2. Poll Supabase every 3s for new results (max 60s)
    const startTime = Date.now();
    const beforeCount = recommendations.length;

    pollRef.current = setInterval(async () => {
      const recs = await fetchFromSupabase();

      // New results appeared
      if (recs.length > beforeCount || (recs.length > 0 && recs[0].created_at && new Date(recs[0].created_at).getTime() > startTime - 5000)) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setRecommendations(recs);
        setAuditing(false);
        toast.success(`SEO audit complete — ${recs.length} recommendations found`);
        return;
      }

      // Timeout
      if (Date.now() - startTime > 60000) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setAuditing(false);
        toast("Audit complete", { description: "Refresh to see results" });
        // One final fetch
        const finalRecs = await fetchFromSupabase();
        if (finalRecs.length > 0) setRecommendations(finalRecs);
      }
    }, 3000);
  };

  const handleApply = async (id: string) => {
    if (!businessId) return;
    setApplyingId(id);
    try {
      await api.seoRecommendationApply({ business_id: businessId, recommendation_id: id });
      toast.success("Recommendation applied");
      // Optimistic update
      setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: "applied", applied_at: new Date().toISOString() } : r));
    } catch {
      toast.error("Failed to apply recommendation");
    } finally {
      setApplyingId(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const lastAuditDate = recommendations.length > 0 ? recommendations[0].created_at : null;
  const pendingCount = recommendations.filter(r => r.status === "pending").length;
  const appliedCount = recommendations.filter(r => r.status === "applied" || r.status === "completed").length;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-lg border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            {lastAuditDate && (
              <span className="text-xs text-muted-foreground">
                Last audit: {new Date(lastAuditDate).toLocaleString()}
              </span>
            )}
            {recommendations.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {pendingCount} pending · {appliedCount} applied
              </span>
            )}
          </div>
        </div>
        <Button size="sm" className="h-9 text-xs" onClick={handleAudit} disabled={auditing}>
          {auditing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Search className="mr-1.5 h-3.5 w-3.5" />}
          {auditing ? "Running audit..." : "Run SEO Audit"}
        </Button>
      </div>

      {/* Summary stats */}
      {recommendations.length > 0 && (
        (() => {
          const totalCount = recommendations.length;
          const highCount = recommendations.filter(r => r.priority === "high").length;
          const mediumCount = recommendations.filter(r => r.priority === "medium").length;
          const appliedStatCount = recommendations.filter(r => r.status === "applied" || r.status === "completed").length;
          return (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-xl font-bold text-foreground">{totalCount}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Total</p>
              </div>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-center">
                <p className="text-xl font-bold text-destructive">{highCount}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">High Priority</p>
              </div>
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 text-center">
                <p className="text-xl font-bold text-warning">{mediumCount}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Medium</p>
              </div>
              <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-center">
                <p className="text-xl font-bold text-success">{appliedStatCount}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Applied</p>
              </div>
            </div>
          );
        })()
      )}

      {/* Auditing progress */}
      {auditing && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium text-primary">AI is analyzing your SEO...</p>
            <p className="text-xs text-muted-foreground">Checking meta tags, keywords, schema markup. Results appear automatically.</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {recommendations.length === 0 && !auditing ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Your AI audits SEO every Sunday</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">Run a manual audit now to get your first recommendations.</p>
          <Button size="sm" className="mt-4" onClick={handleAudit}>Run SEO Audit Now</Button>
        </div>
      ) : (
        /* Recommendations */
        <div className="space-y-3">
          {recommendations.map(r => {
            const pBadge = priorityBadge[r.priority] ?? priorityBadge.low;
            const isApplied = r.status === "applied" || r.status === "completed";
            const typeInfo = typeConfig[r.type ?? ""] ?? { icon: Globe, label: r.type || "SEO" };
            const TypeIcon = typeInfo.icon;

            return (
              <div
                key={r.id}
                className={`rounded-lg border bg-card p-5 shadow-meta transition-shadow hover:shadow-meta-hover ${isApplied ? "border-success/20 opacity-75" : "border-border"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Type + Priority + Status badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <TypeIcon className="h-3 w-3" />
                        {typeInfo.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${pBadge.bg} ${pBadge.text}`}>
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${r.priority === "high" ? "bg-destructive" : r.priority === "medium" ? "bg-warning" : "bg-muted-foreground"}`} />
                        {r.priority || "low"}
                      </span>
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] font-semibold text-success">
                          <CheckCircle2 className="h-3 w-3" /> Applied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-[10px] font-semibold text-warning">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </div>

                    {/* Current → Recommended */}
                    {r.current_value && (
                      <p className={`text-xs text-muted-foreground mb-1 ${isApplied ? "line-through" : ""}`}>
                        Current: {r.current_value}
                      </p>
                    )}
                    {r.recommended_value && (
                      <p className={`text-sm font-medium text-foreground leading-relaxed ${isApplied ? "line-through" : ""}`}>
                        {r.recommended_value}
                      </p>
                    )}

                    {/* Keyword + Impact */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {r.target_keyword && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                          <Tag className="h-2.5 w-2.5" />
                          {r.target_keyword}
                        </span>
                      )}
                      {r.estimated_impact && (
                        <span className="text-[11px] text-success font-medium">{r.estimated_impact}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {!isApplied && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleApply(r.id)}
                        disabled={applyingId === r.id}
                      >
                        {applyingId === r.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                        Mark Applied
                      </Button>
                    )}
                    {r.recommended_value && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => handleCopy(r.recommended_value!)}
                      >
                        <Copy className="mr-1 h-3 w-3" /> Copy
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
