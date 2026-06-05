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
  Wand2, Calendar, Users, Search, ArrowRight, Plus, Send,
  TrendingUp, Image as ImageIcon, BarChart3,
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

function platformLabel(raw: any): string | undefined {
  const p = (raw?.platform ?? "").toString().toLowerCase();
  if (p.includes("insta") || raw?.instagram_caption) return "Instagram";
  if (p.includes("face") || raw?.facebook_post) return "Facebook";
  if (p.includes("tik") || raw?.tiktok_caption) return "TikTok";
  if (p.includes("link") || raw?.linkedin_post) return "LinkedIn";
  return undefined;
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
 * Small primitives
 * ----------------------------------------------------------------*/
function Card({ children, className = "", padded = true }: {
  children: React.ReactNode; className?: string; padded?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-white border border-[hsl(var(--m-border-subtle))] ${padded ? "p-5" : ""} ${className}`}
      style={{ boxShadow: "var(--m-shadow-sm)" }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, action, count }: {
  icon: LucideIcon; title: string; action?: { label: string; onClick: () => void }; count?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-[hsl(var(--m-muted-foreground))]" strokeWidth={1.75} />
        <h2 className="font-display text-[14px] font-semibold tracking-tight">{title}</h2>
        {typeof count === "number" && count > 0 && (
          <span className="text-[11px] tabular-nums px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}>
            {count}
          </span>
        )}
      </div>
      {action && (
        <button onClick={action.onClick}
                className="inline-flex items-center gap-0.5 text-[12px] font-medium text-[hsl(var(--m-muted-foreground))] hover:text-[hsl(var(--m-foreground))] transition-colors">
          {action.label} <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, trend, icon: Icon }: {
  label: string; value: string | number; sub?: string;
  trend?: { dir: "up" | "down" | "flat"; pct: string };
  icon: LucideIcon;
}) {
  const trendColor =
    trend?.dir === "up" ? "hsl(var(--m-success))" :
    trend?.dir === "down" ? "hsl(var(--m-destructive))" :
    "hsl(var(--m-muted-foreground))";
  return (
    <Card padded={false} className="p-4">
      <div className="flex items-start justify-between">
        <div className="text-[11.5px] uppercase tracking-wider font-medium text-[hsl(var(--m-muted-foreground))]">
          {label}
        </div>
        <Icon size={14} className="text-[hsl(var(--m-muted-foreground))]" strokeWidth={1.75} />
      </div>
      <div className="font-display text-[26px] font-semibold tabular-nums mt-2 leading-none tracking-tight">
        {value}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        {trend && (
          <span className="text-[11px] tabular-nums font-medium" style={{ color: trendColor }}>
            {trend.dir === "up" ? "↑" : trend.dir === "down" ? "↓" : "·"} {trend.pct}
          </span>
        )}
        {sub && (
          <span className="text-[11px] text-[hsl(var(--m-muted-foreground))]">{sub}</span>
        )}
      </div>
    </Card>
  );
}

function QuickTile({ icon: Icon, title, sub, accent, onClick }: {
  icon: LucideIcon; title: string; sub: string; accent: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative text-left rounded-2xl bg-white border border-[hsl(var(--m-border-subtle))] p-4 transition-all hover:-translate-y-px hover:shadow-[var(--m-shadow-md)]"
    >
      <div className="flex items-start justify-between">
        <div
          className="h-9 w-9 rounded-xl inline-flex items-center justify-center"
          style={{ background: `${accent}14`, color: accent }}
        >
          <Icon size={17} strokeWidth={1.75} />
        </div>
        <ArrowUpRight size={14} className="text-[hsl(var(--m-muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="font-display text-[14px] font-semibold mt-3 leading-tight">{title}</div>
      <div className="text-[12px] text-[hsl(var(--m-muted-foreground))] mt-0.5 leading-snug">{sub}</div>
    </button>
  );
}

/* ----------------------------------------------------------------
 * Ring (compact)
 * ----------------------------------------------------------------*/
function Ring({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.max(0, Math.min(1, value / 100));
  const C = 2 * Math.PI * 26;
  const dash = `${pct * C} ${C}`;
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-[60px] w-[60px]">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
          <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6"
                  stroke="hsl(var(--m-border-subtle))" />
          <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6"
                  stroke={color} strokeLinecap="round" strokeDasharray={dash}
                  style={{ transition: "stroke-dasharray 600ms var(--m-ease)" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-display text-[13px] font-semibold tabular-nums">
          {Math.round(pct * 100)}
        </div>
      </div>
      <div>
        <div className="text-[12px] font-medium">{label}</div>
        <div className="text-[11px] text-[hsl(var(--m-muted-foreground))]">score / 100</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
 * Page
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
  const [command, setCommand] = useState("");

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const firstName =
    (user?.user_metadata?.first_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

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
      .sort((a: any, b: any) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, 6)
      .map((c: any) => ({
        id: c.id,
        title: c.content_theme ?? c.title ?? "Scheduled post",
        scheduledAt: c.scheduled_at,
        platform: platformLabel(c),
      }));
  }, [content.data]);

  /* Needs-you list -------------------------------------------- */
  const needsItems = useMemo(() => {
    const out: Array<{
      id: string; iconKey: string; title: string; detail: string;
      onApprove?: () => void; onReview?: () => void;
    }> = [];
    const drafts = Array.isArray(content.data) ? content.data : [];
    const pending = drafts.filter(
      (c: any) => c?.status === "pending_approval" || c?.status === "draft",
    );
    pending.slice(0, 5).forEach((c: any) => {
      const platform = platformLabel(c) ?? "Social";
      out.push({
        id: c.id,
        iconKey: /face/i.test(platform) ? "facebook" : "instagram",
        title: `${platform} post needs approval`,
        detail: (c.instagram_caption ?? c.facebook_post ?? c.content_theme ?? "Draft ready for review.")
          .toString().slice(0, 120),
        onApprove: () => approveApprovalItem(c.id),
        onReview: () => openReview(c.id),
      });
    });
    if (data?.insight) {
      out.push({
        id: `insight-${data.insight.id}`,
        iconKey: "report",
        title: data.insight.title,
        detail: "Recommendation from Maroa Brain.",
        onReview: () => nav("/app/growth"),
      });
    }
    return out;
  }, [content.data, data?.insight, nav, draftsById]);

  const ICON_MAP: Record<string, LucideIcon> = {
    instagram: Instagram, facebook: Facebook, ads: Megaphone,
    competitor: Eye, report: FileBarChart, inbox: MessageSquare,
  };

  /* KPIs --------------------------------------------------- */
  const postsScheduled = todayItems.length;
  const reachScore = ringContent;
  const draftsCount = pendingIds.length;
  const adsScore = ringAds;

  /* Brain command bar -------------------------------------- */
  const runCommand = async () => {
    const c = command.trim().toLowerCase();
    if (!c) return;
    if (c.includes("ad")) nav("/app/ads");
    else if (c.includes("contact") || c.includes("crm")) nav("/app/crm/contacts");
    else if (c.includes("seo") || c.includes("audit")) nav("/app/growth");
    else if (c.includes("schedule") || c.includes("calendar")) nav("/app/content/calendar");
    else nav(`/app/content/studio?prompt=${encodeURIComponent(command)}`);
    setCommand("");
  };

  /* Error state ------------------------------------------------ */
  if (state.status === "error") {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <AlertCircle size={18} style={{ color: "hsl(var(--m-destructive))" }} />
          <div className="flex-1">
            <div className="text-[14px] font-medium">We couldn't load today's brief.</div>
            <p className="text-[12.5px] mt-1 text-[hsl(var(--m-muted-foreground))]">
              Please refresh in a moment.
            </p>
          </div>
          <Btn onClick={refreshToday}><RefreshCw size={12} /> Try again</Btn>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* ─────────── Header ─────────── */}
      <header className="flex items-end justify-between gap-4 pt-1">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[hsl(var(--m-muted-foreground))]">
            {dateLabel}
          </div>
          <h1 className="font-display text-[28px] sm:text-[32px] font-semibold tracking-tight mt-1 leading-tight">
            {greeting()}, {firstName}.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-[11.5px] tabular-nums text-[hsl(var(--m-muted-foreground))] hidden sm:block">
              Updated {ago(data.updatedAt)}
            </span>
          )}
          <button onClick={refreshToday} title="Refresh"
                  className="h-9 w-9 rounded-lg inline-flex items-center justify-center bg-white border border-[hsl(var(--m-border-subtle))] hover:bg-[hsl(var(--m-surface))] transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* ─────────── Brain command bar ─────────── */}
      <Card padded={false} className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-md inline-flex items-center justify-center"
               style={{ background: "hsl(var(--m-accent))", color: "hsl(var(--m-accent-foreground))" }}>
            <Zap size={12} strokeWidth={2.25} />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--m-accent))]">
            Maroa Brain
          </div>
          <span className="text-[11.5px] text-[hsl(var(--m-muted-foreground))]">·  ask me to generate, schedule or analyze anything</span>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); runCommand(); }}
              className="flex items-center gap-2 rounded-xl border border-[hsl(var(--m-border-subtle))] bg-[hsl(var(--m-surface))] px-3 h-12 focus-within:border-[hsl(var(--m-accent))] focus-within:bg-white transition-colors">
          <Sparkles size={15} className="text-[hsl(var(--m-muted-foreground))] shrink-0" />
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Generate 5 Instagram posts about our new collection…"
            className="flex-1 bg-transparent outline-none text-[14px] font-sans placeholder:text-[hsl(var(--m-muted-foreground))]"
          />
          <button type="submit"
                  className="h-8 px-3 rounded-lg inline-flex items-center gap-1.5 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: "hsl(var(--m-accent))" }}>
            <Send size={12} /> Run
          </button>
        </form>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[
            { label: "Generate post", icon: Wand2, q: "generate post" },
            { label: "Generate ad", icon: Megaphone, q: "generate ad" },
            { label: "Plan this week", icon: Calendar, q: "schedule week" },
            { label: "SEO audit", icon: Search, q: "seo audit" },
            { label: "Reply inbox", icon: MessageSquare, q: "inbox" },
          ].map((c) => (
            <button key={c.label} onClick={() => { setCommand(c.label); }}
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] font-medium bg-[hsl(var(--m-surface))] border border-[hsl(var(--m-border-subtle))] text-[hsl(var(--m-foreground))] hover:bg-[hsl(var(--m-accent-soft))] hover:text-[hsl(var(--m-accent))] hover:border-[hsl(var(--m-accent))] transition-colors">
              <c.icon size={11} /> {c.label}
            </button>
          ))}
        </div>
      </Card>

      {/* ─────────── KPIs ─────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Drafts to approve" value={draftsCount} sub={draftsCount === 0 ? "all clear" : "need sign-off"} icon={CheckCircle2} />
        <Kpi label="Scheduled / 24h" value={postsScheduled} sub={postsScheduled === 0 ? "queue empty" : "going live"} icon={Calendar} />
        <Kpi label="Content health" value={`${reachScore}`} sub="of 100" icon={TrendingUp}
             trend={reachScore >= 70 ? { dir: "up", pct: "on track" } : reachScore >= 40 ? { dir: "flat", pct: "watch" } : { dir: "down", pct: "low" }} />
        <Kpi label="Ads health" value={`${adsScore}`} sub="of 100" icon={BarChart3}
             trend={adsScore >= 70 ? { dir: "up", pct: "on track" } : adsScore >= 40 ? { dir: "flat", pct: "watch" } : { dir: "down", pct: "low" }} />
      </div>

      {/* ─────────── Quick actions ─────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-display text-[14px] font-semibold tracking-tight">Quick actions</h2>
          <span className="text-[11.5px] text-[hsl(var(--m-muted-foreground))]">one tap → full control in the dashboard</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickTile icon={Wand2} title="Generate content" sub="AI posts for every channel"
                     accent="#0881FF" onClick={() => nav("/app/content/studio")} />
          <QuickTile icon={Megaphone} title="Generate ads" sub="Meta + TikTok creatives"
                     accent="#FF6B35" onClick={() => nav("/app/ads")} />
          <QuickTile icon={Calendar} title="Schedule" sub="Plan & queue your week"
                     accent="#8B5CF6" onClick={() => nav("/app/content/calendar")} />
          <QuickTile icon={MessageSquare} title="Inbox" sub="Reply to DMs with AI"
                     accent="#10B981" onClick={() => nav("/app/crm/inbox")} />
          <QuickTile icon={Users} title="CRM" sub="Contacts & pipeline"
                     accent="#F59E0B" onClick={() => nav("/app/crm/contacts")} />
          <QuickTile icon={Search} title="SEO & growth" sub="Audit & opportunities"
                     accent="#EC4899" onClick={() => nav("/app/growth")} />
        </div>
      </div>

      {/* ─────────── Two-col: Needs you + Schedule ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Needs you */}
        <Card padded={false} className="lg:col-span-2">
          <div className="px-5 pt-4">
            <SectionHeader
              icon={InboxIcon}
              title="Needs you"
              count={needsItems.length}
              action={{ label: "Open inbox", onClick: () => nav("/app/crm/inbox") }}
            />
          </div>
          {isLoading ? (
            <ul>
              {[0, 1, 2].map((i) => (
                <li key={i} className="px-5 py-4 border-t border-[hsl(var(--m-border-subtle))]">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--m-border-subtle))] animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 rounded bg-[hsl(var(--m-border-subtle))] animate-pulse" />
                      <div className="h-3 w-2/3 rounded bg-[hsl(var(--m-border-subtle))] animate-pulse" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : needsItems.length === 0 ? (
            <div className="px-5 py-12 text-center border-t border-[hsl(var(--m-border-subtle))]">
              <CheckCircle2 size={24} strokeWidth={1.5} className="mx-auto mb-2 text-[hsl(var(--m-success))]" />
              <div className="font-display text-[14px] font-semibold">You're all caught up</div>
              <p className="text-[12.5px] mt-1 text-[hsl(var(--m-muted-foreground))]">
                Maroa will surface items here as they come in.
              </p>
              <button onClick={async () => {
                setGenBusy(true);
                try { await generateWeeklyContent(); } finally { setGenBusy(false); }
              }}
                className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium text-white"
                style={{ background: "hsl(var(--m-accent))" }}>
                <Sparkles size={13} /> {genBusy ? "Generating…" : "Plan this week with AI"}
              </button>
            </div>
          ) : (
            <>
              <ul>
                {needsItems.map((it, i) => {
                  const Icon = ICON_MAP[it.iconKey] ?? InboxIcon;
                  return (
                    <li key={it.id}
                        className={`flex items-start gap-3 px-5 py-3.5 hover:bg-[hsl(var(--m-surface))] transition-colors ${i === 0 ? "border-t" : ""} border-b border-[hsl(var(--m-border-subtle))]`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                           style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}>
                        <Icon size={14} strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-medium leading-snug">{it.title}</div>
                        <p className="text-[12px] mt-0.5 line-clamp-2 text-[hsl(var(--m-muted-foreground))]">
                          {it.detail}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {it.onReview && (
                          <button onClick={it.onReview}
                                  className="h-7 px-2.5 rounded-md text-[12px] font-medium text-[hsl(var(--m-muted-foreground))] hover:bg-[hsl(var(--m-surface))]">
                            Review
                          </button>
                        )}
                        {it.onApprove && (
                          <button onClick={it.onApprove}
                                  className="h-7 px-2.5 rounded-md text-[12px] font-medium text-white"
                                  style={{ background: "hsl(var(--m-accent))" }}>
                            Approve
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {totalToApprove > 1 && (
                <div className="px-5 py-3 flex items-center justify-between">
                  <span className="text-[12px] text-[hsl(var(--m-muted-foreground))]">
                    {totalToApprove} drafts total
                  </span>
                  <button disabled={batchBusy}
                          onClick={async () => {
                            setBatchBusy(true);
                            try { await batchApproveToday(pendingIds); } finally { setBatchBusy(false); }
                          }}
                          className="h-8 px-3 rounded-lg text-[12.5px] font-medium text-white disabled:opacity-60"
                          style={{ background: "hsl(var(--m-accent))" }}>
                    {batchBusy ? "Approving…" : `Approve all ${totalToApprove}`}
                  </button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Schedule */}
        <Card padded={false}>
          <div className="px-5 pt-4">
            <SectionHeader
              icon={Clock}
              title="Next 24 hours"
              count={todayItems.length}
              action={{ label: "Calendar", onClick: () => nav("/app/content/calendar") }}
            />
          </div>
          {isLoading ? (
            <div className="px-5 pb-5 space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-[hsl(var(--m-border-subtle))] animate-pulse" />
              ))}
            </div>
          ) : todayItems.length === 0 ? (
            <div className="px-5 py-10 text-center border-t border-[hsl(var(--m-border-subtle))]">
              <Clock size={20} strokeWidth={1.5} className="mx-auto mb-2 text-[hsl(var(--m-muted-foreground))]" />
              <p className="text-[12.5px] text-[hsl(var(--m-muted-foreground))]">
                Nothing scheduled for the next 24h.
              </p>
              <button onClick={() => nav("/app/content/studio")}
                      className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-medium bg-[hsl(var(--m-surface))] border border-[hsl(var(--m-border-subtle))] hover:bg-white">
                <Plus size={12} /> Create post
              </button>
            </div>
          ) : (
            <ul className="px-3 pb-3 space-y-1">
              {todayItems.map((it) => (
                <li key={it.id}>
                  <button onClick={() => openReview(it.id)}
                          className="w-full text-left rounded-xl p-3 hover:bg-[hsl(var(--m-surface))] transition-colors flex items-start gap-3">
                    <div className="shrink-0 text-center w-12">
                      <div className="font-display text-[12px] font-semibold tabular-nums text-[hsl(var(--m-accent))]">
                        {timeFmt(it.scheduledAt)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--m-muted-foreground))] mt-0.5">
                        {it.platform ?? "post"}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium line-clamp-2 leading-snug">
                        {it.title}
                      </div>
                    </div>
                    <ArrowRight size={13} className="text-[hsl(var(--m-muted-foreground))] mt-1 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ─────────── Health rings + brief ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <SectionHeader
            icon={TrendingUp}
            title="Marketing health"
            action={{ label: "Open growth", onClick: () => nav("/app/growth") }}
          />
          <div className="grid grid-cols-3 gap-4 pt-1">
            <Ring label="Content" value={ringContent} color="hsl(var(--m-accent))" />
            <Ring label="Ads" value={ringAds} color="hsl(var(--m-success))" />
            <Ring label="SEO" value={ringSeo} color="hsl(var(--m-warning))" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} className="text-[hsl(var(--m-accent))]" strokeWidth={2} />
            <h2 className="font-display text-[13px] font-semibold uppercase tracking-wider text-[hsl(var(--m-accent))]">
              Daily brief
            </h2>
          </div>
          <ul className="space-y-1.5">
            {(() => {
              const bullets: string[] = [];
              if (totalToApprove > 0)
                bullets.push(`${totalToApprove} draft${totalToApprove === 1 ? "" : "s"} waiting for sign-off.`);
              if (todayItems.length > 0)
                bullets.push(`${todayItems.length} post${todayItems.length === 1 ? "" : "s"} going live in the next 24h.`);
              if (data?.recentActivity && data.recentActivity.length > 0)
                bullets.push(`Latest: ${data.recentActivity[0].title}.`);
              if (bullets.length === 0)
                bullets.push("Nothing urgent — a great window to plan next week's content.");
              return bullets.map((b, i) => (
                <li key={i} className="text-[13px] leading-snug flex gap-2">
                  <span className="text-[hsl(var(--m-accent))] mt-0.5">·</span>
                  <span>{b}</span>
                </li>
              ));
            })()}
          </ul>
        </Card>
      </div>

      <ReviewDrawer open={!!reviewing} item={reviewing} onClose={() => setReviewing(null)} />
    </div>
  );
}
