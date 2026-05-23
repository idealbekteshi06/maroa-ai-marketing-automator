import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/v2/components/common/PageHeader";
import { KpiCard } from "@/v2/components/common/KpiCard";
import { EmptyState } from "@/v2/components/common/EmptyState";
import {
  useHealth,
  usePerformanceSummary,
  useDashboardEvents,
  useOpportunities,
} from "@/v2/lib/api/hooks/useHome";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import { Sparkles, Activity } from "lucide-react";

function weatherFromHealth(score: number | undefined): string {
  if (score === undefined) return "✨";
  if (score >= 80) return "☀️";
  if (score >= 60) return "⛅";
  if (score >= 40) return "☁️";
  return "🌧️";
}

function fmtCurrency(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Home() {
  const { user } = useAuth();
  const userId = user?.id;
  const { business } = useCurrentBusiness(userId);
  const businessId = business?.id;

  const health = useHealth(userId);
  const perf = usePerformanceSummary(userId);
  const events = useDashboardEvents(businessId);
  const opps = useOpportunities(userId);

  const firstName =
    (user?.user_metadata?.first_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  return (
    <div>
      <PageHeader
        title={`Good morning, ${firstName} ${weatherFromHealth(health.data?.score)}`}
        subtitle="Here's what Maroa has been working on."
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Pipeline value"
          value={fmtCurrency(perf.data?.pipeline_value)}
          loading={perf.isLoading}
          sublabel="vs 7d ago"
        />
        <KpiCard
          label="Revenue · 30d"
          value={fmtCurrency(perf.data?.revenue_30d)}
          delta={perf.data?.revenue_delta_7d}
          loading={perf.isLoading}
        />
        <KpiCard
          label="Active campaigns"
          value={perf.data?.active_campaigns?.toString() ?? "—"}
          loading={perf.isLoading}
        />
        <KpiCard
          label="Health score"
          value={
            health.data?.score !== undefined
              ? `${health.data.score}/100`
              : (health.data as { total?: number } | undefined)?.total !== undefined
                ? `${(health.data as { total: number }).total}/100`
                : "—"
          }
          loading={health.isLoading}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-8">
        <div className="lg:col-span-8 rounded-2xl m-glass p-6" style={{ boxShadow: "var(--m-shadow-sm)" }}>
          <h2 className="text-title-3 mb-4">Maroa did this for you today</h2>
          {events.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl animate-pulse"
                  style={{ background: "hsl(var(--m-border-subtle))" }}
                />
              ))}
            </div>
          ) : events.data && events.data.length > 0 ? (
            <ul className="space-y-3">
              {events.data.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: "hsl(var(--m-surface))" }}
                >
                  <Activity size={16} strokeWidth={1.5} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="text-callout font-medium">{e.title}</div>
                    {e.narrative && (
                      <div
                        className="text-footnote mt-0.5"
                        style={{ color: "hsl(var(--m-muted-foreground))" }}
                      >
                        {e.narrative}
                      </div>
                    )}
                  </div>
                  <span
                    className="text-caption"
                    style={{ color: "hsl(var(--m-muted-foreground))" }}
                  >
                    {new Date(e.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Activity}
              title="Quiet so far"
              helper="Maroa is warming up. New activity appears here in real time."
            />
          )}
        </div>

        <div className="lg:col-span-4 rounded-2xl m-glass p-6" style={{ boxShadow: "var(--m-shadow-sm)" }}>
          <h2 className="text-title-3 mb-4">Opportunities</h2>
          {opps.isLoading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl animate-pulse"
                  style={{ background: "hsl(var(--m-border-subtle))" }}
                />
              ))}
            </div>
          ) : opps.data && opps.data.length > 0 ? (
            <ul className="space-y-3">
              {opps.data.slice(0, 5).map((o) => (
                <li key={o.id} className="p-3 rounded-xl" style={{ background: "hsl(var(--m-surface))" }}>
                  <div className="text-callout font-medium">{o.title}</div>
                  <div
                    className="text-footnote mt-1"
                    style={{ color: "hsl(var(--m-muted-foreground))" }}
                  >
                    {o.why}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="All clear"
              helper="No new opportunities to surface yet."
            />
          )}
        </div>
      </section>
    </div>
  );
}
