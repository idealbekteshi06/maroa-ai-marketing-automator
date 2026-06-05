/**
 * HubSpot-style Deals pipeline (kanban).
 * Columns by stage. Drag-and-drop reorders + fires dealStageUpdate.
 */
import { useMemo, useState } from "react";
import { usePipeline } from "@/v2/lib/api/hooks/useModules";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import { PageHeader } from "@/v2/components/common/PageHeader";
import { EmptyState } from "@/v2/components/common/EmptyState";
import { Btn } from "@/v2/components/common/Card";
import { dealStageUpdate } from "@/lib/api";
import { GitBranch, Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";

type Deal = Record<string, any>;
const STAGES = ["new", "qualified", "proposal", "negotiation", "won", "lost"] as const;
const STAGE_LABEL: Record<string, string> = {
  new: "New", qualified: "Qualified", proposal: "Proposal",
  negotiation: "Negotiation", won: "Won", lost: "Lost",
};

function fmtMoney(n?: number) {
  if (!n) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function PipelinePage() {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const bid = business?.id;
  const { data, isLoading, refetch } = usePipeline(bid);
  const deals: Deal[] = Array.isArray(data) ? data : [];
  const [optimistic, setOptimistic] = useState<Record<string, string>>({});

  const grouped = useMemo(() => {
    const g: Record<string, Deal[]> = {};
    STAGES.forEach((s) => (g[s] = []));
    deals.forEach((d) => {
      const stage = optimistic[d.id] ?? (d.stage ?? d.status ?? "new").toLowerCase();
      (g[stage] ?? g.new).push(d);
    });
    return g;
  }, [deals, optimistic]);

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    STAGES.forEach((s) => {
      t[s] = grouped[s].reduce((sum, d) => sum + (Number(d.amount ?? d.value ?? 0) || 0), 0);
    });
    return t;
  }, [grouped]);

  const totalValue = Object.values(totals).reduce((a, b) => a + b, 0);

  async function moveDeal(dealId: string, toStage: string) {
    setOptimistic((p) => ({ ...p, [dealId]: toStage }));
    try {
      await dealStageUpdate({ deal_id: dealId, stage: toStage, business_id: bid! });
      toast.success(`Moved to ${STAGE_LABEL[toStage]}`);
      refetch();
    } catch (e) {
      toast.error("Couldn't move deal", { description: e instanceof Error ? e.message : "" });
      setOptimistic((p) => { const n = { ...p }; delete n[dealId]; return n; });
    }
  }

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle={deals.length ? `${deals.length} deals · ${fmtMoney(totalValue)} in flight` : "Track every deal."}
        action={<Btn variant="primary" onClick={() => toast.info("New deal form coming")}>
          <Plus size={13} /> New deal
        </Btn>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {STAGES.map((s) => (
            <div key={s} className="rounded-xl h-96 animate-pulse"
                 style={{ background: "hsl(var(--m-border-subtle))" }} />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="rounded-xl px-6 py-16"
             style={{ background: "hsl(var(--m-surface-elevated))",
                      border: "1px solid hsl(var(--m-border-subtle))" }}>
          <EmptyState icon={GitBranch} title="No deals yet"
            helper="Deals appear here when leads cross your qualification threshold." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {STAGES.map((stage) => (
            <Column key={stage} stage={stage} deals={grouped[stage]} total={totals[stage]}
                    onDrop={(id) => moveDeal(id, stage)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Column({ stage, deals, total, onDrop }: {
  stage: string; deals: Deal[]; total: number; onDrop: (id: string) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop(id);
      }}
      className="rounded-xl flex flex-col min-h-[400px] transition-colors"
      style={{
        background: over ? "hsl(var(--m-accent-soft))" : "hsl(var(--m-surface-elevated))",
        border: `1px solid ${over ? "hsl(var(--m-accent))" : "hsl(var(--m-border-subtle))"}`,
      }}>
      <header className="flex items-center justify-between px-3 h-10"
              style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold">{STAGE_LABEL[stage]}</span>
          <span className="text-[10.5px] px-1.5 py-0.5 rounded-full m-tnum"
                style={{ background: "hsl(var(--m-foreground) / 0.06)",
                         color: "hsl(var(--m-muted-foreground))" }}>{deals.length}</span>
        </div>
        <span className="text-[10.5px] m-tnum"
              style={{ color: "hsl(var(--m-muted-foreground))" }}>{fmtMoney(total)}</span>
      </header>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {deals.length === 0 ? (
          <div className="text-center text-[11.5px] py-8"
               style={{ color: "hsl(var(--m-muted-foreground))" }}>Empty</div>
        ) : deals.map((d) => (
          <div key={d.id} draggable
               onDragStart={(e) => e.dataTransfer.setData("text/plain", d.id)}
               className="rounded-lg p-2.5 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-sm"
               style={{ background: "hsl(var(--m-background))",
                        border: "1px solid hsl(var(--m-border-subtle))" }}>
            <div className="text-[12.5px] font-medium truncate">{d.name ?? d.title ?? "Untitled"}</div>
            {d.contact_name && (
              <div className="text-[11px] truncate mt-0.5"
                   style={{ color: "hsl(var(--m-muted-foreground))" }}>{d.contact_name}</div>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold m-tnum">
                <DollarSign size={10} />
                {Number(d.amount ?? d.value ?? 0).toLocaleString()}
              </span>
              {d.close_date && (
                <span className="text-[10px] m-tnum"
                      style={{ color: "hsl(var(--m-muted-foreground))" }}>
                  {new Date(d.close_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
