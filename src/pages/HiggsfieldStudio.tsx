import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Image, Video, Plus, Download, Eye, Wand2,
  Clock, Layers, Search, Sparkles, Film, Loader2,
} from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { generateContentNow } from "@/lib/apiClient";
import { toast } from "sonner";

type AssetType = "image" | "video";

/**
 * The Studio renders the SAME persisted assets the rest of the app reads from
 * the `generated_content` table (see DashboardContent / DashboardPublish) — the
 * media lives in the `image_url` column the generation backend writes. The page
 * used to render a hardcoded mock array whose objects had only a `gradient`
 * field and no media element at all, which is why real generations only ever
 * showed a colored gradient card. The table is untyped (types.ts ships no Row
 * definitions), so we declare the columns we read, mirroring DashboardContent.
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

export default function HiggsfieldStudio() {
  const { businessId, user, isReady } = useAuth();
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
                        <Button asChild size="sm" className="gap-1.5 h-8 text-xs">
                          <a href={asset.mediaUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
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
    </div>
  );
}
