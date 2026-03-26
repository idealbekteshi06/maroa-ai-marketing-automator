import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Search } from "lucide-react";

interface Insight {
  id: string;
  competitor_doing_well: string | null;
  gap_opportunity: string | null;
  content_to_steal: string | null;
  positioning_tip: string | null;
  recorded_at: string;
}

function SkeletonRow() {
  return <div className="h-32 rounded-2xl border border-border bg-card animate-pulse-soft" />;
}

export default function DashboardCompetitors() {
  const { businessId, isReady } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await externalSupabase
        .from("competitor_insights")
        .select("*")
        .eq("business_id", businessId)
        .order("recorded_at", { ascending: false });
      setInsights((data as Insight[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [businessId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">AI-powered insights on what your competitors are doing.</p>

      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
            <Search className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">Competitor tracking activates after your first week</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Add your competitors in Settings and maroa.ai will monitor them every Friday and tell you exactly what is working for them.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((ins) => (
            <div key={ins.id} className="rounded-2xl border border-border bg-card p-6 space-y-4 transition-all hover:shadow-card">
              {ins.competitor_doing_well && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">🏆 Competitor Doing Well</p>
                  <p className="mt-1.5 text-sm text-card-foreground leading-relaxed">{ins.competitor_doing_well}</p>
                </div>
              )}
              {ins.gap_opportunity && (
                <div className="rounded-xl bg-primary/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">🎯 Gap Opportunity</p>
                  <p className="mt-1.5 text-sm text-card-foreground leading-relaxed">{ins.gap_opportunity}</p>
                </div>
              )}
              {ins.content_to_steal && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">💡 Content to Steal</p>
                  <p className="mt-1.5 text-sm text-card-foreground leading-relaxed">{ins.content_to_steal}</p>
                </div>
              )}
              {ins.positioning_tip && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">📍 Positioning Tip</p>
                  <p className="mt-1.5 text-sm text-card-foreground leading-relaxed">{ins.positioning_tip}</p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">{ins.recorded_at}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
