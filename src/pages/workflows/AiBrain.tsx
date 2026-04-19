/**
 * Workflow #15 — AI Brain (Conversational Command Center) UI
 * ============================================================================
 * Not a chatbot. The Chief of Staff interface:
 *   - Streaming SSE chat (tokens stream in, tool-calls render in real-time)
 *   - Tool-use transparency panel (show the work as Brain runs)
 *   - Approval gates for destructive tools (ads pause, publish now, etc.)
 *   - Model indicator (haiku/sonnet/opus) + cost
 *   - "Explain this decision" button → senior-strategist teaching mode
 *   - Decision log sidebar — searchable history of every action Brain took
 *   - Conversation list (past threads)
 * ============================================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  FileText,
  HelpCircle,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { getApiBase } from "@/lib/apiClient";
import {
  wf15ListConversations,
  wf15GetConversation,
  wf15CreateConversation,
  wf15SendMessage,
  wf15ToolDecision,
  wf15DecisionLog,
  wf15ExplainDecision,
  type BrainMessageDto,
} from "@/lib/api";

type LocalMessage = BrainMessageDto & { isStreaming?: boolean };

export default function AiBrain() {
  const { businessId } = useAuth();
  const qc = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [showDecisionLog, setShowDecisionLog] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  const conversationsQuery = useQuery({
    queryKey: ["wf15", "conversations", businessId],
    queryFn: () => wf15ListConversations({ business_id: businessId! }),
    enabled: !!businessId,
    retry: false,
  });

  const conversationQuery = useQuery({
    queryKey: ["wf15", "conversation", conversationId],
    queryFn: () =>
      wf15GetConversation({
        business_id: businessId!,
        conversation_id: conversationId!,
      }),
    enabled: !!businessId && !!conversationId,
    retry: false,
  });

  useEffect(() => {
    if (conversationQuery.data) {
      setMessages(conversationQuery.data.messages);
    }
  }, [conversationQuery.data]);

  // Scroll to bottom on new messages and during streaming
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.isStreaming && !userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    } else if (!userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Track if user scrolled up (don't fight them during streaming)
  useEffect(() => {
    const container = bottomRef.current?.parentElement;
    if (!container) return;
    const handler = () => {
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      userScrolledUpRef.current = !atBottom;
    };
    container.addEventListener("scroll", handler);
    return () => container.removeEventListener("scroll", handler);
  }, []);

  const createConv = useMutation({
    mutationFn: () => wf15CreateConversation({ businessId: businessId! }),
    onSuccess: (d) => {
      setConversationId(d.conversationId);
      setMessages([]);
      qc.invalidateQueries({ queryKey: ["wf15", "conversations", businessId] });
    },
  });

  const toolDecision = useMutation({
    mutationFn: (vars: { toolCallId: string; decision: "approve" | "reject" }) =>
      wf15ToolDecision({ businessId: businessId!, ...vars }),
    onSuccess: (_d, vars) => {
      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          toolCalls: m.toolCalls?.map((t) =>
            t.id === vars.toolCallId
              ? {
                  ...t,
                  status: vars.decision === "approve" ? "running" : "rejected",
                }
              : t,
          ),
        })),
      );
      toast.success(vars.decision === "approve" ? "Tool call approved" : "Tool call rejected");
    },
  });

  const handleSend = useCallback(async () => {
    if (!input.trim() || !businessId) return;
    let convId = conversationId;
    if (!convId) {
      const created = await wf15CreateConversation({ businessId });
      convId = created.conversationId;
      setConversationId(convId);
    }

    const now = new Date().toISOString();
    const userMsg: LocalMessage = {
      id: `tmp-user-${Date.now()}`,
      role: "user",
      content: input,
      createdAt: now,
    };
    setMessages((prev) => [...prev, userMsg]);
    const content = input;
    setInput("");
    setStreaming(true);

    try {
      const { data: sessionData } = await externalSupabase.auth.getSession();
      const jwt = sessionData?.session?.access_token ?? "";

      const response = await fetch(`${getApiBase()}/webhook/wf15-send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({
          businessId,
          conversationId: convId!,
          content,
          attachmentIds: [],
        }),
      });

      if (!response.ok || !response.body) throw new Error("Stream failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantMessageId: string | null = null;

      const updateAssistant = (fn: (m: LocalMessage) => LocalMessage) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? fn(m) : m,
          ),
        );
      };

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          if (!event.trim()) continue;

          let eventType = "data";
          let dataLine = "";
          for (const line of event.split("\n")) {
            if (line.startsWith("event:")) eventType = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLine = line.slice(5).trim();
          }

          if (!dataLine) continue;
          if (dataLine === "[DONE]") {
            // Stream complete
            if (assistantMessageId) {
              updateAssistant((m) => ({ ...m, isStreaming: false }));
            }
            setStreaming(false);
            continue;
          }

          try {
            const parsed = JSON.parse(dataLine);

            if (eventType === "meta" && parsed.assistantMessageId) {
              assistantMessageId = parsed.assistantMessageId;
              const assistantMsg: LocalMessage = {
                id: assistantMessageId!,
                role: "assistant",
                content: "",
                reasoning: "",
                toolCalls: [],
                createdAt: new Date().toISOString(),
                isStreaming: true,
              };
              setMessages((prev) => [...prev, assistantMsg]);
            } else if (eventType === "error") {
              toast.error(parsed.message ?? "Stream error");
              if (assistantMessageId) {
                updateAssistant((m) => ({ ...m, isStreaming: false }));
              }
              setStreaming(false);
            } else if (parsed.text) {
              if (assistantMessageId) {
                updateAssistant((m) => ({
                  ...m,
                  content: m.content + parsed.text,
                }));
              }
            }
          } catch {
            /* ignore malformed SSE data */
          }
        }
      }

      setStreaming(false);
    } catch (e) {
      toast.error((e as Error).message || "Failed to send message");
      setStreaming(false);
    }
  }, [input, businessId, conversationId]);

  const stopStream = useCallback(() => {
    setStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    );
  }, []);

  const conversations = conversationsQuery.data?.items ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      {/* ── Left: conversation list ── */}
      <aside className="hidden lg:block">
        <Card className="flex h-[calc(100vh-200px)] flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Conversations</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => createConv.mutate()}
                disabled={createConv.isPending}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            {conversationsQuery.isLoading ? (
              <p className="p-2 text-xs text-muted-foreground">Loading…</p>
            ) : conversations.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">
                No conversations yet. Start by asking anything.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setConversationId(c.id)}
                      className={`w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
                        conversationId === c.id
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <p className="line-clamp-1 font-medium">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.messageCount} messages
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          <div className="border-t border-border p-2">
            <Sheet open={showDecisionLog} onOpenChange={setShowDecisionLog}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Decision log
                </Button>
              </SheetTrigger>
              <DecisionLogSheet businessId={businessId} />
            </Sheet>
          </div>
        </Card>
      </aside>

      {/* ── Right: chat thread + composer ── */}
      <div className="flex h-[calc(100vh-200px)] flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Workflow #15 · AI Brain
            </div>
            <h1 className="mt-0.5 text-2xl font-medium tracking-tight text-foreground">
              Ask Maroa anything
            </h1>
          </div>
          {streaming && (
            <Button size="sm" variant="outline" onClick={stopStream}>
              Stop
            </Button>
          )}
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <EmptyChat />
            ) : (
              <div className="space-y-6">
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} onToolDecision={(tcId, dec) => toolDecision.mutate({ toolCallId: tcId, decision: dec })} />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything — 'why is CAC climbing?', 'write a post about our new launch', 'pause Meta if CTR drops below 1%'…"
                className="min-h-[60px] flex-1 resize-none"
                disabled={streaming}
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!input.trim() || streaming}
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              ⌘⏎ to send · Brain routes automatically to Haiku / Sonnet / Opus
              by query complexity · destructive actions require approval
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble — user or assistant + tool calls
// ---------------------------------------------------------------------------

function MessageBubble({
  message,
  onToolDecision,
}: {
  message: LocalMessage;
  onToolDecision: (toolCallId: string, decision: "approve" | "reject") => void;
}) {
  const [showReasoning, setShowReasoning] = useState(false);
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
        {isUser ? (
          <span className="text-xs font-medium">you</span>
        ) : (
          <Bot className="h-3.5 w-3.5 text-primary" />
        )}
      </div>
      <div className={`flex-1 space-y-2 ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block max-w-[80ch] rounded-lg px-3 py-2 text-sm ${
            isUser
              ? "bg-primary/10 text-foreground"
              : "bg-muted/40 text-foreground"
          }`}
        >
          {!message.content && message.isStreaming && (
            <span className="text-muted-foreground">thinking…</span>
          )}
          {message.content && (
            isUser ? message.content
            : message.isStreaming ? <div className="whitespace-pre-wrap">{message.content}</div>
            : <ReactMarkdownSafe content={message.content} />
          )}
        </div>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-1.5">
            {message.toolCalls.map((t) => (
              <ToolCallCard key={t.id} tool={t} onDecision={onToolDecision} />
            ))}
          </div>
        )}

        {/* Footer: model + cost + explain */}
        {!isUser && message.modelUsed && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Badge variant="outline" className="text-[9px] uppercase">
              {message.modelUsed}
            </Badge>
            {message.costUsd != null && (
              <span className="tabular-nums">${message.costUsd.toFixed(4)}</span>
            )}
            {message.reasoning && (
              <button
                type="button"
                onClick={() => setShowReasoning((v) => !v)}
                className="inline-flex items-center gap-0.5 hover:text-foreground"
              >
                <HelpCircle className="h-3 w-3" />
                {showReasoning ? "hide reasoning" : "explain"}
              </button>
            )}
          </div>
        )}
        {showReasoning && message.reasoning && (
          <div className="rounded border border-primary/20 bg-primary/5 p-2 text-[11px] text-foreground">
            <p className="mb-1 font-medium uppercase tracking-wide text-primary">
              Senior-strategist reasoning
            </p>
            <ReactMarkdownSafe content={message.reasoning} />
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallCard({
  tool,
  onDecision,
}: {
  tool: NonNullable<BrainMessageDto["toolCalls"]>[number];
  onDecision: (id: string, decision: "approve" | "reject") => void;
}) {
  const statusColor: Record<string, string> = {
    pending: "text-muted-foreground",
    running: "text-primary",
    completed: "text-success",
    failed: "text-destructive",
    awaiting_approval: "text-warning",
    rejected: "text-muted-foreground",
  };
  return (
    <div className="rounded border border-border bg-background p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5">
          <Wrench className={`mt-0.5 h-3 w-3 shrink-0 ${statusColor[tool.status]}`} />
          <div>
            <p className="text-xs font-medium text-foreground">{tool.tool}</p>
            <p className="text-[11px] text-muted-foreground">{tool.inputSummary}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] capitalize">
          {tool.status.replace("_", " ")}
        </Badge>
      </div>
      {tool.progress && tool.status === "running" && (
        <div className="mt-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${tool.progress.percent}%` }}
            />
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{tool.progress.note}</p>
        </div>
      )}
      {tool.rationale && (
        <p className="mt-1.5 border-l-2 border-primary/30 pl-2 text-[11px] text-foreground">
          <span className="font-medium">Why: </span>
          {tool.rationale}
        </p>
      )}
      {tool.alternativesConsidered && tool.alternativesConsidered.length > 0 && (
        <details className="mt-1">
          <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
            Alternatives considered ({tool.alternativesConsidered.length})
          </summary>
          <ul className="mt-0.5 ml-3 list-disc text-[10px] text-muted-foreground">
            {tool.alternativesConsidered.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </details>
      )}
      {tool.status === "awaiting_approval" && (
        <div className="mt-2 flex gap-1.5">
          <Button size="sm" className="h-7 text-[11px]" onClick={() => onDecision(tool.id, "approve")}>
            <Check className="mr-1 h-3 w-3" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={() => onDecision(tool.id, "reject")}
          >
            <X className="mr-1 h-3 w-3" />
            Reject
          </Button>
        </div>
      )}
      {tool.error && (
        <p className="mt-1.5 text-[10px] text-destructive">{tool.error}</p>
      )}
    </div>
  );
}

