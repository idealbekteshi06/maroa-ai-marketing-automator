import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Image, Video, Plus, Download, Eye, Wand2, Upload, X, ImageIcon,
  Clock, Layers, Search, Sparkles, Film, Loader2, Send, CalendarClock, Link2,
} from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { generateContentNow } from "@/lib/apiClient";
import {
  setBrandAssets, wf10CreateJob, wf10GetJob, wf10ListJobs,
  socialPostNow, socialPostSchedule,
} from "@/lib/api";
import { toast } from "sonner";

type AssetType = "image" | "video";

/**
 * The Studio renders the SAME persisted assets the rest of the app reads from
 * the `generated_content` table (see DashboardContent / DashboardPublish) — the
 * media lives in the `image_url` column the generation backend writes. The
 * table is untyped (types.ts ships no Row definitions), so we declare the
 * columns we read, mirroring DashboardContent.
 */
interface GeneratedContentRow {
  id: string;
  image_url: string | null;
  instagram_caption: string | null;
  facebook_post: string | null;
  instagram_story_text: string | null;
  email_subject: string | null;
  content_theme: string | null;
  platform: string | null;
  status: string | null;
  created_at: string;
}

interface StudioAsset {
  id: string;
  prompt: string;
  type: AssetType;
  mediaUrl: string | null;
  gradient: string;
  createdAt: string;
}

/** Row shape of `studio_jobs` as returned by /webhook/wf10-job-get + jobs-list. */
interface StudioJobRow {
  id: string;
  status: string | null; // queued | processing | completed | failed
  request_kind: string | null;
  result_url: string | null;
  thumbnail_url: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
  brief?: Record<string, unknown> | null;
}

interface Wf10CreateResponse {
  jobId?: string;
  status?: string;
  plan?: string;
}

/** Per-target entry inside social-multi's postNow `results` array. */
interface SocialResultEntry {
  ok?: boolean;
  via?: string; // "ayrshare" | "meta_graph"
  platform?: string;
  platforms?: string[];
  reason?: string;
  error?: unknown;
  dry_run?: boolean;
}

interface SocialPostResponse {
  ok?: boolean;
  sent?: number;
  dry_run_count?: number;
  reason?: string;
  results?: SocialResultEntry[];
  // schedule-only fields
  queued_local?: boolean;
  ayrshare_id?: string;
  error?: string;
}

/** Exact platform keys routed by services/social-multi (SUPPORTED_PLATFORMS). */
const PUBLISH_PLATFORMS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "tiktok", label: "TikTok" },
  { key: "pinterest", label: "Pinterest" },
  { key: "youtube", label: "YouTube" },
] as const;

const typeIcon: Record<AssetType, typeof Image> = { image: Image, video: Video };
const typeLabel: Record<AssetType, string> = { image: "Image", video: "Video" };
const typeBadgeClass: Record<AssetType, string> = {
  image: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  video: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

// Full literal class names so Tailwind's JIT keeps them in the build.
const GRADIENTS = [
  "from-sky-400 via-blue-500 to-indigo-600",
  "from-purple-400 via-violet-500 to-indigo-600",
  "from-orange-400 via-rose-500 to-pink-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-rose-400 via-pink-500 to-fuchsia-600",
  "from-amber-400 via-orange-500 to-red-500",
  "from-lime-400 via-green-500 to-emerald-600",
  "from-cyan-400 via-blue-500 to-violet-600",
  "from-slate-400 via-gray-500 to-zinc-600",
];

function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

function isVideoUrl(url: string | null): url is string {
  return !!url && /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url);
}

