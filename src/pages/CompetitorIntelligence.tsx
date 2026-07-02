import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Target, Plus, Search, Globe, BarChart3, Eye, Lightbulb,
  Megaphone, Tag, RefreshCw, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getCompetitorReport, competitorAnalyze } from "@/lib/api";

// ─── Response shapes (routes/competitor-intel.js — competitor_reports +
//     competitor_snapshots tables) ─────────────────────────────────────────
interface KeywordRanking {
  keyword?: string | null;
  url?: string | null;
  position?: number | null;
}

interface ActiveAd {
  headline?: string | null;
  description?: string | null;
  url?: string | null;
}

interface CompetitorSnapshot {
  id?: string;
  business_id?: string;
  competitor_name?: string | null;
  snapshot_date?: string | null;
  keyword_rankings?: KeywordRanking[] | null;
  active_ads?: ActiveAd[] | null;
}

interface CompetitorReport {
  id?: string;
  business_id?: string;
  report_date?: string | null;
  new_offers?: string[] | null;
  content_themes?: string[] | null;
  ad_angles?: string[] | null;
  pricing_changes?: string[] | null;
  recommendation?: string | null;
  raw_analysis?: unknown;
  created_at?: string | null;
}

interface CompetitorReportResponse {
  latest_report?: CompetitorReport | null;
  recent_reports?: CompetitorReport[] | null;
  recent_snapshots?: CompetitorSnapshot[] | null;
}

interface AnalyzeResponse {
  received?: boolean;
  message?: string;
}

// Analysis runs in the background (~60s) — poll this long after triggering.
const POLL_WINDOW_MS = 90_000;
const POLL_INTERVAL_MS = 5_000;

