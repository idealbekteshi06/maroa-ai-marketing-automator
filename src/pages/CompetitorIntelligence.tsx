import { useState } from "react";
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
  Target, Users, TrendingUp, TrendingDown, Plus, Search, Globe,
  BarChart3, Eye, Lightbulb, ArrowUpRight, Instagram,
} from "lucide-react";

// TODO: wire to real API
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

const competitors: Competitor[] = [
  {
    name: "Uje Karadaku", initials: "UK", color: "bg-primary text-primary-foreground",
    platforms: ["instagram", "facebook", "tiktok", "website"],
    followers: "24.3K", engagement: 4.8, engagementTrend: "up", weeklyPosts: 7,
    topContent: "Reels / Stories",
    sparkline: [3.2, 3.5, 3.8, 4.0, 3.9, 4.2, 4.5, 4.3, 4.6, 4.7, 4.5, 4.8],
  },
  {
    name: "Rugova Water", initials: "RW", color: "bg-blue-500 text-white",
    platforms: ["instagram", "facebook", "website"],
    followers: "41.7K", engagement: 3.2, engagementTrend: "down", weeklyPosts: 5,
    topContent: "Static posts",
    sparkline: [4.1, 3.9, 3.7, 3.8, 3.5, 3.6, 3.4, 3.3, 3.5, 3.2, 3.1, 3.2],
  },
  {
    name: "Bonita Water", initials: "BW", color: "bg-emerald-500 text-white",
    platforms: ["instagram", "facebook"],
    followers: "18.5K", engagement: 2.9, engagementTrend: "up", weeklyPosts: 4,
    topContent: "Carousel",
    sparkline: [2.1, 2.3, 2.2, 2.5, 2.4, 2.6, 2.7, 2.5, 2.8, 2.7, 2.9, 2.9],
  },
  {
    name: "Dea Water", initials: "DW", color: "bg-violet-500 text-white",
    platforms: ["instagram", "website"],
    followers: "12.1K", engagement: 2.1, engagementTrend: "down", weeklyPosts: 3,
    topContent: "Stories",
    sparkline: [2.8, 2.7, 2.5, 2.6, 2.4, 2.3, 2.5, 2.2, 2.3, 2.1, 2.0, 2.1],
  },
];

const chartData = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  "Uje Karadaku": competitors[0].sparkline[i],
  "Rugova Water": competitors[1].sparkline[i],
  "Bonita Water": competitors[2].sparkline[i],
  "Dea Water": competitors[3].sparkline[i],
}));

const chartColors = ["hsl(var(--primary))", "#3b82f6", "#10b981", "#8b5cf6"];

const contentGaps = [
  {
    topic: "Sustainability Stories",
    description: "Rugova and Bonita post weekly about eco-friendly packaging and carbon neutrality initiatives. Your audience is 3x more likely to engage with sustainability content.",
    competitors: ["Rugova Water", "Bonita Water"],
    opportunity: "High",
  },
  {
    topic: "Behind-the-scenes Factory",
    description: "Rugova shares bottling process videos that average 2.4x higher engagement than their other content. Transparency builds trust with health-conscious buyers.",
    competitors: ["Rugova Water"],
    opportunity: "Medium",
  },
  {
    topic: "Customer Testimonials",
    description: "Bonita and Dea feature UGC testimonials weekly. Peer reviews drive 38% higher purchase intent in the Kosovo beverage market.",
    competitors: ["Bonita Water", "Dea Water"],
    opportunity: "High",
  },
];

const platformIcon: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Globe,
  tiktok: BarChart3,
  website: Globe,
};

export default function CompetitorIntelligence() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  const uje = competitors[0];

  return (
    <div className="space-y-6">
      {/* Hero — brand vs competitors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Engagement Rate Comparison
          </CardTitle>
          <CardDescription>Your brand vs top 3 competitors in Kosovo's water market</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {competitors.map((c) => {
              const isYou = c.name === "Uje Karadaku";
              return (
                <div key={c.name} className={`flex flex-col items-center text-center p-4 rounded-lg border ${isYou ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}>
                  <Avatar className="h-12 w-12 mb-2">
                    <AvatarFallback className={`text-sm font-bold ${c.color}`}>{c.initials}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{c.name}</p>
                  {isYou && <Badge className="mt-1 text-[10px]">You</Badge>}
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
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Competitor table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Competitor Overview</CardTitle>
            <CardDescription>Weekly performance tracking across platforms</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Competitor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Competitor</DialogTitle>
                <DialogDescription>Enter a competitor's website or social media URL to start tracking.</DialogDescription>
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
                <Button onClick={() => { /* TODO: wire to real API */ setDialogOpen(false); setNewUrl(""); }}>
                  <Eye className="h-4 w-4 mr-1.5" /> Start Tracking
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
                  <TableHead className="text-right">Weekly Posts</TableHead>
                  <TableHead>Top Content</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((c) => {
                  const isYou = c.name === "Uje Karadaku";
                  return (
                    <TableRow key={c.name} className={isYou ? "bg-primary/5" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={`text-xs font-bold ${c.color}`}>{c.initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{c.name}</span>
                          {isYou && <Badge variant="secondary" className="text-[10px]">You</Badge>}
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
                      <TableCell><Badge variant="outline" className="text-[11px]">{c.topContent}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Content Gaps */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-semibold">Content Gaps</h2>
          <Badge variant="secondary" className="text-[10px]">{contentGaps.length} opportunities</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contentGaps.map((gap) => (
            <Card key={gap.topic} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold">{gap.topic}</h3>
                  <Badge className={`text-[10px] ${gap.opportunity === "High" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}>
                    {gap.opportunity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{gap.description}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-muted-foreground">Covered by:</span>
                  {gap.competitors.map((name) => (
                    <Badge key={name} variant="outline" className="text-[10px]">{name}</Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <ArrowUpRight className="h-3 w-3" /> Create Content
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Engagement chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Engagement Rate — 12 Week Trend
          </CardTitle>
          <CardDescription>Weekly average engagement across all platforms</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4">
            {competitors.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[i] }} />
                {c.name}
              </div>
            ))}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} domain={[1.5, 5.5]} unit="%" className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                {competitors.map((c, i) => (
                  <Line
                    key={c.name}
                    type="monotone"
                    dataKey={c.name}
                    stroke={chartColors[i]}
                    strokeWidth={c.name === "Uje Karadaku" ? 2.5 : 1.5}
                    dot={false}
                    strokeDasharray={c.name === "Uje Karadaku" ? undefined : "4 4"}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