function timeAgo(date: string): string {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

function mapRows(rows: GeneratedContentRow[]): StudioAsset[] {
  return rows.map((r) => {
    const prompt =
      r.content_theme || r.instagram_caption || r.facebook_post ||
      r.instagram_story_text || r.email_subject || "Untitled asset";
    return {
      id: r.id,
      prompt,
      type: isVideoUrl(r.image_url) ? "video" : "image",
      mediaUrl: r.image_url,
      gradient: gradientFor(r.content_theme || r.id),
      createdAt: r.created_at,
    };
  });
}

/** Honest one-liner per social-multi result entry (never fakes success). */
function describeSocialResult(r: SocialResultEntry): string {
  const label =
    r.platform ||
    (Array.isArray(r.platforms) && r.platforms.length ? r.platforms.join(", ") : r.via || "target");
  if (r.ok) return r.dry_run ? `${label}: accepted (dry run — not live)` : `${label}: posted`;
  const why =
    r.reason ||
    (typeof r.error === "string" ? r.error : "") ||
    "failed — account may not be connected";
  return `${label}: ${why}`;
}

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 6 * 60 * 1000; // bound the polling — videos are slow, but never forever

export default function HiggsfieldStudio() {
  const { businessId, user, isReady } = useAuth();
  const qc = useQueryClient();

  // ── Gallery (generated_content) ──────────────────────────────
  const [assets, setAssets] = useState<StudioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<"all" | AssetType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");
  const [newType, setNewType] = useState<AssetType>("image");
  const [newAspect, setNewAspect] = useState("1:1");

  // ── Product library ──────────────────────────────────────────
  const [uploadingProducts, setUploadingProducts] = useState(false);
  const productFileRef = useRef<HTMLInputElement>(null);

  // ── Reference generation ("Make my next post like this") ─────
  const [refPrompt, setRefPrompt] = useState("");
  const [refKind, setRefKind] = useState<AssetType>("image");
  const [refImageUrl, setRefImageUrl] = useState("");
  const [activeJob, setActiveJob] = useState<{ id: string; startedAt: number } | null>(null);
  const [activeJobStatus, setActiveJobStatus] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);

  // ── Publish everywhere ────────────────────────────────────────
  const [publishTarget, setPublishTarget] = useState<{ mediaUrl: string; caption: string } | null>(null);
  const [publishPlatforms, setPublishPlatforms] = useState<string[]>([]);
  const [publishCaption, setPublishCaption] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  const fetchAssets = useCallback(async () => {
    if (!businessId || !isReady) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await externalSupabase
        .from("generated_content")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      setAssets(mapRows((data as GeneratedContentRow[]) ?? []));
    } catch {
      setAssets([]);
    }
    setLoading(false);
  }, [businessId, isReady]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  // ── Product library: read current product_image_urls off the business row ──
  const productsQuery = useQuery({
    queryKey: ["studio-products", businessId],
    enabled: !!businessId && isReady,
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from("businesses")
        .select("product_image_urls")
        .eq("id", businessId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      const urls = (data as { product_image_urls?: unknown } | null)?.product_image_urls;
      return Array.isArray(urls) ? (urls.filter((u) => typeof u === "string") as string[]) : [];
    },
  });
  const productUrls = productsQuery.data ?? [];

  const saveProductsMutation = useMutation({
    mutationFn: (urls: string[]) =>
      setBrandAssets(businessId ?? "", { product_image_urls: urls }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studio-products", businessId] });
    },
    onError: (err) => {
      toast.error("Couldn't save product images", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  const handleProductUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !businessId) return;
    setUploadingProducts(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      try {
        // Same bucket + filename scheme as PhotoLibrary.
        const fileName = `${businessId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await externalSupabase.storage
          .from("business-photos").upload(fileName, file);
        if (uploadError) { toast.error(`Failed to upload ${file.name}`); continue; }
        const { data: urlData } = externalSupabase.storage
          .from("business-photos").getPublicUrl(fileName);
        if (urlData?.publicUrl) uploaded.push(urlData.publicUrl);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    if (uploaded.length > 0) {
      try {
        await saveProductsMutation.mutateAsync([...productUrls, ...uploaded]);
        toast.success(`${uploaded.length} product photo${uploaded.length > 1 ? "s" : ""} added`);
      } catch { /* toast handled by mutation onError */ }
    }
    setUploadingProducts(false);
    if (productFileRef.current) productFileRef.current.value = "";
  };

  const handleProductRemove = async (url: string) => {
    try {
      await saveProductsMutation.mutateAsync(productUrls.filter((u) => u !== url));
      toast.success("Product photo removed");
    } catch { /* toast handled by mutation onError */ }
  };

  // ── WF10 jobs list ────────────────────────────────────────────
  const jobsQuery = useQuery({
    queryKey: ["wf10-jobs", businessId],
    enabled: !!businessId && isReady,
    queryFn: async () => {
      const res = await wf10ListJobs({ business_id: businessId ?? "" }) as { items?: StudioJobRow[] };
      return res?.items ?? [];
    },
  });
  const jobs = jobsQuery.data ?? [];

  // ── WF10 create + bounded 5s polling ─────────────────────────
  const createJobMutation = useMutation({
    mutationFn: (request: Record<string, unknown>) =>
      wf10CreateJob({ businessId: businessId ?? "", request }) as Promise<Wf10CreateResponse>,
    onSuccess: (res) => {
      if (!res?.jobId) {
        setJobError("The studio didn't return a job id. Please try again.");
        toast.error("Generation didn't start", { description: "No job id returned by the backend." });
        return;
      }
      setJobError(null);
      setActiveJob({ id: res.jobId, startedAt: Date.now() });
      setActiveJobStatus(res.status ?? "queued");
      toast.success("Generation started", { description: "We'll show the result here when it's ready." });
      qc.invalidateQueries({ queryKey: ["wf10-jobs", businessId] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Please try again.";
      setJobError(msg);
      toast.error("Couldn't start generation", { description: msg });
    },
  });

  useEffect(() => {
    if (!activeJob || !businessId) return;
    let cancelled = false;
    const interval = window.setInterval(async () => {
      if (Date.now() - activeJob.startedAt > POLL_TIMEOUT_MS) {
        window.clearInterval(interval);
        if (!cancelled) {
          setActiveJob(null);
          setActiveJobStatus(null);
          setJobError("Generation is taking longer than expected. Check 'Recent studio jobs' below in a bit.");
          toast.error("Still processing", {
            description: "We stopped waiting after 6 minutes — the job may still finish in the background.",
          });
          qc.invalidateQueries({ queryKey: ["wf10-jobs", businessId] });
        }
        return;
      }
      try {
        const job = await wf10GetJob({ business_id: businessId, job_id: activeJob.id }) as StudioJobRow | null;
        if (cancelled || !job) return;
        setActiveJobStatus(job.status ?? "processing");
        if (job.status === "completed") {
          window.clearInterval(interval);
          setActiveJob(null);
          setActiveJobStatus(null);
          toast.success("Your asset is ready");
          qc.invalidateQueries({ queryKey: ["wf10-jobs", businessId] });
          fetchAssets();
        } else if (job.status === "failed") {
          window.clearInterval(interval);
          setActiveJob(null);
          setActiveJobStatus(null);
          const msg = job.error || "Generation failed on the backend.";
          setJobError(msg);
          toast.error("Generation failed", { description: msg });
          qc.invalidateQueries({ queryKey: ["wf10-jobs", businessId] });
        }
      } catch {
        // transient polling errors are fine — next tick retries; the timeout bounds us
      }
    }, POLL_INTERVAL_MS);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [activeJob, businessId, qc, fetchAssets]);

  const handleReferenceGenerate = () => {
    if (!businessId) {
      toast.error("No business profile found", {
        description: "Refresh the page, and finish onboarding if you haven't already.",
      });
      return;
    }
    const prompt = refPrompt.trim();
    if (!prompt) {
      toast.error("Describe what you want", { description: "e.g. \"Same vibe but for our summer promo\"" });
      return;
    }
    const ref = refImageUrl.trim();
    // Shape consumed by services/wf10 createStudioJob → buildStudioBriefPrompt:
    // kind, subject, coreIdea, platform, mood, referenceAssets (the reference image).
    const request: Record<string, unknown> = {
      kind: refKind,
      subject: prompt,
      coreIdea: prompt,
      platform: refKind === "video" ? "instagram_reel" : "instagram_feed",
      mood: "on-brand, match the reference",
    };
    if (ref) request.referenceAssets = ref;
    createJobMutation.mutate(request);
  };

  // ── Legacy quick-create (kept — this path already works) ─────
  const handleGenerate = useCallback(async () => {
    if (!businessId || !user?.id) {
      // Never bail silently — a no-op button is exactly the symptom audited in §1b.
      toast.error("No business profile found", {
        description: "Refresh the page, and finish onboarding if you haven't already.",
      });
      return;
    }
    setDialogOpen(false);
    setGenerating(true);
    try {
      const row = await generateContentNow(businessId, user.id, user.email ?? "");
      toast.success(row?.content_theme ? `Generated — ${row.content_theme}` : "Asset generated");
      await fetchAssets();
    } catch (err) {
      toast.error("Couldn't generate asset", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setGenerating(false);
    }
  }, [businessId, user?.id, user?.email, fetchAssets]);

  // ── Publish everywhere ────────────────────────────────────────
  const openPublish = (mediaUrl: string, caption: string) => {
    setPublishTarget({ mediaUrl, caption });
    setPublishCaption(caption);
    setPublishPlatforms([]);
    setScheduleAt("");
  };

  const surfaceSocialResponse = (res: SocialPostResponse, mode: "now" | "schedule") => {
    const results = res?.results ?? [];
    if (results.length > 0) {
      for (const r of results) {
        const line = describeSocialResult(r);
        if (r.ok) toast.success(line);
        else toast.error(line);
      }
    } else if (res?.ok) {
      if (mode === "schedule") {
        toast.success(res.queued_local
          ? "Scheduled — queued locally, will publish at the chosen time"
          : "Scheduled via Ayrshare");
      } else {
        toast.success("Posted");
      }
    } else {
      toast.error(mode === "schedule" ? "Scheduling failed" : "Posting failed", {
        description: res?.reason || res?.error || "No platforms accepted the post.",
      });
    }
    if (res?.ok) setPublishTarget(null);
  };

  const postNowMutation = useMutation({
    mutationFn: () =>
      socialPostNow({
        businessId: businessId ?? "",
        platforms: publishPlatforms,
        content: { body: publishCaption.trim() },
        mediaUrl: publishTarget?.mediaUrl,
      }) as Promise<SocialPostResponse>,
    onSuccess: (res) => surfaceSocialResponse(res, "now"),
    onError: (err) => {
      toast.error("Posting failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: () =>
      socialPostSchedule({
        businessId: businessId ?? "",
        platforms: publishPlatforms,
        content: { body: publishCaption.trim() },
        mediaUrl: publishTarget?.mediaUrl,
        scheduleAt: new Date(scheduleAt).toISOString(),
      }) as Promise<SocialPostResponse>,
    onSuccess: (res) => surfaceSocialResponse(res, "schedule"),
    onError: (err) => {
      toast.error("Scheduling failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  const publishBusy = postNowMutation.isPending || scheduleMutation.isPending;

  const togglePlatform = (key: string) => {
    setPublishPlatforms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-lg skeleton" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-72 rounded-xl skeleton" />)}
        </div>
      </div>
    );
  }

  const counts = {
    all: assets.length,
    image: assets.filter((a) => a.type === "image").length,
    video: assets.filter((a) => a.type === "video").length,
  };

  const filtered = assets.filter((a) => {
    const matchesType = filter === "all" || a.type === filter;
    const matchesSearch = !searchQuery || a.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const weekAgo = Date.now() - 7 * 86400 * 1000;
  const thisWeek = assets.filter((a) => new Date(a.createdAt).getTime() >= weekAgo).length;

  const jobBusy = createJobMutation.isPending || !!activeJob;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2" disabled={generating}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DialogTrigger asChild>
                  <DropdownMenuItem onClick={() => setNewType("image")}>
                    <Image className="h-4 w-4 mr-2" /> Image
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <DropdownMenuItem onClick={() => setNewType("video")}>
                    <Video className="h-4 w-4 mr-2" /> Video
                  </DropdownMenuItem>
                </DialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" /> New Generation
                </DialogTitle>
                <DialogDescription>
                  Describe what you want to create. We'll generate it in your brand voice.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Prompt</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="A cinematic product shot on a mountain peak at sunrise..."
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Type</label>
                  <div className="flex gap-2">
                    {(["image", "video"] as AssetType[]).map((t) => {
                      const Icon = typeIcon[t];
                      return (
                        <Button
                          key={t}
                          variant={newType === t ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewType(t)}
                          className="gap-1.5"
                        >
                          <Icon className="h-3.5 w-3.5" /> {typeLabel[t]}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {["1:1", "16:9", "9:16", "4:5"].map((r) => (
                      <Button
                        key={r}
                        variant={newAspect === r ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewAspect(r)}
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button className="gap-2" onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" /> <strong className="text-foreground">{assets.length}</strong> assets
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> <strong className="text-foreground">{thisWeek}</strong> this week
            </span>
          </div>
        </div>
      </div>

      {/* ── Your products + reference generation ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product library */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4 text-primary" /> Your products
            </CardTitle>
            <CardDescription>
              Upload product photos — the AI uses them as generation references for on-brand content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {productUrls.length} saved{productUrls.length >= 20 ? " (max 20)" : ""}
              </p>
              <div>
                <input
                  ref={productFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleProductUpload}
                />
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => productFileRef.current?.click()}
                  disabled={uploadingProducts || saveProductsMutation.isPending || !businessId}
                >
                  {uploadingProducts
                    ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Uploading...</>
                    : <><Upload className="mr-1.5 h-3.5 w-3.5" /> Upload</>}
                </Button>
              </div>
            </div>

            {productsQuery.isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
              </div>
            ) : productUrls.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-10 text-center cursor-pointer transition-colors hover:border-primary/30"
                onClick={() => productFileRef.current?.click()}
              >
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No product photos yet</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-[240px]">
                  Add a few product shots so generations can match your real products.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {productUrls.map((url) => {
                  const selected = refImageUrl === url;
                  return (
                    <div
                      key={url}
                      className={`group relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition-all ${selected ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/40"}`}
                      onClick={() => setRefImageUrl(selected ? "" : url)}
                      title={selected ? "Click to deselect" : "Use as generation reference"}
                    >
                      <img src={url} alt="Product" className="h-full w-full object-cover" loading="lazy" />
                      {selected && (
                        <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-medium text-primary-foreground">
                          Reference
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleProductRemove(url); }}
                        className="absolute top-1 right-1 rounded-full bg-background/90 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                        aria-label="Remove product photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Make my next post like this */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Make my next post like this
            </CardTitle>
            <CardDescription>
              Pick a product photo (or paste any inspiration image URL), describe the twist, and generate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ref-url" className="text-xs">Reference image (optional)</Label>
              <div className="relative">
                <Link2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ref-url"
                  placeholder="Paste an image URL, or click a product photo on the left"
                  value={refImageUrl}
                  onChange={(e) => setRefImageUrl(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              {refImageUrl.trim() && (
                <div className="flex items-center gap-2 pt-1">
                  <img
                    src={refImageUrl.trim()}
                    alt="Reference preview"
                    className="h-12 w-12 rounded-md border border-border object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setRefImageUrl("")}>
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ref-prompt" className="text-xs">What do you want?</Label>
              <Textarea
                id="ref-prompt"
                placeholder='e.g. "Same vibe but for our summer promo"'
                value={refPrompt}
                onChange={(e) => setRefPrompt(e.target.value)}
                className="min-h-[72px] text-sm"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {(["image", "video"] as AssetType[]).map((t) => {
                  const Icon = typeIcon[t];
                  return (
                    <Button
                      key={t}
                      variant={refKind === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRefKind(t)}
                      className="gap-1.5 h-8 text-xs"
                    >
                      <Icon className="h-3.5 w-3.5" /> {typeLabel[t]}
                    </Button>
                  );
                })}
              </div>
              <Button className="gap-2 h-8 text-xs" onClick={handleReferenceGenerate} disabled={jobBusy || !businessId}>
                {jobBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                Generate
              </Button>
            </div>

            {activeJob && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>
                  {activeJobStatus === "processing" ? "Generating" : "Queued"} — this can take a few minutes.
                  We check every 5 seconds.
                </span>
              </div>
            )}
            {jobError && !activeJob && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {jobError}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent studio jobs ────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Film className="h-4 w-4 text-primary" /> Recent studio jobs
          </CardTitle>
          <CardDescription>Reference generations run through the studio pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          {jobsQuery.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 rounded-lg" />)}
            </div>
          ) : jobsQuery.isError ? (
            <p className="text-sm text-muted-foreground py-4">
              Couldn't load studio jobs — {jobsQuery.error instanceof Error ? jobsQuery.error.message : "please refresh."}
            </p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No studio jobs yet. Generate a reference-based post above to get started.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {jobs.map((job) => {
                const done = job.status === "completed";
                const failed = job.status === "failed";
                const isVideo = job.request_kind === "video" || job.request_kind === "reel" || isVideoUrl(job.result_url);
                return (
                  <div key={job.id} className="rounded-lg border border-border overflow-hidden">
                    <div className="relative h-24 bg-muted/50 flex items-center justify-center">
                      {done && job.result_url ? (
                        isVideo ? (
                          <video src={job.result_url} className="h-full w-full object-cover" muted playsInline preload="metadata"
                            onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = "none"; }} />
                        ) : (
                          <img src={job.thumbnail_url || job.result_url} alt="Studio result" className="h-full w-full object-cover" loading="lazy"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        )
                      ) : failed ? (
                        <X className="h-6 w-6 text-destructive/60" />
                      ) : (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                      <Badge
                        className={`absolute top-1.5 left-1.5 text-[9px] border ${
                          done
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : failed
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}
                      >
                        {job.status ?? "queued"}
                      </Badge>
                    </div>
                    <div className="p-2 space-y-1.5">
                      <p className="text-[10px] text-muted-foreground">
                        {typeLabel[isVideo ? "video" : "image"]} · {timeAgo(job.created_at)}
                      </p>
                      {failed && job.error && (
                        <p className="text-[10px] text-destructive line-clamp-2" title={job.error}>{job.error}</p>
                      )}
                      {done && job.result_url && (
                        <div className="flex gap-1">
                          <Button asChild size="sm" variant="outline" className="h-6 px-1.5 text-[10px]">
                            <a href={job.result_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3 w-3" />
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            className="h-6 flex-1 text-[10px] gap-1"
                            onClick={() => openPublish(job.result_url as string, "")}
                          >
                            <Send className="h-3 w-3" /> Post to socials
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="w-full sm:w-auto">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">All <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{counts.all}</Badge></TabsTrigger>
            <TabsTrigger value="image"><Image className="h-3.5 w-3.5 mr-1" />Images <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{counts.image}</Badge></TabsTrigger>
            <TabsTrigger value="video"><Film className="h-3.5 w-3.5 mr-1" />Videos <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{counts.video}</Badge></TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Wand2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No {filter !== "all" ? typeLabel[filter as AssetType].toLowerCase() + "s" : "assets"} yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? "Try a different search term." : `Generate your first ${filter !== "all" ? typeLabel[filter as AssetType].toLowerCase() : "asset"} with AI.`}
          </p>
          <Button className="gap-2" onClick={() => setDialogOpen(true)} disabled={generating}>
            <Sparkles className="h-4 w-4" /> Generate {filter !== "all" ? typeLabel[filter as AssetType] : "Asset"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((asset) => {
            const Icon = typeIcon[asset.type];
            const isHovered = hoveredId === asset.id;
            return (
              <Card
                key={asset.id}
                className="overflow-hidden group cursor-pointer transition-shadow hover:shadow-lg"
                onMouseEnter={() => setHoveredId(asset.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Thumbnail — real media when present, gradient fallback otherwise */}
                <div className={`relative h-48 bg-gradient-to-br ${asset.gradient} flex items-center justify-center overflow-hidden`}>
                  <Icon className="h-12 w-12 text-white/30" />
                  {asset.mediaUrl && (
                    asset.type === "video" ? (
                      <video
                        src={asset.mediaUrl}
                        className="absolute inset-0 h-full w-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = "none"; }}
                      />
                    ) : (
                      <img
                        src={asset.mediaUrl}
                        alt={asset.prompt}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    )
                  )}
                  {/* Hover overlay */}
                  <div className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>
                    {asset.mediaUrl ? (
                      <>
                        <Button asChild size="sm" variant="secondary" className="gap-1.5 h-8 text-xs">
                          <a href={asset.mediaUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3.5 w-3.5" /> View
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="secondary" className="gap-1.5 h-8 text-xs">
                          <a href={asset.mediaUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 h-8 text-xs"
                          onClick={() => openPublish(asset.mediaUrl as string, asset.prompt)}
                        >
                          <Send className="h-3.5 w-3.5" /> Post
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-white/90 px-2.5 py-1 rounded bg-black/40">No media yet</span>
                    )}
                  </div>
                  {/* Type badge */}
                  <Badge className={`absolute top-3 left-3 text-[10px] border ${typeBadgeClass[asset.type]}`}>
                    {typeLabel[asset.type]}
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm line-clamp-2 leading-relaxed">{asset.prompt}</p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(asset.createdAt)}</span>
                    <span className="uppercase tracking-wide">{asset.type}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Post to socials dialog ────────────────────────────────── */}
      <Dialog open={!!publishTarget} onOpenChange={(open) => { if (!open && !publishBusy) setPublishTarget(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Post to socials
            </DialogTitle>
            <DialogDescription>
              Pick platforms, write a caption, and post now or schedule it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {publishTarget?.mediaUrl && (
              <div className="flex items-center gap-3">
                {isVideoUrl(publishTarget.mediaUrl) ? (
                  <video src={publishTarget.mediaUrl} className="h-16 w-16 rounded-md border border-border object-cover" muted playsInline preload="metadata" />
                ) : (
                  <img src={publishTarget.mediaUrl} alt="Asset to publish" className="h-16 w-16 rounded-md border border-border object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                )}
                <p className="text-xs text-muted-foreground break-all line-clamp-2">{publishTarget.mediaUrl}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Platforms</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PUBLISH_PLATFORMS.map((p) => (
                  <label
                    key={p.key}
                    className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-sm cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={publishPlatforms.includes(p.key)}
                      onCheckedChange={() => togglePlatform(p.key)}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Platforms that aren't connected will be reported as failed — nothing is faked.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="publish-caption" className="text-xs">Caption</Label>
              <Textarea
                id="publish-caption"
                placeholder="Write the caption for this post..."
                value={publishCaption}
                onChange={(e) => setPublishCaption(e.target.value)}
                className="min-h-[90px] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="publish-schedule" className="text-xs flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" /> Schedule (optional)
              </Label>
              <Input
                id="publish-schedule"
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPublishTarget(null)} disabled={publishBusy}>
              Cancel
            </Button>
            {scheduleAt ? (
              <Button
                className="gap-2"
                onClick={() => scheduleMutation.mutate()}
                disabled={publishBusy || publishPlatforms.length === 0 || !publishCaption.trim() || Number.isNaN(new Date(scheduleAt).getTime())}
              >
                {scheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                Schedule
              </Button>
            ) : (
              <Button
                className="gap-2"
                onClick={() => postNowMutation.mutate()}
                disabled={publishBusy || publishPlatforms.length === 0 || !publishCaption.trim()}
              >
                {postNowMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
