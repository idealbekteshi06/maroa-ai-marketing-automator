/**
 * WF6 — Local Presence (Google Business Profile / local-presence audit)
 * ============================================================================
 * Wired to the retained wf6 GBP audit capability:
 *   - GET  /webhook/wf6-latest-audit  → latest presence_audits row
 *   - POST /webhook/wf6-run-audit     → runs a fresh audit, then refetch
 *
 * NOTE (CANONICAL_WORKFLOWS.md): wf6 schema *generation* is deprecated in
 * favor of the AI-SEO engine — this page only surfaces the audit's
 * schema_markup findings and points users at the AI-SEO tab for generation.
 * ============================================================================
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  MapPin, Star, CheckCircle, AlertTriangle, Search, Building2,
  Loader2, RefreshCw, Sparkles, FileCode2, Link2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { wf6GetLatestAudit, wf6RunAudit } from "@/lib/api";

/* ── Backend shapes (services/wf6 → presence_audits row) ── */

interface GbpIssue {
  severity?: string;
  issue?: string;
  fix?: string;
}

interface NapInconsistency {
  source?: string;
  found?: string;
  expected?: string;
}

interface TrackedKeyword {
  keyword?: string;
  rank?: number;
  volume_monthly?: number;
}

interface RemediationItem {
  priority?: number;
  task?: string;
  effort_hours?: number;
  owner?: string;
  expected_lift?: string;
}

interface PresenceAudit {
  id?: string;
  business_id?: string;
  overall_score?: number | null;
  gbp?: { score?: number; issues?: GbpIssue[] } | null;
  schema_markup?: { score?: number; missing?: string[]; recommended?: string[] } | null;
  citations?: {
    score?: number;
    nap_consistent?: boolean;
    inconsistencies?: NapInconsistency[];
  } | null;
  local_rank?: {
    score?: number;
    top_keywords_tracked?: TrackedKeyword[];
    gaps?: string[];
  } | null;
  remediation_plan?: RemediationItem[] | null;
  quick_wins?: string[] | null;
  audit_run_at?: string | null;
}

const severityVariant = (severity?: string): "destructive" | "default" | "secondary" => {
  if (severity === "high") return "destructive";
  if (severity === "medium") return "default";
  return "secondary";
};

/* ── Circular Progress Ring ── */

