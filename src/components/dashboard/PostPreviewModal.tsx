import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ThumbsUp, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { toast } from "sonner";

interface ContentItem {
  id: string;
  instagram_caption: string | null;
  facebook_post: string | null;
  image_url: string | null;
  status: string;
}

interface PostPreviewModalProps {
  item: ContentItem;
  businessName: string;
  onClose: () => void;
  onApproved: () => void;
}

export default function PostPreviewModal({ item, businessName, onClose, onApproved }: PostPreviewModalProps) {
  const handleApprove = async () => {
    const { error } = await externalSupabase
      .from("generated_content")
      .update({ status: "approved" })
      .eq("id", item.id);
    if (error) { toast.error("Failed to approve"); return; }
    toast.success("Content approved!");
    onApproved();
  };

  const imgSrc = item.image_url || undefined;
  const initials = (businessName || "B")[0].toUpperCase();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background border border-border p-6">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors">
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-foreground mb-6">Post Preview</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Instagram Phone */}
          <div className="mx-auto w-full max-w-[300px]">
            <div className="rounded-[2rem] border-2 border-border bg-card p-2 shadow-elevated">
              <div className="rounded-[1.5rem] overflow-hidden bg-background">
                {/* IG Header */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials}</div>
                  <span className="text-xs font-semibold text-foreground">{businessName || "yourbusiness"}</span>
                  <MoreHorizontal className="ml-auto h-4 w-4 text-muted-foreground" />
                </div>
                {/* Image */}
                {imgSrc ? (
                  <img src={imgSrc} alt="Post" className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-4xl">📸</span>
                  </div>
                )}
                {/* Actions */}
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-4">
                    <Heart className="h-5 w-5 text-foreground" />
                    <MessageCircle className="h-5 w-5 text-foreground" />
                    <Send className="h-5 w-5 text-foreground" />
                  </div>
                  <Bookmark className="h-5 w-5 text-foreground" />
                </div>
                {/* Caption */}
                <div className="px-3 pb-3">
                  <p className="text-xs text-foreground">
                    <span className="font-semibold">{businessName || "yourbusiness"}</span>{" "}
                    {item.instagram_caption || "No caption yet"}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Instagram</p>
          </div>

          {/* Facebook Phone */}
          <div className="mx-auto w-full max-w-[300px]">
            <div className="rounded-[2rem] border-2 border-border bg-card p-2 shadow-elevated">
              <div className="rounded-[1.5rem] overflow-hidden bg-background">
                {/* FB Header */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials}</div>
                  <div>
                    <span className="text-xs font-semibold text-foreground">{businessName || "Your Business"}</span>
                    <p className="text-[10px] text-muted-foreground">Just now · 🌐</p>
                  </div>
                </div>
                {/* Post text */}
                <div className="px-3 py-2">
                  <p className="text-xs text-foreground leading-relaxed">{item.facebook_post || item.instagram_caption || "No content yet"}</p>
                </div>
                {/* Image */}
                {imgSrc ? (
                  <img src={imgSrc} alt="Post" className="w-full aspect-video object-cover" />
                ) : (
                  <div className="w-full aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-4xl">📸</span>
                  </div>
                )}
                {/* Actions */}
                <div className="flex items-center justify-around border-t border-border px-2 py-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-[11px]">Like</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-[11px]">Comment</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Share2 className="h-4 w-4" />
                    <span className="text-[11px]">Share</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Facebook</p>
          </div>
        </div>

        {/* Approve button */}
        <div className="mt-6 flex justify-center gap-3">
          {item.status !== "approved" && item.status !== "published" && (
            <Button onClick={handleApprove} size="lg">Approve Content</Button>
          )}
          <Button variant="outline" size="lg" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
