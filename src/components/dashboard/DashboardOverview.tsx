import { Button } from "@/components/ui/button";
import { Sparkles, Eye, DollarSign, TrendingUp, ArrowRight } from "lucide-react";

const stats = [
  { label: "Total Reach", value: "24,582", change: "+12%", icon: Eye },
  { label: "Posts Published", value: "47", change: "+8", icon: Sparkles },
  { label: "Ad Spend", value: "$312", change: "On budget", icon: DollarSign },
  { label: "ROAS", value: "3.2x", change: "+0.4x", icon: TrendingUp },
];

const activities = [
  "AI generated 3 Instagram posts for this week",
  "Facebook ad 'Summer Sale' scaled to $15/day",
  "Weekly report sent to your email",
  "New competitor insight: Bloom Bakery launched a TikTok campaign",
  "Instagram post 'Fresh from the oven' published — 342 reach",
];

export default function DashboardOverview() {
  return (
    <div className="space-y-8 pb-20 md:pb-0">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-card-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-primary">{s.change}</p>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-2xl bg-card p-6">
        <h3 className="font-semibold text-card-foreground">Reach — Last 30 Days</h3>
        <div className="mt-4 flex h-48 items-end gap-1">
          {Array.from({ length: 30 }, (_, i) => {
            const height = 20 + Math.sin(i * 0.4) * 30 + Math.random() * 40;
            return (
              <div key={i} className="flex-1 rounded-t bg-primary/20 transition-all hover:bg-primary/40" style={{ height: `${height}%` }} />
            );
          })}
        </div>
      </div>

      {/* Quick actions + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-6">
          <h3 className="font-semibold text-card-foreground">Quick Actions</h3>
          <div className="mt-4 space-y-3">
            <Button variant="outline" className="w-full justify-between">Generate content now <ArrowRight className="h-4 w-4" /></Button>
            <Button variant="outline" className="w-full justify-between">View this week's posts <ArrowRight className="h-4 w-4" /></Button>
            <Button variant="outline" className="w-full justify-between">Check ad performance <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6">
          <h3 className="font-semibold text-card-foreground">Recent Activity</h3>
          <div className="mt-4 space-y-3">
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <p className="text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
