import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FileText, Search as SearchIcon, Calendar, LayoutGrid, ChevronLeft, ChevronRight, Loader2, Sparkles, Eye, Check, Instagram, Facebook } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PostPreviewModal from "@/components/dashboard/PostPreviewModal";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

interface ContentItem {
  id: string; instagram_caption: string | null; instagram_caption_2: string | null;
  facebook_post: string | null; instagram_story_text: string | null;
  email_subject: string | null; email_body: string | null; blog_title: string | null;
  google_ad_headline: string | null; google_ad_description: string | null;
  image_url: string | null; content_theme: string | null; status: string; created_at: string;
  platform?: string | null;
}

const statusConfig: Record<string, { bg: string; text: string; label: string; overlay: string }> = {
  published: { bg: "bg-primary/10", text: "text-primary", label: "✓ Published", overlay: "bg-blue-600/80" },
  approved: { bg: "bg-success/10", text: "text-success", label: "✓ Approved", overlay: "bg-green-600/80" },
  pending: { bg: "bg-warning/10", text: "text-warning", label: "⚠ Needs Review", overlay: "bg-amber-500/80" },
  "pending approval": { bg: "bg-warning/10", text: "text-warning", label: "⚠ Needs Review", overlay: "bg-amber-500/80" },
  pending_approval: { bg: "bg-warning/10", text: "text-warning", label: "⚠ Needs Review", overlay: "bg-amber-500/80" },
  rejected: { bg: "bg-destructive/10", text: "text-destructive", label: "✕ Rejected", overlay: "bg-red-600/80" },
  draft: { bg: "bg-muted", text: "text-muted-foreground", label: "Draft", overlay: "bg-gray-600/80" },
};

