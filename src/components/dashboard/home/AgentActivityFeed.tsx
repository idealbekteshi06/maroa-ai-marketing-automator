import { Brain } from "lucide-react";

export interface FeedEntry {
  id: string;
  agent: "drafter" | "brain" | "optimizer" | "guardrail" | "sender" | "scheduler";
  agentLabel: string;
  action: string;
  detail?: string;
  time: string;
  status?: "shipped" | "drafting" | "auto" | "scheduled" | "needs_review";
}

const AGENT_COLORS: Record<string, string> = {
  drafter: "bg-[var(--agent-drafter)]",
  brain: "bg-[var(--agent-brain)]",
  optimizer: "bg-[var(--agent-optimizer)]",
  guardrail: "bg-[var(--agent-guardrail)]",
  sender: "bg-[var(--agent-sender)]",
  scheduler: "bg-[var(--agent-scheduler)]",
};

const STATUS_STYLES: Record<string, string> = {
  shipped: "bg-emerald-50 text-emerald-600",
  drafting: "bg-blue-50 text-blue-600",
  auto: "bg-emerald-50 text-emerald-600",
  scheduled: "bg-cyan-50 text-cyan-600",
  needs_review: "bg-amber-50 text-amber-600",
};

const STATUS_LABELS: Record<string, string> = {
  shipped: "Shipped",
  drafting: "Drafting",
  auto: "Auto",
  scheduled: "Scheduled",
  needs_review: "Review",
};

interface AgentActivityFeedProps {
  items: FeedEntry[];
  activeCount: number;
}

export default function AgentActivityFeed({ items, activeCount }: AgentActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Last 12 hours</h3>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-default)] bg-white px-6 py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-subtle)]">
            <Brain className="h-6 w-6 text-[var(--brand)] animate-pulse" />
          </div>
          <p className="text-[15px] font-medium text-foreground">Your AI team is learning about your business</p>
          <p className="mt-1 text-[13px] text-muted-foreground">First activity will appear here shortly</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Last 12 hours</h3>
        <span className="rounded-full bg-[var(--brand-subtle)] px-3 py-1 text-[11px] font-medium text-[var(--brand)]">
          {activeCount} agent{activeCount !== 1 ? "s" : ""} active
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-[var(--shadow-xs)]">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex min-h-[80px] items-center gap-4 border-b border-[var(--border-default)] px-5 py-4 last:border-0"
            style={{ animation: `fadeSlideIn 300ms ease ${i * 50}ms both` }}
          >
            <div className={`h-2 w-2 shrink-0 rounded-full ${AGENT_COLORS[item.agent] || "bg-gray-400"}`} />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] leading-snug">
                <span className="font-semibold">{item.agentLabel}</span>{" "}
                <span className="text-foreground">{item.action}</span>
              </div>
              {item.detail && (
                <div className="mt-0.5 font-mono text-[13px] text-muted-foreground">{item.detail}</div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-[12px] text-muted-foreground">{item.time}</span>
              {item.status && (
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${STATUS_STYLES[item.status] || ""}`}>
                  {STATUS_LABELS[item.status] || item.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Agent name mapping utility ── */

const AGENT_MAP: Record<string, { agent: FeedEntry["agent"]; label: string }> = {
  content_strategy: { agent: "drafter", label: "Drafter" },
  content_generated: { agent: "drafter", label: "Drafter" },
  content_published: { agent: "sender", label: "Sender" },
  ad_strategy: { agent: "optimizer", label: "Optimizer" },
  campaign_created: { agent: "optimizer", label: "Optimizer" },
  growth_priorities: { agent: "brain", label: "Brain" },
  competitor_analysis: { agent: "brain", label: "Brain" },
  seo_audit: { agent: "brain", label: "Brain" },
  email_sent: { agent: "sender", label: "Sender" },
  review_request: { agent: "sender", label: "Sender" },
  lead_captured: { agent: "guardrail", label: "Guardrail" },
  brand_memory: { agent: "brain", label: "Brain" },
  video_script: { agent: "drafter", label: "Drafter" },
  scheduled: { agent: "scheduler", label: "Scheduler" },
};

export function mapToFeedEntry(raw: { type: string; message: string; time: string; emoji?: string }, index: number): FeedEntry {
  const mapped = AGENT_MAP[raw.type] || { agent: "brain" as const, label: "Brain" };
  return {
    id: `${raw.time}-${index}`,
    agent: mapped.agent,
    agentLabel: mapped.label,
    action: raw.message,
    time: formatRelativeTime(raw.time),
    status: raw.type.includes("published") ? "shipped" : raw.type.includes("generated") ? "drafting" : "auto",
  };
}

function formatRelativeTime(date: string): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
