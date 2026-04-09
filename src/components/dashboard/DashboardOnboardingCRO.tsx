import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserCheck, Loader2, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";

interface OnboardingStep {
  step_number: number;
  title: string;
  copy: string;
  improvement: string;
  completion_rate: number;
}

interface OnboardingResult {
  id: string;
  steps: OnboardingStep[];
  overall_completion: number;
  time_to_value: string;
  drop_off_point: string;
  created_at: string;
}

const API_BASE = "https://maroa-api-production.up.railway.app";

export default function DashboardOnboardingCRO() {
  const { businessId, isReady } = useAuth();
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!businessId) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/onboarding-cro/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: businessId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
      toast.success("Onboarding flow optimized");
    } catch { toast.error("Failed to optimize onboarding"); }
    finally { setGenerating(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="sm" className="h-9 text-xs" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <UserCheck className="mr-1.5 h-3.5 w-3.5" />}
          Optimize Onboarding
        </Button>
      </div>

      {result && (
        <div className="grid gap-3 grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-foreground">{result.overall_completion}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Completion Rate</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-foreground">{result.time_to_value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Time to Value</p>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-center">
            <p className="text-sm font-bold text-destructive">{result.drop_off_point}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Drop-off Point</p>
          </div>
        </div>
      )}

      {!result ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <UserCheck className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Optimize your customer onboarding</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">AI will analyze your onboarding flow and suggest improvements for each step.</p>
          <Button size="sm" className="mt-4" onClick={handleGenerate}>Optimize Now</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(result.steps || []).map((step, idx) => (
            <div key={idx} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">{step.step_number}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${step.completion_rate >= 70 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {step.completion_rate}% complete
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.copy}</p>
                  <div className="mt-2 flex items-start gap-1.5 rounded-md bg-muted/50 p-2">
                    <AlertTriangle className="h-3 w-3 text-warning shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground">{step.improvement}</p>
                  </div>
                </div>
              </div>
              {idx < (result.steps || []).length - 1 && (
                <div className="flex justify-center mt-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
