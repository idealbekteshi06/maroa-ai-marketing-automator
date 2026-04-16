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

/* ── Mock Data ── */

const healthScore = 78;

const tiles = [
  { label: "Profile Completeness", value: "85%", icon: Building2, color: "text-primary" },
  { label: "Review Velocity", value: "+4/week", icon: Star, color: "text-amber-500" },
  { label: "Local Pack Ranking", value: "#3", icon: MapPin, color: "text-emerald-500" },
  { label: "Photo Freshness", value: "3 days ago", icon: Camera, color: "text-violet-500" },
];

const actions = [
  { id: 1, title: "Update holiday hours for Eid al-Fitr", priority: "high", icon: Clock },
  { id: 2, title: "Respond to 2 pending Google reviews", priority: "high", icon: Star },
  { id: 3, title: "Add 3 new product photos to GMB listing", priority: "medium", icon: Camera },
  { id: 4, title: "Update business description with spring campaign keywords", priority: "low", icon: Building2 },
];

const keywords = [
  { keyword: "natural spring water Kosovo", position: 3, change: 2, volume: 1_200, url: "/products/spring-water" },
  { keyword: "uje karadaku", position: 1, change: 0, volume: 880, url: "/" },
  { keyword: "best water brand Pristina", position: 5, change: -1, volume: 720, url: "/about" },
  { keyword: "mineral water delivery Kosovo", position: 8, change: 3, volume: 590, url: "/delivery" },
  { keyword: "alkaline water Balkans", position: 12, change: 1, volume: 440, url: "/products/alkaline" },
  { keyword: "healthy drinking water near me", position: 4, change: 2, volume: 1_050, url: "/products" },
  { keyword: "water subscription Kosovo", position: 6, change: -2, volume: 380, url: "/subscribe" },
  { keyword: "premium bottled water", position: 15, change: 4, volume: 2_100, url: "/products/premium" },
];

const priorityColor: Record<string, "destructive" | "default" | "secondary"> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

/* ── Circular Progress Ring ── */

function HealthRing({ score, size = 140 }: { score: number; size?: number }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

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
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

/* ── Component ── */

export default function LocalPresence() {
  // TODO: wire to real API — fetch GMB data, keyword rankings, action items

  return (
    <div className="space-y-6">
      {/* Hero — GMB Health Score */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="flex flex-col md:flex-row items-center gap-6 pt-6">
          <HealthRing score={healthScore} size={140} />
          <div className="text-center md:text-left">
            <h2 className="text-lg font-semibold text-foreground">Google Business Profile Health</h2>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              Your GMB listing for Uje Karadaku is performing well but has room to improve.
              Complete the 4 action items below to reach <span className="font-medium text-primary">90+</span>.
            </p>
            <div className="flex gap-2 mt-3 justify-center md:justify-start">
              <Badge variant="outline"><Globe className="mr-1 h-3 w-3" /> Verified</Badge>
              <Badge variant="outline"><Star className="mr-1 h-3 w-3" /> 4.6 avg rating</Badge>
              <Badge variant="outline"><CheckCircle className="mr-1 h-3 w-3" /> 127 reviews</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4-Tile Grid */}
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

      {/* Action Needed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Action Needed
          </CardTitle>
          <CardDescription>Complete these items to improve your local presence score</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground">{a.title}</span>
                  <Badge variant={priorityColor[a.priority]} className="text-xs capitalize shrink-0">
                    {a.priority}
                  </Badge>
                </div>
                <Button size="sm" variant="outline" className="shrink-0">
                  <CheckCircle className="mr-1 h-3 w-3" /> Resolve
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Keyword Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Keyword Rankings
          </CardTitle>
          <CardDescription>Tracked local SEO keywords for Uje Karadaku</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead className="text-center">Position</TableHead>
                <TableHead className="text-center">Change</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Search Volume</TableHead>
                <TableHead className="hidden md:table-cell">URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords.map((k) => (
                <TableRow key={k.keyword}>
                  <TableCell className="font-medium">{k.keyword}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={k.position <= 3 ? "default" : k.position <= 10 ? "secondary" : "outline"}>
                      #{k.position}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {k.change > 0 ? (
                      <span className="inline-flex items-center text-emerald-500 text-sm font-medium">
                        <TrendingUp className="mr-1 h-3 w-3" />+{k.change}
                      </span>
                    ) : k.change < 0 ? (
                      <span className="inline-flex items-center text-destructive text-sm font-medium">
                        <TrendingDown className="mr-1 h-3 w-3" />{k.change}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">{k.volume.toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{k.url}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Service Area
          </CardTitle>
          <CardDescription>Uje Karadaku distribution coverage in Kosovo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-[200px] rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-muted overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_40%_50%,hsl(var(--primary)),transparent_70%)]" />
            <div className="text-center z-10">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Pristina, Kosovo</p>
              <p className="text-xs text-muted-foreground mt-1">Serving 12 municipalities across Kosovo</p>
            </div>
            {/* Decorative dots for map feel */}
            {[
              { top: "25%", left: "30%" }, { top: "40%", left: "55%" },
              { top: "60%", left: "40%" }, { top: "35%", left: "70%" },
              { top: "55%", left: "25%" }, { top: "70%", left: "60%" },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary/40"
                style={{ top: pos.top, left: pos.left }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
