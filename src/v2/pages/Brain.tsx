import { useState } from "react";
import { Card, Btn } from "@/v2/components/common/Card";
import {
  useBrainChatData,
  useBrainDecisionLogData,
} from "@/v2/lib/data/usePageData";
import { sendBrainMessage, explainBrainDecision } from "@/v2/lib/data/handlers";
import type { BrainMessage } from "@/v2/lib/data/types";
import { Brain, Send, Sparkles, ArrowUpRight, AlertCircle } from "lucide-react";

type Tab = "chat" | "log";

export default function BrainPage() {
  const [tab, setTab] = useState<Tab>("chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<BrainMessage[]>([]);
  const [sending, setSending] = useState(false);

  const chat = useBrainChatData(messages);
  const log = useBrainDecisionLogData();

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    const userMsg: BrainMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: t,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    try {
      const reply = await sendBrainMessage(t);
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: "ai", text: reply, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">AI Brain</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
            Ask Maroa anything. See every decision it has made for you.
          </p>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "hsl(var(--m-surface))", border: "1px solid hsl(var(--m-border-subtle))" }}>
          {(["chat", "log"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 h-7 rounded-md text-[12px] font-medium transition-colors"
              style={{
                background: tab === t ? "hsl(var(--m-surface-elevated))" : "transparent",
                color: tab === t ? "hsl(var(--m-foreground))" : "hsl(var(--m-muted-foreground))",
                boxShadow: tab === t ? "0 1px 2px hsl(0 0% 0% / 0.06)" : "none",
              }}
            >
              {t === "chat" ? "Chat" : "Decision log"}
            </button>
          ))}
        </div>
      </header>

      {tab === "chat" ? (
        <Card padded={false}>
          <div className="flex flex-col" style={{ height: "calc(100vh - 240px)", minHeight: 480 }}>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {chat.data.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: "hsl(var(--m-accent) / 0.1)", color: "hsl(var(--m-accent))" }}
                  >
                    <Brain size={18} strokeWidth={1.75} />
                  </div>
                  <h2 className="text-[15px] font-semibold">Ask Maroa anything</h2>
                  <p className="text-[12.5px] mt-1 mb-5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    Try one of these to start:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    {chat.data.suggestedPrompts.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-left px-3 py-2.5 rounded-lg text-[12.5px] transition-colors hover:bg-[hsl(var(--m-surface))]"
                        style={{
                          background: "hsl(var(--m-surface-elevated))",
                          border: "1px solid hsl(var(--m-border-subtle))",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chat.data.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                      style={
                        m.role === "user"
                          ? { background: "hsl(var(--m-foreground))", color: "hsl(var(--m-background))" }
                          : { background: "hsl(var(--m-surface))", border: "1px solid hsl(var(--m-border-subtle))" }
                      }
                    >
                      {m.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="p-3 flex items-center gap-2"
              style={{ borderTop: "1px solid hsl(var(--m-border-subtle))" }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Maroa…"
                disabled={sending}
                className="flex-1 h-10 px-3 rounded-lg text-[13px] outline-none focus:ring-2"
                style={{
                  background: "hsl(var(--m-surface))",
                  border: "1px solid hsl(var(--m-border-subtle))",
                }}
              />
              <Btn variant="primary" size="md" type="submit" disabled={sending}>
                <Send size={13} />
                Send
              </Btn>
            </form>
          </div>
        </Card>
      ) : (
        <Card title="Decision log" padded={false}>
          {log.status === "error" ? (
            <div className="p-5 flex items-start gap-3">
              <AlertCircle size={16} style={{ color: "hsl(var(--m-destructive))" }} />
              <div className="text-[13px]">We couldn't load the decision log. Please refresh.</div>
            </div>
          ) : log.status === "loading" ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
              ))}
            </div>
          ) : log.data.decisions.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Brain size={20} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: "hsl(var(--m-muted-foreground))" }} />
              <div className="text-[13px] font-medium">No decisions yet</div>
              <p className="text-[12px] mt-1" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                Every move Maroa makes will be logged here with full reasoning.
              </p>
            </div>
          ) : (
            <ul>
              {log.data.decisions.map((d, idx, arr) => (
                <li
                  key={d.id}
                  className="px-5 py-4"
                  style={{ borderBottom: idx === arr.length - 1 ? "none" : "1px solid hsl(var(--m-border-subtle))" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles size={13} strokeWidth={1.75} style={{ color: "hsl(var(--m-accent))" }} />
                        <span className="text-[13px] font-medium">{d.title}</span>
                      </div>
                      {d.reasoning && (
                        <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                          {d.reasoning}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono tabular-nums" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                        {new Date(d.occurredAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <Btn variant="ghost" onClick={() => explainBrainDecision(d.id)}>
                        Explain <ArrowUpRight size={11} />
                      </Btn>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
