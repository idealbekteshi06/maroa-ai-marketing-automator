import { useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Sparkline from "@/components/Sparkline";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Target, Zap, PauseCircle,
  PlayCircle, ArrowUpRight, Lightbulb, BarChart3,
} from "lucide-react";

/* ── Mock Data ── */

const metrics = [
  {
    label: "Total Spend",
    value: "€2,847",
    delta: "+12.4%",
    up: true,
    icon: DollarSign,
    spark: [1800, 1950, 2100, 2000, 2300, 2500, 2650, 2847],
  },
  {
    label: "ROAS",
    value: "3.2x",
    delta: "+0.4x",
    up: true,
    icon: TrendingUp,
    spark: [2.1, 2.4, 2.5, 2.8, 2.6, 3.0, 3.1, 3.2],
  },
  {
    label: "Avg CPC",
    value: "€0.42",
    delta: "-8.7%",
    up: true,
    icon: Target,
    spark: [0.56, 0.52, 0.49, 0.48, 0.45, 0.44, 0.43, 0.42],
  },
  {
    label: "Conversions",
    value: "187",
    delta: "+23",
    up: true,
    icon: Zap,
    spark: [110, 125, 130, 145, 155, 160, 172, 187],
  },
];

const campaigns = [
  { name: "Uje Karadaku — Spring Launch", status: "active", spend: 980, budget: 1200, impressions: 124_500, clicks: 2_870, ctr: 2.3, cpa: 4.12 },
  { name: "Brand Awareness — Kosovo", status: "active", spend: 650, budget: 800, impressions: 98_200, clicks: 1_540, ctr: 1.57, cpa: 5.41 },
  { name: "Retargeting — Cart Abandoners", status: "active", spend: 520, budget: 600, impressions: 45_300, clicks: 1_890, ctr: 4.17, cpa: 2.89 },
  { name: "Summer Hydration Promo", status: "paused", spend: 420, budget: 700, impressions: 67_800, clicks: 980, ctr: 1.44, cpa: 6.23 },
  { name: "Lookalike — High-Value Buyers", status: "active", spend: 277, budget: 500, impressions: 31_200, clicks: 720, ctr: 2.31, cpa: 3.78 },
];

const optimizations = [
  {
    id: 1,
    title: "Shift €200 from Brand Awareness to Retargeting",
    description: "Retargeting campaign has 2x better ROAS. Reallocating budget could increase conversions by ~18%.",
    impact: "+18%",
    type: "budget",
  },
  {
    id: 2,
    title: "Pause Summer Hydration — below break-even",
    description: "CPA of €6.23 exceeds target of €5.00. Recommend pausing and refreshing creative.",
    impact: "-€120/wk",
    type: "pause",
  },
  {
    id: 3,
    title: "Test video creative on Spring Launch",
    description: "Similar brands see 35% higher CTR with short-form video ads. AI-generated storyboard ready.",
    impact: "+35% CTR",
    type: "creative",
  },
  {
    id: 4,
    title: "Expand Lookalike audience to 3%",
    description: "Current 1% lookalike is saturating. Expanding to 3% should maintain ROAS above 2.8x.",
    impact: "+40% reach",
    type: "audience",
  },
];

const chartData = Array.from({ length: 30 }, (_, i) => ({
  day: `Apr ${i + 1}`,
  spend: Math.round(70 + Math.random() * 40 + i * 1.2),
  conversions: Math.round(3 + Math.random() * 5 + i * 0.3),
}));

/* ── Component ── */

export default function AdOptimization() {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  // TODO: wire to real API — fetch campaigns, metrics, AI suggestions

  return (
    <div className="space-y-6">
      {/* Hero — AI Ad Brain */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">AI Ad Brain</h2>
              <p className="text-sm text-muted-foreground max-w-lg">
                4 optimization opportunities detected across your Meta campaigns.
                Estimated impact: <span className="font-medium text-primary">+22% ROAS</span> if all are applied.
              </p>
            </div>
          </div>
          <Button className="shrink-0">
            <Zap className="mr-2 h-4 w-4" /> Apply All Recommendations
          </Button>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{m.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{m.value}</p>
                    <Badge variant={m.up ? "default" : "destructive"} className="mt-1 text-xs">
                      {m.up ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                      {m.delta}
                    </Badge>
                  </div>
                  <Sparkline data={m.spark} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Active Campaigns
          </CardTitle>
          <CardDescription>Meta Ads campaigns for Uje Karadaku</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="hidden md:table-cell">Budget</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">CPA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium max-w-[200px] truncate">{c.name}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-xs">
                      {c.status === "active" ? (
                        <PlayCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <PauseCircle className="mr-1 h-3 w-3" />
                      )}
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">€{c.spend}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Progress value={(c.spend / c.budget) * 100} className="h-2 w-20" />
                      <span className="text-xs text-muted-foreground">{Math.round((c.spend / c.budget) * 100)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right">{c.impressions.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{c.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{c.ctr}%</TableCell>
                  <TableCell className="text-right">€{c.cpa.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Optimization Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" /> Optimization Opportunities
          </CardTitle>
          <CardDescription>AI-detected improvements based on the last 14 days of data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {optimizations
            .filter((o) => !dismissed.has(o.id))
            .map((o) => (
              <div
                key={o.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{o.title}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      <ArrowUpRight className="mr-1 h-3 w-3" /> {o.impact}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{o.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm">Accept</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDismissed((prev) => new Set([...prev, o.id]))}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* 30-Day Spend vs Conversions Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Spend vs Conversions — Last 30 Days</CardTitle>
          <CardDescription>Daily ad spend (€) and conversion count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  yAxisId="spend"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="conv"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line
                  yAxisId="spend"
                  type="monotone"
                  dataKey="spend"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Spend (€)"
                />
                <Line
                  yAxisId="conv"
                  type="monotone"
                  dataKey="conversions"
                  stroke="hsl(var(--success, 142 71% 45%))"
                  strokeWidth={2}
                  dot={false}
                  name="Conversions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
