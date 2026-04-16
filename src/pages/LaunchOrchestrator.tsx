import { useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Rocket, Calendar, CheckCircle, Circle, Clock, Plus, Flag,
  Target, Megaphone, BarChart3, ArrowRight, Zap,
} from "lucide-react";

/* ── Mock data ── */
// TODO: wire to real API

interface Task {
  label: string;
  done: boolean;
}

interface Phase {
  name: string;
  tasks: Task[];
}

interface Launch {
  id: string;
  name: string;
  dateRange: string;
  status: "In Progress" | "Planning" | "Upcoming";
  progress: number;
  completedTasks: number;
  totalTasks: number;
  phases: Phase[];
}

const launches: Launch[] = [
  {
    id: "summer-hydration",
    name: "Summer Hydration Campaign",
    dateRange: "May 1 – Jun 30, 2026",
    status: "In Progress",
    progress: 67,
    completedTasks: 6,
    totalTasks: 9,
    phases: [
      {
        name: "Pre-launch",
        tasks: [
          { label: "Brand assets finalized (summer visuals)", done: true },
          { label: "Landing page live at ujekaradaku.com/summer", done: true },
          { label: "Email sequence drafted (3-part drip)", done: true },
        ],
      },
      {
        name: "Launch",
        tasks: [
          { label: "Social posts scheduled (Instagram + TikTok)", done: true },
          { label: "Meta ad campaigns activated", done: true },
          { label: "Press release sent to Kosovo media", done: true },
        ],
      },
      {
        name: "Post-launch",
        tasks: [
          { label: "Analytics review — week 1 performance", done: false },
          { label: "Customer feedback survey distributed", done: false },
          { label: "Iteration on underperforming creatives", done: false },
        ],
      },
    ],
  },
  {
    id: "sparkling-line",
    name: "New Sparkling Line Launch",
    dateRange: "Jul 15 – Aug 31, 2026",
    status: "Planning",
    progress: 15,
    completedTasks: 1,
    totalTasks: 9,
    phases: [
      {
        name: "Pre-launch",
        tasks: [
          { label: "Brand assets — sparkling bottle design approved", done: true },
          { label: "Landing page wireframe", done: false },
          { label: "Email sequence for sparkling announcement", done: false },
        ],
      },
      {
        name: "Launch",
        tasks: [
          { label: "Social posts — taste-test video series", done: false },
          { label: "Google Ads campaign for 'sparkling water Kosovo'", done: false },
          { label: "Press release + influencer seeding", done: false },
        ],
      },
      {
        name: "Post-launch",
        tasks: [
          { label: "Analytics review — launch week", done: false },
          { label: "Customer feedback collection", done: false },
          { label: "Retail expansion based on demand signals", done: false },
        ],
      },
    ],
  },
  {
    id: "ramadan-edition",
    name: "Ramadan Special Edition",
    dateRange: "Feb 15 – Mar 20, 2027",
    status: "Upcoming",
    progress: 0,
    completedTasks: 0,
    totalTasks: 9,
    phases: [
      {
        name: "Pre-launch",
        tasks: [
          { label: "Brand assets — Ramadan packaging design", done: false },
          { label: "Landing page with iftar hydration guide", done: false },
          { label: "Email sequence for Ramadan offers", done: false },
        ],
      },
      {
        name: "Launch",
        tasks: [
          { label: "Social posts — daily hydration tips", done: false },
          { label: "Ad campaigns targeting Kosovo + diaspora", done: false },
          { label: "Press release to local media", done: false },
        ],
      },
      {
        name: "Post-launch",
        tasks: [
          { label: "Analytics review", done: false },
          { label: "Customer feedback", done: false },
          { label: "Iteration for next Ramadan", done: false },
        ],
      },
    ],
  },
];

const statusBadge: Record<string, string> = {
  "In Progress": "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Planning: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  Upcoming: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30",
};

const phaseIcon: Record<string, typeof Megaphone> = {
  "Pre-launch": Flag,
  Launch: Megaphone,
  "Post-launch": BarChart3,
};

