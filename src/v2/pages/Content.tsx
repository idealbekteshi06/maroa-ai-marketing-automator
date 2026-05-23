import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, Pill, Btn } from "@/v2/components/common/Card";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import { useContent, useCalendar } from "@/v2/lib/api/hooks/useModules";
import { Sparkles, Calendar as CalendarIcon } from "lucide-react";

const PLATFORMS = ["All", "Instagram", "Facebook", "TikTok", "LinkedIn"] as const;
const STATUSES = ["All", "Draft", "Needs approval", "Scheduled", "Published"] as const;

function statusOf(c: any): (typeof STATUSES)[number] {
  const s = (c?.status ?? "").toString().toLowerCase();
  if (s === "published") return "Published";
  if (s === "scheduled") return "Scheduled";
  if (s === "pending_approval" || s === "pending") return "Needs approval";
  return "Draft";
}
function platformOf(c: any): string {
  if (c?.platform) return c.platform;
  if (c?.instagram_caption) return "Instagram";
  if (c?.facebook_post) return "Facebook";
  if (c?.tiktok_caption) return "TikTok";
  if (c?.linkedin_post) return "LinkedIn";
  return "—";
}
function statusTone(s: string) {
  if (s === "Published") return "success" as const;
  if (s === "Scheduled") return "info" as const;
  if (s === "Needs approval") return "warning" as const;
  return "muted" as const;
}

export default function Content() {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const bid = business?.id;
  const content = useContent(bid);
  const now = new Date();
  const calendar = useCalendar(bid, now.getMonth() + 1, now.getFullYear());

  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("All");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");

  const list = useMemo(() => {
    const arr = Array.isArray(content.data) ? content.data : [];
    return arr.filter((c: any) => {
      if (platform !== "All" && platformOf(c).toLowerCase() !== platform.toLowerCase()) return false;
      if (status !== "All" && statusOf(c) !== status) return false;
      return true;
    });
  }, [content.data, platform, status]);

  // Build current week (Mon–Sun) with scheduled items from calendar
  const week = useMemo(() => {
    const today = new Date();
    const day = (today.getDay() + 6) % 7; // 0 = Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() - day);
    monday.setHours(0, 0, 0, 0);
    const cal = Array.isArray(calendar.data) ? calendar.data : [];
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const items = cal.filter((c: any) => {
        if (!c?.scheduled_at) return false;
        const dd = new Date(c.scheduled_at);
        return dd.toDateString() === d.toDateString();
      });
      return { date: d, items };
    });
  }, [calendar.data]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Content</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
            Plan, approve, and schedule everything Maroa creates.
          </p>
        </div>
        <Btn variant="primary" size="md">
          <Sparkles size={13} />
          Generate this week's plan
        </Btn>
      </header>

      {/* Weekly calendar */}
      <Card title="This week" padded={false}>
        {calendar.isLoading ? (
          <div className="p-5 grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
            ))}
          </div>
        ) : (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {week.map((d) => {
              const isToday = d.date.toDateString() === new Date().toDateString();
              return (
                <div
                  key={d.date.toISOString()}
                  className="rounded-lg p-2.5 min-h-[110px]"
                  style={{
                    background: isToday
                      ? "hsl(var(--m-accent) / 0.06)"
                      : "hsl(var(--m-surface))",
                    border: `1px solid ${
                      isToday ? "hsl(var(--m-accent) / 0.3)" : "hsl(var(--m-border-subtle))"
                    }`,
                  }}
                >
                  <div className="flex items-baseline justify-between">
                    <span
                      className="text-[10px] font-medium uppercase tracking-wide"
                      style={{
                        color: isToday
                          ? "hsl(var(--m-accent))"
                          : "hsl(var(--m-muted-foreground))",
                      }}
                    >
                      {d.date.toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                    <span className="text-[13px] font-semibold tabular-nums">
                      {d.date.getDate()}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {d.items.length === 0 ? (
                      <span className="text-[11px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                        —
                      </span>
                    ) : (
                      d.items.slice(0, 3).map((it: any, i: number) => (
                        <div
                          key={it.id ?? i}
                          className="text-[11px] px-1.5 py-1 rounded truncate"
                          style={{
                            background: "hsl(var(--m-surface-elevated))",
                            border: "1px solid hsl(var(--m-border-subtle))",
                          }}
                        >
                          {platformOf(it)} · {(it.title ?? it.theme ?? "Post").toString().slice(0, 18)}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "hsl(var(--m-surface))", border: "1px solid hsl(var(--m-border-subtle))" }}>
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className="px-2.5 h-7 rounded-md text-[12px] font-medium transition-colors"
              style={{
                background: platform === p ? "hsl(var(--m-surface-elevated))" : "transparent",
                color: platform === p ? "hsl(var(--m-foreground))" : "hsl(var(--m-muted-foreground))",
                boxShadow: platform === p ? "0 1px 2px hsl(0 0% 0% / 0.06)" : "none",
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "hsl(var(--m-surface))", border: "1px solid hsl(var(--m-border-subtle))" }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="px-2.5 h-7 rounded-md text-[12px] font-medium transition-colors"
              style={{
                background: status === s ? "hsl(var(--m-surface-elevated))" : "transparent",
                color: status === s ? "hsl(var(--m-foreground))" : "hsl(var(--m-muted-foreground))",
                boxShadow: status === s ? "0 1px 2px hsl(0 0% 0% / 0.06)" : "none",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <Card title={`Posts · ${list.length}`} padded={false}>
        {content.isLoading ? (
          <div className="p-5 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <CalendarIcon
              size={22}
              strokeWidth={1.5}
              className="mx-auto mb-2"
              style={{ color: "hsl(var(--m-muted-foreground))" }}
            />
            <div className="text-[14px] font-medium">No content scheduled yet</div>
            <p
              className="text-[12.5px] mt-1 mb-4 max-w-sm mx-auto"
              style={{ color: "hsl(var(--m-muted-foreground))" }}
            >
              Maroa will draft a week of on-brand posts. You approve, it publishes.
            </p>
            <Btn variant="primary">
              <Sparkles size={13} />
              Generate this week's plan
            </Btn>
          </div>
        ) : (
          <ul>
            {list.map((c: any, idx: number) => {
              const s = statusOf(c);
              return (
                <li
                  key={c.id ?? idx}
                  className="px-5 py-4 flex items-start gap-4"
                  style={{
                    borderBottom:
                      idx === list.length - 1
                        ? "none"
                        : "1px solid hsl(var(--m-border-subtle))",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium truncate">
                        {c.content_theme ?? c.title ?? "Post"}
                      </span>
                      <Pill tone="muted">{platformOf(c)}</Pill>
                      <Pill tone={statusTone(s)}>{s}</Pill>
                    </div>
                    <p
                      className="text-[12.5px] mt-1 line-clamp-2"
                      style={{ color: "hsl(var(--m-muted-foreground))" }}
                    >
                      {c.instagram_caption ?? c.facebook_post ?? c.preview ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Btn variant="ghost">Edit</Btn>
                    {s === "Needs approval" || s === "Draft" ? (
                      <Btn variant="primary">Approve</Btn>
                    ) : (
                      <Btn variant="secondary">Schedule</Btn>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
