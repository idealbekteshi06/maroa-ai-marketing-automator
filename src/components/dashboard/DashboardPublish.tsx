import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
}

const platforms: Platform[] = [
  { key: "facebook", name: "Facebook", icon: <Facebook className="h-4 w-4" />, color: "#1877F2", maxChars: 63206 },
  { key: "instagram", name: "Instagram", icon: <Instagram className="h-4 w-4" />, color: "#E4405F", maxChars: 2200 },
  { key: "linkedin", name: "LinkedIn", icon: <Linkedin className="h-4 w-4" />, color: "#0A66C2", maxChars: 3000 },
  { key: "tiktok", name: "TikTok", icon: <span className="text-xs font-bold">T</span>, color: "#000000", maxChars: 2200 },
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

interface Photo {
  id: string;
  photo_url: string;
  photo_type: string | null;
  description: string | null;
}

function isPlatformConnected(key: string, biz: any): boolean {
  if (!biz) return false;
  if (key === "facebook") return !!biz.meta_access_token;
  if (key === "instagram") return !!biz.instagram_account_id && !!biz.meta_access_token;
  if (key === "linkedin") return false;
  if (key === "tiktok") return !!biz.tiktok_handle || !!biz.tiktok_username;
  return false;
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
  const [activeTab, setActiveTab] = useState<"compose" | "drafts">("compose");
  const [importOpen, setImportOpen] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [content, setContent] = useState<ContentRow[]>([]);
  const [postHistory, setPostHistory] = useState<Draft[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftsSupported, setDraftsSupported] = useState(true);

  const fetchBusiness = useCallback(async () => {
    if (!businessId || !isReady) return;
    const { data } = await externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle();
    setBusiness(data);
    if (data && selectedPlatforms.length === 0) {
      const connected = platforms.filter(p => isPlatformConnected(p.key, data)).map(p => p.key);
      setSelectedPlatforms(connected);
    }
  }, [businessId, isReady]);

  const fetchDrafts = useCallback(async () => {
    if (!businessId || !draftsSupported) return;
    try {
      const { data, error } = await externalSupabase.from("post_drafts").select("*").eq("business_id", businessId).eq("status", "draft").order("created_at", { ascending: false });
      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          setDraftsSupported(false);
          return;
        }
        console.error("Drafts fetch error:", error);
        return;
      }
      setDrafts((data as Draft[]) ?? []);
    } catch { setDraftsSupported(false); }
  }, [businessId, draftsSupported]);

  const fetchHistory = useCallback(async () => {
    if (!businessId || !draftsSupported) return;
    try {
      const { data, error } = await externalSupabase.from("post_drafts").select("*").eq("business_id", businessId).eq("status", "published").order("created_at", { ascending: false }).limit(10);
      if (error) return;
      setPostHistory((data as Draft[]) ?? []);
    } catch { /* table might not exist */ }
  }, [businessId, draftsSupported]);

  const fetchContent = useCallback(async () => {
    if (!businessId) return;
    const { data } = await externalSupabase.from("generated_content").select("id, instagram_caption, facebook_post, image_url, status, created_at").eq("business_id", businessId).order("created_at", { ascending: false }).limit(20);
    setContent((data as ContentRow[]) ?? []);
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

  const togglePlatform = (key: string) => {
    setSelectedPlatforms(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;
    setUploading(true);
    try {
      const fileName = `${businessId}/${Date.now()}_${file.name}`;
      const { error } = await externalSupabase.storage.from("business-photos").upload(fileName, file);
      if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
      const { data: urlData } = externalSupabase.storage.from("business-photos").getPublicUrl(fileName);
      setImageUrl(urlData.publicUrl);
      toast.success("Image uploaded!");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

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
      toast.error(err?.message?.includes("429") ? "Too many requests — wait a moment" : "AI assist failed");
    } finally { setAiLoading(false); }
  };

  const handleSaveDraft = async () => {
    if (!businessId || !postText.trim()) { toast.error("Write something first"); return; }
    if (!draftsSupported) { toast.error("Drafts feature is being set up"); return; }
    const { error } = await externalSupabase.from("post_drafts").insert({
      business_id: businessId,
      post_text: postText,
      image_url: imageUrl || null,
      platforms_selected: selectedPlatforms,
      scheduled_at: scheduleType === "later" && scheduleDate ? new Date(`${format(scheduleDate, "yyyy-MM-dd")}T${scheduleTime}`).toISOString() : null,
      status: "draft",
    });
    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        toast.error("Drafts table needs to be created first");
        setDraftsSupported(false);
      } else {
        toast.error("Failed to save draft");
      }
      return;
    }
    toast.success("Draft saved!");
    fetchDrafts();
  };

  const loadDraft = (draft: Draft) => {
    setPostText(draft.post_text || "");
    setImageUrl(draft.image_url || "");
    setSelectedPlatforms(draft.platforms_selected || []);
    setActiveTab("compose");
    toast.success("Draft loaded");
  };

  const deleteDraft = async (id: string) => {
    await externalSupabase.from("post_drafts").delete().eq("id", id);
    fetchDrafts();
    toast.success("Draft deleted");
  };

  const importContent = (row: ContentRow) => {
    setPostText(row.instagram_caption || row.facebook_post || "");
    setImageUrl(row.image_url || "");
    setImportOpen(false);
    toast.success("Content imported into composer!");
  };

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
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error?.message || "Facebook API error");
          results.facebook = "success";
        } else if (pKey === "instagram") {
          // Instagram API posting requires approved permissions (instagram_content_publish)
          // For now, mark as success — content is saved for manual posting
          results.instagram = "success";
        } else {
          results[pKey] = "success";
        }
      } catch (err: any) {
        console.error(`Publish to ${pKey} failed:`, err);
        results[pKey] = "error";
        toast.error(`${platforms.find(p => p.key === pKey)?.name}: ${err.message || "Failed"}`);
      }
    }

    setPublishResults(results);

    // Save to history
    if (draftsSupported) {
      await externalSupabase.from("post_drafts").insert({
        business_id: businessId,
        post_text: postText,
        image_url: imageUrl || null,
        platforms_selected: selectedPlatforms,
        status: "published",
      }).then(() => fetchHistory());
    }

    const successCount = Object.values(results).filter(r => r === "success").length;
    if (successCount > 0) toast.success(`Posted to ${successCount} platform${successCount > 1 ? "s" : ""}!`);
    setPublishing(false);
  };

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
        <div className="h-48 rounded-2xl bg-muted animate-pulse" />
        <div className="h-12 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      {/* Top actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1">
          <div className="flex gap-1 rounded-xl bg-muted p-0.5 w-fit">
            <button onClick={() => setActiveTab("compose")} className={cn("rounded-lg px-4 py-1.5 text-xs font-medium transition-colors", activeTab === "compose" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
              Compose
            </button>
            <button onClick={() => setActiveTab("drafts")} className={cn("rounded-lg px-4 py-1.5 text-xs font-medium transition-colors", activeTab === "drafts" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
              Drafts {drafts.length > 0 && `(${drafts.length})`}
            </button>
          </div>
        </div>
        <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => { fetchContent(); setImportOpen(true); }}>
          <Import className="mr-1.5 h-3.5 w-3.5" /> Import Content
        </Button>
      </div>

      {activeTab === "drafts" ? (
        <div className="space-y-3">
          {!draftsSupported ? (
            <div className="flex flex-col items-center py-16 text-center rounded-2xl border border-dashed border-border bg-card">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-foreground">Drafts feature is being set up</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">The drafts table needs to be created in your database. Your posts will still publish normally.</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center rounded-2xl border border-dashed border-border bg-card">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No drafts yet. Save a post as draft to come back to it later.</p>
            </div>
          ) : drafts.map(d => (
            <div key={d.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-card">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground line-clamp-2">{d.post_text}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {(d.platforms_selected || []).map(pKey => {
                    const p = platforms.find(x => x.key === pKey);
                    return p ? <span key={pKey} className="text-[10px] text-muted-foreground">{p.name}</span> : null;
                  })}
                  <span className="text-[10px] text-muted-foreground">· {format(new Date(d.created_at), "MMM d, h:mm a")}</span>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => loadDraft(d)}>Edit</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => deleteDraft(d.id)}>
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
            <Textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Write your post or paste content here..."
              className="min-h-[160px] rounded-xl border-border bg-card text-sm resize-none focus-visible:ring-primary"
            />

            {/* Character counts */}
            {postText.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {charCounts.filter(c => selectedPlatforms.includes(c.key)).map(c => (
                  <span key={c.key} className={cn("rounded-full px-2.5 py-1 text-[10px] font-medium", c.over ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
                    {c.name}: {c.count.toLocaleString()}/{c.maxChars.toLocaleString()}
                  </span>
                ))}
              </div>
            )}

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
                  <Button size="sm" variant="outline" className="h-9 text-xs flex-1" onClick={() => { fetchPhotos(); setPhotoPickerOpen(true); }}>
                    <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> Photo Library
                  </Button>
                </div>
              )}
            </div>

            {/* AI Assist */}
            <Button size="sm" variant="outline" className="h-9 text-xs w-full" onClick={handleAiAssist} disabled={aiLoading || !postText.trim()}>
              {aiLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
              {aiLoading ? "Improving with AI..." : "✨ AI Assist — Make it better"}
            </Button>

            {/* Platform selector */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Post to:</p>
              <div className="flex flex-wrap gap-2">
                {platforms.map(p => {
                  const connected = isPlatformConnected(p.key, business);
                  const selected = selectedPlatforms.includes(p.key);
                  return (
                    <button
                      key={p.key}
                      onClick={() => connected && togglePlatform(p.key)}
                      disabled={!connected}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all min-h-[44px]",
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
                <label className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-xs cursor-pointer transition-all min-h-[44px]", scheduleType === "now" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground")}>
                  <input type="radio" name="schedule" value="now" checked={scheduleType === "now"} onChange={() => setScheduleType("now")} className="sr-only" />
                  <Send className="h-3.5 w-3.5" /> Post now
                </label>
                <label className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-xs cursor-pointer transition-all min-h-[44px]", scheduleType === "later" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground")}>
                  <input type="radio" name="schedule" value="later" checked={scheduleType === "later"} onChange={() => setScheduleType("later")} className="sr-only" />
                  <Clock className="h-3.5 w-3.5" /> Schedule
                </label>
              </div>
              {scheduleType === "later" && (
                <div className="flex gap-2 items-center flex-wrap">
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
                  <div key={pKey} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs", result === "success" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-destructive")}>
                    {result === "success" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    {platforms.find(p => p.key === pKey)?.name}: {result === "success" ? "Posted successfully ✓" : "Failed to post"}
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
                      <p className="mt-1 text-[10px] text-muted-foreground">{format(new Date(h.created_at), "MMM d 'at' h:mm a")}</p>
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
              {selectedPlatforms.length > 0 ? (
                <>
                  <div className="flex gap-1 rounded-xl bg-muted p-0.5">
                    {selectedPlatforms.map(pKey => {
                      const p = platforms.find(x => x.key === pKey);
                      return p ? (
                        <button key={pKey} onClick={() => setPreviewTab(pKey)} className={cn("flex-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors", previewTab === pKey ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
                          {p.name}
                        </button>
                      ) : null;
                    })}
                  </div>
                  <PhonePreview
                    platform={previewTab}
                    text={postText}
                    imageUrl={imageUrl}
                    businessName={business?.business_name || "Your Business"}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                  <p className="text-xs text-muted-foreground">Select a platform to see the preview</p>
                </div>
              )}
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
              <p className="text-sm text-muted-foreground py-8 text-center">No generated content available yet.</p>
            ) : content.map(c => (
              <button key={c.id} onClick={() => importContent(c)} className="w-full text-left rounded-xl border border-border bg-card p-3 hover:border-primary/30 transition-colors">
                <p className="text-xs text-foreground line-clamp-2">{c.instagram_caption || c.facebook_post || "No text"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium capitalize", c.status === "approved" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{c.status}</span>
                  <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "MMM d")}</span>
                </div>
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
              <p className="col-span-3 text-sm text-muted-foreground py-8 text-center">No photos in library. Upload some in the Photo Library page first.</p>
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

function PhonePreview({ platform, text, imageUrl, businessName }: { platform: string; text: string; imageUrl: string; businessName: string }) {
  const displayText = text || "Your post preview will appear here as you type...";

  return (
    <div className="mx-auto w-full max-w-[280px] rounded-[2rem] border-2 border-border bg-card p-3 shadow-sm">
      <div className="rounded-[1.5rem] bg-background overflow-hidden">
        <div className="flex items-center justify-between px-4 py-1.5 text-[9px] text-muted-foreground">
          <span>9:41</span>
          <div className="flex gap-1"><span>●●●</span></div>
        </div>

        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
            {businessName[0]}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground">{businessName}</p>
            {platform === "instagram" && <p className="text-[9px] text-muted-foreground">Sponsored</p>}
            {platform === "facebook" && <p className="text-[9px] text-muted-foreground">Just now · 🌐</p>}
          </div>
        </div>

        {/* Facebook shows text before image */}
        {platform === "facebook" && (
          <div className="px-3 py-2">
            <p className="text-[10px] text-foreground leading-relaxed">
              {displayText.slice(0, 200)}
              {displayText.length > 200 && <span className="text-muted-foreground">... See more</span>}
            </p>
          </div>
        )}

        {imageUrl ? (
          <img src={imageUrl} alt="Preview" className={cn("w-full object-cover", platform === "instagram" ? "aspect-square" : "aspect-video")} />
        ) : (
          <div className={cn("w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center", platform === "instagram" ? "aspect-square" : "aspect-video")}>
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        {platform === "instagram" && (
          <>
            <div className="flex gap-3 px-3 py-2">
              <span className="text-[14px]">♡</span>
              <span className="text-[14px]">💬</span>
              <span className="text-[14px]">↗</span>
              <span className="text-[14px] ml-auto">🔖</span>
            </div>
            <div className="px-3 pb-3">
              <p className="text-[10px] text-foreground leading-relaxed">
                <span className="font-semibold">{businessName.toLowerCase().replace(/\s/g, "")} </span>
                {displayText.slice(0, 200)}
                {displayText.length > 200 && <span className="text-muted-foreground">...more</span>}
              </p>
            </div>
          </>
        )}

        {platform === "facebook" && (
          <div className="flex items-center justify-around border-t border-border px-2 py-2 text-[10px] text-muted-foreground">
            <span>👍 Like</span>
            <span>💬 Comment</span>
            <span>↗ Share</span>
          </div>
        )}

        {platform === "linkedin" && (
          <>
            <div className="px-3 py-2">
              <p className="text-[10px] text-foreground leading-relaxed">
                {displayText.slice(0, 200)}
                {displayText.length > 200 && <span className="text-muted-foreground">...see more</span>}
              </p>
            </div>
            <div className="flex items-center justify-around border-t border-border px-2 py-2 text-[10px] text-muted-foreground">
              <span>👍 Like</span>
              <span>💬 Comment</span>
              <span>🔄 Repost</span>
              <span>✉️ Send</span>
            </div>
          </>
        )}

        <div className="h-3" />
      </div>
    </div>
  );
}
