import { useAuth } from "@/contexts/AuthContext";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import { useContent } from "@/v2/lib/api/hooks/useModules";
import { Btn } from "@/v2/components/common/Card";
import { useTodayPageData } from "@/v2/lib/data/usePageData";
import {
  approveApprovalItem,
  batchApproveToday,
  refreshToday,
  generateWeeklyContent,
} from "@/v2/lib/data/handlers";
import {
  Instagram, Facebook, Megaphone, Eye, FileBarChart,
  CheckCircle2, ChevronRight, AlertCircle, RefreshCw, Sparkles,
  MessageSquare, Inbox as InboxIcon, Clock, ArrowUpRight, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReviewDrawer from "./today/ReviewDrawer";

/* ----------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------------*/
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
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

function timeFmt(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/* ----------------------------------------------------------------
 * Ring — Apple Activity style. A single SVG ring with a label.
 * ----------------------------------------------------------------*/
function Ring({
  label, value, goal, color, icon: Icon, unit,
}: {
  label: string; value: number; goal: number; color: string;
  icon: LucideIcon; unit?: string;
}) {
  const pct = Math.max(0, Math.min(1, goal > 0 ? value / goal : 0));
  const C = 2 * Math.PI * 42;
  const dash = `${pct * C} ${C}`;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[120px] w-[120px]">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="9"
                  stroke="hsl(var(--m-border-subtle))" />
          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="9"
                  stroke={color} strokeLinecap="round" strokeDasharray={dash}
                  style={{ transition: "stroke-dasharray 600ms var(--m-ease)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={16} strokeWidth={1.75} style={{ color }} />
          <div className="text-[22px] font-semibold tabular-nums mt-0.5 leading-none">
            {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
          </div>
          {unit && (
            <div className="text-[10px] uppercase tracking-wider mt-0.5"
                 style={{ color: "hsl(var(--m-muted-foreground))" }}>
              {unit}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-[13px] font-medium">{label}</div>
        <div className="text-[11px] tabular-nums" style={{ color: "hsl(var(--m-muted-foreground))" }}>
          {Math.round(pct * 100)}% of {goal >= 1000 ? `${(goal / 1000).toFixed(0)}k` : goal} goal
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
 * NeedsYou item — single row in the inbox
 * ----------------------------------------------------------------*/
interface NeedsItem {
  id: string;
  iconKey: "instagram" | "facebook" | "ads" | "competitor" | "report" | "inbox";
  title: string;
  detail: string;
  action?: { label: string; kind: "primary" | "secondary" | "ghost"; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
}

const ICON_MAP: Record<NeedsItem["iconKey"], LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  ads: Megaphone,
  competitor: Eye,
  report: FileBarChart,
  inbox: MessageSquare,
};

function NeedsRow({ item, last }: { item: NeedsItem; last: boolean }) {
  const Icon = ICON_MAP[item.iconKey];
  return (
    <li
      className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-[hsl(var(--m-surface))]"
      style={{ borderBottom: last ? "none" : "1px solid hsl(var(--m-border-subtle))" }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
           style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}>
        <Icon size={15} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium leading-snug">{item.title}</div>
        <p className="text-[12.5px] mt-0.5 line-clamp-2"
           style={{ color: "hsl(var(--m-muted-foreground))" }}>
          {item.detail}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {item.secondary && (
          <Btn variant="ghost" onClick={item.secondary.onClick}>{item.secondary.label}</Btn>
        )}
        {item.action && (
          <Btn variant={item.action.kind} onClick={item.action.onClick}>{item.action.label}</Btn>
        )}
      </div>
    </li>
  );
}

/* ----------------------------------------------------------------
 * Today schedule strip
 * ----------------------------------------------------------------*/
function TodayStrip({
  items, isLoading,
}: {
  items: Array<{ id: string; title: string; scheduledAt: string; platform?: string }>;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto px-5 py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 w-56 shrink-0 rounded-xl animate-pulse"
               style={{ background: "hsl(var(--m-border-subtle))" }} />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <Clock size={20} strokeWidth={1.5} className="mx-auto mb-2"
               style={{ color: "hsl(var(--m-muted-foreground))" }} />
        <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
          Nothing scheduled for the next 24 hours.
        </p>
      </div>
    );
  }
  return (
    <div className="flex gap-3 overflow-x-auto px-5 py-4">
      {items.map((it) => (
        <div key={it.id}
             className="shrink-0 w-60 rounded-xl p-3 cursor-pointer transition-transform hover:-translate-y-px"
             style={{
               background: "hsl(var(--m-surface))",
               border: "1px solid hsl(var(--m-border-subtle))",
             }}>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider"
               style={{ color: "hsl(var(--m-accent))" }}>
            <Clock size={11} />
            {timeFmt(it.scheduledAt)}
            {it.platform && (
              <span style={{ color: "hsl(var(--m-muted-foreground))" }}>· {it.platform}</span>
            )}
          </div>
          <div className="text-[13px] font-medium mt-1.5 line-clamp-2 leading-snug">
            {it.title}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------
 * Drawer
 * ----------------------------------------------------------------*/
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

/* ----------------------------------------------------------------
 * Home / Today page
 * ----------------------------------------------------------------*/
export default function Today() {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const content = useContent(business?.id);
  const state = useTodayPageData();
  const nav = useNavigate();
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
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  // Build lookup for the drawer
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

  const isLoading = state.status === "loading";
  const data = state.status === "loading" ? undefined : state.data;

  const pendingIds = useMemo(() => {
    const list = Array.isArray(content.data) ? content.data : [];
    return list
      .filter((c: any) => c?.status === "pending_approval" || c?.status === "draft")
      .map((c: any) => c.id)
      .filter(Boolean);
  }, [content.data]);

  const totalToApprove = pendingIds.length || (data?.approvalsCount ?? 0);

  /* Activity rings ---------------------------------------------- */
  // Best-effort metrics derived from health dimensions when available;
  // otherwise show 0 with goals so the rings still render.
  const dims = data?.health?.dimensions;
  const ringContent = dims?.content ?? 0;
  const ringAds = dims?.ads ?? 0;
  const ringSeo = dims?.seo ?? 0;

  /* Today schedule strip --------------------------------------- */
  const todayItems = useMemo(() => {
    const list = Array.isArray(content.data) ? content.data : [];
    const horizon = Date.now() + 24 * 60 * 60 * 1000;
    return list
      .filter((c: any) => {
        if (!c?.scheduled_at) return false;
        const t = new Date(c.scheduled_at).getTime();
        return t >= Date.now() - 60_000 && t <= horizon;
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
      )
      .slice(0, 8)
      .map((c: any) => ({
        id: c.id,
        title: c.content_theme ?? c.title ?? "Scheduled post",
        scheduledAt: c.scheduled_at,
        platform: platformLabel(c),
      }));
  }, [content.data]);

  /* Needs-you inbox -------------------------------------------- */
  const needsItems: NeedsItem[] = useMemo(() => {
    const out: NeedsItem[] = [];
    const drafts = Array.isArray(content.data) ? content.data : [];
    const pending = drafts.filter(
      (c: any) => c?.status === "pending_approval" || c?.status === "draft",
    );
    pending.slice(0, 4).forEach((c: any) => {
      const platform = platformLabel(c) ?? "Social";
      out.push({
        id: c.id,
        iconKey: /face/i.test(platform) ? "facebook" : "instagram",
        title: `${platform} post needs your approval`,
        detail:
          (c.instagram_caption ?? c.facebook_post ?? c.content_theme ?? "Draft ready for review.")
            .toString()
            .slice(0, 140),
        action: { label: "Approve", kind: "primary", onClick: () => approveApprovalItem(c.id) },
        secondary: { label: "Review", onClick: () => openReview(c.id) },
      });
    });

    // Insight as a single nudge
    if (data?.insight) {
      out.push({
        id: `insight-${data.insight.id}`,
        iconKey: "report",
        title: data.insight.title,
        detail: "Recommendation from Maroa based on this week's signal.",
        action: { label: "View", kind: "secondary", onClick: () => nav("/app/growth") },
      });
    }
    return out;
  }, [content.data, data?.insight, nav, draftsById]);

  /* AI brief --------------------------------------------------- */
  const briefBullets = useMemo(() => {
    const bullets: string[] = [];
    if (totalToApprove > 0) {
      bullets.push(`${totalToApprove} draft${totalToApprove === 1 ? "" : "s"} waiting for your sign-off.`);
    }
    if (todayItems.length > 0) {
      bullets.push(`${todayItems.length} post${todayItems.length === 1 ? "" : "s"} scheduled in the next 24h.`);
    }
    if (data?.recentActivity && data.recentActivity.length > 0) {
      bullets.push(`Latest: ${data.recentActivity[0].title}.`);
    }
    if (bullets.length === 0) {
      bullets.push("Nothing urgent. A good window to plan next week's content.");
    }
    return bullets;
  }, [totalToApprove, todayItems.length, data?.recentActivity]);

  /* Error state ------------------------------------------------ */
  if (state.status === "error") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl p-6"
             style={{
               background: "hsl(var(--m-surface-elevated))",
               border: "1px solid hsl(var(--m-border-subtle))",
             }}>
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ──────────────── Hero ──────────────── */}
      <section className="rounded-2xl overflow-hidden"
               style={{
                 background:
                   "linear-gradient(180deg, hsl(var(--m-surface-elevated)) 0%, hsl(var(--m-surface)) 100%)",
                 border: "1px solid hsl(var(--m-border-subtle))",
               }}>
        <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.08em]"
                   style={{ color: "hsl(var(--m-muted-foreground))" }}>
                {dateLabel}
              </div>
              <h1 className="text-[26px] sm:text-[30px] font-semibold tracking-tight mt-1.5 leading-tight">
                {greeting()}, {firstName}.
              </h1>
              <p className="text-[14px] mt-1.5 max-w-2xl"
                 style={{ color: "hsl(var(--m-muted-foreground))" }}>
                Here's where things stand today.
              </p>
            </div>
            <button onClick={refreshToday} title="Refresh"
                    className="shrink-0 h-9 w-9 rounded-lg inline-flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{
                      background: "hsl(var(--m-surface))",
                      border: "1px solid hsl(var(--m-border-subtle))",
                    }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Activity rings */}
        <div className="px-4 sm:px-6 pt-4 pb-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-6 justify-items-center">
            <Ring label="Content" value={ringContent} goal={100} unit="score"
                  color="hsl(var(--m-accent))" icon={Sparkles} />
            <Ring label="Ads" value={ringAds} goal={100} unit="score"
                  color="hsl(var(--m-success))" icon={Megaphone} />
            <Ring label="SEO" value={ringSeo} goal={100} unit="score"
                  color="hsl(var(--m-warning))" icon={ArrowUpRight} />
          </div>
        </div>

        {/* Primary action bar */}
        <div className="px-6 sm:px-8 py-4 flex flex-wrap items-center gap-2"
             style={{ borderTop: "1px solid hsl(var(--m-border-subtle))" }}>
          {totalToApprove > 0 ? (
            <>
              <Btn variant="primary" size="md" className="!h-10 !px-5 !text-[14px]"
                   disabled={batchBusy}
                   onClick={async () => {
                     setBatchBusy(true);
                     try { await batchApproveToday(pendingIds); }
                     finally { setBatchBusy(false); }
                   }}>
                {batchBusy ? "Approving…" : `Approve all ${totalToApprove}`}
              </Btn>
              <Btn size="md" className="!h-10 !px-4 !text-[13px]"
                   onClick={() => {
                     const first = pendingIds[0];
                     if (first) openReview(first);
                   }}>
                Review one by one
              </Btn>
            </>
          ) : (
            <Btn variant="primary" size="md" className="!h-10 !px-5 !text-[14px]"
                 disabled={genBusy}
                 onClick={async () => {
                   setGenBusy(true);
                   try { await generateWeeklyContent(); }
                   finally { setGenBusy(false); }
                 }}>
              <Sparkles size={13} /> {genBusy ? "Generating…" : "Plan this week"}
            </Btn>
          )}
          {data && (
            <span className="text-[12px] tabular-nums ml-auto"
                  style={{ color: "hsl(var(--m-muted-foreground))" }}>
              Updated {ago(data.updatedAt)}
            </span>
          )}
        </div>
      </section>

      {/* ──────────────── AI brief ──────────────── */}
      <section className="rounded-xl p-5"
               style={{
                 background: "hsl(var(--m-accent-soft))",
                 border: "1px solid hsl(var(--m-border-subtle))",
               }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
               style={{ background: "hsl(var(--m-accent))", color: "hsl(var(--m-accent-foreground))" }}>
            <Zap size={14} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider"
                 style={{ color: "hsl(var(--m-accent))" }}>
              Brain · daily brief
            </div>
            <ul className="mt-1.5 space-y-1">
              {briefBullets.map((b, i) => (
                <li key={i} className="text-[13.5px] leading-snug">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ──────────────── Needs You ──────────────── */}
      <section className="rounded-xl overflow-hidden"
               style={{
                 background: "hsl(var(--m-surface-elevated))",
                 border: "1px solid hsl(var(--m-border-subtle))",
               }}>
        <header className="flex items-center justify-between px-5 h-12"
                style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}>
          <div className="flex items-center gap-2">
            <InboxIcon size={14} style={{ color: "hsl(var(--m-muted-foreground))" }} />
            <h2 className="text-[14px] font-semibold">Needs you</h2>
            {needsItems.length > 0 && (
              <span className="text-[11px] tabular-nums px-1.5 py-0.5 rounded-md"
                    style={{
                      background: "hsl(var(--m-accent-soft))",
                      color: "hsl(var(--m-accent))",
                    }}>
                {needsItems.length}
              </span>
            )}
          </div>
          <button onClick={() => nav("/app/crm/inbox")}
                  className="inline-flex items-center gap-0.5 text-[12px] font-medium"
                  style={{ color: "hsl(var(--m-muted-foreground))" }}>
            Open inbox <ChevronRight size={13} />
          </button>
        </header>
        {isLoading ? (
          <ul>
            {[0, 1, 2].map((i) => (
              <li key={i} className="px-5 py-4"
                  style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg animate-pulse"
                       style={{ background: "hsl(var(--m-border-subtle))" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded animate-pulse"
                         style={{ background: "hsl(var(--m-border-subtle))" }} />
                    <div className="h-3 w-2/3 rounded animate-pulse"
                         style={{ background: "hsl(var(--m-border-subtle))" }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : needsItems.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <CheckCircle2 size={24} strokeWidth={1.5} className="mx-auto mb-2"
                          style={{ color: "hsl(var(--m-success))" }} />
            <div className="text-[14px] font-medium">You're all caught up</div>
            <p className="text-[12.5px] mt-1" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              We'll surface things here as they come in.
            </p>
          </div>
        ) : (
          <ul>
            {needsItems.map((it, i) => (
              <NeedsRow key={it.id} item={it} last={i === needsItems.length - 1} />
            ))}
          </ul>
        )}
      </section>

      {/* ──────────────── Today schedule ──────────────── */}
      <section className="rounded-xl overflow-hidden"
               style={{
                 background: "hsl(var(--m-surface-elevated))",
                 border: "1px solid hsl(var(--m-border-subtle))",
               }}>
        <header className="flex items-center justify-between px-5 h-12"
                style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}>
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: "hsl(var(--m-muted-foreground))" }} />
            <h2 className="text-[14px] font-semibold">Next 24 hours</h2>
          </div>
          <button onClick={() => nav("/app/content/calendar")}
                  className="inline-flex items-center gap-0.5 text-[12px] font-medium"
                  style={{ color: "hsl(var(--m-muted-foreground))" }}>
            Open calendar <ChevronRight size={13} />
          </button>
        </header>
        <TodayStrip items={todayItems} isLoading={isLoading} />
      </section>

      <ReviewDrawer open={!!reviewing} item={reviewing} onClose={() => setReviewing(null)} />
    </div>
  );
}
