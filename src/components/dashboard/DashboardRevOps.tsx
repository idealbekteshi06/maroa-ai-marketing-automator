import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TrendingUp, Loader2, Users, DollarSign, Percent, BarChart3 } from "lucide-react";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

interface ScoredLead {
  id: string;
  contact_id: string;
  name: string;
  email: string;
  score: number;
  revenue_forecast: number;
  scored_at: string;
}

const API_BASE = "https://maroa-api-production.up.railway.app";

export default function DashboardRevOps() {
  const { businessId, isReady } = useAuth();
  const [leads, setLeads] = useState<ScoredLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);

  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/revops/scores/${businessId}`);
        const data = await res.json();
        if (res.ok) setLeads(data.leads ?? []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    };
    load();
  }, [businessId, isReady]);

  const handleScoreLeads = async () => {
    if (!businessId) return;
    setScoring(true);
    try {
      const res = await fetch(`${API_BASE}/api/revops/score-lead`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: businessId, contact_id: "all" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setLeads(data.leads ?? []);
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setScoring(false); }
  };

  const scoreBadge = (score: number) => {
    if (score >= 80) return "bg-success/10 text-success";
    if (score >= 50) return "bg-warning/10 text-warning";
    return "bg-muted text-muted-foreground";
  };

  const totalPipeline = (leads || []).reduce((s, l) => s + (l.revenue_forecast || 0), 0);
  const avgScore = (leads || []).length > 0 ? Math.round((leads || []).reduce((s, l) => s + l.score, 0) / (leads || []).length) : 0;
  const avgDeal = (leads || []).length > 0 ? Math.round(totalPipeline / (leads || []).length) : 0;

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
      <div className="flex items-center justify-between">
        <div />
        <Button size="sm" className="h-9 text-xs" onClick={handleScoreLeads} disabled={scoring}>
          {scoring ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="mr-1.5 h-3.5 w-3.5" />}
          Score Leads
        </Button>
      </div>

      {(leads || []).length > 0 && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <DollarSign className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-xl font-bold text-foreground">${totalPipeline.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Total Pipeline</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <Percent className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-xl font-bold text-foreground">{avgScore}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Avg Lead Score</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <BarChart3 className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-xl font-bold text-foreground">${avgDeal.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Avg Deal Size</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <TrendingUp className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-xl font-bold text-foreground">${Math.round(totalPipeline * 0.3).toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Forecast (30d)</p>
          </div>
        </div>
      )}

      {(leads || []).length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Set up revenue operations</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">Score your leads and forecast revenue with AI-powered analysis.</p>
          <Button size="sm" className="mt-4" onClick={handleScoreLeads}>Score Leads</Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Forecast</th>
              </tr>
            </thead>
            <tbody>
              {(leads || []).map(l => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-foreground font-medium">{l.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{l.email}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${scoreBadge(l.score)}`}>{l.score}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground">${(l.revenue_forecast || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
