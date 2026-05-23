import { Card, Pill, Btn } from "@/v2/components/common/Card";
import { useGrowthPageData } from "@/v2/lib/data/usePageData";
import {
  applyGrowthRecommendation,
  dismissGrowthRecommendation,
  explainGrowthRecommendation,
  viewCompetitorSignal,
  viewSeoOpportunity,
} from "@/v2/lib/data/handlers";
import { Eye, Search, Sparkles, ArrowRight, AlertCircle } from "lucide-react";

function Metric({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
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
      <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "hsl(var(--m-muted-foreground))" }}>
        {label}
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-20 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
      ) : (
        <div className="mt-1 text-[22px] font-semibold tabular-nums">{value}</div>
      )}
    </div>
  );
}

export default function Growth() {
  const state = useGrowthPageData();

  if (state.status === "error") {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <AlertCircle size={18} style={{ color: "hsl(var(--m-destructive))" }} />
          <div>
            <div className="text-[14px] font-medium">We couldn't load growth data.</div>
            <p className="text-[12.5px] mt-1" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              Please refresh in a moment.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const isLoading = state.status === "loading";
  const data = state.status === "loading" ? undefined : state.data;
  const ads = data?.ads;
  const competitors = data?.competitors ?? [];
  const seoOpps = data?.seoOpportunities ?? [];
  const recs = data?.recommendations ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Growth</h1>
        <p className="text-[13px] mt-0.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
          What's working, what's moving, what to do next.
        </p>
      </header>

      <Card
        title="Ads performance"
        action={
          <Pill tone={(ads?.activeCampaigns ?? 0) > 0 ? "success" : "muted"}>
            {ads?.activeCampaigns ?? 0} active
          </Pill>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Metric label="Spend · MTD" value={ads?.spendMtd ? `$${ads.spendMtd.toFixed(0)}` : "—"} loading={isLoading} />
          <Metric label="Blended ROAS" value={ads?.blendedRoas ? `${ads.blendedRoas.toFixed(1)}x` : "—"} loading={isLoading} />
          <Metric label="Active campaigns" value={(ads?.activeCampaigns ?? 0).toString()} loading={isLoading} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Competitor signals" padded={false}>
          {isLoading ? (
            <div className="p-5 space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-12 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
              ))}
            </div>
          ) : competitors.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Eye size={20} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: "hsl(var(--m-muted-foreground))" }} />
              <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                Add competitors in Settings to start tracking signals.
              </p>
            </div>
          ) : (
            <ul>
              {competitors.map((c, idx) => (
                <li
                  key={c.id}
                  className="px-5 py-3.5 flex items-start gap-3 cursor-pointer hover:bg-[hsl(var(--m-surface))]"
                  style={{
                    borderBottom: idx === competitors.length - 1 ? "none" : "1px solid hsl(var(--m-border-subtle))",
                  }}
                  onClick={() => viewCompetitorSignal(c.id)}
                >
                  <Eye size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" style={{ color: "hsl(var(--m-muted-foreground))" }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate">{c.name}</div>
                    <p className="text-[12px] mt-0.5 line-clamp-1" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                      {c.signal}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="AI SEO opportunities" padded={false}>
          {isLoading ? (
            <div className="p-5 space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-12 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
              ))}
            </div>
          ) : seoOpps.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Search size={20} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: "hsl(var(--m-muted-foreground))" }} />
              <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                Connect Search Console so Maroa can find opportunities.
              </p>
            </div>
          ) : (
            <ul>
              {seoOpps.map((k, idx) => (
                <li
                  key={k.id}
                  className="px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-[hsl(var(--m-surface))]"
                  style={{
                    borderBottom: idx === seoOpps.length - 1 ? "none" : "1px solid hsl(var(--m-border-subtle))",
                  }}
                  onClick={() => viewSeoOpportunity(k.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate">{k.query}</div>
                    <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                      Position {k.position ?? "—"} · {k.clicks} clicks
                    </p>
                  </div>
                  <ArrowRight size={13} style={{ color: "hsl(var(--m-muted-foreground))" }} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Recommendations from Maroa" padded={false}>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
            ))}
          </div>
        ) : recs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Sparkles size={20} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: "hsl(var(--m-muted-foreground))" }} />
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
                style={{ borderBottom: idx === recs.length - 1 ? "none" : "1px solid hsl(var(--m-border-subtle))" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "hsl(var(--m-accent) / 0.08)", color: "hsl(var(--m-accent))" }}
                >
                  <Sparkles size={14} strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{r.what}</div>
                  <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    {r.why}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Btn variant="ghost" onClick={() => explainGrowthRecommendation(r.id)}>Ask why</Btn>
                  <Btn variant="secondary" onClick={() => dismissGrowthRecommendation(r.id)}>Ignore</Btn>
                  <Btn variant="primary" onClick={() => applyGrowthRecommendation(r.id)}>{r.actionLabel}</Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
