import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Download, CheckSquare, BookOpen, LayoutTemplate, HelpCircle } from "lucide-react";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

const API_BASE = "https://maroa-api-production.up.railway.app";

interface LeadMagnet {
  id: string;
  type: string;
  title: string;
  download_url: string;
  created_at: string;
}

const typeOptions = [
  { value: "checklist", label: "Checklist", icon: CheckSquare },
  { value: "guide", label: "Guide", icon: BookOpen },
  { value: "template", label: "Template", icon: LayoutTemplate },
  { value: "quiz", label: "Quiz", icon: HelpCircle },
];

export default function DashboardLeadMagnets() {
  const { businessId, isReady } = useAuth();
  const [magnets, setMagnets] = useState<LeadMagnet[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState("checklist");

  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/lead-magnets/${businessId}`);
        if (res.ok) {
          const data = await res.json();
          setMagnets(Array.isArray(data) ? data : data?.items || data?.data || []);
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
      const res = await fetch(`${API_BASE}/api/lead-magnets/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: businessId, type: selectedType }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMagnets(prev => [data, ...prev]);
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch {
      toast.error(ERROR_MESSAGES.GENERATION_FAILED);
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

  if (magnets.length === 0 && !generating) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">Generate your first lead magnet</h3>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
          Create AI-powered PDFs, checklists, and guides to capture leads.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {typeOptions.map(t => (
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
          {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
          {generating ? "Generating..." : "Generate Lead Magnet"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{magnets.length} lead magnet{magnets.length !== 1 ? "s" : ""} generated</p>
        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="h-9 rounded-md border border-border bg-card px-2 text-xs text-foreground"
          >
            {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <Button size="sm" className="h-9 text-xs" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
            Generate
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {(magnets || []).map(m => (
          <div key={m.id} className="rounded-lg border border-border bg-card p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground mb-1">
                {m.type}
              </span>
              <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
              <p className="text-[11px] text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</p>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" asChild>
              <a href={m.download_url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-1 h-3 w-3" /> Download
              </a>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
