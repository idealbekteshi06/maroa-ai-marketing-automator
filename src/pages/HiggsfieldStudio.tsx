import { useState } from "react";
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
  Image, Video, Palette, Plus, Download, Eye, Wand2,
  Clock, Layers, Search, Sparkles, Film,
} from "lucide-react";

// TODO: wire to real API
type AssetType = "image" | "video" | "ad";

interface Asset {
  id: string;
  prompt: string;
  type: AssetType;
  gradient: string;
  generatedAt: string;
  duration: string;
  dimensions: string;
}

const typeIcon: Record<AssetType, typeof Image> = { image: Image, video: Video, ad: Palette };
const typeLabel: Record<AssetType, string> = { image: "Image", video: "Video", ad: "Ad Creative" };
const typeBadgeClass: Record<AssetType, string> = {
  image: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  video: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ad: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

const mockAssets: Asset[] = [
  { id: "a1", prompt: "Crystal clear water pouring into a glass with Sharr mountains at golden hour", type: "image", gradient: "from-sky-400 via-blue-500 to-indigo-600", generatedAt: "2 hours ago", duration: "12s", dimensions: "1080x1080" },
  { id: "a2", prompt: "Uje Karadaku bottle rotating 360 degrees on marble surface with water droplets", type: "video", gradient: "from-purple-400 via-violet-500 to-indigo-600", generatedAt: "5 hours ago", duration: "45s", dimensions: "1920x1080" },
  { id: "a3", prompt: "Instagram Story ad: Summer hydration campaign with gradient overlay and CTA", type: "ad", gradient: "from-orange-400 via-rose-500 to-pink-600", generatedAt: "1 day ago", duration: "8s", dimensions: "1080x1920" },
  { id: "a4", prompt: "Mountain spring source aerial view with brand watermark for social media", type: "image", gradient: "from-emerald-400 via-teal-500 to-cyan-600", generatedAt: "1 day ago", duration: "15s", dimensions: "1200x628" },
  { id: "a5", prompt: "Water bottle unboxing experience stop-motion for TikTok Reels campaign", type: "video", gradient: "from-rose-400 via-pink-500 to-fuchsia-600", generatedAt: "2 days ago", duration: "38s", dimensions: "1080x1920" },
  { id: "a6", prompt: "Facebook carousel ad: 5 reasons to choose natural mineral water from Kosovo", type: "ad", gradient: "from-amber-400 via-orange-500 to-red-500", generatedAt: "2 days ago", duration: "10s", dimensions: "1080x1080" },
  { id: "a7", prompt: "Family picnic scene with Uje Karadaku bottles, Rugova Canyon background", type: "image", gradient: "from-lime-400 via-green-500 to-emerald-600", generatedAt: "3 days ago", duration: "18s", dimensions: "1080x1080" },
  { id: "a8", prompt: "Product comparison infographic: mineral content vs competitors", type: "image", gradient: "from-cyan-400 via-blue-500 to-violet-600", generatedAt: "4 days ago", duration: "9s", dimensions: "1080x1350" },
  { id: "a9", prompt: "Dynamic video ad: water source to bottle journey cinematic sequence", type: "video", gradient: "from-slate-400 via-gray-500 to-zinc-600", generatedAt: "5 days ago", duration: "52s", dimensions: "1920x1080" },
];

export default function HiggsfieldStudio() {
  const [filter, setFilter] = useState<"all" | AssetType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");
  const [newType, setNewType] = useState<AssetType>("image");
  const [newAspect, setNewAspect] = useState("1:1");

  const filtered = mockAssets.filter((a) => {
    const matchesType = filter === "all" || a.type === filter;
    const matchesSearch = !searchQuery || a.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const counts = {
    all: mockAssets.length,
    image: mockAssets.filter((a) => a.type === "image").length,
    video: mockAssets.filter((a) => a.type === "video").length,
    ad: mockAssets.filter((a) => a.type === "ad").length,
  };

  const thisWeek = mockAssets.filter((a) => !a.generatedAt.includes("day")).length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Create
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
                <DialogTrigger asChild>
                  <DropdownMenuItem onClick={() => setNewType("ad")}>
                    <Palette className="h-4 w-4 mr-2" /> Ad Creative
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
                  Describe what you want to create for Uje Karadaku.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Prompt</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="A cinematic shot of Uje Karadaku bottle on a mountain peak at sunrise..."
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Type</label>
                  <div className="flex gap-2">
                    {(["image", "video", "ad"] as AssetType[]).map((t) => {
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
                <Button className="gap-2" onClick={() => { /* TODO: wire to real API */ setDialogOpen(false); }}>
                  <Sparkles className="h-4 w-4" /> Generate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" /> <strong className="text-foreground">{mockAssets.length}</strong> assets
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
            <TabsTrigger value="ad"><Palette className="h-3.5 w-3.5 mr-1" />Ads <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{counts.ad}</Badge></TabsTrigger>
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
          <h3 className="text-lg font-semibold mb-1">No {filter !== "all" ? typeLabel[filter as AssetType].toLowerCase() + "s" : "assets"} found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? "Try a different search term." : `Generate your first ${filter !== "all" ? typeLabel[filter as AssetType].toLowerCase() : "asset"} with AI.`}
          </p>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
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
                {/* Thumbnail */}
                <div className={`relative h-48 bg-gradient-to-br ${asset.gradient} flex items-center justify-center`}>
                  <Icon className="h-12 w-12 text-white/30" />
                  {/* Hover overlay */}
                  <div className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>
                    <Button size="sm" variant="secondary" className="gap-1.5 h-8 text-xs">
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                    <Button size="sm" variant="secondary" className="gap-1.5 h-8 text-xs">
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                    <Button size="sm" className="gap-1.5 h-8 text-xs">
                      <Sparkles className="h-3.5 w-3.5" /> Use
                    </Button>
                  </div>
                  {/* Type badge */}
                  <Badge className={`absolute top-3 left-3 text-[10px] border ${typeBadgeClass[asset.type]}`}>
                    {typeLabel[asset.type]}
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm line-clamp-2 leading-relaxed">{asset.prompt}</p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{asset.duration} gen</span>
                    <span>{asset.dimensions}</span>
                    <span>{asset.generatedAt}</span>
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
