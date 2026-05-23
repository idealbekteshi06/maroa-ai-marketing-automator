import { useAuth } from "@/contexts/AuthContext";
import { Card, Pill, Btn } from "@/v2/components/common/Card";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import {
  useHealth,
  useDashboardEvents,
  useOpportunities,
} from "@/v2/lib/api/hooks/useHome";
import { useContent, useAds, useCompetitors, useCalendar } from "@/v2/lib/api/hooks/useModules";
import {
  Instagram,
  Facebook,
  Megaphone,
  Eye,
  FileBarChart,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";
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
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
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

  // Build today's plan from real data — falls back to clear empty.
  const plan: PlanItem[] = useMemo(() => {
    const items: PlanItem[] = [];
    const drafts = Array.isArray(content.data) ? content.data : [];
    const ig = drafts.find((c: any) => /insta/i.test(c?.platform ?? "") || c?.instagram_caption);
    const fb = drafts.find((c: any) => /face/i.test(c?.platform ?? "") || c?.facebook_post);
    if (ig)
      items.push({
        id: `ig-${ig.id ?? "draft"}`,
        icon: Instagram,
        title: "Instagram post ready",
        desc: (ig.instagram_caption ?? ig.content_theme ?? "Draft is ready for your review.").toString().slice(0, 110),
        status: ig.status === "published" ? "Scheduled" : ig.status === "pending_approval" ? "Needs review" : "Ready",
        action: ig.status === "published" ? "View" : "Approve",
      });
    if (fb)
      items.push({
        id: `fb-${fb.id ?? "draft"}`,
        icon: Facebook,
        title: "Facebook post ready",
        desc: (fb.facebook_post ?? fb.content_theme ?? "Draft is ready for your review.").toString().slice(0, 110),
        status: fb.status === "published" ? "Scheduled" : fb.status === "pending_approval" ? "Needs review" : "Ready",
        action: fb.status === "published" ? "View" : "Approve",
      });
    const adList = Array.isArray(ads.data) ? ads.data : [];
    if (adList.length > 0)
      items.push({
        id: "ad-refresh",
        icon: Megaphone,
        title: "Ad creative refresh recommended",
        desc: `${adList.length} active campaign${adList.length === 1 ? "" : "s"} — Maroa suggests new creatives this week.`,
        status: "Needs review",
        action: "View",
      });
    const compList = Array.isArray(competitors.data) ? competitors.data : [];
    if (compList.length > 0)
      items.push({
        id: "comp-trend",
        icon: Eye,
        title: "Competitor trend detected",
        desc: `Movement across ${compList.length} tracked competitor${compList.length === 1 ? "" : "s"}.`,
        status: "Watching",
        action: "View",
      });
    items.push({
      id: "weekly-scorecard",
      icon: FileBarChart,
      title: "Weekly scorecard scheduled",
      desc: "Performance brief lands in your inbox Friday morning.",
      status: "Scheduled",
    });
    return items;
  }, [content.data, ads.data, competitors.data]);

  const approvals = useMemo(() => {
    const drafts = Array.isArray(content.data) ? content.data : [];
    return drafts
      .filter((c: any) => c?.status === "pending_approval" || c?.status === "draft")
      .slice(0, 3);
  }, [content.data]);

  const upcoming = useMemo(() => {
    const cal = Array.isArray(calendar.data) ? calendar.data : [];
    return cal.slice(0, 3);
  }, [calendar.data]);

  const score = health.data?.score;
  const updated =
    events.data?.[0]?.created_at ?? health.data?.updated_at ?? new Date().toISOString();

  const loadingPlan = content.isLoading || ads.isLoading || competitors.isLoading;

  return (
    <div className="space-y-6">
      {/* Operating brief header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div
            className="text-[12px] font-medium uppercase tracking-wide"
            style={{ color: "hsl(var(--m-muted-foreground))" }}
          >
            Good morning, {firstName}
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight mt-1">
            Today's marketing plan
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "hsl(var(--m-muted-foreground))" }}>
            Maroa prepared {plan.length} action{plan.length === 1 ? "" : "s"} for{" "}
            {business?.business_name ?? business?.name ?? "your business"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
            Last updated {ago(updated)}
          </span>
          <Btn variant="secondary" size="md">
            Review items
          </Btn>
          <Btn variant="primary" size="md">
            Approve today's plan
          </Btn>
        </div>
      </header>

      {/* Two-column main */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left wider */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Today's plan" padded={false}>
            {loadingPlan ? (
              <ul>
                {[0, 1, 2].map((i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 px-5 py-4"
                    style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}
                  >
                    <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                    <div className="flex-1 space-y-2">
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
                    className="flex items-start gap-4 px-5 py-4"
                    style={{
                      borderBottom:
                        idx === plan.length - 1
                          ? "none"
                          : "1px solid hsl(var(--m-border-subtle))",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: "hsl(var(--m-surface))",
                        color: "hsl(var(--m-muted-foreground))",
                        border: "1px solid hsl(var(--m-border-subtle))",
                      }}
                    >
                      <item.icon size={15} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium truncate">{item.title}</span>
                        <Pill tone={statusTone(item.status)}>{item.status}</Pill>
                      </div>
                      <p
                        className="text-[12.5px] mt-0.5 line-clamp-2"
                        style={{ color: "hsl(var(--m-muted-foreground))" }}
                      >
                        {item.desc}
                      </p>
                    </div>
                    {item.action && (
                      <div className="shrink-0">
                        <Btn variant={item.action === "Approve" ? "primary" : "secondary"}>
                          {item.action}
                        </Btn>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Approval queue" padded={false}>
            {content.isLoading ? (
              <div className="p-5 space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                ))}
              </div>
            ) : approvals.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <CheckCircle2
                  size={22}
                  strokeWidth={1.5}
                  className="mx-auto mb-2"
                  style={{ color: "hsl(var(--m-success))" }}
                />
                <div className="text-[13px] font-medium">Nothing waiting</div>
                <p
                  className="text-[12px] mt-1"
                  style={{ color: "hsl(var(--m-muted-foreground))" }}
                >
                  You're caught up. New drafts will appear here as Maroa creates them.
                </p>
              </div>
            ) : (
              <ul>
                {approvals.map((a: any, idx: number) => (
                  <li
                    key={a.id ?? idx}
                    className="px-5 py-4"
                    style={{
                      borderBottom:
                        idx === approvals.length - 1
                          ? "none"
                          : "1px solid hsl(var(--m-border-subtle))",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium truncate">
                            {a.content_theme ?? a.title ?? "Social post draft"}
                          </span>
                          <Pill tone="muted">
                            {a.platform ?? (a.instagram_caption ? "Instagram" : a.facebook_post ? "Facebook" : "Post")}
                          </Pill>
                        </div>
                        <p
                          className="text-[12.5px] mt-1 line-clamp-2"
                          style={{ color: "hsl(var(--m-muted-foreground))" }}
                        >
                          {a.instagram_caption ?? a.facebook_post ?? a.preview ?? "Draft is ready for review."}
                        </p>
                        {a.quality_score !== undefined && (
                          <div
                            className="text-[11px] mt-1.5"
                            style={{ color: "hsl(var(--m-muted-foreground))" }}
                          >
                            Confidence · {a.quality_score}/100
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Btn variant="ghost">Reject</Btn>
                        <Btn variant="secondary">Edit</Btn>
                        <Btn variant="primary">Approve</Btn>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Recent activity" padded={false}>
            {events.isLoading ? (
              <div className="p-5 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-5 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                ))}
              </div>
            ) : !events.data || events.data.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                  Maroa hasn't logged any activity yet today.
                </p>
              </div>
            ) : (
              <ul>
                {events.data.slice(0, 6).map((e, idx) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 px-5 py-3"
                    style={{
                      borderBottom:
                        idx === Math.min(events.data!.length, 6) - 1
                          ? "none"
                          : "1px solid hsl(var(--m-border-subtle))",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "hsl(var(--m-muted-foreground) / 0.5)" }}
                    />
                    <span className="text-[13px] flex-1 truncate">{e.title}</span>
                    <span
                      className="text-[11px] font-mono tabular-nums shrink-0"
                      style={{ color: "hsl(var(--m-muted-foreground))" }}
                    >
                      {ago(e.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right narrower */}
        <div className="space-y-6">
          <Card title="Marketing health">
            <div className="flex items-baseline gap-2 mb-4">
              {health.isLoading ? (
                <div className="h-9 w-20 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
              ) : (
                <>
                  <span className="text-[32px] font-semibold tabular-nums leading-none">
                    {score ?? "—"}
                  </span>
                  <span className="text-[13px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    / 100
                  </span>
                </>
              )}
            </div>
            <div className="space-y-3">
              {[
                { label: "Content consistency", key: "content" },
                { label: "Ad efficiency", key: "ads" },
                { label: "Search visibility", key: "seo" },
                { label: "Competitor movement", key: "competitors" },
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
                        {val !== undefined ? `${val}` : "—"}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "hsl(var(--m-border-subtle))" }}
                    >
                      <div
                        className="h-full transition-all"
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

          <Card title="Key insight">
            {opps.isLoading ? (
              <div className="space-y-2">
                <div className="h-3 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
              </div>
            ) : opps.data && opps.data.length > 0 ? (
              <div>
                <div className="flex items-start gap-2">
                  <Sparkles
                    size={14}
                    strokeWidth={1.75}
                    className="mt-0.5 shrink-0"
                    style={{ color: "hsl(var(--m-accent))" }}
                  />
                  <p className="text-[13px] leading-relaxed">{opps.data[0].title}</p>
                </div>
                {opps.data[0].why && (
                  <p
                    className="text-[12px] mt-2 leading-relaxed"
                    style={{ color: "hsl(var(--m-muted-foreground))" }}
                  >
                    {opps.data[0].why}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                Maroa is still learning your business. Insights appear once there's enough
                signal.
              </p>
            )}
          </Card>

          <Card title="Upcoming" padded={false}>
            {calendar.isLoading ? (
              <div className="p-5 space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-5 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <CalendarIcon
                  size={18}
                  strokeWidth={1.5}
                  className="mx-auto mb-1.5"
                  style={{ color: "hsl(var(--m-muted-foreground))" }}
                />
                <p className="text-[12px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                  Nothing scheduled yet.
                </p>
              </div>
            ) : (
              <ul>
                {upcoming.map((u: any, idx: number) => (
                  <li
                    key={u.id ?? idx}
                    className="flex items-center gap-3 px-5 py-3"
                    style={{
                      borderBottom:
                        idx === upcoming.length - 1
                          ? "none"
                          : "1px solid hsl(var(--m-border-subtle))",
                    }}
                  >
                    <Clock
                      size={13}
                      strokeWidth={1.75}
                      style={{ color: "hsl(var(--m-muted-foreground))" }}
                    />
                    <span className="text-[12.5px] flex-1 truncate">
                      {u.title ?? u.theme ?? "Scheduled action"}
                    </span>
                    <span
                      className="text-[11px] shrink-0"
                      style={{ color: "hsl(var(--m-muted-foreground))" }}
                    >
                      {u.scheduled_at
                        ? new Date(u.scheduled_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
