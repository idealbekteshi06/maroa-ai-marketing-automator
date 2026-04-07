import { useState } from "react";
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ThumbsUp, Share2, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { toast } from "sonner";

interface ContentItem {
  id: string;
  instagram_caption: string | null;
  instagram_caption_2?: string | null;
  facebook_post: string | null;
  instagram_story_text?: string | null;
  email_subject: string | null;
  email_body: string | null;
  blog_title?: string | null;
  google_ad_headline?: string | null;
  google_ad_description?: string | null;
  content_theme: string | null;
  image_url: string | null;
  status: string;
  created_at?: string;
}

interface PostPreviewModalProps {
  item: ContentItem;
  businessName: string;
  businessId?: string;
  onClose: () => void;
  onApproved: () => void;
}

const statusColors: Record<string, string> = {
  published: "bg-green-500/10 text-green-600 dark:text-green-400",
  approved: "bg-primary/10 text-primary",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  pending_approval: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "pending approval": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default function PostPreviewModal({ item, businessName, businessId, onClose, onApproved }: PostPreviewModalProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    instagram_caption: item.instagram_caption ?? "",
    instagram_caption_2: item.instagram_caption_2 ?? "",
    facebook_post: item.facebook_post ?? "",
    instagram_story_text: item.instagram_story_text ?? "",
    email_subject: item.email_subject ?? "",
    email_body: item.email_body ?? "",
    blog_title: item.blog_title ?? "",
    google_ad_headline: item.google_ad_headline ?? "",
    google_ad_description: item.google_ad_description ?? "",
    content_theme: item.content_theme ?? "",
  });

  const handleApprove = async () => {
    const { error } = await externalSupabase
      .from("generated_content")
      .update({ status: "approved" })
      .eq("id", item.id);
    if (error) { toast.error("Failed to approve"); return; }
    toast.success("Content approved!");
    void fetch("https://maroa-api-production.up.railway.app/webhook/content-approved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_id: item.id, business_id: businessId }),
    }).catch(console.warn);
    onApproved();
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await externalSupabase
      .from("generated_content")
      .update({
        instagram_caption: form.instagram_caption || null,
        instagram_caption_2: form.instagram_caption_2 || null,
        facebook_post: form.facebook_post || null,
        instagram_story_text: form.instagram_story_text || null,
        email_subject: form.email_subject || null,
        email_body: form.email_body || null,
        blog_title: form.blog_title || null,
        google_ad_headline: form.google_ad_headline || null,
        google_ad_description: form.google_ad_description || null,
        content_theme: form.content_theme || null,
      })
      .eq("id", item.id);
    setSaving(false);
    if (error) { toast.error("Failed to save changes"); return; }
    toast.success("Content updated!");
    setEditing(false);
    onApproved();
  };

  const imgSrc = item.image_url || undefined;
  const initials = (businessName || "B")[0].toUpperCase();
  const isPending = item.status === "pending" || item.status === "pending_approval" || item.status === "pending approval";

  const contentFields = [
    { key: "instagram_caption", label: "Instagram Caption", type: "textarea" },
    { key: "instagram_caption_2", label: "Instagram Caption 2", type: "textarea" },
    { key: "facebook_post", label: "Facebook Post", type: "textarea" },
    { key: "instagram_story_text", label: "Instagram Story", type: "textarea" },
    { key: "email_subject", label: "Email Subject", type: "input" },
    { key: "email_body", label: "Email Body", type: "textarea" },
    { key: "blog_title", label: "Blog Title", type: "input" },
    { key: "google_ad_headline", label: "Google Ad Headline", type: "input" },
    { key: "google_ad_description", label: "Google Ad Description", type: "textarea" },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background border border-border p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-semibold text-foreground">Content Details</h2>
          <span className={`rounded-full px-3 py-1 text-[11px] font-medium capitalize ${statusColors[item.status] ?? statusColors.pending}`}>
            {item.status?.replace(/_/g, " ")}
          </span>
          {item.created_at && (
            <span className="text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: All content fields */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">All Content Fields</p>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditing(!editing)}>
                {editing ? <><X className="mr-1.5 h-3 w-3" /> Cancel</> : <><Pencil className="mr-1.5 h-3 w-3" /> Edit</>}
              </Button>
            </div>

            <div className="space-y-3">
              {contentFields.map(({ key, label, type }) => {
                const value = form[key as keyof typeof form];
                if (!editing && !value) return null;
                return (
                  <div key={key} className="rounded-xl border border-border bg-card p-4">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
                    {editing ? (
                      type === "textarea" ? (
                        <Textarea
                          value={value}
                          onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                          className="mt-2 text-sm"
                          rows={3}
                        />
                      ) : (
                        <Input
                          value={value}
                          onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                          className="mt-2 text-sm"
                        />
                      )
                    ) : (
                      <p className="mt-1.5 text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">{value}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {editing && (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>

          {/* Right: Phone previews */}
          <div className="space-y-4">
            {/* Instagram Preview */}
            <div className="mx-auto w-full max-w-[280px]">
              <div className="rounded-[2rem] border-2 border-border bg-card p-2 shadow-sm">
                <div className="rounded-[1.5rem] overflow-hidden bg-background">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{initials}</div>
                    <span className="text-[11px] font-semibold text-foreground">{businessName || "yourbusiness"}</span>
                    <MoreHorizontal className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  {imgSrc ? (
                    <img src={imgSrc} alt="Post" className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-3xl">📸</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <div className="flex items-center gap-3">
                      <Heart className="h-4 w-4 text-foreground" />
                      <MessageCircle className="h-4 w-4 text-foreground" />
                      <Send className="h-4 w-4 text-foreground" />
                    </div>
                    <Bookmark className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="px-3 pb-2.5">
                    <p className="text-[10px] text-foreground leading-relaxed">
                      <span className="font-semibold">{businessName?.toLowerCase().replace(/\s/g, "")} </span>
                      {(form.instagram_caption || "Caption preview...").slice(0, 150)}
                      {(form.instagram_caption || "").length > 150 && <span className="text-muted-foreground">...more</span>}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-1.5 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Instagram</p>
            </div>

            {/* Facebook Preview */}
            <div className="mx-auto w-full max-w-[280px]">
              <div className="rounded-[2rem] border-2 border-border bg-card p-2 shadow-sm">
                <div className="rounded-[1.5rem] overflow-hidden bg-background">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{initials}</div>
                    <div>
                      <span className="text-[11px] font-semibold text-foreground">{businessName || "Business"}</span>
                      <p className="text-[9px] text-muted-foreground">Just now · 🌐</p>
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-[10px] text-foreground leading-relaxed">
                      {(form.facebook_post || form.instagram_caption || "Post preview...").slice(0, 200)}
                    </p>
                  </div>
                  {imgSrc && <img src={imgSrc} alt="Post" className="w-full aspect-video object-cover" />}
                  <div className="flex items-center justify-around border-t border-border px-2 py-1.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Like</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Comment</span>
                    <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Share</span>
                  </div>
                </div>
              </div>
              <p className="mt-1.5 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Facebook</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center gap-3 border-t border-border pt-6">
          {isPending && (
            <Button onClick={handleApprove} size="lg" className="min-w-[160px]">
              <Check className="mr-2 h-4 w-4" /> Approve & Schedule
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
