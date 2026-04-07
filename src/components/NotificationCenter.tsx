import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, X, Bot, Flame, Rocket, Target, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "ai_action" | "hot_lead" | "viral" | "competitor" | "warning" | "success" | "error";
  title: string;
  description?: string;
  is_read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  ai_action: { icon: <Bot className="h-4 w-4" />, color: "text-primary" },
  hot_lead: { icon: <Flame className="h-4 w-4" />, color: "text-orange-500" },
  viral: { icon: <Rocket className="h-4 w-4" />, color: "text-success" },
  competitor: { icon: <Target className="h-4 w-4" />, color: "text-purple-500" },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-warning" },
  success: { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-success" },
  error: { icon: <XCircle className="h-4 w-4" />, color: "text-destructive" },
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationCenter() {
  const { businessId, isReady } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [justUpdated, setJustUpdated] = useState(false);
  const prevCountRef = useRef(0);

  const fetchNotifications = useCallback(async () => {
    if (!businessId || !isReady) return;
    const { data } = await externalSupabase
      .from("win_notifications")
      .select("*")
      .eq("business_id", businessId)
      .order("notified_at", { ascending: false })
      .limit(50);

    if (data) {
      const mapped: Notification[] = data.map((n: any) => ({
        id: n.id,
        type: mapWinType(n.win_type),
        title: n.title || n.win_type || "Notification",
        description: n.message || undefined,
        is_read: n.is_read || false,
        created_at: n.notified_at,
      }));
      setNotifications(mapped);
    }
  }, [businessId, isReady]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Supabase real-time subscriptions
  useEffect(() => {
    if (!businessId || !isReady) return;

    const channel = externalSupabase
      .channel(`notifications-${businessId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "generated_content",
        filter: `business_id=eq.${businessId}`,
      }, (payload: any) => {
        const newNotif: Notification = {
          id: `content-${Date.now()}`,
          type: "ai_action",
          title: "New content generated",
          description: payload.new?.content_theme ? `Generated "${payload.new.content_theme}" content` : "AI generated new content",
          is_read: false,
          created_at: new Date().toISOString(),
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 50));
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "contacts",
        filter: `business_id=eq.${businessId}`,
      }, (payload: any) => {
        const newNotif: Notification = {
          id: `lead-${Date.now()}`,
          type: "hot_lead",
          title: "New lead captured",
          description: payload.new?.full_name ? `${payload.new.full_name} — score ${payload.new?.lead_score || "N/A"}/100` : "New contact added",
          is_read: false,
          created_at: new Date().toISOString(),
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => { externalSupabase.removeChannel(channel); };
  }, [businessId, isReady]);

  // Pulse animation when unread count changes
  const unreadCount = notifications.filter(n => !n.is_read).length;
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setJustUpdated(true);
      const t = setTimeout(() => setJustUpdated(false), 1000);
      return () => clearTimeout(t);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    // Only update real DB entries (not synthetic real-time ones)
    if (!id.startsWith("content-") && !id.startsWith("lead-")) {
      await externalSupabase.from("win_notifications").update({ is_read: true }).eq("id", id);
    }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    if (businessId) {
      await externalSupabase.from("win_notifications").update({ is_read: true }).eq("business_id", businessId).eq("is_read", false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
        aria-label="Open notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className={cn(
            "absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground",
            justUpdated && "animate-bounce"
          )}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-label="Notifications">
          <div className="absolute inset-0 bg-foreground/10 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-primary hover:underline">Mark all read</button>
                )}
                <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors" aria-label="Close">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-3 text-sm font-medium text-foreground">No notifications yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Your AI just got started — updates will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(n => {
                    const config = typeConfig[n.type] || typeConfig.success;
                    return (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                          !n.is_read && "bg-primary/5"
                        )}
                      >
                        <div className={cn("mt-0.5 shrink-0", config.color)}>{config.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                            <span className="text-sm font-medium text-foreground truncate">{n.title}</span>
                          </div>
                          {n.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.description}</p>}
                          <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function mapWinType(winType: string | null): Notification["type"] {
  if (!winType) return "success";
  const lower = winType.toLowerCase();
  if (lower.includes("lead") || lower.includes("contact")) return "hot_lead";
  if (lower.includes("content") || lower.includes("post") || lower.includes("generate")) return "ai_action";
  if (lower.includes("reach") || lower.includes("viral")) return "viral";
  if (lower.includes("competitor")) return "competitor";
  if (lower.includes("error") || lower.includes("fail")) return "error";
  if (lower.includes("warn") || lower.includes("budget")) return "warning";
  return "success";
}
