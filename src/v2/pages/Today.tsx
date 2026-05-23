import { useAuth } from "@/contexts/AuthContext";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import { useContent } from "@/v2/lib/api/hooks/useModules";
import { Card, Pill, Btn } from "@/v2/components/common/Card";
import { useTodayPageData } from "@/v2/lib/data/usePageData";
import {
  approveApprovalItem,
  batchApproveToday,
  refreshToday,
  generateWeeklyContent,
  viewHealthDetails,
  viewRecentActivity,
  viewUpcomingSchedule,
} from "@/v2/lib/data/handlers";
import type { TodayPlanItem } from "@/v2/lib/data/types";
import {
  Instagram, Facebook, Megaphone, Eye, FileBarChart,
  CheckCircle2, ChevronRight, AlertCircle, RefreshCw, Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ReviewDrawer from "./today/ReviewDrawer";

const ICON_MAP: Record<TodayPlanItem["iconKey"], LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  ads: Megaphone,
  competitor: Eye,
  report: FileBarChart,
};

function statusTone(s: TodayPlanItem["status"]) {
  if (s === "Ready") return "success" as const;
  if (s === "Needs review") return "warning" as const;
  if (s === "Scheduled") return "info" as const;
  return "muted" as const;
}

function ago(iso?: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function healthLabel(score?: number | null): string {
  if (score == null) return "Getting set up";
  if (score >= 80) return "Looking great";
  if (score >= 60) return "On track";
  if (score >= 40) return "Needs a little attention";
  return "Needs your attention";
}

function healthTone(score: number) {
  if (score >= 70) return "hsl(var(--m-success))";
  if (score >= 40) return "hsl(var(--m-warning))";
  return "hsl(var(--m-destructive))";
}

interface DrawerItem {
  id: string;
  title: string;
  platform?: string;
  caption?: string;
  hashtags?: string[];
  mediaUrl?: string | null;
  status?: string;
  scheduledAt?: string | null;
}

function platformLabel(raw: any): string | undefined {
  const p = (raw?.platform ?? "").toString().toLowerCase();
  if (p.includes("insta") || raw?.instagram_caption) return "Instagram";
  if (p.includes("face") || raw?.facebook_post) return "Facebook";
  if (p.includes("tik") || raw?.tiktok_caption) return "TikTok";
  if (p.includes("link") || raw?.linkedin_post) return "LinkedIn";
  return undefined;
}

function toDrawerItem(raw: any): DrawerItem {
  return {
    id: raw?.id ?? "unknown",
    title: raw?.content_theme ?? raw?.title ?? "Social post",
    platform: platformLabel(raw),
    caption:
      raw?.instagram_caption ??
      raw?.facebook_post ??
      raw?.tiktok_caption ??
      raw?.linkedin_post ??
      raw?.caption ??
      raw?.preview ??
      "",
    hashtags: Array.isArray(raw?.hashtags) ? raw.hashtags : undefined,
    mediaUrl: raw?.media_url ?? raw?.image_url ?? raw?.thumbnail_url ?? null,
    status: raw?.status,
    scheduledAt: raw?.scheduled_at ?? null,
  };
}

export default function Today() {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const content = useContent(business?.id);
  const state = useTodayPageData();
  const [detailsTab, setDetailsTab] = useState<"health" | "activity" | "upcoming">("health");
  const [reviewing, setReviewing] = useState<DrawerItem | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);

  // re-render once a minute so "x m ago" stays fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const firstName =
    (user?.user_metadata?.first_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  // Build a quick lookup of raw drafts for the drawer.
  const draftsById = useMemo(() => {
    const list = Array.isArray(content.data) ? content.data : [];
    const map = new Map<string, any>();
    list.forEach((c: any) => c?.id && map.set(c.id, c));
    return map;
  }, [content.data]);

  const openReview = (rawIdOrPrefixed: string) => {
    const id = rawIdOrPrefixed.replace(/^(ig|fb|tk|li)-/, "");
    const raw = draftsById.get(id);
    if (raw) setReviewing(toDrawerItem(raw));
    else setReviewing({ id, title: "Social post", caption: "Loading…" });
  };

  const handleBatchApprove = async (ids: string[]) => {
    setBatchBusy(true);
    try { await batchApproveToday(ids); } finally { setBatchBusy(false); }
  };

  const handleGenerate = async () => {
    setGenBusy(true);
    try { await generateWeeklyContent(); } finally { setGenBusy(false); }
  };

  if (state.status === "error") {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex items-start gap-3">
            <AlertCircle size={18} style={{ color: "hsl(var(--m-destructive))" }} />
            <div className="flex-1">
              <div className="text-[14px] font-medium">We couldn't load today's brief.</div>
              <p className="text-[12.5px] mt-1" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                Please refresh in a moment. If this keeps happening, we'll already know.
              </p>
            </div>
            <Btn onClick={refreshToday}>
              <RefreshCw size={12} /> Try again
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  const isLoading = state.status === "loading";
  const data = state.status === "loading" ? undefined : state.data;

  // Real pending IDs (those that exist in the cache & are pending_approval/draft).
  const pendingIds = useMemo(() => {
    const list = Array.isArray(content.data) ? content.data : [];
    return list
      .filter((c: any) => c?.status === "pending_approval" || c?.status === "draft")
      .map((c: any) => c.id)
      .filter(Boolean);
  }, [content.data]);

  const totalToApprove = pendingIds.length || (data?.approvalsCount ?? 0);

  const summary = (() => {
    if (!data) return "Loading today's brief…";
    const bits: string[] = [];
    if (totalToApprove > 0) bits.push(`${totalToApprove} thing${totalToApprove === 1 ? "" : "s"} to approve`);
    if (data.nextScheduled?.scheduledAt) {
      const d = new Date(data.nextScheduled.scheduledAt);
      const sameDay = d.toDateString() === new Date().toDateString();
      bits.push(sameDay ? `next post at ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : `next post ${d.toLocaleDateString([], { weekday: "short" })}`);
    }
    if (bits.length === 0) return "You're all caught up. We'll let you know when something needs you.";
    return `You've got ${bits.join(" · ")}.`;
  })();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section
        className="rounded-2xl p-6 sm:p-8"
        style={{
          background: "hsl(var(--m-surface-elevated))",
          border: "1px solid hsl(var(--m-border-subtle))",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              {dateLabel}
            </div>
            <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight mt-1.5 leading-tight">
              {greeting()}, {firstName}.
            </h1>
            <p className="text-[15px] mt-2 max-w-2xl" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              {summary}
            </p>
          </div>
          <button
            onClick={refreshToday}
            title="Refresh"
            className="shrink-0 h-9 w-9 rounded-lg inline-flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ background: "hsl(var(--m-surface))", border: "1px solid hsl(var(--m-border-subtle))" }}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {totalToApprove > 0 ? (
            <>
              <Btn
                variant="primary"
                size="md"
                className="!h-10 !px-5 !text-[14px]"
                disabled={batchBusy}
                onClick={() => handleBatchApprove(pendingIds)}
              >
                {batchBusy ? "Approving…" : `Approve all ${totalToApprove} →`}
              </Btn>
              <Btn size="md" className="!h-10 !px-4 !text-[13px]" onClick={() => {
                const first = pendingIds[0] ?? data?.approvals[0]?.id;
                if (first) openReview(first);
              }}>
                Review one by one
              </Btn>
            </>
          ) : (
            <Btn
              variant="primary"
              size="md"
              className="!h-10 !px-5 !text-[14px]"
              disabled={genBusy}
              onClick={handleGenerate}
            >
              <Sparkles size={13} /> {genBusy ? "Generating…" : "Make me something new"}
            </Btn>
          )}
          {data && (
            <span className="text-[12px] tabular-nums ml-auto" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              Updated {ago(data.updatedAt)}
            </span>
          )}
        </div>
      </section>

      {/* What's on for today */}
      <Card title="What's on for today" padded={false}>
        {data?.insight && (
          <div
            className="px-5 py-3 flex items-start gap-3"
            style={{
              background: "hsl(var(--m-info) / 0.06)",
              borderBottom: "1px solid hsl(var(--m-border-subtle))",
            }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 shrink-0" style={{ color: "hsl(var(--m-info))" }}>
              Tip
            </span>
            <p className="text-[13px] leading-snug">{data.insight.title}</p>
          </div>
        )}

        {isLoading ? (
          <ul>
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}>
                <div className="w-7 h-7 rounded-md animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                  <div className="h-3 w-2/3 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                </div>
              </li>
            ))}
          </ul>
        ) : !data || data.plan.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle2 size={22} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: "hsl(var(--m-success))" }} />
            <div className="text-[14px] font-medium">Nothing on your plate</div>
            <p className="text-[12.5px] mt-1" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              We'll ping you when there's something to look at.
            </p>
          </div>
        ) : (
          <ul>
            {data.plan.map((item, idx) => {
              const Icon = ICON_MAP[item.iconKey];
              const last = idx === data.plan.length - 1;
              const isApprovable = item.action === "Approve";
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3.5 px-5 py-4 transition-colors hover:brightness-[0.99]"
                  style={{ borderBottom: last ? "none" : "1px solid hsl(var(--m-border-subtle))" }}
                >
                  <Icon size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" style={{ color: "hsl(var(--m-muted-foreground))" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium truncate">{item.title}</span>
                      <Pill tone={statusTone(item.status)}>{item.status}</Pill>
                    </div>
                    <p className="text-[12.5px] mt-0.5 line-clamp-2" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                      {item.description}
                    </p>
                  </div>
                  {item.action && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isApprovable && (
                        <Btn variant="ghost" onClick={() => openReview(item.id)}>
                          Review
                        </Btn>
                      )}
                      <Btn
                        variant={isApprovable ? "primary" : "secondary"}
                        onClick={() =>
                          isApprovable
                            ? approveApprovalItem(item.id.replace(/^(ig|fb|tk|li)-/, ""))
                            : openReview(item.id)
                        }
                      >
                        {item.action}
                      </Btn>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Details tabs */}
      <section
        className="rounded-xl"
        style={{
          background: "hsl(var(--m-surface-elevated))",
          border: "1px solid hsl(var(--m-border-subtle))",
        }}
      >
        <div className="flex items-center justify-between px-5 h-11" style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}>
          <div className="flex gap-1">
            {([
              ["health", "How things are going"],
              ["activity", "Recent activity"],
              ["upcoming", "Coming up"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setDetailsTab(key)}
                className="px-2.5 h-7 rounded-md text-[12px] font-medium transition-colors"
                style={{
                  background: detailsTab === key ? "hsl(var(--m-surface))" : "transparent",
                  color: detailsTab === key ? "hsl(var(--m-foreground))" : "hsl(var(--m-muted-foreground))",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              detailsTab === "health"
                ? viewHealthDetails()
                : detailsTab === "activity"
                ? viewRecentActivity()
                : viewUpcomingSchedule()
            }
            className="inline-flex items-center gap-0.5 text-[12px] font-medium"
            style={{ color: "hsl(var(--m-muted-foreground))" }}
          >
            View details <ChevronRight size={13} />
          </button>
        </div>

        <div className="p-5">
          {detailsTab === "health" &&
            (isLoading ? (
              <div className="h-10 w-40 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
            ) : !data?.health ? (
              <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                We're calculating your score. It'll appear after Maroa has a few days of data.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20">
                    <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--m-border-subtle))" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={healthTone(data.health.score)}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${data.health.score} 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[18px] font-semibold tabular-nums">
                      {data.health.score}
                    </div>
                  </div>
                  <div>
                    <div className="text-[14px] font-medium">{healthLabel(data.health.score)}</div>
                    <div className="text-[12px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                      Overall marketing health, this week.
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  {(Object.entries(data.health.dimensions) as [string, number][]).map(([k, v]) => (
                    <div key={k}>
                      <div className="flex items-center justify-between text-[11.5px] mb-1">
                        <span className="capitalize" style={{ color: "hsl(var(--m-muted-foreground))" }}>{k}</span>
                        <span className="tabular-nums font-medium">{v}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--m-border-subtle))" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, v)}%`, background: healthTone(v) }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {detailsTab === "activity" &&
            (isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-4 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                ))}
              </div>
            ) : !data || data.recentActivity.length === 0 ? (
              <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                Nothing yet today. We'll log things here as Maroa works.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.recentActivity.map((e) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "hsl(var(--m-info))" }} />
                    <span className="text-[13px] flex-1 truncate">{e.title}</span>
                    <span className="text-[11px] tabular-nums shrink-0" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                      {ago(e.occurredAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ))}

          {detailsTab === "upcoming" &&
            (isLoading ? (
              <div className="h-4 w-2/3 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
            ) : !data?.nextScheduled ? (
              <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                Nothing scheduled yet — we'll plan posts as soon as you approve a few.
              </p>
            ) : (
              <div>
                <div className="text-[14px] font-medium">{data.nextScheduled.title}</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                  {new Date(data.nextScheduled.scheduledAt).toLocaleString(undefined, {
                    weekday: "long", month: "short", day: "numeric",
                    hour: "numeric", minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Approval queue */}
      {data && data.approvals.length > 0 && (
        <Card
          title="Approval queue"
          padded={false}
          action={
            pendingIds.length > 0 ? (
              <Btn variant="primary" disabled={batchBusy} onClick={() => handleBatchApprove(pendingIds)}>
                {batchBusy ? "Approving…" : `Approve all (${pendingIds.length})`}
              </Btn>
            ) : null
          }
        >
          <ul>
            {data.approvals.map((a, idx) => (
              <li
                key={a.id}
                className="px-5 py-4 flex items-start gap-4"
                style={{ borderBottom: idx === data.approvals.length - 1 ? "none" : "1px solid hsl(var(--m-border-subtle))" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium truncate">{a.title}</span>
                    <Pill tone="muted">{a.platform}</Pill>
                  </div>
                  <p className="text-[12.5px] mt-1 line-clamp-2" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    {a.preview}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Btn variant="ghost" onClick={() => openReview(a.id)}>Review</Btn>
                  <Btn variant="primary" onClick={() => approveApprovalItem(a.id)}>Approve</Btn>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ReviewDrawer open={!!reviewing} onClose={() => setReviewing(null)} item={reviewing} />
    </div>
  );
}
