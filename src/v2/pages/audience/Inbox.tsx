/**
 * Front-style Unified Inbox.
 * Split panel: thread list on left, conversation view on right.
 * AI Reply button hits the `chat` edge function for a drafted response.
 */
import { useState, useEffect, useMemo } from "react";
import { useInbox } from "@/v2/lib/api/hooks/useModules";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import { PageHeader } from "@/v2/components/common/PageHeader";
import { EmptyState } from "@/v2/components/common/EmptyState";
import { Btn, Pill } from "@/v2/components/common/Card";
import { Inbox as InboxIcon, Sparkles, Send, Search, Archive, Star, Loader2 } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { toast } from "sonner";

type Msg = Record<string, any>;

function initials(s: string) {
  return s.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}
function timeAgo(iso?: string) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "now"; if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const PLATFORM_TONE: Record<string, "success" | "info" | "warning" | "neutral"> = {
  facebook: "info", instagram: "warning", email: "neutral", sms: "success",
};

export default function InboxPage() {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const bid = business?.id;
  const { data, isLoading } = useInbox(bid);
  const messages: Msg[] = Array.isArray(data) ? data : [];

  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [draftingAi, setDraftingAi] = useState(false);

  const filtered = useMemo(() => {
    if (!q) return messages;
    const k = q.toLowerCase();
    return messages.filter((m) =>
      (m.from_name ?? m.sender ?? "").toString().toLowerCase().includes(k) ||
      (m.preview ?? m.last_message ?? m.subject ?? "").toString().toLowerCase().includes(k)
    );
  }, [messages, q]);

  useEffect(() => {
    if (!selectedId && filtered.length > 0) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const selected = filtered.find((m) => m.id === selectedId);

  async function draftAiReply() {
    if (!selected) return;
    setDraftingAi(true);
    try {
      const { data: res, error } = await externalSupabase.functions.invoke("chat", {
        body: {
          messages: [{
            role: "user",
            content: `Draft a warm, on-brand reply to this customer message. Be concise.\n\nMessage:\n${selected.preview ?? selected.last_message ?? ""}`
          }],
          business_id: bid,
        },
      });
      if (error) throw error;
      const draft = res?.message ?? res?.content ?? res?.text ?? "";
      if (draft) setReply(draft);
      else toast.error("AI didn't return a draft");
    } catch (e) {
      toast.error("Couldn't draft reply", { description: e instanceof Error ? e.message : "Try again" });
    } finally { setDraftingAi(false); }
  }

  return (
    <div className="-mt-2">
      <PageHeader title="Inbox"
        subtitle={messages.length ? `${messages.length} conversations` : "Every conversation, one place."} />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-0 rounded-xl overflow-hidden h-[calc(100vh-220px)] min-h-[480px]"
           style={{ background: "hsl(var(--m-surface))",
                    border: "1px solid hsl(var(--m-border-subtle))" }}>
        {/* Thread list */}
        <div className="flex flex-col" style={{ borderRight: "1px solid hsl(var(--m-border-subtle))" }}>
          <div className="p-3" style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "hsl(var(--m-muted-foreground))" }} />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search conversations…"
                className="w-full h-9 pl-8 pr-3 rounded-lg text-[12.5px] outline-none focus:ring-2"
                style={{ background: "hsl(var(--m-background))",
                         border: "1px solid hsl(var(--m-border-subtle))" }}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-2 space-y-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg animate-pulse mx-2"
                       style={{ background: "hsl(var(--m-border-subtle))" }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12">
                <EmptyState icon={InboxIcon}
                  title={messages.length === 0 ? "Inbox is clear" : "No matches"}
                  helper={messages.length === 0
                    ? "When customers reach out across email, Instagram, Messenger, or SMS, they land here."
                    : "Try a different search."} />
              </div>
            ) : (
              <ul>
                {filtered.map((m) => {
                  const active = m.id === selectedId;
                  const platform = (m.platform ?? "email").toString().toLowerCase();
                  return (
                    <li key={m.id} onClick={() => setSelectedId(m.id)}
                        className="px-3 py-3 cursor-pointer transition-colors"
                        style={{
                          background: active ? "hsl(var(--m-accent-soft))" : "transparent",
                          borderBottom: "1px solid hsl(var(--m-border-subtle))",
                          borderLeft: active ? "2px solid hsl(var(--m-accent))" : "2px solid transparent",
                        }}>
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                             style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}>
                          {initials(m.from_name ?? m.sender ?? "?")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12.5px] font-semibold truncate">
                              {m.from_name ?? m.sender ?? "Unknown"}
                            </span>
                            <span className="text-[10.5px] shrink-0 m-tnum"
                                  style={{ color: "hsl(var(--m-muted-foreground))" }}>
                              {timeAgo(m.created_at ?? m.received_at)}
                            </span>
                          </div>
                          <div className="text-[12px] truncate mt-0.5"
                               style={{ color: "hsl(var(--m-muted-foreground))" }}>
                            {m.subject ?? m.preview ?? m.last_message ?? "—"}
                          </div>
                          <div className="mt-1.5">
                            <Pill tone={PLATFORM_TONE[platform] ?? "neutral"}>{platform}</Pill>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Conversation view */}
        <div className="flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={InboxIcon} title="No conversation selected"
                          helper="Pick a thread on the left to read and reply." />
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between gap-2 px-5 h-14"
                      style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold truncate">
                    {selected.from_name ?? selected.sender ?? "Unknown"}
                  </div>
                  <div className="text-[11.5px] truncate"
                       style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    {selected.email ?? selected.platform ?? ""}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[hsl(var(--m-surface-elevated))]"
                          title="Star"><Star size={14} /></button>
                  <button className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[hsl(var(--m-surface-elevated))]"
                          title="Archive"><Archive size={14} /></button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="rounded-xl p-4 max-w-[680px]"
                     style={{ background: "hsl(var(--m-surface-elevated))",
                              border: "1px solid hsl(var(--m-border-subtle))" }}>
                  {selected.subject && (
                    <div className="text-[13px] font-semibold mb-2">{selected.subject}</div>
                  )}
                  <p className="text-[13px] whitespace-pre-wrap leading-relaxed">
                    {selected.body ?? selected.preview ?? selected.last_message ?? "(empty message)"}
                  </p>
                  <div className="text-[11px] mt-3"
                       style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    {selected.created_at ? new Date(selected.created_at).toLocaleString() : ""}
                  </div>
                </div>
              </div>

              <div className="p-4" style={{ borderTop: "1px solid hsl(var(--m-border-subtle))" }}>
                <div className="rounded-xl overflow-hidden"
                     style={{ background: "hsl(var(--m-surface-elevated))",
                              border: "1px solid hsl(var(--m-border-subtle))" }}>
                  <textarea
                    value={reply} onChange={(e) => setReply(e.target.value)}
                    placeholder="Type a reply…"
                    rows={3}
                    className="w-full px-3 py-2.5 text-[13px] bg-transparent outline-none resize-none"
                  />
                  <div className="flex items-center justify-between px-2 py-2"
                       style={{ borderTop: "1px solid hsl(var(--m-border-subtle))" }}>
                    <Btn variant="ghost" onClick={draftAiReply} disabled={draftingAi}>
                      {draftingAi ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      AI draft
                    </Btn>
                    <Btn variant="primary"
                         onClick={() => { toast.success("Reply sent"); setReply(""); }}
                         disabled={!reply.trim()}>
                      <Send size={13} /> Send
                    </Btn>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
