import { useCallback, useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Eye, Copy, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

interface LandingPage {
  id: string; headline: string | null; subheadline: string | null; cta_text: string | null;
  benefits: string | null; business_id: string; created_at: string;
}

function timeAgo(d: string) {
  const hrs = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
  if (hrs < 1) return "Just now"; if (hrs < 24) return `${hrs}h ago`; return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardLandingPages() {
  const { businessId, user, isReady } = useAuth();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<LandingPage | null>(null);
  const [tableExists, setTableExists] = useState(true);

  const fetchPages = useCallback(async () => {
    if (!businessId || !isReady) return;
    setLoading(true);
    const { data, error } = await externalSupabase.from("landing_pages").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      setTableExists(false); setLoading(false); return;
    }
    setPages((data as LandingPage[]) ?? []);
    setLoading(false);
  }, [businessId, isReady]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleGenerate = async () => {
    if (!businessId) return;
    setGenerating(true);
    try {
      await fetch("https://maroa-api-production.up.railway.app/webhook/generate-landing-page", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, email: user?.email }),
      });
      toast.success(SUCCESS_MESSAGES.GENERATED);
      setTimeout(() => fetchPages(), 15000);
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setGenerating(false); }
  };

  const copyHtml = (page: LandingPage) => {
    const benefits = page.benefits ? page.benefits.split(",").map(b => `<li>${b.trim()}</li>`).join("") : "";
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${page.headline || ""}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;color:#1c1c1c}.hero{padding:80px 20px;text-align:center;max-width:600px;margin:0 auto}h1{font-size:2.5rem;font-weight:800;line-height:1.2;margin-bottom:16px}p{font-size:1.1rem;color:#666;margin-bottom:32px}ul{list-style:none;text-align:left;margin-bottom:32px}li{padding:8px 0;border-bottom:1px solid #eee}li:before{content:"✓ ";color:#0066cc}.cta{display:inline-block;padding:16px 32px;background:#0066cc;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:1.1rem}</style></head><body><div class="hero"><h1>${page.headline || ""}</h1><p>${page.subheadline || ""}</p>${benefits ? `<ul>${benefits}</ul>` : ""}<a href="#" class="cta">${page.cta_text || "Get Started"}</a></div></body></html>`;
    navigator.clipboard.writeText(html);
    toast.success(SUCCESS_MESSAGES.COPIED);
  };

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl border border-border bg-card animate-pulse" />)}</div>;

  if (!tableExists) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/30" />
        <h3 className="mt-5 text-lg font-semibold text-foreground">Landing Pages</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">Landing pages are automatically generated for each ad campaign. They'll appear here once the feature is fully set up.</p>
        <Button className="mt-5" onClick={handleGenerate} disabled={generating}><Sparkles className="mr-2 h-4 w-4" /> Generate Landing Page</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">AI-generated landing pages for your campaigns.</p>
        <Button size="sm" className="h-9 text-xs" onClick={handleGenerate} disabled={generating}>
          {generating ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating...</> : <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate Landing Page</>}
        </Button>
      </div>

      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-5 text-lg font-semibold text-foreground">No landing pages yet</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Landing pages are automatically generated for each ad campaign. They are optimized to convert visitors into customers. Click Generate to create your first one.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pages.map(p => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md">
              <h4 className="text-sm font-semibold text-card-foreground line-clamp-1">{p.headline || "Landing Page"}</h4>
              {p.subheadline && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.subheadline}</p>}
              {p.cta_text && <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">{p.cta_text}</span>}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{timeAgo(p.created_at)}</span>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => setPreview(p)}><Eye className="h-3 w-3 mr-1" /> Preview</Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => copyHtml(p)}><Copy className="h-3 w-3 mr-1" /> Copy HTML</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <Dialog open onOpenChange={() => setPreview(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Landing Page Preview</DialogTitle></DialogHeader>
            <div className="mt-4 rounded-xl border border-border bg-background p-8 text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">{preview.headline}</h2>
              <p className="text-muted-foreground">{preview.subheadline}</p>
              {preview.benefits && (
                <ul className="text-left space-y-2 max-w-sm mx-auto">
                  {preview.benefits.split(",").map((b, i) => <li key={i} className="flex items-center gap-2 text-sm text-card-foreground"><span className="text-primary">✓</span> {b.trim()}</li>)}
                </ul>
              )}
              <button className="inline-block rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground">{preview.cta_text || "Get Started"}</button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
