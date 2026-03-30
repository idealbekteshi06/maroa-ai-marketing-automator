import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FileText, Search as SearchIcon, Calendar, List, ChevronLeft, ChevronRight, Loader2, Sparkles, Copy } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PostPreviewModal from "@/components/dashboard/PostPreviewModal";

interface ContentItem {
  id: string;
  instagram_caption: string | null;
  instagram_caption_2: string | null;
  facebook_post: string | null;
  instagram_story_text: string | null;
  email_subject: string | null;
  email_body: string | null;
  blog_title: string | null;
  google_ad_headline: string | null;
  google_ad_description: string | null;
  image_url: string | null;
  content_theme: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  published: "bg-green-500/10 text-green-600 dark:text-green-400",
  approved: "bg-primary/10 text-primary",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "pending approval": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  pending_approval: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};
const statusLabels: Record<string, string> = {
  published: "Published", approved: "Approved", pending: "Pending",
  "pending approval": "Pending", pending_approval: "Pending",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardContent() {
  const { businessId, user, isReady } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [businessName, setBusinessName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState("");

  const fetchContent = async () => {
    if (!businessId || !isReady) return;
    setLoading(true);
    const { data } = await externalSupabase.from("generated_content").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
    setContent((data as ContentItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
    if (businessId && isReady) {
      externalSupabase.from("businesses").select("business_name").eq("id", businessId).maybeSingle()
        .then(({ data }) => setBusinessName(data?.business_name || ""));
    }
  }, [businessId, isReady]);

  const handleGenerateNow = async () => {
    if (!businessId) return;
    setGenerating(true);
    setGenMessage("Claude is writing your content...");
    try {
      await fetch("https://maroa-api-production.up.railway.app/webhook/instant-content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, email: user?.email ?? "" }),
      });
      toast.success("Content generation started!");
      // Typing animation messages
      const msgs = ["Analyzing your brand voice...", "Crafting Instagram captions...", "Writing Facebook posts...", "Generating email copy...", "Finishing up..."];
      for (let i = 0; i < msgs.length; i++) {
        await new Promise(r => setTimeout(r, 4000));
        setGenMessage(msgs[i]);
      }
      await new Promise(r => setTimeout(r, 5000));
      await fetchContent();
    } catch { toast.error("Failed to trigger content generation"); }
    finally { setGenerating(false); setGenMessage(""); }
  };

  const handleApprove = async (id: string) => {
    const { error } = await externalSupabase.from("generated_content").update({ status: "approved" }).eq("id", id);
    if (error) { toast.error("Failed to approve"); return; }
    toast.success("Content approved!");
    void fetch("https://maroa-api-production.up.railway.app/webhook/content-approved", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_id: id, business_id: businessId }),
    }).catch(console.warn);
    fetchContent();
  };

  const statusCounts = {
    all: content.length,
    pending: content.filter(c => c.status === "pending" || c.status === "pending_approval" || c.status === "pending approval").length,
    approved: content.filter(c => c.status === "approved").length,
    published: content.filter(c => c.status === "published").length,
  };

  const filtered = content.filter(c => {
    const matchSearch = !searchQuery || c.content_theme?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter ||
      (statusFilter === "pending" && (c.status === "pending" || c.status === "pending_approval" || c.status === "pending approval"));
    return matchSearch && matchStatus;
  });

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

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl border border-border bg-card animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Generate now banner */}
      {generating && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium text-primary">{genMessage}</p>
            <p className="text-xs text-muted-foreground mt-0.5">This usually takes about 25 seconds</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by theme..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5 rounded-xl border border-border bg-card p-0.5">
            {(["all", "pending", "approved", "published"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {s === "all" ? "All" : s} <span className="ml-1 opacity-60">{statusCounts[s]}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 rounded-xl border border-border bg-card p-0.5">
            <button onClick={() => setViewMode("list")} className={`rounded-lg p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><List className="h-4 w-4" /></button>
            <button onClick={() => setViewMode("calendar")} className={`rounded-lg p-1.5 transition-colors ${viewMode === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><Calendar className="h-4 w-4" /></button>
          </div>
          <Button size="sm" className="h-9 text-xs" onClick={handleGenerateNow} disabled={generating}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate Now
          </Button>
        </div>
      </div>

      {/* Calendar view */}
      {viewMode === "calendar" ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronLeft className="h-4 w-4" /></button>
            <h3 className="text-sm font-semibold text-card-foreground">{new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => <div key={d} className="py-2 text-center text-[10px] font-medium text-muted-foreground">{d}</div>)}
            {monthDays.map((day, i) => {
              const items = day ? contentByDay[day] : undefined;
              return (
                <Popover key={i}>
                  <PopoverTrigger asChild>
                    <div className={`min-h-[48px] rounded-lg border border-transparent p-1 text-center text-xs transition-colors ${day ? "cursor-pointer hover:bg-muted" : ""} ${items?.length ? "border-primary/20 bg-primary/5" : ""}`}>
                      {day && <><span className="text-foreground">{day}</span>{items && <div className="mt-1 flex justify-center gap-0.5">{items.slice(0, 3).map(c => <span key={c.id} className="h-1.5 w-1.5 rounded-full bg-primary" />)}</div>}</>}
                    </div>
                  </PopoverTrigger>
                  {items && items.length > 0 && (
                    <PopoverContent className="w-72 p-3">
                      <p className="text-xs font-semibold text-foreground mb-2">{items.length} piece{items.length > 1 ? "s" : ""}</p>
                      {items.map(c => (
                        <div key={c.id} className="mb-2 last:mb-0 rounded-lg bg-muted/50 p-2 cursor-pointer hover:bg-muted transition-colors" onClick={() => setPreviewItem(c)}>
                          <p className="text-xs text-foreground truncate">{c.content_theme || c.instagram_caption || "Content"}</p>
                          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium capitalize ${statusColors[c.status] ?? statusColors.pending}`}>{statusLabels[c.status] ?? c.status}</span>
                        </div>
                      ))}
                    </PopoverContent>
                  )}
                </Popover>
              );
            })}
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <div key={c.id} className="group rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md cursor-pointer" onClick={() => setPreviewItem(c)}>
              {c.image_url && <img src={c.image_url} alt="" className="w-full h-32 rounded-xl object-cover mb-3" loading="lazy" />}
              <div className="flex items-center gap-2 mb-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize ${statusColors[c.status] ?? statusColors.pending}`}>{statusLabels[c.status] ?? c.status}</span>
                {c.content_theme && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">{c.content_theme}</span>}
              </div>
              <p className="text-sm text-card-foreground line-clamp-3 leading-relaxed">{c.instagram_caption || c.facebook_post || c.email_subject || "Content"}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  {(c.status === "pending" || c.status === "pending_approval" || c.status === "pending approval") && (
                    <Button size="sm" className="h-7 text-[10px] px-2.5" onClick={() => handleApprove(c.id)}>Approve</Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => { navigator.clipboard.writeText(c.instagram_caption || c.facebook_post || ""); toast.success("Copied!"); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : content.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">Your AI content engine runs every Monday at 9am</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            It writes Instagram captions, Facebook posts, emails, Google ads and blog titles — all in your brand voice. Click Generate Now to get your first batch instantly.
          </p>
          <Button className="mt-5" onClick={handleGenerateNow} disabled={generating}><Sparkles className="mr-2 h-4 w-4" /> Generate Now</Button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No content matches your search.</p>
        </div>
      )}

      {previewItem && (
        <PostPreviewModal item={previewItem} businessName={businessName} businessId={businessId ?? undefined}
          onClose={() => setPreviewItem(null)} onApproved={() => { setPreviewItem(null); fetchContent(); }} />
      )}
    </div>
  );
}
