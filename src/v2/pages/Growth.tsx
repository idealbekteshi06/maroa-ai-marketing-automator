import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, Pill, Btn } from "@/v2/components/common/Card";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import { useAds, useCompetitors, useSeo } from "@/v2/lib/api/hooks/useModules";
import { useOpportunities } from "@/v2/lib/api/hooks/useHome";
import { Megaphone, Eye, Search, Sparkles, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function Metric({
  label,
  value,
  delta,
  loading,
}: {
  label: string;
  value: string;
  delta?: string;
  loading?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "hsl(var(--m-surface-elevated))",
        border: "1px solid hsl(var(--m-border-subtle))",
      }}
    >
      <div
        className="text-[11px] font-medium uppercase tracking-wide"
        style={{ color: "hsl(var(--m-muted-foreground))" }}
      >
        {label}
      </div>
      {loading ? (
        <div
          className="mt-2 h-7 w-20 rounded animate-pulse"
          style={{ background: "hsl(var(--m-border-subtle))" }}
        />
      ) : (
        <div className="mt-1 text-[22px] font-semibold tabular-nums">{value}</div>
      )}
      {delta && (
        <div className="text-[11px] mt-0.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
          {delta}
        </div>
      )}
    </div>
  );
}

interface Rec {
  id: string;
  icon: LucideIcon;
  what: string;
  why: string;
  action: string;
}

export default function Growth() {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const bid = business?.id;

  const ads = useAds(bid);
  const competitors = useCompetitors(bid);
  const seo = useSeo(bid);
  const opps = useOpportunities(user?.id);

  const adList = Array.isArray(ads.data) ? ads.data : [];
  const compList = Array.isArray(competitors.data) ? competitors.data : [];
  const seoD = seo.data as any;

  const activeAds = adList.filter((a: any) => a?.status === "active").length;
  const spend = adList.reduce((s: number, a: any) => s + (Number(a?.spend ?? 0) || 0), 0);
  const roas = adList.length
    ? adList.reduce((s: number, a: any) => s + (Number(a?.roas ?? 0) || 0), 0) / adList.length
    : 0;

  const recs: Rec[] = useMemo(() => {
    const list: Rec[] = [];
    const oppArr = Array.isArray(opps.data) ? opps.data : [];
    for (const o of oppArr.slice(0, 4)) {
      list.push({
        id: o.id,
        icon: Sparkles,
        what: o.title,
        why: o.why,
        action: "Apply",
      });
    }
    return list;
  }, [opps.data]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Growth</h1>
        <p className="text-[13px] mt-0.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
          What's working, what's moving, what to do next.
        </p>
      </header>

      {/* Ads performance summary */}
      <Card
        title="Ads performance"
        action={
          <Pill tone={activeAds > 0 ? "success" : "muted"}>
            {activeAds} active
          </Pill>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Metric label="Spend · MTD" value={spend ? `$${spend.toFixed(0)}` : "—"} loading={ads.isLoading} />
          <Metric label="Blended ROAS" value={roas ? `${roas.toFixed(1)}x` : "—"} loading={ads.isLoading} />
          <Metric label="Active campaigns" value={activeAds.toString()} loading={ads.isLoading} />
        </div>
      </Card>

      {/* Two-column: Competitor + SEO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Competitor signals" padded={false}>
          {competitors.isLoading ? (
            <div className="p-5 space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-12 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
              ))}
            </div>
          ) : compList.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Eye
                size={20}
                strokeWidth={1.5}
                className="mx-auto mb-2"
                style={{ color: "hsl(var(--m-muted-foreground))" }}
              />
              <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                Add competitors in Settings to start tracking signals.
              </p>
            </div>
          ) : (
            <ul>
              {compList.slice(0, 5).map((c: any, idx: number) => (
                <li
                  key={c.id ?? idx}
                  className="px-5 py-3.5 flex items-start gap-3"
                  style={{
                    borderBottom:
                      idx === Math.min(compList.length, 5) - 1
                        ? "none"
                        : "1px solid hsl(var(--m-border-subtle))",
                  }}
                >
                  <Eye
                    size={14}
                    strokeWidth={1.75}
                    className="mt-0.5 shrink-0"
                    style={{ color: "hsl(var(--m-muted-foreground))" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate">
                      {c.name ?? c.competitor_name ?? "Competitor"}
                    </div>
                    <p
                      className="text-[12px] mt-0.5 line-clamp-1"
                      style={{ color: "hsl(var(--m-muted-foreground))" }}
                    >
                      {c.signal ?? c.last_activity ?? "Tracking"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="AI SEO opportunities" padded={false}>
          {seo.isLoading ? (
            <div className="p-5 space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-12 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
              ))}
            </div>
          ) : !seoD?.keywords || seoD.keywords.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Search
                size={20}
                strokeWidth={1.5}
                className="mx-auto mb-2"
                style={{ color: "hsl(var(--m-muted-foreground))" }}
              />
              <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                Connect Search Console so Maroa can find opportunities.
              </p>
            </div>
          ) : (
            <ul>
              {seoD.keywords.slice(0, 5).map((k: any, idx: number) => (
                <li
                  key={idx}
                  className="px-5 py-3.5 flex items-center gap-3"
                  style={{
                    borderBottom:
                      idx === Math.min(seoD.keywords.length, 5) - 1
                        ? "none"
                        : "1px solid hsl(var(--m-border-subtle))",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate">{k.query}</div>
                    <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                      Position {k.position ?? "—"} · {k.clicks ?? 0} clicks
                    </p>
                  </div>
                  <ArrowRight
                    size={13}
                    style={{ color: "hsl(var(--m-muted-foreground))" }}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recommendations */}
      <Card title="Recommendations from Maroa" padded={false}>
        {opps.isLoading ? (
          <div className="p-5 space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
            ))}
          </div>
        ) : recs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Sparkles
              size={20}
              strokeWidth={1.5}
              className="mx-auto mb-2"
              style={{ color: "hsl(var(--m-muted-foreground))" }}
            />
            <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              No recommendations yet. Maroa surfaces them as your business generates signal.
            </p>
          </div>
        ) : (
          <ul>
            {recs.map((r, idx) => (
              <li
                key={r.id}
                className="px-5 py-4 flex items-start gap-4"
                style={{
                  borderBottom:
                    idx === recs.length - 1 ? "none" : "1px solid hsl(var(--m-border-subtle))",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: "hsl(var(--m-accent) / 0.08)",
                    color: "hsl(var(--m-accent))",
                  }}
                >
                  <r.icon size={14} strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{r.what}</div>
                  <p
                    className="text-[12.5px] mt-1 leading-relaxed"
                    style={{ color: "hsl(var(--m-muted-foreground))" }}
                  >
                    {r.why}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Btn variant="ghost">Ask why</Btn>
                  <Btn variant="secondary">Ignore</Btn>
                  <Btn variant="primary">{r.action}</Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
