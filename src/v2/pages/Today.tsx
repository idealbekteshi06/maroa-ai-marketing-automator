import { useAuth } from "@/contexts/AuthContext";
import { Card, Pill, Btn } from "@/v2/components/common/Card";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import {
  useHealth,
  useDashboardEvents,
  useOpportunities,
} from "@/v2/lib/api/hooks/useHome";
import { useContent, useAds, useCompetitors, useCalendar } from "@/v2/lib/api/hooks/useModules";
import { Instagram, Facebook, Megaphone, Eye, FileBarChart, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";

interface PlanItem {
  id: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  status: "Ready" | "Needs review" | "Scheduled" | "Watching";
  action?: "Approve" | "Edit" | "Skip" | "View";
}

function statusTone(s: PlanItem["status"]) {
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

export default function Today() {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const bid = business?.id;

  const health = useHealth(user?.id);
  const events = useDashboardEvents(bid);
  const opps = useOpportunities(user?.id);
  const content = useContent(bid);
  const ads = useAds(bid);
  const competitors = useCompetitors(bid);
  const now = new Date();
  const calendar = useCalendar(bid, now.getMonth() + 1, now.getFullYear());

  const firstName =
    (user?.user_metadata?.first_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  const plan: PlanItem[] = useMemo(() => {
    const items: PlanItem[] = [];
    const drafts = Array.isArray(content.data) ? content.data : [];
    const ig = drafts.find((c: any) => /insta/i.test(c?.platform ?? "") || c?.instagram_caption);
    const fb = drafts.find((c: any) => /face/i.test(c?.platform ?? "") || c?.facebook_post);
    if (ig)
      items.push({
        id: `ig-${ig.id ?? "draft"}`,
        icon: Instagram,
        title: "Instagram post",
        desc: (ig.instagram_caption ?? ig.content_theme ?? "Draft ready for review.").toString().slice(0, 100),
        status: ig.status === "published" ? "Scheduled" : ig.status === "pending_approval" ? "Needs review" : "Ready",
        action: ig.status === "published" ? "View" : "Approve",
      });
    if (fb)
      items.push({
        id: `fb-${fb.id ?? "draft"}`,
        icon: Facebook,
        title: "Facebook post",
        desc: (fb.facebook_post ?? fb.content_theme ?? "Draft ready for review.").toString().slice(0, 100),
        status: fb.status === "published" ? "Scheduled" : fb.status === "pending_approval" ? "Needs review" : "Ready",
        action: fb.status === "published" ? "View" : "Approve",
      });
    const adList = Array.isArray(ads.data) ? ads.data : [];
    if (adList.length > 0)
      items.push({
        id: "ad-refresh",
        icon: Megaphone,
        title: "Ad creative refresh",
        desc: `${adList.length} active campaign${adList.length === 1 ? "" : "s"} suggested for refresh.`,
        status: "Needs review",
        action: "View",
      });
    const compList = Array.isArray(competitors.data) ? competitors.data : [];
    if (compList.length > 0)
      items.push({
        id: "comp-trend",
        icon: Eye,
        title: "Competitor movement",
        desc: `Activity across ${compList.length} tracked competitor${compList.length === 1 ? "" : "s"}.`,
        status: "Watching",
        action: "View",
      });
    items.push({
      id: "weekly-scorecard",
      icon: FileBarChart,
      title: "Weekly scorecard",
      desc: "Performance brief lands Friday morning.",
      status: "Scheduled",
    });
    return items;
  }, [content.data, ads.data, competitors.data]);

  const approvalsCount = useMemo(() => {
    const drafts = Array.isArray(content.data) ? content.data : [];
    return drafts.filter((c: any) => c?.status === "pending_approval" || c?.status === "draft").length;
  }, [content.data]);

  const nextScheduled = useMemo(() => {
    const cal = Array.isArray(calendar.data) ? calendar.data : [];
    const future = cal
      .filter((c: any) => c?.scheduled_at && new Date(c.scheduled_at).getTime() >= Date.now())
      .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    return future[0] ?? cal[0] ?? null;
  }, [calendar.data]);

  const insight = opps.data?.[0];
  const score = health.data?.score;
  const updated =
    events.data?.[0]?.created_at ?? health.data?.updated_at ?? new Date().toISOString();

  const loadingPlan = content.isLoading || ads.isLoading || competitors.isLoading;

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Executive header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div
            className="text-[11px] font-medium uppercase tracking-[0.08em]"
            style={{ color: "hsl(var(--m-muted-foreground))" }}
          >
            {dateLabel}
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight mt-1.5 leading-tight">
            {greeting()}, {firstName}.
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] tabular-nums" style={{ color: "hsl(var(--m-muted-foreground))" }}>
            Updated {ago(updated)}
          </span>
          <Btn variant="primary" size="md">Approve today's plan</Btn>
        </div>
      </header>

      {/* Brief: 4 tiles above the fold */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl overflow-hidden"
        style={{
          background: "hsl(var(--m-surface-elevated))",
          border: "1px solid hsl(var(--m-border-subtle))",
        }}
      >
        {/* Tile 1 — Today's plan */}
        <Tile label="Today's plan">
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-semibold tabular-nums leading-none">
              {loadingPlan ? "—" : plan.length}
            </span>
            <span className="text-[12px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              action{plan.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-[12px] mt-2" style={{ color: "hsl(var(--m-muted-foreground))" }}>
            Prepared by Maroa
          </p>
        </Tile>

        {/* Tile 2 — Approval queue */}
        <Tile label="Approval queue" divide>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-semibold tabular-nums leading-none">
              {content.isLoading ? "—" : approvalsCount}
            </span>
            <span className="text-[12px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              waiting
            </span>
          </div>
          <button
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium hover:underline"
            style={{ color: "hsl(var(--m-foreground))" }}
          >
            Review <ArrowUpRight size={12} />
          </button>
        </Tile>

        {/* Tile 3 — Key insight */}
        <Tile label="Key insight" divide>
          {opps.isLoading ? (
            <div className="h-10 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
          ) : insight ? (
            <p className="text-[13px] leading-snug line-clamp-3">{insight.title}</p>
          ) : (
            <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              Maroa is still learning. Insights appear with more signal.
            </p>
          )}
        </Tile>

        {/* Tile 4 — Next scheduled */}
        <Tile label="Next scheduled" divide>
          {calendar.isLoading ? (
            <div className="h-10 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
          ) : nextScheduled ? (
            <>
              <p className="text-[13px] font-medium truncate">
                {nextScheduled.title ?? nextScheduled.theme ?? "Scheduled action"}
              </p>
              <p className="text-[12px] mt-1 tabular-nums" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                {nextScheduled.scheduled_at
                  ? new Date(nextScheduled.scheduled_at).toLocaleString(undefined, {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "—"}
              </p>
            </>
          ) : (
            <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              Nothing scheduled yet.
            </p>
          )}
        </Tile>
      </section>

      {/* Below the fold: plan detail + side rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Today's plan" padded={false}>
            {loadingPlan ? (
              <ul>
                {[0, 1, 2].map((i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 px-5 py-3.5"
                    style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}
                  >
                    <div className="w-7 h-7 rounded-md animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                      <div className="h-3 w-2/3 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul>
                {plan.map((item, idx) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3.5 px-5 py-3.5"
                    style={{
                      borderBottom:
                        idx === plan.length - 1 ? "none" : "1px solid hsl(var(--m-border-subtle))",
                    }}
                  >
                    <item.icon
                      size={15}
                      strokeWidth={1.75}
                      className="mt-0.5 shrink-0"
                      style={{ color: "hsl(var(--m-muted-foreground))" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium truncate">{item.title}</span>
                        <Pill tone={statusTone(item.status)}>{item.status}</Pill>
                      </div>
                      <p
                        className="text-[12.5px] mt-0.5 line-clamp-1"
                        style={{ color: "hsl(var(--m-muted-foreground))" }}
                      >
                        {item.desc}
                      </p>
                    </div>
                    {item.action && (
                      <Btn variant={item.action === "Approve" ? "primary" : "secondary"}>
                        {item.action}
                      </Btn>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Marketing health">
            <div className="flex items-baseline gap-1.5 mb-4">
              {health.isLoading ? (
                <div className="h-8 w-16 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
              ) : (
                <>
                  <span className="text-[28px] font-semibold tabular-nums leading-none">
                    {score ?? "—"}
                  </span>
                  <span className="text-[12px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    / 100
                  </span>
                </>
              )}
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Content", key: "content" },
                { label: "Ads", key: "ads" },
                { label: "Search", key: "seo" },
                { label: "Competitors", key: "competitors" },
              ].map((row) => {
                const val =
                  (health.data?.dimensions?.[row.key] as number | undefined) ??
                  (health.data?.dimensions?.[row.label.toLowerCase()] as number | undefined);
                return (
                  <div key={row.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                        {row.label}
                      </span>
                      <span className="text-[12px] font-medium tabular-nums">
                        {val !== undefined ? val : "—"}
                      </span>
                    </div>
                    <div
                      className="h-[3px] rounded-full overflow-hidden"
                      style={{ background: "hsl(var(--m-border-subtle))" }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.max(0, Math.min(100, val ?? 0))}%`,
                          background: "hsl(var(--m-foreground))",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Recent activity" padded={false}>
            {events.isLoading ? (
              <div className="p-5 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-4 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                ))}
              </div>
            ) : !events.data || events.data.length === 0 ? (
              <div className="px-5 py-6">
                <p className="text-[12px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                  No activity logged today.
                </p>
              </div>
            ) : (
              <ul>
                {events.data.slice(0, 5).map((e, idx, arr) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-2.5 px-5 py-2.5"
                    style={{
                      borderBottom:
                        idx === arr.length - 1 ? "none" : "1px solid hsl(var(--m-border-subtle))",
                    }}
                  >
                    <span className="text-[12.5px] flex-1 truncate">{e.title}</span>
                    <span
                      className="text-[11px] tabular-nums shrink-0"
                      style={{ color: "hsl(var(--m-muted-foreground))" }}
                    >
                      {ago(e.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Tile({
  label,
  children,
  divide,
}: {
  label: string;
  children: React.ReactNode;
  divide?: boolean;
}) {
  return (
    <div
      className="p-5 min-h-[112px] flex flex-col"
      style={{
        borderLeft: divide ? "1px solid hsl(var(--m-border-subtle))" : undefined,
      }}
    >
      <div
        className="text-[11px] font-medium uppercase tracking-[0.06em] mb-3"
        style={{ color: "hsl(var(--m-muted-foreground))" }}
      >
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
