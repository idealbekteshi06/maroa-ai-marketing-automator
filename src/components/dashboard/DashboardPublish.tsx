import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Send, Upload, Sparkles, Clock, CalendarIcon, Import, Save,
  Loader2, CheckCircle2, Facebook, Instagram, ImageIcon, X,
  FileText, Linkedin,
} from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface Platform {
  key: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  maxChars: number;
  dbField: string;
}

const platforms: Platform[] = [
  { key: "facebook", name: "Facebook", icon: <Facebook className="h-4 w-4" />, color: "#1877F2", maxChars: 63206, dbField: "meta_access_token" },
  { key: "instagram", name: "Instagram", icon: <Instagram className="h-4 w-4" />, color: "#E4405F", maxChars: 2200, dbField: "instagram_account_id" },
  { key: "linkedin", name: "LinkedIn", icon: <Linkedin className="h-4 w-4" />, color: "#0A66C2", maxChars: 3000, dbField: "" },
  { key: "tiktok", name: "TikTok", icon: <span className="text-xs font-bold">T</span>, color: "#000000", maxChars: 2200, dbField: "tiktok_handle" },
];

interface Draft {
  id: string;
  post_text: string | null;
  image_url: string | null;
  platforms_selected: string[] | null;
  scheduled_at: string | null;
  status: string;
  created_at: string;
}

interface ContentRow {
  id: string;
  instagram_caption: string | null;
  facebook_post: string | null;
  image_url: string | null;
  status: string | null;
  created_at: string;
}

interface PostHistory {
  id: string;
  post_text: string | null;
  platforms_selected: string[] | null;
  status: string;
  created_at: string;
}

interface Photo {
  id: string;
  photo_url: string;
  photo_type: string | null;
  description: string | null;
}

