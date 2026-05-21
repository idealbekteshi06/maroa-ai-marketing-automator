import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { wf5Dashboard, wf5RunAnalysis } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import Sparkline from "@/components/Sparkline";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Target, TrendingUp, TrendingDown, Plus, Search, Globe,
  BarChart3, Eye, Lightbulb, ArrowUpRight, Instagram,
} from "lucide-react";

interface Competitor {
  name: string;
  initials: string;
  color: string;
  platforms: string[];
  followers: string;
  engagement: number;
  engagementTrend: "up" | "down";
  weeklyPosts: number;
  topContent: string;
  sparkline: number[];
}

interface ContentGap {
  topic: string;
  description: string;
  competitors: string[];
  opportunity: string;
}

const chartColors = ["hsl(var(--primary))", "#3399FF", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

const platformIcon: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Globe,
  tiktok: BarChart3,
  website: Globe,
};

export default function CompetitorIntelligence() {
  const { businessId, isReady } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [contentGaps, setContentGaps] = useState<ContentGap[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  const load = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await wf5Dashboard(businessId);
      setBusinessName(data.business_name || "");
      setWeekStart(data.week_start);
      setSummary(data.summary);
      setHasData(!!data.has_data);
      setCompetitors((data.competitors || []) as Competitor[]);
      setContentGaps((data.content_gaps || []) as ContentGap[]);
    } catch {
      setHasData(false);
      setCompetitors([]);
      setContentGaps([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);

  const chartData = useMemo(() => {
    if (!competitors.length) return [];
    return Array.from({ length: 12 }, (_, i) => {
      const row: Record<string, string | number> = { week: `W${i + 1}` };
      for (const c of competitors) {
        row[c.name] = c.sparkline[i] ?? 0;
      }
      return row;
    });
  }, [competitors]);

  const handleStartTracking = async () => {
    if (!businessId) {
      toast.error("Connect your business first");
      return;
    }
    setAnalyzing(true);
    try {
      await wf5RunAnalysis({ businessId, force: true });
      toast.success("Competitor analysis complete");
      setDialogOpen(false);
      setNewUrl("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading competitor intel…
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h3 className="mt-4 text-base font-semibold">No competitor brief yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Maroa scans competitor moves weekly (Sunday 05:30 UTC) and after you run analysis.
              Connect integrations in Settings, then generate your first brief.
            </p>
            <Button className="mt-6" onClick={handleStartTracking} disabled={analyzing || !businessId}>
              {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run competitor analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly competitive summary</CardTitle>
            {weekStart && (
              <CardDescription>Week of {weekStart} · {businessName}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Threat-weighted engagement index
          </CardTitle>
          <CardDescription>Derived from your latest WF5 competitor brief (not demo data)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {competitors.slice(0, 4).map((c) => (
              <div
                key={c.name}
                className="flex flex-col items-center text-center p-4 rounded-lg border border-border bg-muted/20"
              >
                <Avatar className="h-12 w-12 mb-2">
                  <AvatarFallback className={`text-sm font-bold ${c.color}`}>{c.initials}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">{c.name}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-2xl font-bold">{c.engagement}%</span>
                  {c.engagementTrend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <Sparkline data={c.sparkline} width={80} height={24} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Competitor Overview</CardTitle>
            <CardDescription>Tracked competitors from your intelligence brief</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Refresh analysis
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Run competitor analysis</DialogTitle>
                <DialogDescription>
                  Optional: paste a competitor URL for context. Analysis uses your connected channels and SerpAPI when configured.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="https://competitor.com (optional)"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleStartTracking} disabled={analyzing}>
                  {analyzing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Eye className="h-4 w-4 mr-1.5" />}
                  Analyze
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Platforms</TableHead>
                  <TableHead className="text-right">Followers</TableHead>
                  <TableHead className="text-right">Engagement %</TableHead>
                  <TableHead className="text-right">Signals</TableHead>
                  <TableHead>Top move</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`text-xs font-bold ${c.color}`}>{c.initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {c.platforms.map((p) => {
                          const Icon = platformIcon[p] || Globe;
                          return (
                            <div key={p} className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                              <Icon className="h-3 w-3 text-muted-foreground" />
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{c.followers}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-medium">{c.engagement}%</span>
                        {c.engagementTrend === "up" ? (
                          <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{c.weeklyPosts}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">{c.topContent}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {contentGaps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-semibold">Content gaps</h2>
            <Badge variant="secondary" className="text-[10px]">{contentGaps.length} opportunities</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contentGaps.map((gap) => (
              <Card key={gap.topic} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold">{gap.topic}</h3>
                    <Badge
                      className={`text-[10px] ${
                        gap.opportunity === "High"
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {gap.opportunity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{gap.description}</p>
                  {gap.competitors.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-muted-foreground">Seen at:</span>
                      {gap.competitors.map((name) => (
                        <Badge key={name} variant="outline" className="text-[10px]">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Engagement index — 12 week trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              {competitors.map((c, i) => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                  {c.name}
                </div>
              ))}
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  {competitors.map((c, i) => (
                    <Line
                      key={c.name}
                      type="monotone"
                      dataKey={c.name}
                      stroke={chartColors[i % chartColors.length]}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
