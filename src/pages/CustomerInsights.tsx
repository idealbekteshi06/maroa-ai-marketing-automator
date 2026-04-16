import { useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, UserCheck, UserX, UserPlus, Heart, Star,
  MessageSquare, TrendingUp, TrendingDown, Brain, Target,
  ShoppingBag,
} from "lucide-react";
import Sparkline from "@/components/Sparkline";

/* ── Mock data ── */
// TODO: wire to real API

const personas = [
  {
    name: "Lira Krasniqi",
    role: "Health-Conscious Professional",
    avatar: "👩‍💼",
    description:
      "Mid-30s professional in Prishtina who tracks macros and hydration. Prefers premium, locally-sourced water and shares wellness tips on Instagram.",
    needs: ["Mineral content transparency", "Subscription delivery", "Eco-friendly packaging"],
  },
  {
    name: "Blerim Hoti",
    role: "Restaurant Owner",
    avatar: "👨‍🍳",
    description:
      "Runs two restaurants in Peja. Orders in bulk for table service and values consistent supply, competitive wholesale pricing, and branded bottles for events.",
    needs: ["Bulk pricing tiers", "Reliable weekly delivery", "Custom-label options"],
  },
  {
    name: "Arta Berisha",
    role: "Fitness Studio Manager",
    avatar: "🏋️‍♀️",
    description:
      "Operates a CrossFit gym in Prizren. Stocks 500ml bottles for members and runs co-branded hydration challenges on social media.",
    needs: ["Sport-cap bottles", "Co-marketing opportunities", "Volume discounts"],
  },
];

const segments = [
  {
    label: "VIP Customers",
    count: 23,
    ltv: 847,
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    sparkline: [620, 670, 710, 780, 810, 847],
  },
  {
    label: "At-Risk",
    count: 8,
    ltv: 234,
    icon: UserX,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    sparkline: [310, 290, 270, 260, 245, 234],
  },
  {
    label: "New Signups",
    count: 34,
    ltv: 0,
    icon: UserPlus,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    sparkline: [12, 18, 22, 26, 30, 34],
  },
  {
    label: "Inactive 30d",
    count: 12,
    ltv: 156,
    icon: Users,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    sparkline: [18, 16, 15, 14, 13, 12],
  },
];

const insights = [
  {
    quote: "The glass bottle feels premium — I always refill it at work and people ask about the brand.",
    source: "Google Review — Lira K.",
    sentiment: "positive" as const,
  },
  {
    quote: "Delivery was two days late last month. If it happens again I will switch to Rugova Water.",
    source: "WhatsApp Support Chat",
    sentiment: "negative" as const,
  },
  {
    quote: "Would love a sparkling option. I currently mix Uje Karadaku still water with SodaStream.",
    source: "Instagram DM",
    sentiment: "neutral" as const,
  },
  {
    quote: "Best water in Kosovo, hands down. My gym members request it by name.",
    source: "Facebook Review — Arta B.",
    sentiment: "positive" as const,
  },
  {
    quote: "The 1.5L bottle cap leaks if you tilt it in a bag. Happened three times now.",
    source: "Email Support Ticket #1042",
    sentiment: "negative" as const,
  },
];

const cohortMonths = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const cohortData = [
  [100, 82, 71, 64, 58, 52],
  [100, 79, 68, 60, 53, 0],
  [100, 85, 74, 67, 0, 0],
  [100, 80, 70, 0, 0, 0],
  [100, 88, 0, 0, 0, 0],
  [100, 0, 0, 0, 0, 0],
];

function retentionColor(value: number): string {
  if (value === 0) return "transparent";
  if (value >= 80) return "hsl(142 71% 45% / 0.85)";
  if (value >= 60) return "hsl(142 71% 45% / 0.55)";
  if (value >= 40) return "hsl(142 71% 45% / 0.30)";
  if (value >= 20) return "hsl(0 84% 60% / 0.35)";
  return "hsl(0 84% 60% / 0.60)";
}

const sentimentBadge = {
  positive: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  neutral: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  negative: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

export default function CustomerInsights() {
  const [expandedPersona, setExpandedPersona] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      {/* ── Hero: AI Personas ── */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">AI-Generated Customer Personas</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Built from 6 months of order history, reviews, and support conversations for Uje Karadaku.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {personas.map((p, i) => (
            <Card
              key={i}
              className={`cursor-pointer transition-shadow hover:shadow-md ${expandedPersona === i ? "ring-2 ring-primary" : ""}`}
              onClick={() => setExpandedPersona(expandedPersona === i ? null : i)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{p.avatar}</span>
                  <div>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <CardDescription>{p.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>{p.description}</p>
                <div>
                  <span className="font-medium text-foreground text-xs uppercase tracking-wider">Top Needs</span>
                  <ul className="mt-1 space-y-1">
                    {p.needs.map((n, j) => (
                      <li key={j} className="flex items-center gap-1.5">
                        <Target className="h-3 w-3 text-primary shrink-0" />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Customer Segments ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Customer Segments</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {segments.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i}>
                <CardContent className="pt-5 pb-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${s.bgColor}`}>
                      <Icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <Sparkline data={s.sparkline} width={64} height={28} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{s.count}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg LTV: <span className="font-medium text-foreground">€{s.ltv}</span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── What Your Customers Want ── */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Heart className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">What Your Customers Want</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          AI-extracted insights from reviews, messages, and support tickets.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((ins, i) => (
            <Card key={i}>
              <CardContent className="pt-5 space-y-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <blockquote className="text-sm italic text-foreground leading-relaxed">
                  "{ins.quote}"
                </blockquote>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{ins.source}</span>
                  <Badge variant="outline" className={sentimentBadge[ins.sentiment]}>
                    {ins.sentiment}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Cohort Retention Heatmap ── */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Cohort Retention</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Monthly retention rates for Uje Karadaku subscriber cohorts.
        </p>

        <Card>
          <CardContent className="pt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-muted-foreground font-medium pb-2 pr-3">Cohort</th>
                  {cohortMonths.map((m) => (
                    <th key={m} className="text-center text-muted-foreground font-medium pb-2 px-2 min-w-[56px]">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortData.map((row, ri) => (
                  <tr key={ri}>
                    <td className="pr-3 py-1 font-medium text-foreground whitespace-nowrap">
                      {cohortMonths[ri]} '25
                    </td>
                    {row.map((val, ci) => (
                      <td key={ci} className="px-2 py-1 text-center">
                        {val > 0 ? (
                          <span
                            className="inline-block w-full rounded px-2 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: retentionColor(val),
                              color: val >= 60 ? "#fff" : val > 0 ? "hsl(var(--foreground))" : "transparent",
                            }}
                          >
                            {val}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
