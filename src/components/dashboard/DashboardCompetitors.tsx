import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";

interface Insight {
  id: string;
  competitor_doing_well: string | null;
  gap_opportunity: string | null;
  content_to_steal: string | null;
  positioning_tip: string | null;
  recorded_at: string;
}

export default function DashboardCompetitors() {
  const { businessId } = useAuth();
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
      <div className="space-y-4 pb-20 md:pb-0">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <p className="text-sm text-muted-foreground">AI-powered insights on what your competitors are doing.</p>

      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-foreground">No competitor insights yet</p>
          <p className="mt-1 text-sm text-muted-foreground">AI is analyzing your competitors. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((ins) => (
            <div key={ins.id} className="rounded-2xl bg-card p-6 space-y-4">
              {ins.competitor_doing_well && (
                <div>
                  <p className="text-xs font-medium text-primary">🏆 Competitor Doing Well</p>
                  <p className="mt-1 text-sm text-card-foreground">{ins.competitor_doing_well}</p>
                </div>
              )}
              {ins.gap_opportunity && (
                <div className="rounded-xl bg-primary/5 p-4">
                  <p className="text-xs font-medium text-primary">🎯 Gap Opportunity</p>
                  <p className="mt-1 text-sm text-card-foreground">{ins.gap_opportunity}</p>
                </div>
              )}
              {ins.content_to_steal && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">💡 Content to Steal</p>
                  <p className="mt-1 text-sm text-card-foreground">{ins.content_to_steal}</p>
                </div>
              )}
              {ins.positioning_tip && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">📍 Positioning Tip</p>
                  <p className="mt-1 text-sm text-card-foreground">{ins.positioning_tip}</p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">{ins.recorded_at}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
