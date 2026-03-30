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
  id: string; instagram_caption: string | null; instagram_caption_2: string | null;
  facebook_post: string | null; instagram_story_text: string | null;
  email_subject: string | null; email_body: string | null; blog_title: string | null;
  google_ad_headline: string | null; google_ad_description: string | null;
  image_url: string | null; content_theme: string | null; status: string; created_at: string;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  published: { bg: "bg-success/10", text: "text-success", label: "Published" },
  approved: { bg: "bg-primary/10", text: "text-primary", label: "Approved" },
  pending: { bg: "bg-warning/10", text: "text-warning", label: "Pending" },
  "pending approval": { bg: "bg-warning/10", text: "text-warning", label: "Pending" },
  pending_approval: { bg: "bg-warning/10", text: "text-warning", label: "Pending" },
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
  return `${Math.floor(hrs / 24)}d ago`;
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
    setGenerating(true); setGenMessage("Writing your content...");
    try {
      await fetch("https://maroa-api-production.up.railway.app/webhook/instant-content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, email: user?.email ?? "" }),
      });
      toast.success("Content generation started!");
      const msgs = ["Analyzing your brand...", "Crafting captions...", "Writing posts...", "Generating ads...", "Finishing up..."];
      for (const msg of msgs) { await new Promise(r => setTimeout(r, 4000)); setGenMessage(msg); }
      await new Promise(r => setTimeout(r, 5000));
      await fetchContent();
    } catch { toast.error("Failed to generate"); }
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
    pending: content.filter(c => ["pending", "pending_approval", "pending approval"].includes(c.status)).length,
    approved: content.filter(c => c.status === "approved").length,
    published: content.filter(c => c.status === "published").length,
  };

  const filtered = content.filter(c => {
    const matchSearch = !searchQuery || c.content_theme?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter ||
      (statusFilter === "pending" && ["pending", "pending_approval", "pending approval"].includes(c.status));
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
    return <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-lg border border-border bg-card animate-pulse" />)}</div>;
  }

  const getStatus = (s: string) => statusConfig[s] ?? statusConfig.pending;

  return (
    <div className="space-y-4">
      {generating && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium text-primary">{genMessage}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">This takes about 25 seconds</p>
          </div>
        </div>
      )}

      {/* Toolbar — Meta Ads Manager style */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search themes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm bg-card" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex border border-border rounded-md overflow-hidden bg-card">
            {(["all", "pending", "approved", "published"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors border-r border-border last:border-0 ${
                  statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}>
                {s === "all" ? "All" : s} <span className="ml-0.5 opacity-60">{statusCounts[s]}</span>
              </button>
            ))}
          </div>
          <div className="flex border border-border rounded-md overflow-hidden bg-card">
            <button onClick={() => setViewMode("list")} className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}><List className="h-4 w-4" /></button>
            <button onClick={() => setViewMode("calendar")} className={`p-1.5 transition-colors border-l border-border ${viewMode === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}><Calendar className="h-4 w-4" /></button>
          </div>
          <Button size="sm" className="h-9 text-xs" onClick={handleGenerateNow} disabled={generating}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate Now
          </Button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="rounded-lg border border-border bg-card p-5 shadow-meta">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="p-1.5 rounded hover:bg-muted transition-colors"><ChevronLeft className="h-4 w-4" /></button>
            <h3 className="text-sm font-semibold text-foreground">{new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="p-1.5 rounded hover:bg-muted transition-colors"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => <div key={d} className="py-2 text-center text-[10px] font-medium text-muted-foreground">{d}</div>)}
            {monthDays.map((day, i) => {
              const items = day ? contentByDay[day] : undefined;
              return (
                <Popover key={i}>
                  <PopoverTrigger asChild>
                    <div className={`min-h-[48px] rounded p-1 text-center text-xs transition-colors ${day ? "cursor-pointer hover:bg-muted" : ""} ${items?.length ? "bg-primary/5 border border-primary/20" : "border border-transparent"}`}>
                      {day && <><span className="text-foreground">{day}</span>{items && <div className="mt-1 flex justify-center gap-0.5">{items.slice(0, 3).map(c => <span key={c.id} className="h-1.5 w-1.5 rounded-full bg-primary" />)}</div>}</>}
                    </div>
                  </PopoverTrigger>
                  {items && items.length > 0 && (
                    <PopoverContent className="w-72 p-3">
                      {items.map(c => (
                        <div key={c.id} className="mb-2 last:mb-0 rounded bg-muted p-2 cursor-pointer hover:bg-accent transition-colors" onClick={() => setPreviewItem(c)}>
                          <p className="text-xs text-foreground truncate">{c.content_theme || "Content"}</p>
                          <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[9px] font-medium ${getStatus(c.status).bg} ${getStatus(c.status).text}`}>{getStatus(c.status).label}</span>
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
          {filtered.map(c => {
            const st = getStatus(c.status);
            return (
              <div key={c.id} className="group rounded-lg border border-border bg-card p-4 shadow-meta transition-shadow hover:shadow-meta-hover cursor-pointer" onClick={() => setPreviewItem(c)}>
                {c.image_url && <img src={c.image_url} alt="" className="w-full h-32 rounded object-cover mb-3" loading="lazy" />}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${st.bg} ${st.text}`}>{st.label}</span>
                  {c.content_theme && <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{c.content_theme}</span>}
                </div>
                <p className="text-[13px] text-foreground line-clamp-3 leading-relaxed">{c.instagram_caption || c.facebook_post || c.email_subject || "Content"}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    {["pending", "pending_approval", "pending approval"].includes(c.status) && (
                      <Button size="sm" className="h-7 text-[10px] px-2.5" onClick={() => handleApprove(c.id)}>Approve</Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => { navigator.clipboard.writeText(c.instagram_caption || c.facebook_post || ""); toast.success("Copied!"); }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : content.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center shadow-meta">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">Your AI content engine runs every Monday at 9am</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">Writes Instagram captions, Facebook posts, emails, Google ads and blog titles — all in your brand voice.</p>
          <Button className="mt-4" onClick={handleGenerateNow} disabled={generating}><Sparkles className="mr-2 h-4 w-4" /> Generate Now</Button>
        </div>
      ) : (
        <div className="py-8 text-center"><p className="text-sm text-muted-foreground">No content matches your search.</p></div>
      )}

      {previewItem && (
        <PostPreviewModal item={previewItem} businessName={businessName} businessId={businessId ?? undefined}
          onClose={() => setPreviewItem(null)} onApproved={() => { setPreviewItem(null); fetchContent(); }} />
      )}
    </div>
  );
}