/* ── Timeline bar helpers ── */
function TimelineBar() {
  const phases = [
    { label: "Pre-launch", pct: 33 },
    { label: "Launch", pct: 34 },
    { label: "Post-launch", pct: 33 },
  ];
  const todayPct = 67; // matches "Summer" progress

  return (
    <div className="relative mt-2 mb-6">
      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
        {phases.map((ph, i) => (
          <div
            key={i}
            className="h-full border-r border-background last:border-r-0"
            style={{
              width: `${ph.pct}%`,
              backgroundColor:
                i === 0
                  ? "hsl(var(--primary) / 0.7)"
                  : i === 1
                  ? "hsl(var(--primary) / 0.4)"
                  : "hsl(var(--primary) / 0.15)",
            }}
          />
        ))}
      </div>
      {/* today marker */}
      <div
        className="absolute top-0 -mt-1 w-0.5 h-5 bg-foreground rounded"
        style={{ left: `${todayPct}%` }}
      />
      <span
        className="absolute text-[10px] font-medium text-foreground -mt-0.5"
        style={{ left: `${todayPct}%`, transform: "translateX(-50%)" }}
      >
        Today
      </span>
      <div className="flex justify-between mt-3 text-xs text-muted-foreground">
        {phases.map((ph) => (
          <span key={ph.label}>{ph.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function LaunchOrchestrator() {
  const [selected, setSelected] = useState<string>("summer-hydration");
  const [dialogOpen, setDialogOpen] = useState(false);
  const activeLaunch = launches.find((l) => l.id === selected)!;

  return (
    <div className="space-y-8">
      {/* ── Hero stats ── */}
      <section className="flex flex-wrap gap-4">
        {[
          { icon: Rocket, label: "Active Launches", value: "2", color: "text-blue-500" },
          { icon: Clock, label: "Upcoming", value: "1", color: "text-yellow-500" },
          { icon: CheckCircle, label: "Tasks Complete", value: "7 / 27", color: "text-green-500" },
        ].map((s, i) => (
          <Card key={i} className="flex-1 min-w-[160px]">
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ── Launch cards ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Launches
          </h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> New Launch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Launch</DialogTitle>
                <DialogDescription>
                  Define a new product or campaign launch for Uje Karadaku.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* TODO: wire to real API */}
                <div>
                  <label className="text-sm font-medium text-foreground">Launch Name</label>
                  <Input placeholder="e.g. Autumn Wellness Pack" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">Start Date</label>
                    <Input type="date" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">End Date</label>
                    <Input type="date" className="mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Input placeholder="Brief description of the launch goals" className="mt-1" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setDialogOpen(false)}>
                  <Zap className="h-4 w-4 mr-1" /> Create Launch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {launches.map((l) => (
            <Card
              key={l.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${selected === l.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelected(l.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{l.name}</CardTitle>
                  <Badge variant="outline" className={statusBadge[l.status]}>
                    {l.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" /> {l.dateRange}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={l.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{l.progress}% complete</span>
                  <span>
                    {l.completedTasks}/{l.totalTasks} tasks
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Timeline ── */}
      <section>
        <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          Timeline — {activeLaunch.name}
        </h3>
        <TimelineBar />
      </section>

      {/* ── Expanded task checklist ── */}
      <section>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Task Checklist — {activeLaunch.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeLaunch.phases.map((phase) => {
              const PhaseIcon = phaseIcon[phase.name] || Circle;
              return (
                <div key={phase.name}>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                    <PhaseIcon className="h-4 w-4 text-primary" />
                    {phase.name}
                  </h4>
                  <div className="space-y-2 ml-6">
                    {phase.tasks.map((task, ti) => (
                      <label
                        key={ti}
                        className="flex items-center gap-2 text-sm cursor-pointer group"
                      >
                        <Checkbox checked={task.done} disabled />
                        <span
                          className={
                            task.done
                              ? "line-through text-muted-foreground"
                              : "text-foreground group-hover:text-primary transition-colors"
                          }
                        >
                          {task.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground border-t pt-4">
            {activeLaunch.completedTasks} of {activeLaunch.totalTasks} tasks completed
            <ArrowRight className="h-3 w-3 mx-1 inline" />
            {activeLaunch.progress}% overall progress
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