function HealthRing({ score, size = 140 }: { score: number; size?: number }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{clamped}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

/* ── Component ── */

export default function LocalPresence() {
  const { businessId } = useAuth();
  const qc = useQueryClient();

  const auditQuery = useQuery({
    queryKey: ["wf6", "latest-audit", businessId],
    queryFn: () =>
      wf6GetLatestAudit({ business_id: businessId! }) as Promise<PresenceAudit | null>,
    enabled: !!businessId,
    retry: false,
  });

  const runAudit = useMutation({
    mutationFn: () => wf6RunAudit({ businessId: businessId! }),
    onSuccess: () => {
      toast.success("Presence audit complete");
      qc.invalidateQueries({ queryKey: ["wf6", "latest-audit", businessId] });
    },
    onError: (e: Error) => toast.error(e.message || "Audit failed"),
  });

  const audit = auditQuery.data ?? null;

  const dimensionTiles = [
    { label: "Google Business Profile", score: audit?.gbp?.score, icon: Building2, color: "text-primary" },
    { label: "Schema Markup", score: audit?.schema_markup?.score, icon: FileCode2, color: "text-violet-500" },
    { label: "Citations & NAP", score: audit?.citations?.score, icon: Link2, color: "text-amber-500" },
    { label: "Local Rank", score: audit?.local_rank?.score, icon: MapPin, color: "text-emerald-500" },
  ];

  const gbpIssues = audit?.gbp?.issues ?? [];
  const remediation = [...(audit?.remediation_plan ?? [])].sort(
    (a, b) => (a?.priority ?? 99) - (b?.priority ?? 99),
  );
  const quickWins = audit?.quick_wins ?? [];
  const keywords = audit?.local_rank?.top_keywords_tracked ?? [];
  const rankGaps = audit?.local_rank?.gaps ?? [];
  const napInconsistencies = audit?.citations?.inconsistencies ?? [];
  const schemaMissing = audit?.schema_markup?.missing ?? [];
  const schemaRecommended = audit?.schema_markup?.recommended ?? [];

  const runButton = (
    <Button
      size="sm"
      onClick={() => runAudit.mutate()}
      disabled={!businessId || runAudit.isPending}
    >
      {runAudit.isPending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-1.5 h-4 w-4" />
      )}
      {runAudit.isPending ? "Auditing…" : "Run audit"}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Workflow #6 · Local Presence
          </div>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-foreground">
            Local presence audit
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Google Business Profile, citations, NAP consistency and local rank —
            audited with a prioritized remediation plan.
          </p>
        </div>
        {runButton}
      </div>

      {/* ── Loading skeleton ── */}
      {auditQuery.isLoading && (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex items-center gap-6 pt-6">
              <Skeleton className="h-[140px] w-[140px] rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {/* ── Error state ── */}
      {!auditQuery.isLoading && auditQuery.isError && (
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-warning" />
            <p className="mt-2 text-sm text-muted-foreground">
              Couldn't load your presence audit.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => auditQuery.refetch()}
            >
              <RefreshCw className="mr-1.5 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Empty state ── */}
      {!auditQuery.isLoading && !auditQuery.isError && !audit && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                No presence audit yet — run your first one
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                We'll score your Google Business Profile, schema markup, citations
                and local rankings, then hand you a prioritized fix list.
              </p>
            </div>
            {runButton}
          </CardContent>
        </Card>
      )}

      {/* ── Audit results ── */}
      {!auditQuery.isLoading && audit && (
        <>
          {/* Hero — overall score */}
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="flex flex-col md:flex-row items-center gap-6 pt-6">
              <HealthRing score={audit.overall_score ?? 0} size={140} />
              <div className="text-center md:text-left">
                <h2 className="text-lg font-semibold text-foreground">
                  Local Presence Health
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mt-1">
                  Overall score across Google Business Profile, schema markup,
                  citations and local rankings.
                </p>
                {audit.audit_run_at && (
                  <div className="flex gap-2 mt-3 justify-center md:justify-start">
                    <Badge variant="outline">
                      Last audit: {new Date(audit.audit_run_at).toLocaleString()}
                    </Badge>
                    {audit.citations?.nap_consistent != null && (
                      <Badge variant="outline">
                        {audit.citations.nap_consistent ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" /> NAP consistent
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="mr-1 h-3 w-3" /> NAP inconsistent
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dimension score tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dimensionTiles.map((t) => {
              const Icon = t.icon;
              return (
                <Card key={t.label}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="rounded-md bg-muted p-2">
                        <Icon className={`h-4 w-4 ${t.color}`} />
                      </div>
                      <span className="text-sm text-muted-foreground">{t.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {typeof t.score === "number" ? `${t.score}/100` : "—"}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* GBP issues */}
          {gbpIssues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Google Business Profile issues
                </CardTitle>
                <CardDescription>
                  Problems found on your GBP listing, with fixes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {gbpIssues.map((issue, i) => (
                  <div
                    key={`${issue?.issue ?? "issue"}-${i}`}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Badge
                        variant={severityVariant(issue?.severity)}
                        className="text-xs capitalize shrink-0"
                      >
                        {issue?.severity ?? "info"}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {issue?.issue ?? "—"}
                        </p>
                        {issue?.fix && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Fix: {issue.fix}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Remediation plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Remediation plan
              </CardTitle>
              <CardDescription>
                Prioritized tasks to improve your local presence score
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {remediation.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No remediation tasks in the latest audit.
                </p>
              ) : (
                remediation.map((item, i) => (
                  <div
                    key={`${item?.task ?? "task"}-${i}`}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="shrink-0 tabular-nums">
                        P{item?.priority ?? "—"}
                      </Badge>
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {item?.task ?? "—"}
                        </span>
                        {item?.expected_lift && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Expected lift: {item.expected_lift}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {typeof item?.effort_hours === "number" && (
                        <Badge variant="secondary" className="text-xs">
                          ~{item.effort_hours}h
                        </Badge>
                      )}
                      {item?.owner && (
                        <Badge variant="outline" className="text-xs uppercase">
                          {item.owner}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick wins */}
          {quickWins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" /> Quick wins this week
                </CardTitle>
                <CardDescription>Low-effort improvements to ship now</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {quickWins.map((win, i) => (
                    <li key={`${win}-${i}`} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {win}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Keyword rankings (from audit local_rank) */}
          {(keywords.length > 0 || rankGaps.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" /> Local keyword rankings
                </CardTitle>
                <CardDescription>Tracked local keywords from the latest audit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {keywords.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Keyword</TableHead>
                          <TableHead className="text-center">Rank</TableHead>
                          <TableHead className="text-right">Monthly volume</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keywords.map((k, i) => (
                          <TableRow key={`${k?.keyword ?? "kw"}-${i}`}>
                            <TableCell className="font-medium">{k?.keyword ?? "—"}</TableCell>
                            <TableCell className="text-center">
                              {typeof k?.rank === "number" ? (
                                <Badge
                                  variant={
                                    k.rank <= 3 ? "default" : k.rank <= 10 ? "secondary" : "outline"
                                  }
                                >
                                  #{k.rank}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {typeof k?.volume_monthly === "number"
                                ? k.volume_monthly.toLocaleString()
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {rankGaps.length > 0 && (
                  <div className="rounded border border-warning/30 bg-warning/5 p-3">
                    <p className="text-xs font-medium text-foreground">Ranking gaps</p>
                    <ul className="mt-1 ml-4 list-disc space-y-0.5 text-xs text-muted-foreground">
                      {rankGaps.map((g, i) => (
                        <li key={`${g}-${i}`}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* NAP inconsistencies */}
          {napInconsistencies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" /> NAP inconsistencies
                </CardTitle>
                <CardDescription>
                  Name / Address / Phone mismatches found across citation sources
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Found</TableHead>
                      <TableHead>Expected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {napInconsistencies.map((n, i) => (
                      <TableRow key={`${n?.source ?? "src"}-${i}`}>
                        <TableCell className="font-medium">{n?.source ?? "—"}</TableCell>
                        <TableCell className="text-destructive">{n?.found ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{n?.expected ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Schema markup findings (generation lives in AI-SEO) */}
          {(schemaMissing.length > 0 || schemaRecommended.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode2 className="h-5 w-5" /> Schema markup findings
                </CardTitle>
                <CardDescription>
                  Structured-data gaps detected by the audit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {schemaMissing.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Missing
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {schemaMissing.map((s, i) => (
                        <Badge key={`${s}-${i}`} variant="destructive" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {schemaRecommended.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Recommended
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {schemaRecommended.map((s, i) => (
                        <Badge key={`${s}-${i}`} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  To generate JSON-LD for these types, use the AI-SEO tab — schema
                  generation lives there.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
