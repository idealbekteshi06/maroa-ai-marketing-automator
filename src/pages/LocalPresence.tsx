import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { wf6LatestAudit, wf6RunAudit } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  MapPin, Star, Camera, Clock, CheckCircle, AlertTriangle,
  TrendingUp, TrendingDown, Search, Globe, Building2,
} from "lucide-react";

type PresenceAudit = {
  overall_score?: number;
  gbp?: Record<string, unknown>;
  local_rank?: { keywords?: Array<{ keyword: string; position: number; change?: number; volume?: number; url?: string }> };
  remediation_plan?: Array<{ title: string; priority?: string }>;
  quick_wins?: string[];
};

const priorityColor: Record<string, "destructive" | "default" | "secondary"> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

function HealthRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

export default function LocalPresence() {
  const { businessId, isReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [audit, setAudit] = useState<PresenceAudit | null>(null);

  const load = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const row = (await wf6LatestAudit(businessId)) as PresenceAudit | null;
      setAudit(row);
    } catch {
      setAudit(null);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);

  const runAudit = async () => {
    if (!businessId) {
      toast.error("Connect your business first");
      return;
    }
    setRunning(true);
    try {
      const result = await wf6RunAudit({ businessId });
      setAudit(result as PresenceAudit);
      toast.success("Presence audit complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setRunning(false);
    }
  };

  const score = Math.round(Number(audit?.overall_score) || 0);
  const gbp = (audit?.gbp || {}) as Record<string, unknown>;
  const keywords = audit?.local_rank?.keywords || [];
  const actions = (audit?.remediation_plan || []).map((item, i) => ({
    id: i + 1,
    title: item.title,
    priority: (item.priority || "medium").toLowerCase(),
    icon: item.priority === "high" ? AlertTriangle : Clock,
  }));

  const tiles = [
    { label: "Profile Completeness", value: gbp.completeness ? `${gbp.completeness}%` : "—", icon: Building2, color: "text-primary" },
    { label: "Review Velocity", value: gbp.review_velocity ? String(gbp.review_velocity) : "—", icon: Star, color: "text-amber-500" },
    { label: "Local Pack Ranking", value: gbp.local_pack_rank ? `#${gbp.local_pack_rank}` : "—", icon: MapPin, color: "text-emerald-500" },
    { label: "Photo Freshness", value: gbp.photo_freshness ? String(gbp.photo_freshness) : "—", icon: Camera, color: "text-violet-500" },
  ];

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading local presence…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={runAudit} disabled={running || !businessId}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Run presence audit
        </Button>
      </div>

      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="flex flex-col md:flex-row items-center gap-6 pt-6">
          <HealthRing score={score || 0} size={140} />
          <div className="text-center md:text-left">
            <h2 className="text-lg font-semibold text-foreground">Google Business Profile Health</h2>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              {audit
                ? "Scores and actions from your latest Maroa presence audit."
                : "Run an audit to score your GBP listing and get remediation steps."}
            </p>
            <div className="flex gap-2 mt-3 justify-center md:justify-start flex-wrap">
              {gbp.verified != null && (
                <Badge variant="outline"><Globe className="mr-1 h-3 w-3" /> {gbp.verified ? "Verified" : "Unverified"}</Badge>
              )}
              {gbp.rating != null && (
                <Badge variant="outline"><Star className="mr-1 h-3 w-3" /> {String(gbp.rating)} avg</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => {
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
                <p className="text-2xl font-bold text-foreground">{t.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Action Needed
          </CardTitle>
          <CardDescription>From your remediation plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No actions yet — run an audit.</p>
          ) : (
            actions.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground">{a.title}</span>
                    <Badge variant={priorityColor[a.priority] || "secondary"} className="text-xs capitalize shrink-0">
                      {a.priority}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Keyword Rankings
          </CardTitle>
          <CardDescription>From local rank analysis</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {keywords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keyword data in the latest audit.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead className="text-center">Position</TableHead>
                  <TableHead className="text-center">Change</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords.map((k) => (
                  <TableRow key={k.keyword}>
                    <TableCell className="font-medium">{k.keyword}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={k.position <= 3 ? "default" : "secondary"}>#{k.position}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {(k.change ?? 0) > 0 ? (
                        <span className="inline-flex items-center text-emerald-500 text-sm">
                          <TrendingUp className="mr-1 h-3 w-3" />+{k.change}
                        </span>
                      ) : (k.change ?? 0) < 0 ? (
                        <span className="inline-flex items-center text-destructive text-sm">
                          <TrendingDown className="mr-1 h-3 w-3" />{k.change}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {k.volume != null ? k.volume.toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
