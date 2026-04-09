import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Rocket, Loader2, CheckCircle2, Circle, Calendar, Zap, Mail, Megaphone } from "lucide-react";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

const API_BASE = "https://maroa-api-production.up.railway.app";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Campaign {
  id: string;
  campaign_type: string;
  launch_date: string;
  tasks: Task[];
  status: string;
  created_at: string;
}

const campaignTypes = [
  { value: "product_launch", label: "Product Launch", icon: Rocket },
  { value: "flash_sale", label: "Flash Sale", icon: Zap },
  { value: "email_campaign", label: "Email Campaign", icon: Mail },
  { value: "brand_awareness", label: "Brand Awareness", icon: Megaphone },
];

export default function DashboardLaunch() {
  const { businessId, isReady } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/launch/${businessId}`);
        if (res.ok) {
          const data = await res.json();
          setCampaigns(Array.isArray(data) ? data : data?.items || data?.data || []);
        }
      } catch { /* empty */ }
      setLoading(false);
    };
    load();
  }, [businessId, isReady]);

  const handleCreate = async (type: string) => {
    if (!businessId) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/launch/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: businessId, campaign_type: type }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCampaigns(prev => [data, ...prev]);
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch {
      toast.error(ERROR_MESSAGES.GENERATION_FAILED);
    } finally {
      setCreating(false);
    }
  };

  const daysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
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

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Rocket className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">Plan your next launch</h3>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
          Create a campaign with AI-generated timelines and task checklists.
        </p>
        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto mt-4">
          {campaignTypes.map(ct => (
            <button
              key={ct.value}
              onClick={() => handleCreate(ct.value)}
              disabled={creating}
              className="rounded-lg border border-border bg-card p-3 text-center hover:border-primary/40 transition-colors"
            >
              <ct.icon className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-foreground">{ct.label}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</p>
        <Button size="sm" className="h-9 text-xs" onClick={() => handleCreate("product_launch")} disabled={creating}>
          {creating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Rocket className="mr-1.5 h-3.5 w-3.5" />}
          New Campaign
        </Button>
      </div>

      <div className="space-y-3">
        {(campaigns || []).map(c => {
          const completed = c.tasks?.filter(t => t.completed).length ?? 0;
          const total = c.tasks?.length ?? 0;
          const days = daysUntil(c.launch_date);
          return (
            <div key={c.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {c.campaign_type.replace("_", " ")}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                  <Calendar className="h-3 w-3" /> {days} days left
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${total ? (completed / total) * 100 : 0}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground">{completed}/{total} tasks complete</p>
              {c.tasks?.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-2 mt-1.5">
                  {t.completed ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className={`text-xs ${t.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.title}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
