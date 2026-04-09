import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

interface StepAnalysis {
  step: string;
  score: number;
  suggestion: string;
}

interface SignupAnalysis {
  id: string;
  signup_url: string;
  friction_score: number;
  field_count: number;
  time_to_complete: string;
  steps: StepAnalysis[];
  created_at: string;
}

const API_BASE = "https://maroa-api-production.up.railway.app";

export default function DashboardSignupCRO() {
  const { businessId, isReady } = useAuth();
  const [analysis, setAnalysis] = useState<SignupAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [signupUrl, setSignupUrl] = useState("");

  const handleAnalyze = async () => {
    if (!businessId || !signupUrl.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE}/api/signup-cro/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: businessId, signup_url: signupUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setAnalysis(data);
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setAnalyzing(false); }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={signupUrl} onChange={e => setSignupUrl(e.target.value)} placeholder="Enter your signup page URL..." className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
        <Button size="sm" className="h-9 text-xs" onClick={handleAnalyze} disabled={analyzing || !signupUrl.trim()}>
          {analyzing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <UserPlus className="mr-1.5 h-3.5 w-3.5" />}
          Analyze
        </Button>
      </div>

      {analysis && (
        <div className="grid gap-3 grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className={`text-xl font-bold ${scoreColor(100 - analysis.friction_score)}`}>{analysis.friction_score}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Friction Score</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-foreground">{analysis.field_count}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Form Fields</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-foreground">{analysis.time_to_complete}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Time to Complete</p>
          </div>
        </div>
      )}

      {!analysis ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <UserPlus className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Analyze your signup flow</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">Enter your signup page URL to get AI-powered optimization suggestions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(analysis.steps || []).map((step, idx) => (
            <div key={idx} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{idx + 1}</div>
                  <h4 className="text-sm font-semibold text-foreground">{step.step}</h4>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${step.score >= 70 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                  {step.score >= 70 ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {step.score}/100
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed ml-8">{step.suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
