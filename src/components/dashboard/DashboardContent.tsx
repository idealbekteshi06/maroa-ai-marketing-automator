import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FileText, Search as SearchIcon, Filter } from "lucide-react";

interface ContentItem {
  id: string;
  instagram_caption: string | null;
  facebook_post: string | null;
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
  const { businessId } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchContent = async () => {
    if (!businessId) return;
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

  useEffect(() => { fetchContent(); }, [businessId]);

  const handleApprove = async (id: string) => {
    const { error } = await externalSupabase
      .from("generated_content")
      .update({ status: "approved" })
      .eq("id", id);
    if (error) { toast.error("Failed to approve"); return; }
    toast.success("Content approved!");
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
      {/* Search & Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-0.5">
            {["all", "pending", "approved", "published"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" className="h-9 text-xs">Generate new</Button>
      </div>

      {/* Content list */}
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
                  <>
                    <Button size="sm" className="h-8 text-xs" onClick={() => handleApprove(c.id)}>Approve</Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs">Edit</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : content.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-5 text-base font-semibold text-foreground">Your content will appear here</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Your first week of content will appear here after maroa.ai generates it on Monday morning.
          </p>
          <Button className="mt-6" size="sm">Generate your first post</Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No content matches your search.</p>
        </div>
      )}
    </div>
  );
}
