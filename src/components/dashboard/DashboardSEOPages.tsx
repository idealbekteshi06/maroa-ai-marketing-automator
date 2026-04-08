import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, ExternalLink, CheckCircle2, Clock, Globe } from "lucide-react";

const API_BASE = "https://maroa-api-production.up.railway.app";

interface SEOPage {
  id: string;
  keyword: string;
  title: string;
  preview_url: string;
  status: "draft" | "published";
  created_at: string;
}

export default function DashboardSEOPages() {
  const { businessId, isReady } = useAuth();
  const [pages, setPages] = useState<SEOPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    if (!businessId || !isReady) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/seo-pages/${businessId}`);
        if (res.ok) {
          const data = await res.json();
          setPages(Array.isArray(data) ? data : data?.items || data?.data || []);
        }
      } catch { /* empty */ }
      setLoading(false);
    };
    load();
  }, [businessId, isReady]);

  const handleGenerate = async () => {
    if (!businessId || !keyword.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/seo-pages/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, keyword: keyword.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPages(prev => [data, ...prev]);
      setKeyword("");
      toast.success("SEO page generated!");
    } catch {
      toast.error("Failed to generate page");
    } finally {
      setGenerating(false);
    }
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

  if (pages.length === 0 && !generating) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Globe className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">Create SEO-optimized pages</h3>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
          Generate landing pages optimized for specific keywords to boost organic traffic.
        </p>
        <div className="max-w-sm mx-auto mt-4 flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Enter target keyword..."
            className="flex-1 h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground"
            onKeyDown={e => e.key === "Enter" && handleGenerate()}
          />
          <Button size="sm" className="h-9 text-xs" onClick={handleGenerate} disabled={!keyword.trim()}>
            <FileText className="mr-1.5 h-3.5 w-3.5" /> Generate
          </Button>
        </div>
      </div>
    );
  }

  const draftCount = pages.filter(p => p.status === "draft").length;
  const publishedCount = pages.filter(p => p.status === "published").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{draftCount} draft · {publishedCount} published</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Target keyword..."
            className="h-9 rounded-md border border-border bg-card px-3 text-xs text-foreground w-48 placeholder:text-muted-foreground"
            onKeyDown={e => e.key === "Enter" && handleGenerate()}
          />
          <Button size="sm" className="h-9 text-xs" onClick={handleGenerate} disabled={generating || !keyword.trim()}>
            {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
            Generate
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-foreground">{pages.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Total Pages</p>
        </div>
        <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-center">
          <p className="text-xl font-bold text-success">{publishedCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Published</p>
        </div>
      </div>

      <div className="space-y-3">
        {pages.map(p => (
          <div key={p.id} className="rounded-lg border border-border bg-card p-5 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{p.keyword}</span>
                {p.status === "published" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                    <Clock className="h-2.5 w-2.5" /> Draft
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
              <p className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" asChild>
              <a href={p.preview_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-3 w-3" /> Preview
              </a>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
