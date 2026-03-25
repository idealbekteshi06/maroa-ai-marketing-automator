import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

export default function DashboardContent() {
  const { businessId } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="space-y-3 pb-20 md:pb-0">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">AI-generated content ready for your review.</p>
        <Button size="sm">Generate new</Button>
      </div>

      <div className="space-y-3">
        {content.map((c) => (
          <div key={c.id} className="flex flex-col gap-4 rounded-2xl bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-2">
              {c.instagram_caption && (
                <div>
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">Instagram</span>
                  <p className="text-sm text-card-foreground">{c.instagram_caption}</p>
                </div>
              )}
              {c.facebook_post && (
                <div>
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">Facebook</span>
                  <p className="text-sm text-card-foreground">{c.facebook_post}</p>
                </div>
              )}
              {c.image_url && (
                <img src={c.image_url} alt="Content preview" className="mt-2 h-16 w-16 rounded-xl object-cover" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColors[c.status] ?? statusColors.pending}`}>
                {c.status === "pending" ? "Pending approval" : c.status}
              </span>
              {(c.status === "pending" || c.status === "pending approval") && (
                <>
                  <Button size="sm" onClick={() => handleApprove(c.id)}>Approve</Button>
                  <Button variant="outline" size="sm">Edit</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {content.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-foreground">No content yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Click "Generate new" to create your first AI content.</p>
        </div>
      )}
    </div>
  );
}
