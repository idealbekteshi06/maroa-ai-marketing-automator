/**
 * Unified Inbox (WF9) — intake, triage + AI-drafted replies.
 *
 * ADVISORY ONLY: the backend has no send path for inbox replies
 * (see CANONICAL_WORKFLOWS.md). Drafts are copy-to-clipboard only —
 * there must be NO send button on this page.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Instagram, Facebook, Mail, MessageCircle, Search, Copy,
  Sparkles, Clock, ArrowLeft, Loader2, Inbox, ShieldCheck, Route,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { wf9ListThreads, wf9Triage, wf9DraftReply } from "@/lib/api";

// ---------------------------------------------------------------------------
// Backend shapes (services/wf9/index.js — inbox_threads / inbox_replies rows)
// ---------------------------------------------------------------------------

interface InboxThread {
  id: string;
  business_id?: string;
  channel?: string | null;
  external_id?: string | null;
  from_handle?: string | null;
  subject?: string | null;
  body?: string | null;
  attachments?: unknown[] | null;
  status?: string | null; // 'new' | 'routed'
  classification?: string | null;
  sentiment?: string | null;
  urgency?: string | null; // 'immediate' | 'high' | 'medium' | 'low'
  sla_deadline?: string | null;
  route_to?: string | null;
  created_at?: string | null;
}

interface Wf9ListThreadsResponse {
  items?: InboxThread[];
}

interface TriageResult {
  classification?: string;
  sentiment?: string;
  urgency?: string;
  sla_minutes?: number;
  route_to?: string;
  ai_can_draft?: boolean;
  routing?: Record<string, unknown>;
}

interface DraftReplyResult {
  replyId?: string;
  reply?: {
    subject_line?: string;
    body?: string;
    tone?: string;
    requires_human_review?: boolean;
    confidence?: number;
  };
}

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

const channelIcon: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  email: Mail,
  whatsapp: MessageCircle,
};

const channelColor: Record<string, string> = {
  instagram: "text-pink-500",
  facebook: "text-blue-500",
  email: "text-orange-500",
  whatsapp: "text-green-500",
};

const urgencyBadge: Record<string, string> = {
  immediate: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-warning/10 text-warning border-warning/30",
  medium: "bg-primary/10 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
};

function ChannelIcon({ channel, className = "h-3 w-3" }: { channel?: string | null; className?: string }) {
  const key = (channel ?? "").toLowerCase();
  const Icon = channelIcon[key] ?? MessageCircle;
  const color = channelColor[key] ?? "text-muted-foreground";
  return <Icon className={`${className} flex-shrink-0 ${color}`} />;
}

function initials(thread: InboxThread): string {
  const source = thread.from_handle || thread.subject || thread.channel || "?";
  return source
    .replace(/^@/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function relativeTime(iso?: string | null): string {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diffMin = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return `${Math.round(diffH / 24)}d`;
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "routed", label: "Routed" },
];

const URGENCY_OPTIONS = ["all", "immediate", "high", "medium", "low"];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UnifiedInbox() {
  const { businessId } = useAuth();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [triageByThread, setTriageByThread] = useState<Record<string, TriageResult>>({});
  const [draftByThread, setDraftByThread] = useState<Record<string, DraftReplyResult>>({});

  const threadsQuery = useQuery({
    queryKey: ["wf9", "threads", businessId, statusFilter, urgencyFilter],
    queryFn: () =>
      wf9ListThreads({
        business_id: businessId!,
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(urgencyFilter !== "all" ? { urgency: urgencyFilter } : {}),
      }) as Promise<Wf9ListThreadsResponse>,
    enabled: !!businessId,
    retry: false,
  });

  const threads = threadsQuery.data?.items ?? [];

  const filtered = threads.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.from_handle ?? "").toLowerCase().includes(q) ||
      (t.subject ?? "").toLowerCase().includes(q) ||
      (t.body ?? "").toLowerCase().includes(q)
    );
  });

  const activeThread =
    filtered.find((t) => t.id === selectedThreadId) ?? filtered[0] ?? null;

  const triageMutation = useMutation({
    mutationFn: (threadId: string) =>
      wf9Triage({ businessId: businessId!, threadId }) as Promise<TriageResult>,
    onSuccess: (data, threadId) => {
      setTriageByThread((prev) => ({ ...prev, [threadId]: data ?? {} }));
      qc.invalidateQueries({ queryKey: ["wf9", "threads", businessId] });
      toast.success("Thread triaged");
    },
    onError: (e: Error) => toast.error(e.message || "Triage failed"),
  });

  const draftMutation = useMutation({
    mutationFn: (threadId: string) =>
      wf9DraftReply({
        businessId: businessId!,
        threadId,
        triage: triageByThread[threadId] as Record<string, unknown> | undefined,
      }) as Promise<DraftReplyResult>,
    onSuccess: (data, threadId) => {
      setDraftByThread((prev) => ({ ...prev, [threadId]: data ?? {} }));
      toast.success("Reply drafted");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to draft reply"),
  });

  const copyDraft = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Reply copied to clipboard");
    } catch {
      toast.error("Could not copy — select the text manually");
    }
  };

  const activeDraft = activeThread ? draftByThread[activeThread.id] : undefined;
  const activeTriage = activeThread ? triageByThread[activeThread.id] : undefined;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Top bar — status tabs + urgency filter + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList className="bg-muted/50">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
                {tab.label}
                {tab.value === "all" && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                    {threads.length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="h-9 w-full sm:w-40 text-xs sm:text-sm">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            {URGENCY_OPTIONS.map((u) => (
              <SelectItem key={u} value={u} className="capitalize text-sm">
                {u === "all" ? "All urgencies" : u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative w-full sm:w-64 sm:ml-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 gap-0 border border-border rounded-lg overflow-hidden bg-card min-h-0">
        {/* Left — Thread list */}
        <div className={`w-full md:w-80 md:block border-r border-border flex-shrink-0 ${showThread ? "hidden" : "block"}`}>
          <ScrollArea className="h-full">
            {threadsQuery.isLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : threadsQuery.isError ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {(threadsQuery.error as Error)?.message || "Failed to load inbox."}
                </p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => threadsQuery.refetch()}>
                  Retry
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">Inbox is clear</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Inbox is clear — connected channels will appear here
                </p>
              </div>
            ) : (
              filtered.map((thread) => {
                const isActive = activeThread?.id === thread.id;
                const preview = thread.subject || thread.body || "(no content)";
                return (
                  <button
                    key={thread.id}
                    onClick={() => { setSelectedThreadId(thread.id); setShowThread(true); }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b border-border ${isActive ? "bg-muted/70" : ""}`}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials(thread)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {thread.from_handle || thread.subject || "Unknown sender"}
                        </span>
                        <span className="text-[11px] text-muted-foreground ml-2 flex-shrink-0">
                          {relativeTime(thread.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ChannelIcon channel={thread.channel} />
                        <span className="text-xs text-muted-foreground truncate">{preview}</span>
                      </div>
                    </div>
                    {thread.urgency && (
                      <Badge
                        variant="outline"
                        className={`text-[9px] capitalize flex-shrink-0 ${urgencyBadge[thread.urgency] ?? "border-border text-muted-foreground"}`}
                      >
                        {thread.urgency}
                      </Badge>
                    )}
                  </button>
                );
              })
            )}
          </ScrollArea>
        </div>

        {/* Center — Thread detail */}
        <div className={`flex-1 flex flex-col min-w-0 ${!showThread ? "hidden md:flex" : "flex"}`}>
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="h-8 w-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a conversation to view its details.
              </p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setShowThread(false)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {initials(activeThread)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activeThread.from_handle || activeThread.subject || "Unknown sender"}
                  </p>
                  <div className="flex items-center gap-1">
                    <ChannelIcon channel={activeThread.channel} />
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {activeThread.channel || "unknown channel"}
                    </span>
                    {activeThread.status && (
                      <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[9px] capitalize">
                        {activeThread.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Message body + draft */}
              <ScrollArea className="flex-1 px-4 py-4">
                <div className="space-y-4">
                  {activeThread.created_at && (
                    <p className="text-center text-[11px] text-muted-foreground">
                      {new Date(activeThread.created_at).toLocaleString()}
                    </p>
                  )}
                  {activeThread.subject && (
                    <p className="text-sm font-medium">{activeThread.subject}</p>
                  )}
                  <div className="flex justify-start">
                    <div className="max-w-[75%] rounded-2xl px-4 py-2.5 bg-muted text-foreground rounded-bl-md">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {activeThread.body || "(no message body)"}
                      </p>
                    </div>
                  </div>

                  {/* AI draft (copy-only) */}
                  {activeDraft?.reply?.body && (
                    <div className="flex justify-end">
                      <div className="max-w-[75%] rounded-2xl px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-br-md">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-medium text-primary">AI draft</span>
                          {activeDraft.reply.tone && (
                            <Badge variant="secondary" className="h-4 px-1.5 text-[9px] capitalize">
                              {activeDraft.reply.tone}
                            </Badge>
                          )}
                          {typeof activeDraft.reply.confidence === "number" && (
                            <span className="text-[10px] text-muted-foreground">
                              {(activeDraft.reply.confidence * 100).toFixed(0)}% confidence
                            </span>
                          )}
                        </div>
                        {activeDraft.reply.subject_line && (
                          <p className="text-xs font-medium mb-1">{activeDraft.reply.subject_line}</p>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {activeDraft.reply.body}
                        </p>
                        {activeDraft.reply.requires_human_review !== false && (
                          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Needs human review before use
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Actions — advisory only, NO send */}
              <div className="border-t border-border px-4 py-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triageMutation.mutate(activeThread.id)}
                    disabled={triageMutation.isPending}
                  >
                    {triageMutation.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Route className="mr-1.5 h-4 w-4" />
                    )}
                    Run triage
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => draftMutation.mutate(activeThread.id)}
                    disabled={draftMutation.isPending}
                  >
                    {draftMutation.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1.5 h-4 w-4" />
                    )}
                    {activeDraft?.reply?.body ? "Redraft reply" : "Draft AI reply"}
                  </Button>
                  {activeDraft?.reply?.body && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => copyDraft(activeDraft.reply?.body ?? "")}
                    >
                      <Copy className="mr-1.5 h-4 w-4" />
                      Copy reply
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Drafts are copy-only — sending from Maroa is coming later.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Right — Triage details (hidden on mobile) */}
        <div className="hidden lg:flex w-72 flex-col border-l border-border flex-shrink-0">
          <ScrollArea className="flex-1">
            {!activeThread ? (
              <div className="p-4">
                <p className="text-xs text-muted-foreground">No conversation selected.</p>
              </div>
            ) : (
              <div className="p-4 space-y-5">
                {/* Profile */}
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-16 w-16 mb-3">
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {initials(activeThread)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-sm font-semibold break-all">
                    {activeThread.from_handle || "Unknown sender"}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground capitalize">
                    <ChannelIcon channel={activeThread.channel} />
                    {activeThread.channel || "unknown channel"}
                  </div>
                </div>

                {/* Triage details */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Route className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Triage</span>
                  </div>
                  <dl className="space-y-2 text-xs">
                    <TriageRow label="Classification" value={activeTriage?.classification ?? activeThread.classification} />
                    <TriageRow label="Sentiment" value={activeTriage?.sentiment ?? activeThread.sentiment} />
                    <TriageRow label="Urgency" value={activeTriage?.urgency ?? activeThread.urgency} />
                    <TriageRow label="Route to" value={activeTriage?.route_to ?? activeThread.route_to} />
                    <TriageRow label="Status" value={activeThread.status} />
                  </dl>
                  {activeThread.sla_deadline && (
                    <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      SLA: {new Date(activeThread.sla_deadline).toLocaleString()}
                    </div>
                  )}
                  {!activeTriage &&
                    !activeThread.classification &&
                    !activeThread.urgency && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Not triaged yet — run triage to classify and route this thread.
                      </p>
                    )}
                </div>

                {/* Advisory note */}
                <div className="rounded border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">AI drafts</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Maroa drafts replies for you to review and paste into the
                    original channel. Drafts are copy-only — sending from Maroa
                    is coming later.
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function TriageRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="capitalize text-foreground">
        {value ? <Badge variant="secondary" className="text-[10px] capitalize">{value}</Badge> : "—"}
      </dd>
    </div>
  );
}
