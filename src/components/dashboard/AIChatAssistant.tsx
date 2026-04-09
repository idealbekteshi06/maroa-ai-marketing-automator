import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useIsMobile } from "@/hooks/use-mobile";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatAssistantProps {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export default function AIChatAssistant({ externalOpen, onExternalOpenChange }: AIChatAssistantProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onExternalOpenChange?.(v);
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState<Record<string, unknown> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { businessId, isReady } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!businessId || !isReady) return;
    externalSupabase
      .from("businesses")
      .select("business_name, industry, location, target_audience, brand_tone, marketing_goal")
      .eq("id", businessId)
      .maybeSingle()
      .then(({ data }) => setBusiness(data));
  }, [businessId, isReady]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const allMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text },
      ];

      let assistantContent: string | null = null;

      // Primary: call backend /webhook/ai-chat which has full business context
      const apiBase = import.meta.env.VITE_API_BASE;
      if (apiBase && businessId) {
        try {
          const backendRes = await fetch(`${apiBase}/webhook/ai-chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              business_id: businessId,
              message: text,
              conversation_history: messages.map(m => ({ role: m.role, content: m.content })),
            }),
          });
          if (backendRes.ok) {
            const backendData = await backendRes.json();
            assistantContent = backendData?.response || backendData?.content || null;
          }
        } catch {
          // Backend unavailable — fall through to Supabase edge function
        }
      }

      // Fallback: call the Supabase edge function directly
      if (!assistantContent) {
        const businessContext = business
          ? `User's business: ${business.business_name || "Unknown"}, Industry: ${business.industry || "Unknown"}, Location: ${business.location || "Unknown"}, Target audience: ${business.target_audience || "Unknown"}, Brand tone: ${business.brand_tone || "Unknown"}, Marketing goal: ${business.marketing_goal || "Unknown"}.`
          : "";

        const systemPrompt = `You are the maroa.ai marketing assistant. You are an expert digital marketer helping small business owners. ${businessContext} Always give specific actionable advice tailored to their exact business. Be warm, confident, and direct. Never be generic. When writing captions or ad copy always match their brand tone. Keep responses concise. Use markdown formatting for clarity.`;

        const response = await fetch("https://zqhyrbttuqkvmdewiytf.supabase.co/functions/v1/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": "sb_publishable_4O2w1ObpYPQ7eOIlOhwl5A_8GxCt-gs",
          },
          body: JSON.stringify({ messages: allMessages, systemPrompt }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Chat service error (${response.status})`);
        }

        const data = await response.json();
        assistantContent =
          data?.choices?.[0]?.message?.content ||
          data?.content ||
          (typeof data === "string" ? data : "Sorry, I couldn't process that. Please try again.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent! }]);
    } catch (err: unknown) {
      const errorMsg = err?.message?.includes("429")
        ? "I'm getting too many requests right now. Please wait a moment and try again."
        : err?.message?.includes("402")
        ? "AI credits have been used up. Please add more credits in your workspace settings."
        : "Sorry, something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const panelClasses = isMobile
    ? "fixed inset-0 z-[60] flex flex-col bg-background"
    : "fixed bottom-20 right-5 z-[60] flex h-[520px] w-[380px] flex-col rounded-2xl border border-border bg-background shadow-elevated";

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground md:bottom-5 chat-btn-breathe"
          style={{ background: "linear-gradient(135deg, #0A84FF, #BF5AF2)" }}
          aria-label="Open AI chat assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className={panelClasses}>
          <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
            <div>
              <h3 className="text-sm font-semibold text-foreground">maroa.ai Assistant</h3>
              <p className="text-[11px] text-muted-foreground">Your AI marketing expert</p>
            </div>
            <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors" aria-label="Close chat">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Ask me anything about your marketing strategy, content ideas, or ad performance.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {["Write me an Instagram caption", "How do I get more followers?", "Optimize my ad budget"].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-[11px] text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs [&_code]:text-xs [&_pre]:text-xs">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-3 rounded-bl-md">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-3 shrink-0 safe-area-inset-bottom">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your marketing..."
                className="flex-1 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50 transition-all hover:bg-primary/90 active:scale-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
