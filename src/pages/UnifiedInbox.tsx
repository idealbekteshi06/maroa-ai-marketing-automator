import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Instagram, Facebook, Mail, MessageCircle, Search, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { wf9DraftReply, wf9ThreadsList, wf11EscalationsList, wf11Metrics } from "@/lib/api";

type Channel = "instagram" | "facebook" | "email" | "whatsapp" | string;

type InboxThread = {
  id: string;
  name: string;
  channel: Channel;
  lastMessage: string;
  timestamp: string;
  unread: number;
  urgency?: string;
  specialist?: string;
  status?: string;
};

const channelIcon: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  email: Mail,
  whatsapp: MessageCircle,
};

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function UnifiedInbox() {
  const { businessId, isReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [metrics, setMetrics] = useState<{ threadCount?: number; escalationCount?: number } | null>(null);
  const [escalationCount, setEscalationCount] = useState(0);

  const load = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [listRes, metricsRes, escRes] = await Promise.all([
        wf9ThreadsList(businessId),
        wf11Metrics(businessId).catch(() => null),
        wf11EscalationsList(businessId).catch(() => ({ items: [] })),
      ]);
      const mapped: InboxThread[] = (listRes.items || []).map((t) => ({
        id: String(t.id),
        name: String(t.from_handle || t.subject || "Unknown"),
        channel: (t.channel as Channel) || "email",
        lastMessage: String(t.body || "").slice(0, 120),
        timestamp: formatRelative(String(t.created_at || new Date().toISOString())),
        unread: t.status === "new" ? 1 : 0,
        urgency: t.urgency ? String(t.urgency) : undefined,
        specialist: t.specialist_role ? String(t.specialist_role) : undefined,
        status: t.status ? String(t.status) : undefined,
      }));
      setThreads(mapped);
      if (!activeId && mapped[0]) setActiveId(mapped[0].id);
      setMetrics(metricsRes as { threadCount?: number; escalationCount?: number } | null);
      setEscalationCount(Array.isArray(escRes.items) ? escRes.items.length : 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load inbox");
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [businessId, activeId]);

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);

  const active = threads.find((t) => t.id === activeId);
  const filtered = threads.filter((t) => {
    if (filter === "urgent" && t.urgency !== "immediate" && t.urgency !== "high") return false;
    if (filter === "escalated" && t.status !== "escalated") return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.lastMessage.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleDraft = async () => {
    if (!businessId || !activeId) return;
    try {
      const res = await wf9DraftReply({ businessId, threadId: activeId });
      const body = (res as { reply?: { body?: string } }).reply?.body
        || (res as { body?: string }).body
        || "";
      setDraftBody(body);
      toast.success("AI draft ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Draft failed");
    }
  };

  if (!isReady || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading inbox…
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Connect your business profile to use the unified inbox.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Unified Inbox</h1>
          <p className="text-sm text-muted-foreground">
            WF9 inbox + WF11 smart routing · {metrics?.threadCount ?? threads.length} threads · {escalationCount} open escalations
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="flex min-h-0 flex-col">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations…"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Tabs value={filter} onValueChange={setFilter} className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="urgent" className="flex-1">Urgent</TabsTrigger>
                <TabsTrigger value="escalated" className="flex-1">Escalated</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-0">
            <ScrollArea className="h-[calc(100%-1rem)]">
              {filtered.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">No conversations yet.</p>
              ) : (
                filtered.map((c) => {
                  const Icon = channelIcon[c.channel] || Mail;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveId(c.id)}
                      className={`flex w-full gap-3 border-b px-4 py-3 text-left transition hover:bg-muted/50 ${
                        activeId === c.id ? "bg-muted/80" : ""
                      }`}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-medium text-sm">{c.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{c.timestamp}</span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{c.lastMessage}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Icon className="h-3 w-3 text-muted-foreground" />
                          {c.specialist && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">{c.specialist}</Badge>
                          )}
                          {c.unread > 0 && <Badge className="text-[10px] px-1 py-0">{c.unread}</Badge>}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col">
          {active ? (
            <>
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-lg">{active.name}</CardTitle>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{active.channel}</Badge>
                  {active.specialist && <Badge variant="secondary">{active.specialist}</Badge>}
                  {active.urgency && <Badge>{active.urgency}</Badge>}
                  {active.status && <Badge variant="outline">{active.status}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-3 pt-4">
                <ScrollArea className="flex-1 rounded-md border p-4">
                  <p className="text-sm whitespace-pre-wrap">{active.lastMessage}</p>
                </ScrollArea>
                <div className="flex gap-2">
                  <Button variant="secondary" className="gap-2" onClick={handleDraft}>
                    <Sparkles className="h-4 w-4" /> AI draft
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Edit reply before sending…"
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && draftBody.trim()) {
                        toast.message("Send via connected channel", { description: "Connect Meta/email in Connections to publish." });
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    disabled={!draftBody.trim()}
                    onClick={() => toast.message("Connect channel to send", { description: "OAuth for Instagram, WhatsApp, or email required." })}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
              Select a conversation
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
