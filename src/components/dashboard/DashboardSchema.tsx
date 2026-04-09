import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Code, Loader2, Copy, Building2, ShoppingBag, HelpCircle, FileText } from "lucide-react";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

const API_BASE = "https://maroa-api-production.up.railway.app";

interface SchemaMarkup {
  id: string;
  page_type: string;
  json_ld: string;
  created_at: string;
}

const pageTypes = [
  { value: "LocalBusiness", label: "Local Business", icon: Building2 },
  { value: "Product", label: "Product", icon: ShoppingBag },
  { value: "FAQ", label: "FAQ", icon: HelpCircle },
  { value: "Article", label: "Article", icon: FileText },
];

export default function DashboardSchema() {
  const { businessId, isReady } = useAuth();
  const [schemas, setSchemas] = useState<SchemaMarkup[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState("LocalBusiness");

  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/schema/${businessId}`);
        if (res.ok) {
          const data = await res.json();
          setSchemas(Array.isArray(data) ? data : data?.items || data?.data || []);
        }
      } catch { /* empty */ }
      setLoading(false);
    };
    load();
  }, [businessId, isReady]);

  const handleGenerate = async () => {
    if (!businessId) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/schema/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: businessId, page_type: selectedType }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSchemas(prev => [data, ...prev]);
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch {
      toast.error(ERROR_MESSAGES.GENERATION_FAILED);
    } finally {
      setGenerating(false);
    }
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

  if (schemas.length === 0 && !generating) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Code className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">Generate schema markup</h3>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
          Create JSON-LD structured data to improve your search engine visibility.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {pageTypes.map(t => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${selectedType === t.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              <t.icon className="h-3 w-3" /> {t.label}
            </button>
          ))}
        </div>
        <Button size="sm" className="mt-4" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Code className="mr-1.5 h-3.5 w-3.5" />}
          Generate Schema
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{schemas.length} schema{schemas.length !== 1 ? "s" : ""} generated</p>
        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="h-9 rounded-md border border-border bg-card px-2 text-xs text-foreground"
          >
            {pageTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <Button size="sm" className="h-9 text-xs" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Code className="mr-1.5 h-3.5 w-3.5" />}
            Generate
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {(schemas || []).map(s => (
          <div key={s.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {s.page_type}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleCopy(s.json_ld)}>
                  <Copy className="mr-1 h-3 w-3" /> Copy
                </Button>
              </div>
            </div>
            <pre className="rounded bg-muted p-3 text-[11px] text-foreground overflow-x-auto max-h-40 leading-relaxed">
              {s.json_ld}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
