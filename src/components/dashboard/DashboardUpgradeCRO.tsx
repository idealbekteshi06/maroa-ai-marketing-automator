import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, Loader2, Copy, Clock, Zap, Lock } from "lucide-react";

interface UpgradePrompt {
  id: string;
  trigger: string;
  headline: string;
  body: string;
  cta: string;
  scenario: string;
  created_at: string;
}

const scenarioIcon: Record<string, typeof Clock> = {
  trial_ending: Clock,
  usage_limit: Zap,
  feature_gate: Lock,
};

const API_BASE = "https://maroa-api-production.up.railway.app";

export default function DashboardUpgradeCRO() {
  const { businessId, isReady } = useAuth();
  const [prompts, setPrompts] = useState<UpgradePrompt[]>([]);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!businessId) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/upgrade/generate-prompts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPrompts(data.prompts ?? []);
      toast.success("Upgrade prompts generated");
    } catch { toast.error("Failed to generate prompts"); }
    finally { setGenerating(false); }
  };

  const handleCopy = (prompt: UpgradePrompt) => {
    navigator.clipboard.writeText(`${prompt.headline}\n\n${prompt.body}\n\nCTA: ${prompt.cta}\nTrigger: ${prompt.trigger}`);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="sm" className="h-9 text-xs" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" />}
          Generate Prompts
        </Button>
      </div>

      {prompts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <ArrowUpCircle className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Generate upgrade prompts to increase revenue</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">AI creates upgrade prompts for trial endings, usage limits, and feature gates.</p>
          <Button size="sm" className="mt-4" onClick={handleGenerate}>Generate Prompts</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {prompts.map(prompt => {
            const Icon = scenarioIcon[prompt.scenario] || ArrowUpCircle;
            return (
              <div key={prompt.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-muted p-1.5"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                    <div>
                      <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{prompt.scenario?.replace(/_/g, " ")}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Trigger: {prompt.trigger}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 text-xs shrink-0" onClick={() => handleCopy(prompt)}>
                    <Copy className="mr-1 h-3 w-3" /> Copy
                  </Button>
                </div>
                {/* Visual mockup */}
                <div className="rounded-lg border border-border bg-background p-5 max-w-md mx-auto">
                  <h4 className="text-sm font-bold text-foreground text-center">{prompt.headline}</h4>
                  <p className="text-xs text-muted-foreground mt-2 text-center leading-relaxed">{prompt.body}</p>
                  <div className="mt-4 text-center">
                    <span className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">{prompt.cta}</span>
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
