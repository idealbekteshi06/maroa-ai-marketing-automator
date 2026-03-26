import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, Eye, DollarSign, TrendingUp, ArrowRight, Sparkles, CheckCircle2, Circle, Share2, ImageIcon, CreditCard, FileText, CalendarCheck } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";

interface DailyStat {
  recorded_at: string;
  total_reach: number;
  ig_reach: number;
  ig_impressions: number;
  ig_followers: number;
  fb_reach: number;
  fb_engaged: number;
  fb_fan_adds: number;
}

interface ChecklistItem {
  key: string;
  label: string;
  icon: React.ElementType;
  done: boolean;
}

function SkeletonCard() {
  return <div className="h-[120px] rounded-2xl border border-border bg-card animate-pulse-soft" />;
}

function EmptyOverview() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
        <Rocket className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">Welcome to maroa.ai</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        Your marketing engine is warming up. Complete your onboarding to activate everything — content generation, ad management, and competitor tracking all start automatically.
      </p>
    </div>
  );
}

export default function DashboardOverview() {
  const { businessId } = useAuth();
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoCount, setPhotoCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      setLoading(true);
      const [statsRes, bizRes, photosRes, contentRes] = await Promise.all([
        externalSupabase.from("daily_stats").select("*").eq("business_id", businessId).order("recorded_at", { ascending: false }).limit(30),
        externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle(),
        externalSupabase.from("business_photos").select("id", { count: "exact", head: true }).eq("business_id", businessId),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", businessId),
      ]);
      setStats(statsRes.data ?? []);
      setBusinessData(bizRes.data);
      setPhotoCount(photosRes.count ?? 0);
      setContentCount(contentRes.count ?? 0);
      setLoading(false);
    };
    fetchData();
  }, [businessId]);

  const checklist: ChecklistItem[] = [
    { key: "social", label: "Connect social accounts", icon: Share2, done: !!businessData?.social_accounts_connected || !!businessData?.facebook_page_id },
    { key: "photos", label: "Upload business photos", icon: ImageIcon, done: photoCount > 0 },
    { key: "budget", label: "Set your ad budget", icon: CreditCard, done: (businessData?.daily_budget ?? 0) > 0 },
    { key: "content", label: "Approve your first content", icon: FileText, done: contentCount > 0 },
    { key: "monday", label: "Your first week of content arrives Monday", icon: CalendarCheck, done: contentCount > 0 },
  ];

  const completedChecklist = checklist.filter(c => c.done).length;
  const showChecklist = completedChecklist < checklist.length;

  const summaryCards = [
    { label: "Total Reach", value: businessData?.total_reach?.toLocaleString() ?? "—", icon: Eye, change: "+24% this week" },
    { label: "Posts Published", value: businessData?.posts_published?.toString() ?? "—", icon: Sparkles, change: "AI generated" },
    { label: "Total Spend", value: businessData?.total_spend != null ? `$${businessData.total_spend}` : "—", icon: DollarSign, change: "Optimized daily" },
    { label: "Avg ROAS", value: businessData?.avg_roas != null ? `${businessData.avg_roas}x` : "—", icon: TrendingUp, change: "Return on ad spend" },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-40 rounded-2xl border border-border bg-card animate-pulse-soft" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="h-64 rounded-2xl border border-border bg-card animate-pulse-soft" />
      </div>
    );
  }

  const hasData = stats.length > 0 || (businessData?.total_reach && businessData.total_reach > 0);

  return (
    <div className="space-y-5">
      {/* Getting Started Checklist */}
      {showChecklist && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Getting started</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{completedChecklist} of {checklist.length} complete</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xs font-bold text-primary">{Math.round((completedChecklist / checklist.length) * 100)}%</span>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden mb-4">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(completedChecklist / checklist.length) * 100}%` }} />
          </div>
          <div className="space-y-2">
            {checklist.map(item => (
              <div key={item.key} className="flex items-center gap-3 py-1.5">
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                )}
                <span className={`text-sm ${item.done ? "text-muted-foreground line-through" : "text-card-foreground font-medium"}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-card-hover">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8">
                <s.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-card-foreground">{s.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{s.change}</p>
          </div>
        ))}
      </div>

      {!hasData ? (
        <EmptyOverview />
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-card-foreground">Reach — Last 30 Days</h3>
            <div className="mt-4">
              <div className="flex h-48 items-end gap-1">
                {[...stats].reverse().map((s, i) => {
                  const max = Math.max(...stats.map((d) => d.total_reach || 1));
                  const height = ((s.total_reach || 0) / max) * 100;
                  return (
                    <div key={i} className="flex-1 rounded-t bg-primary/15 transition-all duration-200 hover:bg-primary/30" style={{ height: `${height}%` }} title={`${s.recorded_at}: ${s.total_reach}`} />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-card-foreground">Quick Actions</h3>
              <div className="mt-4 space-y-2">
                <Button variant="outline" className="w-full justify-between text-sm h-10">Generate content now <ArrowRight className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" className="w-full justify-between text-sm h-10">View this week's posts <ArrowRight className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" className="w-full justify-between text-sm h-10">Check ad performance <ArrowRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-card-foreground">Recent Activity</h3>
              <div className="mt-4 space-y-3">
                {stats.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <p className="text-xs text-muted-foreground">
                      {s.recorded_at}: IG reach {s.ig_reach?.toLocaleString() ?? 0}, FB reach {s.fb_reach?.toLocaleString() ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
