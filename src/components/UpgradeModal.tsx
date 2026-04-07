import { useEffect, useCallback } from "react";
import { Lock, Check, X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
  description?: string;
  businessId: string | null;
}

const featureBullets: Record<string, string[]> = {
  "AI Campaigns": ["Run unlimited Meta and Google campaigns", "AI auto-optimizes your budget daily", "A/B test ad creatives automatically"],
  "Competitor Intel": ["Monitor up to 10 competitors weekly", "Get alerts when competitors change strategy", "AI recommends counter-moves"],
  "Brand Voice": ["AI learns your exact brand tone", "Consistent messaging across all platforms", "Custom content templates"],
  "SEO Audit": ["Weekly automated SEO audits", "Actionable optimization recommendations", "Keyword tracking and ranking"],
  default: ["Full access to all AI marketing features", "Unlimited content generation", "Priority support"],
};

export default function UpgradeModal({ open, onClose, featureName, description, businessId }: UpgradeModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  const handleUpgrade = async (plan: string) => {
    if (!businessId) return;
    try {
      const result: any = await api.createCheckout({ business_id: businessId, plan });
      if (result?.url) window.location.href = result.url;
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  if (!open) return null;

  const bullets = featureBullets[featureName] || featureBullets.default;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-foreground">Unlock {featureName}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {description || "This feature is available on Growth and Agency plans."}
          </p>
        </div>

        <div className="mt-5 space-y-2">
          {bullets.map((b, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Check className="h-4 w-4 text-success shrink-0" />
              <span className="text-sm text-foreground">{b}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => handleUpgrade("growth")}
            className="relative rounded-xl border-2 border-primary bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
          >
            <span className="absolute -top-2.5 left-3 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground uppercase">Most popular</span>
            <p className="text-sm font-bold text-foreground">Growth</p>
            <p className="text-lg font-bold text-foreground">$49<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
          </button>
          <button
            onClick={() => handleUpgrade("agency")}
            className="rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/50"
          >
            <p className="text-sm font-bold text-foreground mt-1">Agency</p>
            <p className="text-lg font-bold text-foreground">$99<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
          </button>
        </div>

        <Button onClick={() => handleUpgrade("growth")} className="mt-4 w-full h-11">
          Start 14-day free trial
        </Button>
        <button onClick={onClose} className="mt-2 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
          Maybe later
        </button>
      </div>
    </div>
  );
}
