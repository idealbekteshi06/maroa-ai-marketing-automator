import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DollarSign, TrendingUp, TrendingDown, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, Lightbulb, Target, Zap,
  BarChart3, Wallet, Calculator,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import Sparkline from "@/components/Sparkline";

/* ── Mock data ── */
// TODO: wire to real API

const totalSpend = 4280;
const totalBudget = 5000;
const roi = 287;

const channels = [
  {
    name: "Meta Ads",
    spend: 2100,
    revenue: 7140,
    roi: 240,
    cpa: 8.75,
    pct: 49,
    color: "#3b82f6",
    sparkline: [1600, 1750, 1900, 1980, 2050, 2100],
  },
  {
    name: "Google Ads",
    spend: 1200,
    revenue: 2880,
    roi: 140,
    cpa: 14.20,
    pct: 28,
    color: "#f59e0b",
    sparkline: [980, 1020, 1080, 1120, 1160, 1200],
  },
  {
    name: "Email Marketing",
    spend: 480,
    revenue: 2160,
    roi: 350,
    cpa: 3.20,
    pct: 11,
    color: "#10b981",
    sparkline: [320, 360, 400, 430, 460, 480],
  },
  {
    name: "Influencer",
    spend: 500,
    revenue: 1100,
    roi: 120,
    cpa: 22.50,
    pct: 12,
    color: "#8b5cf6",
    sparkline: [200, 280, 350, 400, 460, 500],
  },
];

const donutData = channels.map((c) => ({ name: c.name, value: c.spend }));

const trendData = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const spend = 100 + Math.round(Math.sin(i / 4) * 30 + Math.random() * 20);
  const revenue = Math.round(spend * (2.2 + Math.random() * 1.5));
  return { day: `Apr ${day}`, spend, revenue };
});

export default function BudgetROI() {
  return (
    <div className="space-y-8">
      {/* ── Hero ── */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Spend</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              €{totalSpend.toLocaleString()}
            </p>
            <Progress value={(totalSpend / totalBudget) * 100} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              of €{totalBudget.toLocaleString()} monthly budget ({Math.round((totalSpend / totalBudget) * 100)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Overall ROI</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{roi}%</p>
              <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30" variant="outline">
                <ArrowUpRight className="h-3 w-3 mr-0.5" /> +18% vs last month
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              €{channels.reduce((s, c) => s + c.revenue, 0).toLocaleString()} total revenue generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Avg CPA</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              €{(channels.reduce((s, c) => s + c.cpa * c.spend, 0) / totalSpend).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Across {channels.length} active channels
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── Channel Allocation Donut + 30-day Trend ── */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Channel Allocation
            </CardTitle>
            <CardDescription>How your €{totalSpend.toLocaleString()} is distributed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-[180px] h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {channels.map((c, i) => (
                        <Cell key={i} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `€${value.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {channels.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-foreground flex-1">{c.name}</span>
                    <span className="text-muted-foreground font-medium">
                      €{c.spend.toLocaleString()} ({c.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              30-Day Trend
            </CardTitle>
            <CardDescription>Spend vs Revenue over the past month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    interval={6}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    tickFormatter={(v) => `€${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => `€${value}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.15}
                    strokeWidth={2}
                    name="Spend"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.15}
                    strokeWidth={2}
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Channel Breakdown Table ── */}
      <section>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Channel Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">ROI %</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">€{c.spend.toLocaleString()}</TableCell>
                    <TableCell className="text-right">€{c.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          c.roi >= 200
                            ? "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30"
                            : c.roi >= 140
                            ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
                            : "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
                        }
                      >
                        {c.roi}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">€{c.cpa.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Sparkline data={c.sparkline} width={64} height={24} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* ── AI Rebalance Recommendation ── */}
      <section>
        <Alert className="border-primary/30 bg-primary/5">
          <Lightbulb className="h-5 w-5 text-primary" />
          <AlertTitle className="text-foreground font-semibold">
            AI Rebalance Recommendation
          </AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground mt-1 space-y-3">
            <p>
              Based on the last 30 days of ROAS data, shifting <strong className="text-foreground">€300 from Google Ads to Meta Ads</strong> could
              increase overall ROI by an estimated 22%. Meta's CPA (€8.75) is 38% lower than Google's (€14.20),
              and Meta campaigns for Uje Karadaku have shown stronger engagement among the 25–34 age group in Kosovo.
            </p>
            <div className="flex gap-2">
              {/* TODO: wire to real API */}
              <Button size="sm" className="gap-1">
                <Zap className="h-4 w-4" /> Accept Rebalance
              </Button>
              <Button size="sm" variant="outline">
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </section>
    </div>
  );
}
