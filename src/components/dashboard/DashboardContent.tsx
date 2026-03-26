import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FileText, Search as SearchIcon } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface ContentItem {
  id: string;
  instagram_caption: string | null;
  facebook_post: string | null;
  email_subject: string | null;
  email_body: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  published: "bg-success/10 text-success",
  approved: "bg-primary/10 text-primary",
  pending: "bg-muted text-muted-foreground",
  "pending approval": "bg-muted text-muted-foreground",
};

function SkeletonRow() {
  return <div className="h-24 rounded-2xl border border-border bg-card animate-pulse-soft" />;
}

export default function DashboardContent() {
  const { businessId, isReady } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [editForm, setEditForm] = useState({ instagram_caption: "", facebook_post: "", email_subject: "", email_body: "" });
  const [editSaving, setEditSaving] = useState(false);

  const fetchContent = async () => {
    if (!businessId || !isReady) return;
    setLoading(true);
    const { data, error } = await externalSupabase
      .from("generated_content")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) console.error("Content fetch error:", error);
    setContent((data as ContentItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchContent(); }, [businessId, isReady]);

  const handleApprove = async (id: string) => {
    const { error } = await externalSupabase
      .from("generated_content")
      .update({ status: "approved" })
      .eq("id", id);
    if (error) { toast.error("Failed to approve"); return; }
    toast.success("Content approved!");
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
      c.instagram_caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.facebook_post?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
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
        <Button size="sm" className="h-9 text-xs">Generate new</Button>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-card sm:flex-row sm:items-center sm:justify-between">
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
              <div className="flex items-center gap-2 shrink-0">
                <span className={`rounded-full px-3 py-1 text-[11px] font-medium capitalize ${statusColors[c.status] ?? statusColors.pending}`}>
                  {c.status === "pending" ? "Pending" : c.status}
                </span>
                {(c.status === "pending" || c.status === "pending approval") && (
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
            maroa.ai generates your posts every Monday at 9am. Check back Monday morning to see your Instagram captions, Facebook posts, emails and Google ads — all written in your brand voice automatically.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No content matches your search.</p>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Instagram Caption</Label>
              <Textarea value={editForm.instagram_caption} onChange={(e) => setEditForm(f => ({ ...f, instagram_caption: e.target.value }))} className="mt-1" rows={3} />
            </div>
            <div>
              <Label>Facebook Post</Label>
              <Textarea value={editForm.facebook_post} onChange={(e) => setEditForm(f => ({ ...f, facebook_post: e.target.value }))} className="mt-1" rows={3} />
            </div>
            <div>
              <Label>Email Subject</Label>
              <Input value={editForm.email_subject} onChange={(e) => setEditForm(f => ({ ...f, email_subject: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Email Body</Label>
              <Textarea value={editForm.email_body} onChange={(e) => setEditForm(f => ({ ...f, email_body: e.target.value }))} className="mt-1" rows={4} />
            </div>
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
