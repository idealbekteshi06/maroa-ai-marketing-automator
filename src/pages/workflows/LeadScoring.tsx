/**
 * Workflow #2 — Lead Scoring & Routing UI
 * ============================================================================
 * Senior-RevOps dashboard:
 *   - Tier distribution summary (Hot / Warm-High / Warm / Cool / Junk)
 *   - Lead table with score breakdown + top signals
 *   - Detail drawer: enrichment payload, scoring components explained,
 *     buying-committee map, AI-drafted response, approve-send flow
 *   - ICP editor (ideal titles, company size range, industries, geographies,
 *     deadbeat list)
 *   - Routing rules editor (ordered priority list)
 *   - Scoring calibration panel (30-day accuracy, top predictive signal,
 *     most misleading signal)
 * ============================================================================
 */

import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Brain,
  Building2,
  Check,
  ChevronRight,
  Clock,
  Filter,
  Flame,
  Globe,
  Info,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  wf2ListLeads,
  wf2GetLead,
  wf2GenerateResponse,
  wf2SendResponse,
  wf2UpdateLead,
  wf2GetIcp,
  wf2SaveIcp,
  wf2GetRoutingRules,
  wf2GetScoringCalibration,
  type LeadTier,
  type LeadRow,
} from "@/lib/api";

const TIER_META: Record<
  LeadTier,
  { label: string; color: string; description: string; slaLabel: string }
> = {
  hot: {
    label: "Hot",
    color: "bg-destructive/10 text-destructive border-destructive/30",
    description: "Respond within 5 minutes (9x conversion lift)",
    slaLabel: "5 min SLA",
  },
  warm_high: {
    label: "Warm · High",
    color: "bg-warning/10 text-warning border-warning/30",
    description: "Same-day response window",
    slaLabel: "1 hour SLA",
  },
  warm: {
    label: "Warm",
    color: "bg-primary/10 text-primary border-primary/30",
    description: "24 hour response window",
    slaLabel: "24h SLA",
  },
  cool: {
    label: "Cool",
    color: "bg-muted text-muted-foreground border-border",
    description: "Long-term nurture track",
    slaLabel: "weekly cadence",
  },
  junk: {
    label: "Junk",
    color: "bg-muted/50 text-muted-foreground border-border",
    description: "Flagged for weekly review — not deleted",
    slaLabel: "weekly review",
  },
};

