import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MousePointerClick, Loader2, Copy } from "lucide-react";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

interface PopupResult {
  id: string;
  popup_type: string;
  headline: string;
  body: string;
  cta: string;
  offer: string;
  created_at: string;
}

const POPUP_TYPES = ["exit-intent", "scroll-trigger", "time-delay", "welcome"] as const;
const API_BASE = "https://maroa-api-production.up.railway.app";

export default function DashboardPopupCRO() {
  const { businessId, isReady } = useAuth();
  const [popups, setPopups] = useState<PopupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("exit-intent");

  const handleGenerate = async () => {
    if (!businessId) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/popup/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: businessId, popup_type: selectedType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPopups(prev => [data, ...prev]);
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setGenerating(false); }
  };

  const handleCopy = (popup: PopupResult) => {
    navigator.clipboard.writeText(`${popup.headline}\n\n${popup.body}\n\nCTA: ${popup.cta}\nOffer: ${popup.offer}`);
    toast.success(SUCCESS_MESSAGES.COPIED);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {POPUP_TYPES.map(t => (
            <button key={t} onClick={() => setSelectedType(t)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${selectedType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{t}</button>
          ))}
        </div>
        <Button size="sm" className="h-9 text-xs" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <MousePointerClick className="mr-1.5 h-3.5 w-3.5" />}
          Generate
        </Button>
      </div>

      {popups.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <MousePointerClick className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Generate high-converting popups</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">Create exit-intent, scroll, and timed popups with AI-optimized copy.</p>
          <Button size="sm" className="mt-4" onClick={handleGenerate}>Generate Popup</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(popups || []).map(popup => (
            <div key={popup.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{popup.popup_type}</span>
                <Button size="sm" variant="ghost" className="h-8 text-xs shrink-0" onClick={() => handleCopy(popup)}>
                  <Copy className="mr-1 h-3 w-3" /> Copy
                </Button>
              </div>
              {/* Preview mockup */}
              <div className="rounded-lg border border-border bg-background p-6 text-center max-w-sm mx-auto">
                <h4 className="text-base font-bold text-foreground">{popup.headline}</h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{popup.body}</p>
                {popup.offer && (
                  <p className="text-xs font-semibold text-primary mt-2">{popup.offer}</p>
                )}
                <div className="mt-4">
                  <span className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">{popup.cta}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 cursor-pointer hover:underline">No thanks</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
