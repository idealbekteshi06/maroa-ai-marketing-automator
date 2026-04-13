import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FlaskConical, Loader2, Trophy, Plus } from "lucide-react";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";
import { apiGet, apiPost } from "@/lib/apiClient";

interface Variant { name: string; impressions: number; clicks: number; conversions: number; confidence: number }
interface ABTest { id: string; test_type: string; status: string; variants: Variant[]; winner: string | null; created_at: string }

const TEST_TYPES = ["headline", "image", "CTA", "landing page"] as const;

export default function DashboardABTests() {
  const { businessId, user, isReady } = useAuth();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("headline");

  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiGet<{ tests?: ABTest[] }>(`/api/ab-tests/${businessId}`);
        setTests(data.tests ?? []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    };
    load();
  }, [businessId, isReady]);

  const handleCreate = async () => {
    if (!businessId) return;
    setCreating(true);
    try {
      const data = await apiPost<ABTest>("/api/ab-tests/create", {
        user_id: user?.id ?? "", // server expects user_id — this is auth.user.id = businesses.id
        business_id: businessId,
        test_type: selectedType,
        variants: ["A", "B"],
      });
      setTests(prev => [data, ...prev]);
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setCreating(false); }
  };

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
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {TEST_TYPES.map(t => (
            <button key={t} onClick={() => setSelectedType(t)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${selectedType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{t}</button>
          ))}
        </div>
        <Button size="sm" className="h-9 text-xs" onClick={handleCreate} disabled={creating}>
          {creating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
          Create Test
        </Button>
      </div>

      {tests.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <FlaskConical className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Create your first A/B test</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">Test headlines, images, CTAs, and landing pages to optimize conversions.</p>
          <Button size="sm" className="mt-4" onClick={handleCreate}>Create A/B Test</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(tests || []).map(test => (
            <div key={test.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{test.test_type}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${test.status === "completed" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>{test.status}</span>
                </div>
                {test.winner && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] font-semibold text-success">
                    <Trophy className="h-3 w-3" /> Winner: {test.winner}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(test.variants || []).map((v, idx) => (
                  <div key={idx} className={`rounded-lg border p-3 ${test.winner === v.name ? "border-success/40 bg-success/5" : "border-border"}`}>
                    <p className="text-xs font-semibold text-foreground mb-2">Variant {v.name}</p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div><p className="text-lg font-bold text-foreground">{(v.impressions || 0).toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Impressions</p></div>
                      <div><p className="text-lg font-bold text-foreground">{(v.clicks || 0).toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Clicks</p></div>
                      <div><p className="text-lg font-bold text-foreground">{(v.conversions || 0).toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Conversions</p></div>
                      <div><p className="text-lg font-bold text-foreground">{(v.confidence || 0)}%</p><p className="text-[10px] text-muted-foreground">Confidence</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
