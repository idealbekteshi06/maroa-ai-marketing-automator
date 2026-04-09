import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DollarSign, Loader2, Copy, ShieldQuestion } from "lucide-react";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

interface Pitch { id: string; product: string; pitch: string; created_at: string }
interface Objection { id: string; objection: string; response: string; created_at: string }

const API_BASE = "https://maroa-api-production.up.railway.app";

export default function DashboardSales() {
  const { businessId, isReady } = useAuth();
  const [tab, setTab] = useState<"pitches" | "objections">("pitches");
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [product, setProduct] = useState("");
  const [objectionText, setObjectionText] = useState("");

  const handleGeneratePitch = async () => {
    if (!businessId || !product.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/sales/generate-pitch`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: businessId, product: product.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPitches(prev => [data, ...prev]);
      setProduct("");
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setGenerating(false); }
  };

  const handleObjection = async () => {
    if (!businessId || !objectionText.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/sales/objection-handler`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: businessId, objection: objectionText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setObjections(prev => [data, ...prev]);
      setObjectionText("");
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setGenerating(false); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(SUCCESS_MESSAGES.COPIED);
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

  const items = tab === "pitches" ? pitches : objections;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={tab === "pitches" ? "default" : "outline"} className="h-9 text-xs" onClick={() => setTab("pitches")}>Sales Pitches</Button>
        <Button size="sm" variant={tab === "objections" ? "default" : "outline"} className="h-9 text-xs" onClick={() => setTab("objections")}>Objection Handlers</Button>
      </div>

      {tab === "pitches" ? (
        <div className="flex gap-2">
          <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Enter product or service name..." className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
          <Button size="sm" className="h-9 text-xs" onClick={handleGeneratePitch} disabled={generating || !product.trim()}>
            {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <DollarSign className="mr-1.5 h-3.5 w-3.5" />}
            Generate Pitch
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input value={objectionText} onChange={e => setObjectionText(e.target.value)} placeholder="Enter customer objection..." className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
          <Button size="sm" className="h-9 text-xs" onClick={handleObjection} disabled={generating || !objectionText.trim()}>
            {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ShieldQuestion className="mr-1.5 h-3.5 w-3.5" />}
            Handle Objection
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <DollarSign className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Generate sales materials for your team</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">Create AI-powered sales pitches and objection handlers to close more deals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tab === "pitches" ? (pitches || []).map(p => (
            <div key={p.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground mb-2">{p.product}</span>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{p.pitch}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 text-xs shrink-0" onClick={() => handleCopy(p.pitch)}>
                  <Copy className="mr-1 h-3 w-3" /> Copy
                </Button>
              </div>
            </div>
          )) : (objections || []).map(o => (
            <div key={o.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Objection: {o.objection}</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{o.response}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 text-xs shrink-0" onClick={() => handleCopy(o.response)}>
                  <Copy className="mr-1 h-3 w-3" /> Copy
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
