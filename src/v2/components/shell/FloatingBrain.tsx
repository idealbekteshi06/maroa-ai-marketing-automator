import { Brain, X, Send } from "lucide-react";
import { useState } from "react";
import { sendBrainMessage } from "@/v2/lib/data/handlers";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }
interface Msg { id: string; role: "user" | "ai"; text: string }

export function FloatingBrain({ open, onOpenChange }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: "user", text: t }]);
    setInput("");
    try {
      const reply = await sendBrainMessage(t);
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: "ai", text: reply }]);
    } finally { setSending(false); }
  };

  return (
    <>
      <button onClick={() => onOpenChange(!open)}
        aria-label="Ask AI Brain"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 h-12 w-12 rounded-full flex items-center justify-center transition-transform hover:scale-105"
        style={{
          background: "hsl(var(--m-accent))",
          color: "hsl(var(--m-accent-foreground))",
          boxShadow: "var(--m-shadow-lg)",
        }}>
        <Brain size={20} strokeWidth={2} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30"
               onClick={() => onOpenChange(false)} aria-hidden />
          <aside className="fixed z-50 right-0 bottom-0 top-0 w-full sm:w-[420px] flex flex-col"
                 style={{ background: "hsl(var(--m-surface))", borderLeft: "1px solid hsl(var(--m-border))" }}
                 role="dialog" aria-label="AI Brain">
            <header className="h-14 px-4 flex items-center gap-3"
                    style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}>
                <Brain size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold">AI Brain</div>
                <div className="text-[11px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                  Ask anything about your marketing
                </div>
              </div>
              <button onClick={() => onOpenChange(false)}
                      className="p-1.5 rounded-md hover:bg-[hsl(var(--m-surface-elevated))]"
                      aria-label="Close">
                <X size={16} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[13px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    Try: <em>"What should I post today?"</em> or <em>"Why did my ROAS drop?"</em>
                  </p>
                </div>
              ) : messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                       style={m.role === "user"
                         ? { background: "hsl(var(--m-accent))", color: "hsl(var(--m-accent-foreground))" }
                         : { background: "hsl(var(--m-surface-elevated))", border: "1px solid hsl(var(--m-border-subtle))" }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); send(input); }}
                  className="p-3 flex items-center gap-2"
                  style={{ borderTop: "1px solid hsl(var(--m-border-subtle))" }}>
              <input value={input} onChange={(e) => setInput(e.target.value)}
                     placeholder="Ask Maroa…" disabled={sending}
                     className="flex-1 h-10 px-3 rounded-lg text-[13px] outline-none focus:ring-2"
                     style={{
                       background: "hsl(var(--m-background))",
                       border: "1px solid hsl(var(--m-border-subtle))",
                       color: "hsl(var(--m-foreground))",
                     }} />
              <button type="submit" disabled={sending || !input.trim()}
                      className="h-10 px-3 rounded-lg flex items-center gap-1.5 text-[13px] font-medium disabled:opacity-50"
                      style={{ background: "hsl(var(--m-accent))", color: "hsl(var(--m-accent-foreground))" }}
                      aria-label="Send">
                <Send size={13} />
              </button>
            </form>
          </aside>
        </>
      )}
    </>
  );
}