function timeAgo(date: string) {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#6366F1", "#14B8A6", "#F43F5E"];
  return colors[Math.abs(hash) % colors.length];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export default function DashboardContent() {
  const { businessId, user, isReady } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [businessName, setBusinessName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState("");
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());

  const fetchContent = async () => {
    if (!businessId || !isReady) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await externalSupabase.from("generated_content").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
      setContent((data as ContentItem[]) ?? []);
    } catch { setContent([]); }
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
    if (businessId && isReady) {
      externalSupabase.from("businesses").select("business_name").eq("id", businessId).maybeSingle()
        .then(({ data }) => setBusinessName(data?.business_name || ""));
    }
  }, [businessId, isReady]);

  useEffect(() => {
    if (!businessId || !isReady) return;
    const channel = externalSupabase.channel(`content-status-${businessId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "generated_content", filter: `business_id=eq.${businessId}` }, (payload: any) => {
        const updated = payload.new;
        if (updated?.id) {
          setContent(prev => prev.map(c => c.id === updated.id ? { ...c, status: updated.status } : c));
          setChangedIds(prev => new Set(prev).add(updated.id));
          setTimeout(() => setChangedIds(prev => { const n = new Set(prev); n.delete(updated.id); return n; }), 2000);
          if (payload.old?.status !== "published" && updated.status === "published") toast.success(SUCCESS_MESSAGES.GENERATED);
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "generated_content", filter: `business_id=eq.${businessId}` }, (payload: any) => {
        if (payload.new) { setContent(prev => [payload.new as ContentItem, ...prev]); toast.success(SUCCESS_MESSAGES.GENERATED); }
      })
      .subscribe();
    return () => { externalSupabase.removeChannel(channel); };
  }, [businessId, isReady]);

  const handleGenerateNow = async () => {
    if (!businessId) return;
    setGenerating(true); setGenMessage("AI is writing your post...");
    toast("🤖 AI is creating content...");
    try {
      await fetch("https://maroa-api-production.up.railway.app/webhook/instant-content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, email: user?.email ?? "" }),
      });
      const msgs = ["Crafting captions...", "Generating image...", "Optimizing for platforms...", "Almost done..."];
      for (const msg of msgs) { await new Promise(r => setTimeout(r, 5000)); setGenMessage(msg); }
      await new Promise(r => setTimeout(r, 5000));
      toast.success(SUCCESS_MESSAGES.GENERATED);
      await fetchContent();
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setGenerating(false); setGenMessage(""); }
  };

  const handleApprove = async (id: string) => {
    const { error } = await externalSupabase.from("generated_content").update({ status: "approved" }).eq("id", id);
    if (error) { toast.error(ERROR_MESSAGES.GENERATION_FAILED); return; }
    toast.success(SUCCESS_MESSAGES.GENERATED);
    void fetch("https://maroa-api-production.up.railway.app/webhook/content-approved", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_id: id, business_id: businessId }),
    }).catch(console.warn);
    fetchContent();
  };

  const statusCounts = {
    all: content.length,
    pending: content.filter(c => ["pending", "pending_approval", "pending approval"].includes(c.status)).length,
    approved: content.filter(c => c.status === "approved").length,
    published: content.filter(c => c.status === "published").length,
  };

  const filtered = content.filter(c => {
    const matchSearch = !searchQuery || (c.instagram_caption || c.facebook_post || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter ||
      (statusFilter === "pending" && ["pending", "pending_approval", "pending approval"].includes(c.status));
    return matchSearch && matchStatus;
  });

  const getStatus = (s: string) => statusConfig[s] ?? statusConfig.pending;

  const monthDays = getMonthDays(calYear, calMonth);
  const contentByDay: Record<number, ContentItem[]> = {};
  content.forEach(c => {
    const d = new Date(c.created_at);
    if (d.getMonth() === calMonth && d.getFullYear() === calYear) {
      const day = d.getDate();
      if (!contentByDay[day]) contentByDay[day] = [];
      contentByDay[day].push(c);
    }
  });

  if (loading) return (
    <div className="space-y-4">
      <div className="h-10 w-48 skeleton rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-[280px] rounded-xl skeleton" />)}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      {generating && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div><p className="text-sm font-medium text-primary">{genMessage}</p><p className="text-[11px] text-muted-foreground mt-0.5">This takes about 25 seconds</p></div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search content..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm bg-card" />
          </div>
          <div className="hidden sm:flex gap-1">
            {(["all", "pending", "approved", "published"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {s === "all" ? "All" : s === "pending" ? "Review" : s.charAt(0).toUpperCase() + s.slice(1)} <span className="opacity-70">{statusCounts[s]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden bg-card">
            <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`} aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setViewMode("calendar")} className={`p-2 transition-colors border-l border-border ${viewMode === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`} aria-label="Calendar view"><Calendar className="h-4 w-4" /></button>
          </div>
          <Button className="h-9 text-sm px-5" onClick={handleGenerateNow} disabled={generating}>
            <Sparkles className="mr-2 h-4 w-4" /> Generate Post
          </Button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="p-1.5 rounded-lg hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
            <h3 className="text-sm font-semibold text-foreground">{new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="p-1.5 rounded-lg hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => <div key={d} className="py-2 text-center text-[10px] font-medium text-muted-foreground">{d}</div>)}
            {monthDays.map((day, i) => {
              const items = day ? contentByDay[day] : undefined;
              return (
                <Popover key={i}>
                  <PopoverTrigger asChild>
                    <div className={`min-h-[48px] rounded-lg p-1 text-center text-xs transition-colors ${day ? "cursor-pointer hover:bg-muted" : ""} ${items?.length ? "bg-primary/5 border border-primary/20" : "border border-transparent"}`}>
                      {day && <><span className="text-foreground">{day}</span>{items && <div className="mt-1 flex justify-center gap-0.5">{items.slice(0, 3).map(c => <span key={c.id} className="h-1.5 w-1.5 rounded-full bg-primary" />)}</div>}</>}
                    </div>
                  </PopoverTrigger>
                  {items && items.length > 0 && (
                    <PopoverContent className="w-72 p-3">{items.map(c => (
                      <div key={c.id} className="mb-2 last:mb-0 rounded-lg bg-muted p-2 cursor-pointer hover:bg-accent transition-colors" onClick={() => setPreviewItem(c)}>
                        <p className="text-xs text-foreground truncate">{c.instagram_caption?.slice(0, 60) || c.facebook_post?.slice(0, 60) || "Content"}</p>
                        <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[9px] font-medium ${getStatus(c.status).bg} ${getStatus(c.status).text}`}>{getStatus(c.status).label}</span>
                      </div>
                    ))}</PopoverContent>
                  )}
                </Popover>
              );
            })}
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => {
            const st = getStatus(c.status);
            const caption = c.instagram_caption || c.facebook_post || c.email_subject || "";
            const isPending = ["pending", "pending_approval", "pending approval"].includes(c.status);
            return (
              <div key={c.id}
                className={`group relative rounded-xl border bg-card overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg ${changedIds.has(c.id) ? "border-success/50 ring-1 ring-success/20" : "border-border"}`}
                onClick={() => setPreviewItem(c)}
              >
                {/* Image section — fixed 180px height */}
                <div className="relative h-[180px] bg-muted overflow-hidden">
                  {c.image_url ? (
                    <img src={c.image_url} alt="" className="h-full w-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: hashColor(c.content_theme || c.id) + "15" }}>
                      <span className="text-2xl font-bold opacity-25" style={{ color: hashColor(c.content_theme || c.id) }}>
                        {(c.content_theme || "C").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Status overlay badge */}
                  <span className={`absolute top-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-semibold text-white ${st.overlay}`}>{st.label}</span>
                  {/* Platform icons */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {(c.instagram_caption || c.platform === "instagram") && <div className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500"><Instagram className="h-3 w-3 text-white" /></div>}
                    {(c.facebook_post || c.platform === "facebook") && <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600"><Facebook className="h-3 w-3 text-white" /></div>}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-3">
                  <p className="text-[13px] text-foreground line-clamp-2 leading-relaxed">{caption || "Content"}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{timeAgo(c.created_at)}</p>
                </div>

                {/* Hover action row — desktop only, hidden on mobile to avoid blocking card tap */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card to-transparent pt-8 pb-3 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
                  <div className="flex gap-1.5 pointer-events-auto">
                    {isPending && (
                      <Button size="sm" className="h-7 text-[10px] flex-1" title="Content will publish at your optimal time" onClick={(e) => { e.stopPropagation(); handleApprove(c.id); }}>
                        <Check className="mr-1 h-3 w-3" /> Approve
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={(e) => { e.stopPropagation(); setPreviewItem(c); }}>
                      <Eye className="mr-1 h-3 w-3" /> Preview
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : content.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"><FileText className="h-6 w-6 text-primary" /></div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">Your AI generates content every Monday</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-sm">Captions, images, emails, and ads — all in your brand voice.</p>
          <Button className="mt-4" onClick={handleGenerateNow} disabled={generating}><Sparkles className="mr-2 h-4 w-4" /> Generate Now</Button>
        </div>
      ) : (
        <div className="py-8 text-center"><p className="text-sm text-muted-foreground">No content matches your filters.</p></div>
      )}

      {previewItem && (
        <PostPreviewModal item={previewItem} businessName={businessName} businessId={businessId ?? undefined}
          onClose={() => setPreviewItem(null)} onApproved={() => { setPreviewItem(null); fetchContent(); }} />
      )}
    </div>
  );
}