function initialsOf(name?: string | null): string {
  if (!name) return "?";
  return name
    .replace(/^https?:\/\/(www\.)?/i, "")
    .split(/[\s._\-/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

const AVATAR_COLORS = [
  "bg-primary text-primary-foreground",
  "bg-blue-500 text-white",
  "bg-emerald-500 text-white",
  "bg-violet-500 text-white",
  "bg-amber-500 text-white",
];

export default function CompetitorIntelligence() {
  const { businessId } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [pollUntil, setPollUntil] = useState<number | null>(null);

  const reportQuery = useQuery({
    queryKey: ["competitor", "report", businessId],
    queryFn: () =>
      getCompetitorReport({ business_id: businessId! }) as Promise<CompetitorReportResponse>,
    enabled: !!businessId,
    retry: false,
    refetchInterval: () =>
      pollUntil && Date.now() < pollUntil ? POLL_INTERVAL_MS : false,
  });

  const analyze = useMutation({
    mutationFn: () =>
      competitorAnalyze({ business_id: businessId! }) as Promise<AnalyzeResponse>,
    onSuccess: (d) => {
      toast.success(d?.message || "Competitor analysis started — report ready in ~60 seconds");
      setPollUntil(Date.now() + POLL_WINDOW_MS);
      qc.invalidateQueries({ queryKey: ["competitor", "report", businessId] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to start analysis"),
  });

  const report = reportQuery.data?.latest_report ?? null;
  const snapshots = reportQuery.data?.recent_snapshots ?? [];
  const isPolling = !!pollUntil && Date.now() < pollUntil;

  const insightSections = [
    {
      key: "content_themes",
      title: "Content Themes",
      icon: BarChart3,
      opportunity: "High",
      items: report?.content_themes ?? [],
      empty: "No competitor content themes detected in the latest report.",
    },
    {
      key: "ad_angles",
      title: "Ad Angles",
      icon: Megaphone,
      opportunity: "High",
      items: report?.ad_angles ?? [],
      empty: "No competitor ad angles detected in the latest report.",
    },
    {
      key: "new_offers",
      title: "New Offers",
      icon: Tag,
      opportunity: "Medium",
      items: report?.new_offers ?? [],
      empty: "No new competitor offers or promotions spotted.",
    },
    {
      key: "pricing_changes",
      title: "Pricing Signals",
      icon: Eye,
      opportunity: "Medium",
      items: report?.pricing_changes ?? [],
      empty: "No competitor pricing changes detected.",
    },
  ];

  const totalInsights = insightSections.reduce((n, s) => n + (s.items?.length ?? 0), 0);

  const analyzeButton = (
    <Button
      size="sm"
      onClick={() => analyze.mutate()}
      disabled={!businessId || analyze.isPending || isPolling}
      className="gap-1.5"
    >
      {analyze.isPending || isPolling ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Search className="h-3.5 w-3.5" />
      )}
      {isPolling ? "Analyzing…" : "Analyze now"}
    </Button>
  );

  // ── Loading skeleton ──
  if (reportQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state — no report yet ──
  if (!report && snapshots.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-base font-semibold">No competitor report yet</h2>
            <p className="mt-1 mb-4 max-w-md text-sm text-muted-foreground">
              Run your first analysis — we scan your top competitors' search
              rankings and active ads, then synthesize themes, angles, offers,
              and a strategic recommendation.
            </p>
            {analyzeButton}
            {reportQuery.isError && (
              <p className="mt-3 text-xs text-destructive">
                Couldn't load the report: {(reportQuery.error as Error)?.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero — strategic recommendation from the latest report */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Strategic Recommendation
            </CardTitle>
            <CardDescription>
              {report?.report_date
                ? `Latest competitor intelligence report — ${new Date(report.report_date).toLocaleDateString()}`
                : "Latest competitor intelligence report"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => reportQuery.refetch()}
              disabled={reportQuery.isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${reportQuery.isFetching ? "animate-spin" : ""}`} />
            </Button>
            {analyzeButton}
          </div>
        </CardHeader>
        <CardContent>
          {report?.recommendation ? (
            <p className="text-sm leading-relaxed">{report.recommendation}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No recommendation in the latest report yet. Run an analysis to generate one.
            </p>
          )}
          {isPolling && (
            <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analysis running in the background — this page refreshes automatically.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Competitor snapshots table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Competitor Overview</CardTitle>
            <CardDescription>Latest snapshots — search rankings and active ads per competitor</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Competitor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Track Competitors</DialogTitle>
                <DialogDescription>
                  Analysis uses the competitors saved on your business profile
                  (or discovers your top competitors automatically). Running a
                  new analysis refreshes all snapshots.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="https://instagram.com/competitor or website URL"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button
                  disabled={!businessId || analyze.isPending}
                  onClick={() => {
                    analyze.mutate();
                    setDialogOpen(false);
                    setNewUrl("");
                  }}
                >
                  {analyze.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1.5" />
                  )}
                  Start Analysis
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {snapshots.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No competitor snapshots yet — run an analysis to gather them.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Snapshot</TableHead>
                    <TableHead className="text-right">Keywords Tracked</TableHead>
                    <TableHead className="text-right">Active Ads</TableHead>
                    <TableHead>Top Ranking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map((s, i) => {
                    const rankings = s?.keyword_rankings ?? [];
                    const ads = s?.active_ads ?? [];
                    const top = rankings[0];
                    return (
                      <TableRow key={s?.id ?? `${s?.competitor_name ?? "competitor"}-${i}`}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={`text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                                {initialsOf(s?.competitor_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{s?.competitor_name ?? "Unknown competitor"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s?.snapshot_date
                            ? new Date(s.snapshot_date).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">{rankings.length}</TableCell>
                        <TableCell className="text-right font-medium">{ads.length}</TableCell>
                        <TableCell>
                          {top?.keyword ? (
                            <Badge variant="outline" className="text-[11px] max-w-[280px] truncate">
                              {top.keyword}
                              {top?.position != null ? ` · #${top.position}` : ""}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Intelligence findings — themes / angles / offers / pricing */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-semibold">Intelligence Findings</h2>
          <Badge variant="secondary" className="text-[10px]">{totalInsights} findings</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insightSections.map((section) => {
            const Icon = section.icon;
            const items = section.items ?? [];
            return (
              <Card key={section.key} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {section.title}
                    </h3>
                    <Badge
                      className={`text-[10px] ${
                        section.opportunity === "High"
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {section.opportunity}
                    </Badge>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">{section.empty}</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
                          <Globe className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Competitor active ads detail */}
      {snapshots.some((s) => (s?.active_ads ?? []).length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" /> Competitor Ads Spotted
            </CardTitle>
            <CardDescription>Live ads detected in the latest snapshots</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshots.flatMap((s, si) =>
              (s?.active_ads ?? []).map((ad, ai) => (
                <div key={`${si}-${ai}`} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{ad?.headline ?? "Untitled ad"}</p>
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">
                      {s?.competitor_name ?? "Unknown"}
                    </Badge>
                  </div>
                  {ad?.description && (
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{ad.description}</p>
                  )}
                </div>
              )),
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
