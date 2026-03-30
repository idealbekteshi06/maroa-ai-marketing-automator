import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FileText, Search as SearchIcon, Calendar, List, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PostPreviewModal from "@/components/dashboard/PostPreviewModal";

interface ContentItem {
  id: string;
  instagram_caption: string | null;
  instagram_caption_2: string | null;
  facebook_post: string | null;
  email_subject: string | null;
  email_body: string | null;
  image_url: string | null;
  content_theme: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  published: "bg-success/10 text-success",
  approved: "bg-primary/10 text-primary",
  pending: "bg-amber-500/10 text-amber-600",
  "pending approval": "bg-amber-500/10 text-amber-600",
  "pending_approval": "bg-amber-500/10 text-amber-600",
};

const statusLabels: Record<string, string> = {
  published: "Published",
  approved: "Approved",
  pending: "Pending",
  "pending approval": "Pending",
  "pending_approval": "Pending",
};

function SkeletonRow() {
  return <div className="h-24 rounded-2xl border border-border bg-card animate-pulse-soft" />;
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
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [editForm, setEditForm] = useState({ instagram_caption: "", facebook_post: "", email_subject: "", email_body: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [businessName, setBusinessName] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchContent = async () => {
    if (!businessId || !isReady) return;
    setLoading(true);
    const { data } = await externalSupabase
      .from("generated_content")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
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
    try {
      const email = user?.email ?? "";
      await fetch("https://maroa-api-production.up.railway.app/webhook/maroa-content-2026", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, email }),
      });
      toast.success("Content generation started! New posts will appear within 5 minutes.");
      // Auto-refresh after 10 seconds
      setTimeout(() => fetchContent(), 10000);
    } catch {
      toast.error("Failed to trigger content generation");
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id: string) => {
    const { error } = await externalSupabase.from("generated_content").update({ status: "approved" }).eq("id", id);
    if (error) { toast.error("Failed to approve"); return; }
    toast.success("Content approved!");
    void fetch("https://ideal.app.n8n.cloud/webhook/content-approved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_id: id, business_id: businessId }),
    }).catch((err) => console.warn("Content approved webhook failed:", err));
    fetchContent();
  };

  const openEdit = (item: ContentItem) => {
    setEditItem(item);
    setEditForm({
      instagram_caption: item.instagram_caption ?? "",
      facebook_post: item.facebook_post ?? "",
      email_subject: item.email_subject ?? "",
      email_body: item.email_body ?? "",
    });
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    setEditSaving(true);
    const { error } = await externalSupabase
      .from("generated_content")
      .update({
        instagram_caption: editForm.instagram_caption || null,
        facebook_post: editForm.facebook_post || null,
        email_subject: editForm.email_subject || null,
        email_body: editForm.email_body || null,
      })
      .eq("id", editItem.id);
    setEditSaving(false);
    if (error) { toast.error("Failed to save changes"); return; }
    toast.success("Content updated!");
    setEditItem(null);
    fetchContent();
  };

  const filtered = content.filter((c) => {
    const matchesSearch = !searchQuery ||
      c.content_theme?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instagram_caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.facebook_post?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter || 
      (statusFilter === "pending" && (c.status === "pending" || c.status === "pending approval" || c.status === "pending_approval"));
    return matchesSearch && matchesStatus;
  });

  const monthDays = getMonthDays(calYear, calMonth);
  const contentByDay: Record<number, ContentItem[]> = {};
  content.forEach((c) => {
    const d = new Date(c.created_at);
    if (d.getMonth() === calMonth && d.getFullYear() === calYear) {
      const day = d.getDate();
      if (!contentByDay[day]) contentByDay[day] = [];
      contentByDay[day].push(c);
    }
  });

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by theme..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-0.5">
            {["all", "pending", "approved", "published"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-xl border border-border bg-card p-0.5">
            <button onClick={() => setViewMode("list")} className={`rounded-lg p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("calendar")} className={`rounded-lg p-1.5 transition-colors ${viewMode === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              <Calendar className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" className="h-9 text-xs" onClick={handleGenerateNow} disabled={generating}>
            {generating ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating...</> : <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate Now</>}
          </Button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronLeft className="h-4 w-4" /></button>
            <h3 className="text-sm font-semibold text-card-foreground">
              {new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-[10px] font-medium text-muted-foreground">{d}</div>
            ))}
            {monthDays.map((day, i) => {
              const items = day ? contentByDay[day] : undefined;
              return (
                <Popover key={i}>
                  <PopoverTrigger asChild>
                    <div className={`min-h-[48px] rounded-lg border border-transparent p-1 text-center text-xs transition-colors ${
                      day ? "cursor-pointer hover:bg-muted" : ""
                    } ${items?.length ? "border-primary/20 bg-primary/5" : ""}`}>
                      {day && (
                        <>
                          <span className="text-foreground">{day}</span>
                          {items && (
                            <div className="mt-1 flex justify-center gap-0.5 flex-wrap">
                              {items.slice(0, 3).map((c) => (
                                <span key={c.id} className={`h-1.5 w-1.5 rounded-full ${
                                  c.facebook_post ? "bg-primary" : c.email_subject ? "bg-success" : "bg-destructive"
                                }`} />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </PopoverTrigger>
                  {items && items.length > 0 && (
                    <PopoverContent className="w-72 p-3">
                      <p className="text-xs font-semibold text-foreground mb-2">{items.length} piece{items.length > 1 ? "s" : ""} of content</p>
                      {items.map((c) => (
                        <div key={c.id} className="mb-2 last:mb-0 rounded-lg bg-muted/50 p-2 cursor-pointer hover:bg-muted transition-colors" onClick={() => setPreviewItem(c)}>
                          <p className="text-xs text-foreground truncate">{c.instagram_caption || c.facebook_post || c.email_subject || "Content"}</p>
                          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium capitalize ${statusColors[c.status] ?? statusColors.pending}`}>{statusLabels[c.status] ?? c.status}</span>
                        </div>
                      ))}
                    </PopoverContent>
                  )}
                </Popover>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> Instagram</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Facebook</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Email</span>
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-card sm:flex-row sm:items-center sm:justify-between cursor-pointer" onClick={() => setPreviewItem(c)}>
              <div className="flex gap-4 flex-1 min-w-0">
                {c.image_url && (
                  <img src={c.image_url} alt="Content" className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
                )}
                <div className="space-y-2 min-w-0">
                  {c.instagram_caption && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Instagram</span>
                      <p className="text-sm text-card-foreground truncate">{c.instagram_caption}</p>
                    </div>
                  )}
                  {c.facebook_post && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Facebook</span>
                      <p className="text-sm text-card-foreground truncate">{c.facebook_post}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap" onClick={(e) => e.stopPropagation()}>
                {c.content_theme && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">{c.content_theme}</span>
                )}
                <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-medium capitalize ${statusColors[c.status] ?? statusColors.pending}`}>
                  {statusLabels[c.status] ?? c.status}
                </span>
                {(c.status === "pending" || c.status === "pending approval" || c.status === "pending_approval") && (
                  <Button size="sm" className="h-8 text-xs" onClick={() => handleApprove(c.id)}>Approve</Button>
                )}
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openEdit(c)}>Edit</Button>
              </div>
            </div>
          ))}
        </div>
      ) : content.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">Your first week of content is being prepared</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            maroa.ai generates your posts every Monday at 9am. Or click Generate Now above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No content matches your search.</p>
        </div>
      )}

      {previewItem && (
        <PostPreviewModal
          item={previewItem}
          businessName={businessName}
          onClose={() => setPreviewItem(null)}
          onApproved={() => { setPreviewItem(null); fetchContent(); }}
        />
      )}

      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Content</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Instagram Caption</Label><Textarea value={editForm.instagram_caption} onChange={(e) => setEditForm(f => ({ ...f, instagram_caption: e.target.value }))} className="mt-1" rows={3} /></div>
            <div><Label>Facebook Post</Label><Textarea value={editForm.facebook_post} onChange={(e) => setEditForm(f => ({ ...f, facebook_post: e.target.value }))} className="mt-1" rows={3} /></div>
            <div><Label>Email Subject</Label><Input value={editForm.email_subject} onChange={(e) => setEditForm(f => ({ ...f, email_subject: e.target.value }))} className="mt-1" /></div>
            <div><Label>Email Body</Label><Textarea value={editForm.email_body} onChange={(e) => setEditForm(f => ({ ...f, email_body: e.target.value }))} className="mt-1" rows={4} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button onClick={handleEditSave} disabled={editSaving}>{editSaving ? "Saving..." : "Save changes"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
