import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Users, Loader2, Copy, MessageSquare, HelpCircle, Hash, Gamepad2 } from "lucide-react";

const API_BASE = "https://maroa-api-production.up.railway.app";

interface CommunityPost {
  id: string;
  platform: string;
  title: string;
  body: string;
  subreddit_or_group: string;
}

const platforms = [
  { value: "reddit", label: "Reddit", icon: Hash },
  { value: "quora", label: "Quora", icon: HelpCircle },
  { value: "facebook_groups", label: "Facebook Groups", icon: Users },
  { value: "discord", label: "Discord", icon: Gamepad2 },
];

export default function DashboardCommunity() {
  const { businessId } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState("reddit");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!businessId) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/community/generate-posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: businessId, platform: selectedPlatform }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const newPosts = Array.isArray(data) ? data : [data];
      setPosts(prev => [...newPosts, ...prev]);
      toast.success(`${newPosts.length} post${newPosts.length !== 1 ? "s" : ""} generated!`);
    } catch {
      toast.error("Failed to generate posts");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const platformLabel = (val: string) => platforms.find(p => p.value === val)?.label ?? val;

  if (posts.length === 0 && !generating) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">Generate community engagement content</h3>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
          Create authentic posts for Reddit, Quora, Facebook Groups, and Discord.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {platforms.map(p => (
            <button
              key={p.value}
              onClick={() => setSelectedPlatform(p.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${selectedPlatform === p.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              <p.icon className="h-3 w-3" /> {p.label}
            </button>
          ))}
        </div>
        <Button size="sm" className="mt-4" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="mr-1.5 h-3.5 w-3.5" />}
          Generate Posts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{posts.length} post{posts.length !== 1 ? "s" : ""} generated</p>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border overflow-hidden">
            {platforms.map(p => (
              <button
                key={p.value}
                onClick={() => setSelectedPlatform(p.value)}
                className={`px-2.5 py-1.5 text-[10px] font-medium transition-colors ${selectedPlatform === p.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button size="sm" className="h-9 text-xs" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="mr-1.5 h-3.5 w-3.5" />}
            Generate
          </Button>
        </div>
      </div>

      {generating && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-medium text-primary">Generating {platformLabel(selectedPlatform)} posts...</p>
        </div>
      )}

      <div className="space-y-3">
        {(posts || []).map(p => (
          <div key={p.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {platformLabel(p.platform)}
                </span>
                {p.subreddit_or_group && (
                  <span className="text-[10px] text-primary font-medium">{p.subreddit_or_group}</span>
                )}
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleCopy(`${p.title}\n\n${p.body}`)}>
                <Copy className="mr-1 h-3 w-3" /> Copy
              </Button>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">{p.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