export default function LeadScoring() {
  const { businessId } = useAuth();
  const qc = useQueryClient();
  const [tierFilter, setTierFilter] = useState<LeadTier | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showIcp, setShowIcp] = useState(false);

  const leadsQuery = useQuery({
    queryKey: ["wf2", "leads", businessId, tierFilter, search],
    queryFn: () =>
      wf2ListLeads({
        business_id: businessId!,
        tier: tierFilter === "all" ? undefined : tierFilter,
        q: search || undefined,
        limit: "50",
      }),
    enabled: !!businessId,
    retry: false,
  });

  const calibrationQuery = useQuery({
    queryKey: ["wf2", "calibration", businessId],
    queryFn: () => wf2GetScoringCalibration({ business_id: businessId! }),
    enabled: !!businessId,
    retry: false,
  });

  const leads = leadsQuery.data?.items ?? [];
  const counts = leadsQuery.data?.counts ?? {
    hot: 0,
    warm_high: 0,
    warm: 0,
    cool: 0,
    junk: 0,
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Workflow #2 · Lead Scoring &amp; Routing
          </div>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-foreground">
            Lead intelligence
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Behavioral signals (35% weight) over demographic signals. Hot leads
            get drafted responses within 10 minutes — 9x conversion lift when
            responding within 5 min (HBR).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Sheet open={showIcp} onOpenChange={setShowIcp}>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline">
                <Target className="mr-1.5 h-4 w-4" />
                ICP
              </Button>
            </SheetTrigger>
            <IcpEditor businessId={businessId} onClose={() => setShowIcp(false)} />
          </Sheet>
          <Button size="sm" variant="outline" disabled>
            <Settings2 className="mr-1.5 h-4 w-4" />
            Routing
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => leadsQuery.refetch()}
            disabled={leadsQuery.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${leadsQuery.isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* ── Tier summary cards ── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        <TierCard
          active={tierFilter === "all"}
          onClick={() => setTierFilter("all")}
          tier="all"
          count={Object.values(counts).reduce((a, b) => a + b, 0)}
          label="All leads"
        />
        {(["hot", "warm_high", "warm", "cool", "junk"] as LeadTier[]).map((t) => (
          <TierCard
            key={t}
            active={tierFilter === t}
            onClick={() => setTierFilter(t)}
            tier={t}
            count={counts[t]}
            label={TIER_META[t].label}
          />
        ))}
      </div>

      {/* ── Scoring calibration panel ── */}
      {calibrationQuery.data && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Scoring calibration (last 30 days)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              The model self-calibrates every 30 days against actual conversion outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Accuracy
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {(calibrationQuery.data.last30DaysAccuracy * 100).toFixed(0)}%
                </p>
                <p className="text-[10px] text-muted-foreground">
                  n={calibrationQuery.data.sampleSize}
                </p>
              </div>
              <div className="rounded border border-success/30 bg-success/5 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Top predictive signal
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {calibrationQuery.data.topPredictiveSignal}
                </p>
              </div>
              <div className="rounded border border-warning/30 bg-warning/5 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Most misleading signal
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {calibrationQuery.data.mostMisleadingSignal}
                </p>
              </div>
              <div className="rounded border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Weights recalibrated
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  Every 30 days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Search + table ── */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search name, company, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {leadsQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading leads…</div>
          ) : leads.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No leads matching filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Lead</th>
                    <th className="px-3 py-2 text-left">Company</th>
                    <th className="px-3 py-2 text-left">Tier</th>
                    <th className="px-3 py-2 text-right">Score</th>
                    <th className="px-3 py-2 text-left">Top signals</th>
                    <th className="px-3 py-2 text-left">SLA</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <LeadTableRow
                      key={l.id}
                      lead={l}
                      onOpen={() => setSelectedLeadId(l.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Lead detail drawer ── */}
      <Sheet
        open={!!selectedLeadId}
        onOpenChange={(open) => !open && setSelectedLeadId(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {selectedLeadId && (
            <LeadDetailPanel
              businessId={businessId!}
              leadId={selectedLeadId}
              onClose={() => setSelectedLeadId(null)}
              onUpdated={() => {
                qc.invalidateQueries({ queryKey: ["wf2", "leads", businessId] });
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TierCard({
  tier,
  count,
  label,
  active,
  onClick,
}: {
  tier: LeadTier | "all";
  count: number;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const meta = tier !== "all" ? TIER_META[tier] : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-colors ${
        active
          ? "border-primary bg-primary/10"
          : "border-border hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-1.5">
        {tier === "hot" && <Flame className="h-3 w-3 text-destructive" />}
        {tier === "warm_high" && <TrendingUp className="h-3 w-3 text-warning" />}
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
        {count}
      </p>
      {meta && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{meta.slaLabel}</p>
      )}
    </button>
  );
}

function LeadTableRow({ lead, onOpen }: { lead: LeadRow; onOpen: () => void }) {
  const meta = TIER_META[lead.tier];
  return (
    <tr
      className="cursor-pointer border-b border-border hover:bg-muted/30"
      onClick={onOpen}
    >
      <td className="px-3 py-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.email}
          </p>
          <p className="text-[11px] text-muted-foreground">{lead.title ?? lead.email}</p>
        </div>
      </td>
      <td className="px-3 py-2">
        <p className="text-sm text-foreground">{lead.companyName ?? "—"}</p>
        <p className="text-[11px] text-muted-foreground">
          {lead.companyIndustry}{" "}
          {lead.companyEmployees ? `· ${lead.companyEmployees} emp` : ""}
        </p>
      </td>
      <td className="px-3 py-2">
        <Badge variant="outline" className={`text-[10px] ${meta.color}`}>
          {meta.label}
        </Badge>
      </td>
      <td className="px-3 py-2 text-right">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {lead.score}
        </span>
        <span className="text-[10px] text-muted-foreground">/100</span>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {lead.topPredictiveSignals.slice(0, 2).map((s) => (
            <Badge key={s} variant="outline" className="text-[9px]">
              {s}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-3 py-2 text-[11px] text-muted-foreground">
        {lead.slaDeadline ? new Date(lead.slaDeadline).toLocaleString() : "—"}
      </td>
      <td className="px-3 py-2 text-right">
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Lead detail panel (drawer)
// ---------------------------------------------------------------------------

function LeadDetailPanel({
  businessId,
  leadId,
  onClose,
  onUpdated,
}: {
  businessId: string;
  leadId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const qc = useQueryClient();
  const detailQuery = useQuery({
    queryKey: ["wf2", "lead", businessId, leadId],
    queryFn: () => wf2GetLead({ business_id: businessId, lead_id: leadId }),
    retry: false,
  });

  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");

  const generate = useMutation({
    mutationFn: () => wf2GenerateResponse({ businessId, leadId }),
    onSuccess: (d) => {
      setEditedSubject(d.subject);
      setEditedBody(d.body);
      toast.success("Response drafted");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to draft"),
  });

  const send = useMutation({
    mutationFn: () =>
      wf2SendResponse({
        businessId,
        leadId,
        subject: editedSubject,
        body: editedBody,
      }),
    onSuccess: () => {
      toast.success("Response sent");
      qc.invalidateQueries({ queryKey: ["wf2", "lead", businessId, leadId] });
      onUpdated();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to send"),
  });

  const update = useMutation({
    mutationFn: (vars: Parameters<typeof wf2UpdateLead>[0]) => wf2UpdateLead(vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wf2", "lead", businessId, leadId] });
      onUpdated();
    },
  });

  const d = detailQuery.data;

  if (detailQuery.isLoading) {
    return (
      <div className="p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!d) {
    return <p className="p-4 text-sm text-muted-foreground">Lead not found.</p>;
  }

  const meta = TIER_META[d.tier];

  return (
    <div className="space-y-4">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          {[d.firstName, d.lastName].filter(Boolean).join(" ") || d.email}
          <Badge variant="outline" className={`text-[10px] ${meta.color}`}>
            {meta.label} · {d.score}
          </Badge>
        </SheetTitle>
        <SheetDescription className="text-xs">
          {d.title ?? d.email} · {d.companyName}{" "}
          {d.companyIndustry ? `· ${d.companyIndustry}` : ""}
        </SheetDescription>
      </SheetHeader>

      <Tabs defaultValue="score">
        <TabsList>
          <TabsTrigger value="score">Score</TabsTrigger>
          <TabsTrigger value="enrichment">Enrichment</TabsTrigger>
          <TabsTrigger value="response">AI response</TabsTrigger>
          <TabsTrigger value="committee">Committee</TabsTrigger>
        </TabsList>

        {/* Score components */}
        <TabsContent value="score" className="space-y-3 pt-3">
          <ScoreBar
            label="Demographic fit"
            score={d.components.demographicFit.score}
            max={20}
            notes={d.components.demographicFit.notes}
          />
          <ScoreBar
            label="Behavioral intent"
            score={d.components.behavioralIntent.score}
            max={35}
            notes={d.components.behavioralIntent.notes}
          />
          <ScoreBar
            label="Company fit"
            score={d.components.companyFit.score}
            max={25}
            notes={d.components.companyFit.notes}
          />
          <ScoreBar
            label="Commitment signals"
            score={d.components.commitmentSignals.score}
            max={20}
            notes={d.components.commitmentSignals.notes}
          />
          {d.topRiskSignals.length > 0 && (
            <div className="rounded border border-warning/30 bg-warning/5 p-2">
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                <div>
                  <p className="text-[11px] font-medium text-foreground">Risk signals</p>
                  <ul className="mt-0.5 ml-3 list-disc text-[11px] text-muted-foreground">
                    {d.topRiskSignals.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => update.mutate({ businessId, leadId, tagAsJunk: true })}
              disabled={d.tier === "junk"}
            >
              Mark as junk
            </Button>
            {d.tier === "junk" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => update.mutate({ businessId, leadId, unjunk: true })}
              >
                Un-junk (feeds learning)
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Enrichment payload */}
        <TabsContent value="enrichment" className="space-y-3 pt-3">
          <EnrichmentBlock icon={Users} label="Person" data={d.person} />
          <EnrichmentBlock icon={Building2} label="Company" data={d.company} />
          <EnrichmentBlock icon={TrendingUp} label="Behavior" data={d.behavior} />
          <EnrichmentBlock icon={Info} label="Intake" data={d.intake} />
        </TabsContent>

        {/* AI response */}
        <TabsContent value="response" className="space-y-3 pt-3">
          {!editedBody && !d.generatedDraft ? (
            <div className="rounded border border-dashed border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">No draft yet.</p>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => generate.mutate()}
                disabled={generate.isPending}
              >
                {generate.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-4 w-4" />
                )}
                Draft personalized response
              </Button>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-xs">Subject</Label>
                <Input
                  className="mt-1"
                  value={editedSubject || d.generatedDraft?.subject || ""}
                  onChange={(e) => setEditedSubject(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Body</Label>
                <Textarea
                  className="mt-1 min-h-[240px]"
                  value={editedBody || d.generatedDraft?.body || ""}
                  onChange={(e) => setEditedBody(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">
                  Length:{" "}
                  {
                    (editedBody || d.generatedDraft?.body || "").split(/\s+/)
                      .filter(Boolean).length
                  }{" "}
                  words (target 80–200)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generate.mutate()}
                    disabled={generate.isPending}
                  >
                    Regenerate
                  </Button>
                  <Button size="sm" onClick={() => send.mutate()} disabled={send.isPending}>
                    {send.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-1.5 h-4 w-4" />
                    )}
                    Approve &amp; send
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Buying committee */}
        <TabsContent value="committee" className="pt-3">
          {d.committee ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{d.committee.domain}</p>
                {d.committee.isActiveDeal && (
                  <Badge variant="outline" className="text-[10px]">
                    Active deal
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Total activity score: {d.committee.totalActivityScore}
              </p>
              <ul className="divide-y divide-border">
                {d.committee.members.map((m) => (
                  <li key={m.leadId} className="py-2">
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {m.title} · {m.role.replace("_", " ")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No buying committee detected. Committees form when 2+ contacts
              from the same domain enter the pipeline.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScoreBar({
  label,
  score,
  max,
  notes,
}: {
  label: string;
  score: number;
  max: number;
  notes: string[];
}) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  return (
    <div className="rounded border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {score}/{max}
        </p>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      {notes.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground">
          {notes.map((n, i) => (
            <li key={i} className="flex items-start gap-1">
              <Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-success" />
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EnrichmentBlock({
  icon: Icon,
  label,
  data,
}: {
  icon: typeof Users;
  label: string;
  data: Record<string, unknown>;
}) {
  const entries = Object.entries(data ?? {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0),
  );
  return (
    <div className="rounded border border-border p-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
      {entries.length === 0 ? (
        <p className="mt-1 text-[11px] text-muted-foreground">(no data)</p>
      ) : (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
          {entries.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="truncate text-foreground">
                {typeof v === "object" ? JSON.stringify(v) : String(v)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ICP editor
// ---------------------------------------------------------------------------

function IcpEditor({ businessId, onClose }: { businessId: string | null; onClose: () => void }) {
  const icpQuery = useQuery({
    queryKey: ["wf2", "icp", businessId],
    queryFn: () => wf2GetIcp({ business_id: businessId! }),
    enabled: !!businessId,
    retry: false,
  });

  const [titles, setTitles] = useState("");
  const [industries, setIndustries] = useState("");
  const [sizeMin, setSizeMin] = useState("");
  const [sizeMax, setSizeMax] = useState("");
  const [geographies, setGeographies] = useState("");
  const [deadbeats, setDeadbeats] = useState("");

  useMemo(() => {
    if (icpQuery.data) {
      setTitles(icpQuery.data.idealTitles.join(", "));
      setIndustries(icpQuery.data.idealIndustries.join(", "));
      setSizeMin(icpQuery.data.idealCompanySizeMin?.toString() ?? "");
      setSizeMax(icpQuery.data.idealCompanySizeMax?.toString() ?? "");
      setGeographies(icpQuery.data.servedGeographies.join(", "));
      setDeadbeats(icpQuery.data.deadbeatList.join(", "));
    }
  }, [icpQuery.data]);

  const save = useMutation({
    mutationFn: () =>
      wf2SaveIcp({
        businessId: businessId!,
        idealTitles: titles.split(",").map((s) => s.trim()).filter(Boolean),
        idealCompanySizeMin: sizeMin ? parseInt(sizeMin, 10) : null,
        idealCompanySizeMax: sizeMax ? parseInt(sizeMax, 10) : null,
        idealIndustries: industries.split(",").map((s) => s.trim()).filter(Boolean),
        servedGeographies: geographies.split(",").map((s) => s.trim()).filter(Boolean),
        deadbeatList: deadbeats.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      toast.success("ICP saved — scores will recalibrate");
      onClose();
    },
  });

  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
      <SheetHeader>
        <SheetTitle>Ideal Customer Profile</SheetTitle>
        <SheetDescription>
          The scoring engine matches every lead against this. Keep it sharp.
        </SheetDescription>
      </SheetHeader>
      <div className="mt-4 space-y-3">
        <div>
          <Label className="text-xs">Ideal titles (comma-separated)</Label>
          <Textarea
            className="mt-1 min-h-[60px]"
            value={titles}
            onChange={(e) => setTitles(e.target.value)}
            placeholder="VP Marketing, Head of Growth, CMO, Director of Demand Gen"
          />
        </div>
        <div>
          <Label className="text-xs">Ideal industries</Label>
          <Textarea
            className="mt-1 min-h-[60px]"
            value={industries}
            onChange={(e) => setIndustries(e.target.value)}
            placeholder="SaaS, fintech, e-commerce"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Min employees</Label>
            <Input
              className="mt-1"
              type="number"
              value={sizeMin}
              onChange={(e) => setSizeMin(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Max employees</Label>
            <Input
              className="mt-1"
              type="number"
              value={sizeMax}
              onChange={(e) => setSizeMax(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Served geographies</Label>
          <Input
            className="mt-1"
            value={geographies}
            onChange={(e) => setGeographies(e.target.value)}
            placeholder="US, Canada, UK, Germany"
          />
        </div>
        <div>
          <Label className="text-xs">Deadbeat list (domains to block)</Label>
          <Textarea
            className="mt-1 min-h-[60px]"
            value={deadbeats}
            onChange={(e) => setDeadbeats(e.target.value)}
            placeholder="example-fraud.com, spammy-agency.net"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
            Save ICP
          </Button>
        </div>
      </div>
    </SheetContent>
  );
}