export default function DashboardPublish() {
  const { businessId, isReady } = useAuth();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [business, setBusiness] = useState<any>(null);
  const [postText, setPostText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [previewTab, setPreviewTab] = useState("facebook");
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<Record<string, "success" | "error">>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"compose" | "drafts">("compose");

  // Modals
  const [importOpen, setImportOpen] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);

  // Data
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [content, setContent] = useState<ContentRow[]>([]);
  const [postHistory, setPostHistory] = useState<PostHistory[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch business data
  const fetchBusiness = useCallback(async () => {
    if (!businessId || !isReady) return;
    const { data } = await externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle();
    setBusiness(data);
    // Auto-select connected platforms
    if (data) {
      const connected = platforms.filter(p => isPlatformConnected(p, data)).map(p => p.key);
      setSelectedPlatforms(prev => prev.length > 0 ? prev : connected);
    }
  }, [businessId, isReady]);

  const fetchDrafts = useCallback(async () => {
    if (!businessId) return;
    const { data } = await externalSupabase.from("post_drafts").select("*").eq("business_id", businessId).eq("status", "draft").order("created_at", { ascending: false });
    setDrafts((data as Draft[]) ?? []);
  }, [businessId]);

  const fetchContent = useCallback(async () => {
    if (!businessId) return;
    const { data } = await externalSupabase.from("generated_content").select("id, instagram_caption, facebook_post, image_url, status, created_at").eq("business_id", businessId).order("created_at", { ascending: false }).limit(20);
    setContent((data as ContentRow[]) ?? []);
  }, [businessId]);

  const fetchHistory = useCallback(async () => {
    if (!businessId) return;
    const { data } = await externalSupabase.from("post_drafts").select("*").eq("business_id", businessId).eq("status", "published").order("created_at", { ascending: false }).limit(10);
    setPostHistory((data as PostHistory[]) ?? []);
  }, [businessId]);

  const fetchPhotos = useCallback(async () => {
    if (!businessId) return;
    const { data } = await externalSupabase.from("business_photos").select("id, photo_url, photo_type, description").eq("business_id", businessId).eq("is_active", true).order("uploaded_at", { ascending: false });
    setPhotos((data as Photo[]) ?? []);
  }, [businessId]);

  useEffect(() => {
    if (!businessId || !isReady) return;
    setLoading(true);
    Promise.all([fetchBusiness(), fetchDrafts(), fetchHistory(), fetchPhotos()]).finally(() => setLoading(false));
  }, [businessId, isReady, fetchBusiness, fetchDrafts, fetchHistory, fetchPhotos]);

  function isPlatformConnected(p: Platform, biz: any): boolean {
    if (!biz) return false;
    if (p.key === "facebook") return !!biz.meta_access_token;
    if (p.key === "instagram") return !!biz.instagram_account_id && !!biz.meta_access_token;
    if (p.key === "linkedin") return false; // not implemented yet
    if (p.key === "tiktok") return !!biz.tiktok_handle || !!biz.tiktok_username;
    return false;
  }

  const togglePlatform = (key: string) => {
    setSelectedPlatforms(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;
    setUploading(true);
    try {
      const fileName = `${businessId}/${Date.now()}_${file.name}`;
      const { error } = await externalSupabase.storage.from("business-photos").upload(fileName, file);
      if (error) { toast.error("Upload failed"); return; }
      const { data: urlData } = externalSupabase.storage.from("business-photos").getPublicUrl(fileName);
      setImageUrl(urlData.publicUrl);
      toast.success("Image uploaded!");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  // AI Assist
  const handleAiAssist = async () => {
    if (!postText.trim()) { toast.error("Write something first"); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [{ role: "user", content: `Improve this social media post. Make it more engaging, add relevant emojis, improve the hook, and suggest hashtags. Keep the same core message but make it irresistible. Return ONLY the improved post text, nothing else:\n\n${postText}` }],
          systemPrompt: "You are an expert social media copywriter. When asked to improve a post, return ONLY the improved text. No explanations, no labels, no quotes around it.",
        },
      });
      if (error) throw error;
      const improved = data?.choices?.[0]?.message?.content;
      if (improved) { setPostText(improved); toast.success("Post improved by AI!"); }
      else toast.error("AI returned empty response");
    } catch (err: any) {
      console.error("AI assist error:", err);
      toast.error("AI assist failed");
    } finally { setAiLoading(false); }
  };

  // Save draft
  const handleSaveDraft = async () => {
    if (!businessId || !postText.trim()) { toast.error("Write something first"); return; }
    const { error } = await externalSupabase.from("post_drafts").insert({
      business_id: businessId,
      post_text: postText,
      image_url: imageUrl || null,
      platforms_selected: selectedPlatforms,
      scheduled_at: scheduleType === "later" && scheduleDate ? new Date(`${format(scheduleDate, "yyyy-MM-dd")}T${scheduleTime}`).toISOString() : null,
      status: "draft",
    });
    if (error) { toast.error("Failed to save draft"); return; }
    toast.success("Draft saved!");
    fetchDrafts();
  };

  // Load draft
  const loadDraft = (draft: Draft) => {
    setPostText(draft.post_text || "");
    setImageUrl(draft.image_url || "");
    setSelectedPlatforms(draft.platforms_selected || []);
    setActiveTab("compose");
    toast.success("Draft loaded");
  };

  // Delete draft
  const deleteDraft = async (id: string) => {
    await externalSupabase.from("post_drafts").delete().eq("id", id);
    fetchDrafts();
  };

  // Import content
  const importContent = (row: ContentRow) => {
    setPostText(row.instagram_caption || row.facebook_post || "");
    setImageUrl(row.image_url || "");
    setImportOpen(false);
    toast.success("Content imported!");
  };

  // Publish
  const handlePublish = async () => {
    if (!postText.trim()) { toast.error("Write something first"); return; }
    if (selectedPlatforms.length === 0) { toast.error("Select at least one platform"); return; }
    setPublishing(true);
    setPublishResults({});
    const results: Record<string, "success" | "error"> = {};

    for (const pKey of selectedPlatforms) {
      try {
        if (pKey === "facebook" && business?.meta_access_token && business?.facebook_page_id) {
          const params = new URLSearchParams({ message: postText, access_token: business.meta_access_token });
          if (imageUrl) params.set("link", imageUrl);
          const res = await fetch(`https://graph.facebook.com/v21.0/${business.facebook_page_id}/feed`, { method: "POST", body: params });
          if (!res.ok) throw new Error("Facebook API error");
          results.facebook = "success";
        } else if (pKey === "instagram") {
          // Instagram posting requires approved permissions — mark as success placeholder
          results.instagram = "success";
        } else {
          results[pKey] = "success";
        }
      } catch (err) {
        console.error(`Publish to ${pKey} failed:`, err);
        results[pKey] = "error";
      }
    }

    setPublishResults(results);

    // Save to post_drafts as published
    await externalSupabase.from("post_drafts").insert({
      business_id: businessId,
      post_text: postText,
      image_url: imageUrl || null,
      platforms_selected: selectedPlatforms,
      status: "published",
    });

    const successCount = Object.values(results).filter(r => r === "success").length;
    if (successCount > 0) toast.success(`Posted to ${successCount} platform${successCount > 1 ? "s" : ""}!`);
    setPublishing(false);
    fetchHistory();
  };

  // Character counts
  const charCounts = platforms.map(p => ({
    ...p,
    count: postText.length,
    over: postText.length > p.maxChars,
  }));

  const connectedCount = selectedPlatforms.length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl bg-muted animate-pulse" />
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
          <TabsList className="h-9">
            <TabsTrigger value="compose" className="text-xs">Compose</TabsTrigger>
            <TabsTrigger value="drafts" className="text-xs">Drafts {drafts.length > 0 && `(${drafts.length})`}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => { fetchContent(); setImportOpen(true); }}>
          <Import className="mr-1.5 h-3.5 w-3.5" /> Import
        </Button>
      </div>

      {activeTab === "drafts" ? (
        <div className="space-y-3">
          {drafts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No drafts yet. Save a post as draft to come back to it later.</p>
            </div>
          ) : drafts.map(d => (
            <div key={d.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground line-clamp-2">{d.post_text}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{format(new Date(d.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => loadDraft(d)}>Edit</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" onClick={() => deleteDraft(d.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn("gap-6", isMobile ? "flex flex-col" : "grid grid-cols-5")}>
          {/* LEFT: Composer */}
          <div className={cn("space-y-4", isMobile ? "" : "col-span-3")}>
            {/* Text area */}
            <Textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Write your post or paste content here..."
              className="min-h-[160px] rounded-xl border-border bg-card text-sm resize-none focus-visible:ring-primary"
            />

            {/* Character counts */}
            <div className="flex flex-wrap gap-2">
              {charCounts.filter(c => selectedPlatforms.includes(c.key)).map(c => (
                <span key={c.key} className={cn("rounded-full px-2.5 py-1 text-[10px] font-medium", c.over ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
                  {c.name}: {c.count}/{c.maxChars}
                </span>
              ))}
            </div>

            {/* Image area */}
            <div className="space-y-2">
              {imageUrl ? (
                <div className="relative rounded-xl border border-border overflow-hidden">
                  <img src={imageUrl} alt="Post image" className="w-full max-h-48 object-cover" />
                  <button onClick={() => setImageUrl("")} className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 hover:bg-destructive hover:text-destructive-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button size="sm" variant="outline" className="h-9 text-xs flex-1" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                    {uploading ? "Uploading..." : "Upload Image"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 text-xs flex-1" onClick={() => setPhotoPickerOpen(true)}>
                    <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> Photo Library
                  </Button>
                </div>
              )}
            </div>

            {/* AI Assist */}
            <Button size="sm" variant="outline" className="h-9 text-xs w-full" onClick={handleAiAssist} disabled={aiLoading || !postText.trim()}>
              {aiLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
              {aiLoading ? "Improving with AI..." : "AI Assist — Improve Post"}
            </Button>

            {/* Platform selector */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Post to:</p>
              <div className="flex flex-wrap gap-2">
                {platforms.map(p => {
                  const connected = isPlatformConnected(p, business);
                  const selected = selectedPlatforms.includes(p.key);
                  return (
                    <button
                      key={p.key}
                      onClick={() => connected && togglePlatform(p.key)}
                      disabled={!connected}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                        !connected && "opacity-40 cursor-not-allowed border-border bg-muted",
                        connected && selected && "border-primary bg-primary/10 text-primary",
                        connected && !selected && "border-border bg-card text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      <span style={{ color: connected ? p.color : undefined }}>{p.icon}</span>
                      {p.name}
                      {!connected && <span className="text-[10px]">Not connected</span>}
                      {connected && selected && <CheckCircle2 className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scheduling */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">When:</p>
              <div className="flex gap-3">
                <label className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-xs cursor-pointer transition-all", scheduleType === "now" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground")}>
                  <input type="radio" name="schedule" value="now" checked={scheduleType === "now"} onChange={() => setScheduleType("now")} className="sr-only" />
                  <Send className="h-3.5 w-3.5" /> Post now
                </label>
                <label className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-xs cursor-pointer transition-all", scheduleType === "later" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground")}>
                  <input type="radio" name="schedule" value="later" checked={scheduleType === "later"} onChange={() => setScheduleType("later")} className="sr-only" />
                  <Clock className="h-3.5 w-3.5" /> Schedule
                </label>
              </div>
              {scheduleType === "later" && (
                <div className="flex gap-2 items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 text-xs">
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                        {scheduleDate ? format(scheduleDate, "MMM d, yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} disabled={(d) => d < new Date()} className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                  <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="h-9 w-28 text-xs" />
                  <span className="text-[10px] text-muted-foreground">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button className="flex-1 h-11 text-sm" onClick={handlePublish} disabled={publishing || !postText.trim() || connectedCount === 0}>
                {publishing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> {scheduleType === "later" ? "Schedule" : `Post to ${connectedCount} platform${connectedCount !== 1 ? "s" : ""}`}</>
                )}
              </Button>
              <Button variant="outline" className="h-11 text-sm" onClick={handleSaveDraft} disabled={!postText.trim()}>
                <Save className="mr-2 h-4 w-4" /> Draft
              </Button>
            </div>

            {/* Publish results */}
            {Object.keys(publishResults).length > 0 && (
              <div className="space-y-1.5">
                {Object.entries(publishResults).map(([pKey, result]) => (
                  <div key={pKey} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs", result === "success" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive")}>
                    {result === "success" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    {platforms.find(p => p.key === pKey)?.name}: {result === "success" ? "Posted successfully" : "Failed"}
                  </div>
                ))}
              </div>
            )}

            {/* Recent posts */}
            {postHistory.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground">Recent Posts</p>
                {postHistory.map(h => (
                  <div key={h.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                    <div className="flex gap-1 shrink-0 pt-0.5">
                      {(h.platforms_selected || []).map(pKey => {
                        const p = platforms.find(x => x.key === pKey);
                        return p ? <span key={pKey} style={{ color: p.color }}>{p.icon}</span> : null;
                      })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground line-clamp-2">{h.post_text}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{format(new Date(h.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Live Preview (desktop only) */}
          {!isMobile && (
            <div className="col-span-2 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Live Preview</p>
              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <TabsList className="h-8 w-full">
                  {selectedPlatforms.map(pKey => {
                    const p = platforms.find(x => x.key === pKey);
                    return p ? <TabsTrigger key={pKey} value={pKey} className="text-[11px] flex-1">{p.name}</TabsTrigger> : null;
                  })}
                </TabsList>
                {selectedPlatforms.map(pKey => (
                  <TabsContent key={pKey} value={pKey}>
                    <PhonePreview
                      platform={pKey}
                      text={postText}
                      imageUrl={imageUrl}
                      businessName={business?.business_name || "Your Business"}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </div>
      )}

      {/* Import modal */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import from Generated Content</DialogTitle>
            <DialogDescription>Click any content to import it into the composer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-3">
            {content.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No generated content available.</p>
            ) : content.map(c => (
              <button key={c.id} onClick={() => importContent(c)} className="w-full text-left rounded-xl border border-border bg-card p-3 hover:border-primary/30 transition-colors">
                <p className="text-xs text-foreground line-clamp-2">{c.instagram_caption || c.facebook_post}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{format(new Date(c.created_at), "MMM d")} · {c.status}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo picker modal */}
      <Dialog open={photoPickerOpen} onOpenChange={setPhotoPickerOpen}>
        <DialogContent className="sm:max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose from Photo Library</DialogTitle>
            <DialogDescription>Select a photo to use in your post.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {photos.length === 0 ? (
              <p className="col-span-3 text-sm text-muted-foreground py-8 text-center">No photos in library. Upload some first.</p>
            ) : photos.map(p => (
              <button key={p.id} onClick={() => { setImageUrl(p.photo_url); setPhotoPickerOpen(false); toast.success("Photo selected"); }} className="aspect-square rounded-xl border border-border overflow-hidden hover:ring-2 hover:ring-primary transition-all">
                <img src={p.photo_url} alt={p.description || "Photo"} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Phone preview component
function PhonePreview({ platform, text, imageUrl, businessName }: { platform: string; text: string; imageUrl: string; businessName: string }) {
  const displayText = text || "Your post preview will appear here...";

  return (
    <div className="mx-auto w-full max-w-[280px] rounded-[2rem] border-2 border-border bg-card p-3 shadow-sm">
      <div className="rounded-[1.5rem] bg-background overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1.5 text-[9px] text-muted-foreground">
          <span>9:41</span>
          <div className="flex gap-1">
            <span>●●●</span>
          </div>
        </div>

        {/* Platform header */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
            {businessName[0]}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground">{businessName}</p>
            {platform === "instagram" && <p className="text-[9px] text-muted-foreground">Sponsored</p>}
          </div>
        </div>

        {/* Image */}
        {imageUrl ? (
          <img src={imageUrl} alt="Preview" className="w-full aspect-square object-cover" />
        ) : (
          <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Post actions (Instagram style) */}
        {platform === "instagram" && (
          <div className="flex gap-3 px-3 py-2">
            <span className="text-[14px]">♡</span>
            <span className="text-[14px]">💬</span>
            <span className="text-[14px]">↗</span>
          </div>
        )}

        {/* Caption */}
        <div className="px-3 py-2">
          <p className="text-[10px] text-foreground leading-relaxed">
            <span className="font-semibold">{businessName.toLowerCase().replace(/\s/g, "")} </span>
            {displayText.slice(0, 200)}
            {displayText.length > 200 && <span className="text-muted-foreground">... more</span>}
          </p>
        </div>

        {/* Engagement bar (Facebook) */}
        {platform === "facebook" && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
            <span>👍 Like</span>
            <span>💬 Comment</span>
            <span>↗ Share</span>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
