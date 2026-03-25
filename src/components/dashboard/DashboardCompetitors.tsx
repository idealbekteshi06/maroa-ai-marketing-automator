import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";

interface Insight {
  id: string;
  competitor_name: string;
  insight: string;
  recommendation: string;
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
        .order("created_at", { ascending: false });
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
            <div key={ins.id} className="rounded-2xl bg-card p-6">
              <p className="text-xs font-medium text-primary">{ins.competitor_name}</p>
              <p className="mt-2 text-sm text-card-foreground">{ins.insight}</p>
              <div className="mt-4 rounded-xl bg-primary/5 p-4">
                <p className="text-xs font-medium text-primary">💡 Recommendation</p>
                <p className="mt-1 text-sm text-card-foreground">{ins.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
