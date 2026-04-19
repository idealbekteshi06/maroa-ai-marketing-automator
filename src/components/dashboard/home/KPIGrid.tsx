import KPICard from "./KPICard";

interface KPIGridProps {
  reach: number;
  reachDelta: string;
  reachSpark: number[];
  leads: number;
  leadsDelta: string;
  leadsSpark: number[];
  adSpend: number;
  adSpendDelta: string;
  adSpendSpark: number[];
  revenue: number;
  revenueDelta: string;
  revenueSpark: number[];
}

const EMPTY_HELPER = "First data arrives after your AI takes its first action";

export default function KPIGrid(p: KPIGridProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        label="Reach · 7d"
        value={p.reach.toLocaleString()}
        delta={p.reachDelta || "—"}
        deltaContext="vs last week"
        trend={p.reach > 0 ? "up" : "neutral"}
        sparklineData={p.reachSpark}
        sparklineType="line"
        emptyHelper={p.reach === 0 ? EMPTY_HELPER : undefined}
      />
      <KPICard
        label="Leads"
        value={p.leads.toLocaleString()}
        delta={p.leadsDelta || "—"}
        deltaContext="this week"
        trend={p.leads > 0 ? "up" : "neutral"}
        sparklineData={p.leadsSpark}
        sparklineType="area"
        emptyHelper={p.leads === 0 ? EMPTY_HELPER : undefined}
      />
      <KPICard
        label="Ad spend"
        value={`€${p.adSpend.toLocaleString()}`}
        delta={p.adSpendDelta || "—"}
        deltaContext="daily budget"
        trend={p.adSpend > 0 ? "up" : "neutral"}
        sparklineData={p.adSpendSpark}
        sparklineType="bar"
        emptyHelper={p.adSpend === 0 ? EMPTY_HELPER : undefined}
      />
      <KPICard
        label="Revenue · 30d"
        value={`€${p.revenue.toLocaleString()}`}
        delta={p.revenueDelta || "—"}
        deltaContext="vs last month"
        trend={p.revenue > 0 ? "up" : "neutral"}
        sparklineData={p.revenueSpark}
        sparklineType="line"
        emptyHelper={p.revenue === 0 ? EMPTY_HELPER : undefined}
      />
    </div>
  );
}
