import { useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import Sparkline from "@/components/Sparkline";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Mail, Send, Clock, Users, BarChart3, Plus, CheckCircle,
  PauseCircle, PlayCircle, ArrowRight, Zap, MousePointerClick,
} from "lucide-react";

/* ── Mock Data ── */

const heroMetrics = [
  { label: "Active Sequences", value: "4", delta: "+1", up: true, icon: Zap, spark: [2, 2, 3, 3, 3, 4, 4, 4] },
  { label: "Subscribers", value: "2,847", delta: "+124", up: true, icon: Users, spark: [2200, 2350, 2480, 2550, 2620, 2710, 2780, 2847] },
  { label: "Open Rate", value: "42.3%", delta: "+3.1%", up: true, icon: Mail, spark: [36, 37, 38, 39, 40, 41, 41.5, 42.3] },
  { label: "Click Rate", value: "8.7%", delta: "+0.9%", up: true, icon: MousePointerClick, spark: [6.2, 6.8, 7.1, 7.4, 7.8, 8.0, 8.4, 8.7] },
];

interface SequenceEmail {
  subject: string;
  delay: string;
}

interface Sequence {
  id: string;
  name: string;
  emails: number;
  openRate: number;
  active: boolean;
  status: string;
  steps: SequenceEmail[];
}

const sequences: Sequence[] = [
  {
    id: "welcome",
    name: "Welcome Series",
    emails: 5,
    openRate: 68,
    active: true,
    status: "live",
    steps: [
      { subject: "Welcome to Uje Karadaku!", delay: "Immediate" },
      { subject: "Our story: from the mountains of Kosovo", delay: "Day 2" },
      { subject: "How we source our spring water", delay: "Day 4" },
      { subject: "Your first order: 15% off", delay: "Day 7" },
      { subject: "Join the Uje community", delay: "Day 10" },
    ],
  },
  {
    id: "cart",
    name: "Cart Recovery",
    emails: 3,
    openRate: 45,
    active: true,
    status: "live",
    steps: [
      { subject: "You left something behind", delay: "1 hour" },
      { subject: "Your cart is waiting — free shipping today", delay: "24 hours" },
      { subject: "Last chance: 10% off your order", delay: "72 hours" },
    ],
  },
  {
    id: "reengage",
    name: "Re-engagement",
    emails: 4,
    openRate: 31,
    active: false,
    status: "paused",
    steps: [
      { subject: "We miss you! Here's what's new", delay: "Day 0" },
      { subject: "New flavors you haven't tried", delay: "Day 3" },
      { subject: "Special comeback offer: 20% off", delay: "Day 7" },
      { subject: "Last email — should we stay in touch?", delay: "Day 14" },
    ],
  },
  {
    id: "vip",
    name: "VIP Nurture",
    emails: 6,
    openRate: 52,
    active: true,
    status: "live",
    steps: [
      { subject: "Welcome to the VIP club", delay: "Immediate" },
      { subject: "Exclusive: behind-the-scenes at Karadaku springs", delay: "Day 3" },
      { subject: "Early access: summer limited edition", delay: "Day 7" },
      { subject: "Your personal hydration guide", delay: "Day 14" },
      { subject: "VIP-only: free tasting event invite", delay: "Day 21" },
      { subject: "Your loyalty reward is ready", delay: "Day 30" },
    ],
  },
];

const chartData = Array.from({ length: 30 }, (_, i) => ({
  day: `Apr ${i + 1}`,
  opens: Math.round(320 + Math.random() * 80 + i * 4),
  clicks: Math.round(60 + Math.random() * 20 + i * 1.5),
}));

/* ── Sequence Timeline ── */

function SequenceTimeline({ steps }: { steps: SequenceEmail[] }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center gap-0 min-w-max px-2 py-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            {/* Node */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {i + 1}
              </div>
              <div className="mt-2 text-center max-w-[140px]">
                <p className="text-xs font-medium text-foreground leading-tight">{step.subject}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{step.delay}</p>
              </div>
            </div>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex items-center mx-1" style={{ marginBottom: "2.5rem" }}>
                <div className="w-12 h-0.5 bg-border" />
                <ArrowRight className="h-3 w-3 text-muted-foreground -ml-1" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Component ── */

export default function EmailLifecycle() {
  const [selected, setSelected] = useState<string>("welcome");
  const [toggleState, setToggleState] = useState<Record<string, boolean>>(
    Object.fromEntries(sequences.map((s) => [s.id, s.active]))
  );

  // TODO: wire to real API — fetch sequences, subscriber counts, performance metrics

  const selectedSequence = sequences.find((s) => s.id === selected)!;

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {heroMetrics.map((m) => {
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
                    <Badge variant="default" className="mt-1 text-xs">
                      {m.up ? <PlayCircle className="mr-1 h-3 w-3" /> : <PauseCircle className="mr-1 h-3 w-3" />}
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

      {/* Sequence List + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left — Sequence Cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">Email Sequences</h3>
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-3 w-3" /> New
            </Button>
          </div>
          {sequences.map((seq) => (
            <Card
              key={seq.id}
              className={`cursor-pointer transition-colors ${
                selected === seq.id ? "border-primary ring-1 ring-primary/30" : ""
              }`}
              onClick={() => setSelected(seq.id)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground text-sm">{seq.name}</span>
                  </div>
                  <Switch
                    checked={toggleState[seq.id]}
                    onCheckedChange={(checked) => {
                      setToggleState((prev) => ({ ...prev, [seq.id]: checked }));
                      // TODO: wire to real API — toggle sequence active/paused
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {seq.emails} emails
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" /> {seq.openRate}% open rate
                  </span>
                  <Badge
                    variant={toggleState[seq.id] ? "default" : "secondary"}
                    className="text-[10px] ml-auto"
                  >
                    {toggleState[seq.id] ? (
                      <><CheckCircle className="mr-1 h-2.5 w-2.5" /> Live</>
                    ) : (
                      <><PauseCircle className="mr-1 h-2.5 w-2.5" /> Paused</>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right — Sequence Preview */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> {selectedSequence.name} — Sequence Preview
            </CardTitle>
            <CardDescription>
              {selectedSequence.emails} emails &middot; {selectedSequence.openRate}% average open rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SequenceTimeline steps={selectedSequence.steps} />
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Opens vs Clicks — Last 30 Days
          </CardTitle>
          <CardDescription>Aggregate email performance across all active sequences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="opensFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
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
                <Area
                  type="monotone"
                  dataKey="opens"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#opensFill)"
                  name="Opens"
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="hsl(var(--success, 142 71% 45%))"
                  strokeWidth={2}
                  fill="url(#clicksFill)"
                  name="Clicks"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
