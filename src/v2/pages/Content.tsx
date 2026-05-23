import { useMemo, useState } from "react";
import { Card, Pill, Btn } from "@/v2/components/common/Card";
import { useContentPageData } from "@/v2/lib/data/usePageData";
import {
  generateWeeklyContent,
  approveContentPost,
  editContentPost,
  schedulePost,
  filterContentByPlatform,
  filterContentByStatus,
} from "@/v2/lib/data/handlers";
import type { ContentStatus, ContentPlatform } from "@/v2/lib/data/types";
import { Sparkles, Calendar as CalendarIcon, AlertCircle } from "lucide-react";

const PLATFORMS = ["All", "Instagram", "Facebook", "TikTok", "LinkedIn"] as const;
const STATUSES = ["All", "Draft", "Needs approval", "Scheduled", "Published"] as const;

function statusTone(s: ContentStatus) {
  if (s === "Published") return "success" as const;
  if (s === "Scheduled") return "info" as const;
  if (s === "Needs approval") return "warning" as const;
  return "muted" as const;
}

export default function Content() {
  const state = useContentPageData();
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("All");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");

  const isLoading = state.status === "loading";
  const data = state.status === "loading" ? undefined : state.data;

  const list = useMemo(() => {
    const posts = data?.posts ?? [];
    return posts.filter((p) => {
      if (platform !== "All" && p.platform !== (platform as ContentPlatform)) return false;
      if (status !== "All" && p.status !== (status as ContentStatus)) return false;
      return true;
    });
  }, [data?.posts, platform, status]);

  if (state.status === "error") {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <AlertCircle size={18} style={{ color: "hsl(var(--m-destructive))" }} />
          <div>
            <div className="text-[14px] font-medium">We couldn't load your content.</div>
            <p className="text-[12.5px] mt-1" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              Please refresh in a moment.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Content</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
            Plan, approve, and schedule everything Maroa creates.
          </p>
        </div>
        <Btn variant="primary" size="md" onClick={() => generateWeeklyContent()}>
          <Sparkles size={13} />
          Generate this week's plan
        </Btn>
      </header>

      {/* Weekly calendar */}
      <Card title="This week" padded={false}>
        {isLoading ? (
          <div className="p-5 grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
            ))}
          </div>
        ) : (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {(data?.weekCalendar ?? []).map((d) => {
              const date = new Date(d.date);
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div
                  key={d.date}
                  className="rounded-lg p-2.5 min-h-[110px]"
                  style={{
                    background: isToday ? "hsl(var(--m-accent) / 0.06)" : "hsl(var(--m-surface))",
                    border: `1px solid ${isToday ? "hsl(var(--m-accent) / 0.3)" : "hsl(var(--m-border-subtle))"}`,
                  }}
                >
                  <div className="flex items-baseline justify-between">
                    <span
                      className="text-[10px] font-medium uppercase tracking-wide"
                      style={{ color: isToday ? "hsl(var(--m-accent))" : "hsl(var(--m-muted-foreground))" }}
                    >
                      {date.toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                    <span className="text-[13px] font-semibold tabular-nums">{date.getDate()}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {d.items.length === 0 ? (
                      <span className="text-[11px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>—</span>
                    ) : (
                      d.items.slice(0, 3).map((it) => (
                        <div
                          key={it.id}
                          className="text-[11px] px-1.5 py-1 rounded truncate"
                          style={{
                            background: "hsl(var(--m-surface-elevated))",
                            border: "1px solid hsl(var(--m-border-subtle))",
                          }}
                        >
                          {it.platform} · {it.title}
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
              onClick={() => { setPlatform(p); filterContentByPlatform(p); }}
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
              onClick={() => { setStatus(s); filterContentByStatus(s); }}
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
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <CalendarIcon size={22} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: "hsl(var(--m-muted-foreground))" }} />
            <div className="text-[14px] font-medium">No content scheduled yet</div>
            <p className="text-[12.5px] mt-1 mb-4 max-w-sm mx-auto" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              Maroa will draft a week of on-brand posts. You approve, it publishes.
            </p>
            <Btn variant="primary" onClick={() => generateWeeklyContent()}>
              <Sparkles size={13} />
              Generate this week's plan
            </Btn>
          </div>
        ) : (
          <ul>
            {list.map((c, idx) => (
              <li
                key={c.id}
                className="px-5 py-4 flex items-start gap-4"
                style={{
                  borderBottom: idx === list.length - 1 ? "none" : "1px solid hsl(var(--m-border-subtle))",
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium truncate">{c.title}</span>
                    <Pill tone="muted">{c.platform}</Pill>
                    <Pill tone={statusTone(c.status)}>{c.status}</Pill>
                  </div>
                  <p className="text-[12.5px] mt-1 line-clamp-2" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    {c.preview}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Btn variant="ghost" onClick={() => editContentPost(c.id)}>Edit</Btn>
                  {c.status === "Needs approval" || c.status === "Draft" ? (
                    <Btn variant="primary" onClick={() => approveContentPost(c.id)}>Approve</Btn>
                  ) : (
                    <Btn variant="secondary" onClick={() => schedulePost(c.id)}>Schedule</Btn>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