function EmptyChat() {
  const suggestions = [
    "How did last week go?",
    "Why is my Meta CPA climbing?",
    "Write a LinkedIn post about our Q4 launch",
    "Pause all ads if CTR drops below 1% tonight",
    "Show me our top 5 customers by LTV",
    "Should I raise prices 15%?",
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="rounded-full bg-primary/10 p-3">
        <Bot className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-medium text-foreground">Your Chief of Staff is ready</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask anything. Brain synthesizes across every dataset and can execute
          via your other workflows — with approval gates on anything destructive.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {suggestions.map((s) => (
          <Badge key={s} variant="outline" className="text-[11px]">
            "{s}"
          </Badge>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decision log sheet
// ---------------------------------------------------------------------------

function DecisionLogSheet({ businessId }: { businessId: string | null }) {
  const logQuery = useQuery({
    queryKey: ["wf15", "decision-log", businessId],
    queryFn: () => wf15DecisionLog({ business_id: businessId!, limit: "50" }),
    enabled: !!businessId,
    retry: false,
  });
  return (
    <SheetContent className="w-full sm:max-w-lg">
      <SheetHeader>
        <SheetTitle>Decision log</SheetTitle>
      </SheetHeader>
      <div className="mt-4">
        {logQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !logQuery.data || logQuery.data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No decisions logged yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {logQuery.data.items.map((d) => (
              <li key={d.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-foreground">{d.summary}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[9px] uppercase">
                        {d.workflow}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] uppercase">
                        {d.trigger}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] uppercase">
                        {d.modelUsed}
                      </Badge>
                      {d.toolsUsed.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-[9px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        d.outcome === "success"
                          ? "border-success/40 text-success"
                          : d.outcome === "failure"
                            ? "border-destructive/40 text-destructive"
                            : "border-warning/40 text-warning"
                      }`}
                    >
                      {d.outcome}
                    </Badge>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      ${d.costUsd.toFixed(4)}
                    </p>
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  <Clock className="mr-0.5 inline h-2.5 w-2.5" />
                  {new Date(d.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SheetContent>
  );
}

// ---------------------------------------------------------------------------
// ReactMarkdown wrapper that falls back to plain text if the package shape
// changes. Keeps the streaming path safe.
// ---------------------------------------------------------------------------

function ReactMarkdownSafe({ content }: { content: string }) {
  try {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  } catch {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }
}
