import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check, FileText, Instagram, Facebook, Globe, Loader2 } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

interface PendingContent {
  id: string;
  platform: string;
  caption: string;
  content_theme?: string;
  score?: number;
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4 text-pink-500" />,
  facebook: <Facebook className="h-4 w-4 text-blue-500" />,
  linkedin: <Globe className="h-4 w-4 text-blue-700" />,
  default: <FileText className="h-4 w-4 text-muted-foreground" />,
};

interface PendingApprovalsProps {
  onNavigate?: (tab: string) => void;
}

export default function PendingApprovals({ onNavigate }: PendingApprovalsProps) {
  const { businessId, user, isReady } = useAuth();
  const [items, setItems] = useState<PendingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  const fetchPending = useCallback(async () => {
    if (!businessId || !isReady) { setLoading(false); return; }
    const { data } = await externalSupabase
      .from("generated_content")
      .select("id, platform, caption, content_theme, quality_score")
      .eq("business_id", businessId)
      .in("status", ["pending_approval", "pending"])
      .order("created_at", { ascending: false })
      .limit(5);

    setItems((data || []).map((d: Record<string, unknown>) => ({
      id: d.id,
      platform: d.platform || "default",
      caption: d.caption || d.content_theme || "Untitled post",
      content_theme: d.content_theme,
      score: d.quality_score,
    })));
    setLoading(false);
  }, [businessId, isReady]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (contentId: string) => {
    setApprovingId(contentId);
    try {
      await api.approveContentPiece({
        content_id: contentId,
        user_id: user?.id ?? "", // server expects user_id — this is auth.user.id = businesses.id
        business_id: businessId,
      });
      setItems(prev => prev.filter(i => i.id !== contentId));
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch {
      toast.error(ERROR_MESSAGES.SAVE_FAILED);
    }
    setApprovingId(null);
  };

  // Hide when no items
  useEffect(() => {
    if (!loading && items.length === 0) {
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    } else {
      setVisible(true);
    }
  }, [items.length, loading]);

  if (!visible || loading || items.length === 0) return null;

  return (
    <div className={cn(
      "rounded-lg border border-warning/30 bg-card p-4 shadow-meta transition-all duration-300",
      items.length === 0 && "opacity-0 scale-95"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base pending-wobble">✍️</span>
          <h3 className="text-sm font-semibold text-foreground">
            {items.length} piece{items.length !== 1 ? "s" : ""} waiting for review
          </h3>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onNavigate?.("content")}>
          Review All
        </Button>
      </div>

      <div className="space-y-2">
        {items.slice(0, 3).map(item => (
          <div key={item.id} className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2">
            {platformIcons[item.platform.toLowerCase()] || platformIcons.default}
            <span className="flex-1 text-xs text-foreground truncate">{item.caption.slice(0, 60)}</span>
            {item.score && (
              <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{item.score}/10</span>
            )}
            <button
              onClick={() => handleApprove(item.id)}
              disabled={approvingId === item.id}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-success/10 text-success hover:bg-success hover:text-white transition-colors disabled:opacity-50"
              aria-label="Approve"
            >
              {approvingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
