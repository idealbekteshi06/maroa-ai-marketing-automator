import { useAuth } from "@/contexts/AuthContext";
import { Card, Pill, Btn } from "@/v2/components/common/Card";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import {
  useHealth,
  useDashboardEvents,
  useOpportunities,
} from "@/v2/lib/api/hooks/useHome";
import { useContent, useAds, useCompetitors, useCalendar } from "@/v2/lib/api/hooks/useModules";
import { Instagram, Facebook, Megaphone, Eye, FileBarChart, CheckCircle2, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

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

function healthLabel(score?: number): string {
  if (score == null) return "Getting set up";
  if (score >= 80) return "Looking great";
  if (score >= 60) return "On track";
  if (score >= 40) return "Needs a little attention";
  return "Needs your attention";
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

  const [detailsTab, setDetailsTab] = useState<"health" | "activity" | "upcoming">("health");

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
        title: "Instagram post is ready",
        desc: (ig.instagram_caption ?? ig.content_theme ?? "Take a quick look and approve.").toString().slice(0, 110),
        status: ig.status === "published" ? "Scheduled" : ig.status === "pending_approval" ? "Needs review" : "Ready",
        action: ig.status === "published" ? "View" : "Approve",
      });
    if (fb)
      items.push({
        id: `fb-${fb.id ?? "draft"}`,
        icon: Facebook,
        title: "Facebook post is ready",
        desc: (fb.facebook_post ?? fb.content_theme ?? "Take a quick look and approve.").toString().slice(0, 110),
        status: fb.status === "published" ? "Scheduled" : fb.status === "pending_approval" ? "Needs review" : "Ready",
        action: fb.status === "published" ? "View" : "Approve",
      });
    const adList = Array.isArray(ads.data) ? ads.data : [];
    if (adList.length > 0)
      items.push({
        id: "ad-refresh",
        icon: Megaphone,
        title: "Your ads could use fresh photos",
        desc: `${adList.length} ad${adList.length === 1 ? "" : "s"} running — swapping creative this week usually boosts results.`,
        status: "Needs review",
        action: "View",
      });
    const compList = Array.isArray(competitors.data) ? competitors.data : [];
    if (compList.length > 0)
      items.push({
        id: "comp-trend",
        icon: Eye,
        title: "A competitor just posted something new",
        desc: `We're watching ${compList.length} competitor${compList.length === 1 ? "" : "s"} so you don't have to.`,
        status: "Watching",
        action: "View",
      });
    items.push({
      id: "weekly-scorecard",
      icon: FileBarChart,
      title: "Your weekly summary lands Friday",
      desc: "We'll email a plain-English recap of what worked.",
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
  const dateLabel = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const totalToApprove = plan.filter((p) => p.action === "Approve").length || approvalsCount;

  // One-line summary in plain language
  const summary = (() => {
    const bits: string[] = [];
    if (totalToApprove > 0) bits.push(`${totalToApprove} thing${totalToApprove === 1 ? "" : "s"} to approve`);
    if (nextScheduled?.scheduled_at) {
      const d = new Date(nextScheduled.scheduled_at);
      const today = new Date();
      const sameDay = d.toDateString() === today.toDateString();
      bits.push(sameDay ? `next post at ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : `next post ${d.toLocaleDateString([], { weekday: "short" })}`);
    }
    if (bits.length === 0) return "You're all caught up. We'll let you know when something needs you.";
    return `You've got ${bits.join(" · ")}.`;
  })();

  return (
    <div className="space-y-6">
      {/* Hero: greeting + one-line summary + ONE obvious CTA */}
      <section
        className="rounded-2xl p-6 sm:p-8"
        style={{
          background: "hsl(var(--m-surface-elevated))",
          border: "1px solid hsl(var(--m-border-subtle))",
        }}
      >
        <div
          className="text-[11px] font-medium uppercase tracking-[0.08em]"
          style={{ color: "hsl(var(--m-muted-foreground))" }}
        >
          {dateLabel}
        </div>
        <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight mt-1.5 leading-tight">
          {greeting()}, {firstName}.
        </h1>
        <p
          className="text-[15px] mt-2 max-w-2xl"
          style={{ color: "hsl(var(--m-muted-foreground))" }}
        >
          {summary}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {totalToApprove > 0 ? (
            <Btn variant="primary" size="md" className="!h-10 !px-5 !text-[14px]">
              Review {totalToApprove} item{totalToApprove === 1 ? "" : "s"} →
            </Btn>
          ) : (
            <Btn variant="primary" size="md" className="!h-10 !px-5 !text-[14px]">
              See what Maroa's working on →
            </Btn>
          )}
          <span className="text-[12px] tabular-nums" style={{ color: "hsl(var(--m-muted-foreground))" }}>
            Updated {ago(updated)}
          </span>
        </div>
      </section>

      {/* Single primary card: today's work, with key insight inline */}
      <Card title="What's on for today" padded={false}>
        {insight && (
          <div
            className="px-5 py-3 flex items-start gap-3"
            style={{
              background: "hsl(var(--m-info) / 0.06)",
              borderBottom: "1px solid hsl(var(--m-border-subtle))",
            }}
          >
            <span
              className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 shrink-0"
              style={{ color: "hsl(var(--m-info))" }}
            >
              Tip
            </span>
            <p className="text-[13px] leading-snug">{insight.title}</p>
          </div>
        )}

        {loadingPlan ? (
          <ul>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="flex items-center gap-4 px-5 py-4"
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
        ) : plan.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle2
              size={22}
              strokeWidth={1.5}
              className="mx-auto mb-2"
              style={{ color: "hsl(var(--m-success))" }}
            />
            <div className="text-[14px] font-medium">Nothing on your plate</div>
            <p className="text-[12.5px] mt-1" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              We'll ping you when there's something to look at.
            </p>
          </div>
        ) : (
          <ul>
            {plan.map((item, idx) => (
              <li
                key={item.id}
                className="flex items-start gap-3.5 px-5 py-4"
                style={{
                  borderBottom: idx === plan.length - 1 ? "none" : "1px solid hsl(var(--m-border-subtle))",
                }}
              >
                <item.icon
                  size={16}
                  strokeWidth={1.75}
                  className="mt-0.5 shrink-0"
                  style={{ color: "hsl(var(--m-muted-foreground))" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium truncate">{item.title}</span>
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
                  <Btn variant={item.action === "Approve" ? "primary" : "secondary"}>{item.action}</Btn>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Details, tucked behind tabs */}
      <section
        className="rounded-xl"
        style={{
          background: "hsl(var(--m-surface-elevated))",
          border: "1px solid hsl(var(--m-border-subtle))",
        }}
      >
        <div
          className="flex items-center justify-between px-5 h-11"
          style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}
        >
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
            className="inline-flex items-center gap-0.5 text-[12px] font-medium"
            style={{ color: "hsl(var(--m-muted-foreground))" }}
          >
            View details <ChevronRight size={13} />
          </button>
        </div>

        <div className="p-5">
          {detailsTab === "health" &&
            (health.isLoading ? (
              <div className="h-10 w-40 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[34px] font-semibold tabular-nums leading-none">
                    {score ?? "—"}
                  </span>
                  <span className="text-[13px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    / 100
                  </span>
                </div>
                <div>
                  <div className="text-[14px] font-medium">{healthLabel(score)}</div>
                  <div className="text-[12px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    A simple score for how your marketing is doing this week.
                  </div>
                </div>
              </div>
            ))}

          {detailsTab === "activity" &&
            (events.isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-4 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                ))}
              </div>
            ) : !events.data || events.data.length === 0 ? (
              <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                Nothing yet today. We'll log things here as Maroa works.
              </p>
            ) : (
              <ul className="space-y-2">
                {events.data.slice(0, 5).map((e) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <span className="text-[13px] flex-1 truncate">{e.title}</span>
                    <span
                      className="text-[11px] tabular-nums shrink-0"
                      style={{ color: "hsl(var(--m-muted-foreground))" }}
                    >
                      {ago(e.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ))}

          {detailsTab === "upcoming" &&
            (calendar.isLoading ? (
              <div className="h-4 w-2/3 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
            ) : nextScheduled ? (
              <div>
                <div className="text-[14px] font-medium">
                  {nextScheduled.title ?? nextScheduled.theme ?? "Scheduled post"}
                </div>
                <div className="text-[12.5px] mt-0.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                  {nextScheduled.scheduled_at
                    ? new Date(nextScheduled.scheduled_at).toLocaleString(undefined, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : ""}
                </div>
              </div>
            ) : (
              <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                Nothing scheduled yet — we'll plan posts as soon as you approve a few.
              </p>
            ))}
        </div>
      </section>
    </div>
  );
}
