import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Send, Smile, Sparkles, MessageCircle, Facebook, Instagram, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

interface InboxMessage {
  id: string;
  business_id: string;
  platform: string;
  customer_name: string;
  customer_id: string | null;
  message: string;
  is_from_customer: boolean;
  sent_at: string;
  read_at: string | null;
  thread_id: string;
}

interface Thread {
  thread_id: string;
  customer_name: string;
  platform: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  messages: InboxMessage[];
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function DashboardInbox() {
  const { businessId, isReady } = useAuth();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [aiLoading, setAiLoading] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!businessId || !isReady) return;
    const fetchMessages = async () => {
      setLoading(true);
      const { data } = await externalSupabase
        .from("inbox_messages")
        .select("*")
        .eq("business_id", businessId)
        .order("sent_at", { ascending: true });
      setMessages((data as InboxMessage[]) ?? []);
      setLoading(false);
    };
    fetchMessages();
  }, [businessId, isReady]);

  // Group into threads
  const threads: Thread[] = [];
  const threadMap = new Map<string, InboxMessage[]>();
  messages.forEach(m => {
    if (!threadMap.has(m.thread_id)) threadMap.set(m.thread_id, []);
    threadMap.get(m.thread_id)!.push(m);
  });
  threadMap.forEach((msgs, thread_id) => {
    const last = msgs[msgs.length - 1];
    const unread = msgs.filter(m => m.is_from_customer && !m.read_at).length;
    threads.push({
      thread_id,
      customer_name: msgs[0].customer_name,
      platform: msgs[0].platform,
      lastMessage: last.message,
      lastTime: last.sent_at,
      unreadCount: unread,
      messages: msgs,
    });
  });
  threads.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());

  const filteredThreads = threads.filter(t => {
    const matchSearch = !searchQuery || t.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPlatform = platformFilter === "all" || t.platform === platformFilter;
    const matchUnread = platformFilter !== "unread" || t.unreadCount > 0;
    return matchSearch && matchPlatform && matchUnread;
  });

  const activeThread = threads.find(t => t.thread_id === selectedThread);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages.length]);

  const handleAIReply = async () => {
    if (!activeThread) return;
    setAiLoading(true);
    try {
      const context = activeThread.messages.slice(-6).map(m =>
        `${m.is_from_customer ? m.customer_name : "Business"}: ${m.message}`
      ).join("\n");
      const res = await fetch("https://zqhyrbttuqkvmdewiytf.supabase.co/functions/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: "sb_publishable_4O2w1ObpYPQ7eOIlOhwl5A_8GxCt-gs" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a helpful business assistant. Write a friendly, professional reply to the customer's last message. Keep it concise — 1-2 sentences max. Be warm and helpful." },
            { role: "user", content: `Conversation:\n${context}\n\nWrite a reply to the customer's last message.` },
          ],
        }),
      });
      const data = await res.text();
      // Parse SSE
      let reply = "";
      data.split("\n").forEach(line => {
        if (line.startsWith("data: ") && line.slice(6).trim() !== "[DONE]") {
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) reply += content;
          } catch {}
        }
      });
      if (reply) setReplyText(reply);
      else toast.error(ERROR_MESSAGES.GENERATION_FAILED);
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setAiLoading(false); }
  };

  const filters = [
    { key: "all", label: "All" },
    { key: "facebook", label: "Facebook", icon: Facebook },
    { key: "instagram", label: "Instagram", icon: Instagram },
    { key: "unread", label: "Unread" },
  ];

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] rounded-lg border border-border bg-card overflow-hidden">
        <div className="w-80 border-r border-border p-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
        </div>
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-lg border border-border bg-card overflow-hidden shadow-meta-card">
      {/* Left panel - conversation list */}
      <div className="w-80 flex flex-col border-r border-border shrink-0 max-md:hidden">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm bg-muted border-0"
            />
          </div>
          <div className="flex gap-1 mt-2">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setPlatformFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  platformFilter === f.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">No conversations</p>
            </div>
          ) : (
            filteredThreads.map(t => (
              <button
                key={t.thread_id}
                onClick={() => setSelectedThread(t.thread_id)}
                className={`w-full flex items-start gap-3 p-3 text-left transition-colors border-b border-border ${
                  selectedThread === t.thread_id ? "bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                  {t.customer_name[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground truncate">{t.customer_name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(t.lastTime)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">{t.lastMessage}</p>
                    {t.unreadCount > 0 && (
                      <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    {t.platform === "facebook" && <Facebook className="h-3 w-3 text-primary" />}
                    {t.platform === "instagram" && <Instagram className="h-3 w-3 text-pink-500" />}
                    <span className="text-[10px] text-muted-foreground capitalize">{t.platform}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel - conversation thread */}
      <div className="flex-1 flex flex-col">
        {activeThread ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {activeThread.customer_name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{activeThread.customer_name}</p>
                <div className="flex items-center gap-1">
                  {activeThread.platform === "facebook" && <Facebook className="h-3 w-3 text-primary" />}
                  {activeThread.platform === "instagram" && <Instagram className="h-3 w-3 text-pink-500" />}
                  <span className="text-[10px] text-muted-foreground capitalize">{activeThread.platform}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeThread.messages.map(m => (
                <div key={m.id} className={`flex ${m.is_from_customer ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.is_from_customer
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}>
                    <p>{m.message}</p>
                    <p className={`text-[10px] mt-1 ${m.is_from_customer ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                      {new Date(m.sent_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={threadEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs shrink-0"
                  onClick={handleAIReply}
                  disabled={aiLoading}
                >
                  {aiLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                  AI Reply
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="flex-1 h-9 text-sm"
                  onKeyDown={e => { if (e.key === "Enter" && replyText.trim()) toast.info("Send functionality requires connected social accounts."); }}
                />
                <Button size="icon" className="h-9 w-9 shrink-0" disabled={!replyText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MessageCircle className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">Your Inbox</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {messages.length === 0
                ? "Your inbox connects to Facebook and Instagram messages. Once your accounts are connected, all customer messages appear here and AI suggests the perfect reply."
                : "Select a conversation to view messages."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
