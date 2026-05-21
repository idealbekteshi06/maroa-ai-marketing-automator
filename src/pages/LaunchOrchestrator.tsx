import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  wf12LaunchesList,
  wf12LaunchDetail,
  wf12PlanLaunch,
  wf12ActivityUpdate,
} from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
  Rocket, Calendar, CheckCircle, Circle, Clock, Plus,
  Target, ArrowRight, Zap,
} from "lucide-react";

interface Task {
  id?: string;
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
  status: "In Progress" | "Planning" | "Upcoming" | string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  phases: Phase[];
}

const statusBadge: Record<string, string> = {
  "In Progress": "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Planning: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  Upcoming: "bg-muted text-muted-foreground",
  planning: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
};

function mapLaunchRow(row: Record<string, unknown>): Launch {
  const plan = (row.plan || {}) as Record<string, unknown>;
  const phases = Array.isArray(plan.phases)
    ? (plan.phases as Array<Record<string, unknown>>).map((ph) => ({
        name: String(ph.phase || "Phase"),
        tasks: (Array.isArray(ph.key_activities) ? ph.key_activities : []).map((a) => {
          const act = a as Record<string, unknown>;
          return {
            label: String(act.activity || act.label || "Task"),
            done: false,
          };
        }),
      }))
    : [];
  const totalTasks = phases.reduce((n, p) => n + p.tasks.length, 0);
  return {
    id: String(row.id),
    name: String(row.name || plan.launch_name || "Launch"),
    dateRange: row.launch_date ? String(row.launch_date) : "—",
    status: String(row.status || "Planning"),
    progress: 0,
    completedTasks: 0,
    totalTasks,
    phases,
  };
}

function mergeDetail(base: Launch, detail: { activities?: Array<Record<string, unknown>> }): Launch {
  const activities = detail.activities || [];
  const byPhase = new Map<string, Task[]>();
  let completed = 0;
  for (const a of activities) {
    const phase = String(a.phase || "General");
    const status = String(a.status || "pending");
    const task: Task = {
      id: String(a.id),
      label: String(a.activity || "Task"),
      done: status === "completed",
    };
    if (task.done) completed += 1;
    if (!byPhase.has(phase)) byPhase.set(phase, []);
    byPhase.get(phase)!.push(task);
  }
  const phases =
    byPhase.size > 0
      ? [...byPhase.entries()].map(([name, tasks]) => ({ name, tasks }))
      : base.phases;
  const totalTasks = phases.reduce((n, p) => n + p.tasks.length, 0) || base.totalTasks;
  const progress = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
  return {
    ...base,
    phases,
    completedTasks: completed,
    totalTasks,
    progress,
  };
}

export default function LaunchOrchestrator() {
  const { businessId, isReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", start: "", end: "", description: "" });

  const load = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { items } = await wf12LaunchesList(businessId);
      const mapped = (items || []).map((r) => mapLaunchRow(r as Record<string, unknown>));
      setLaunches(mapped);
      setSelected((prev) => (prev && mapped.some((l) => l.id === prev) ? prev : mapped[0]?.id || ""));
    } catch {
      setLaunches([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);


  const selectLaunch = useCallback(async (id: string) => {
    if (!businessId) return;
    try {
      const detail = await wf12LaunchDetail(businessId, id);
      setLaunches((prev) =>
        prev.map((l) => (l.id === id ? mergeDetail(l, detail as { activities?: Array<Record<string, unknown>> }) : l))
      );
    } catch {
      /* keep list row */
    }
  }, [businessId]);

  const pickLaunch = (id: string) => {
    setSelected(id);
    void selectLaunch(id);
  };

  const createLaunch = async () => {
    if (!businessId || !form.name.trim()) {
      toast.error("Launch name required");
      return;
    }
    setCreating(true);
    try {
      const r = await wf12PlanLaunch({
        businessId,
        request: {
          name: form.name,
          launchType: "campaign",
          launchDate: form.start || undefined,
          description: form.description,
          endDate: form.end,
        },
      });
      toast.success("Launch planned");
      setDialogOpen(false);
      setForm({ name: "", start: "", end: "", description: "" });
      const launchId = (r as { launchId?: string }).launchId;
      await load();
      if (launchId) {
        setSelected(launchId);
        void selectLaunch(launchId);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const toggleTask = async (task: Task) => {
    if (!businessId || !task.id) return;
    const next = task.done ? "pending" : "completed";
    try {
      await wf12ActivityUpdate({ businessId, activityId: task.id, status: next });
      if (selected) void selectLaunch(selected);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const activeLaunch = launches.find((l) => l.id === selected);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading launches…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap gap-4">
        {[
          { icon: Rocket, label: "Launches", value: String(launches.length), color: "text-blue-500" },
          {
            icon: CheckCircle,
            label: "Tasks Complete",
            value: activeLaunch ? `${activeLaunch.completedTasks} / ${activeLaunch.totalTasks}` : "—",
            color: "text-green-500",
          },
        ].map((s, i) => (
          <Card key={i} className="flex-1 min-w-[160px]">
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
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
                <DialogDescription>AI-generated launch plan with phased activities.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-medium text-foreground">Launch Name</label>
                  <Input
                    placeholder="e.g. Autumn Wellness Pack"
                    className="mt-1"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">Start Date</label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={form.start}
                      onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">End Date</label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={form.end}
                      onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Input
                    placeholder="Goals and context for the launch"
                    className="mt-1"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={createLaunch} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
                  Create Launch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {launches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No launches yet — create one to get a phased plan.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {launches.map((l) => (
              <Card
                key={l.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${selected === l.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => pickLaunch(l.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{l.name}</CardTitle>
                    <Badge variant="outline" className={statusBadge[l.status] || statusBadge.Planning}>
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
        )}
      </section>

      {activeLaunch && (
        <section>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Task Checklist — {activeLaunch.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {activeLaunch.phases.map((phase) => (
                <div key={phase.name}>
                  <h4 className="text-sm font-semibold text-foreground mb-2">{phase.name}</h4>
                  <div className="space-y-2 ml-2">
                    {phase.tasks.map((task, ti) => (
                      <label key={ti} className="flex items-center gap-2 text-sm cursor-pointer group">
                        <Checkbox
                          checked={task.done}
                          onCheckedChange={() => toggleTask(task)}
                          disabled={!task.id}
                        />
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
              ))}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground border-t pt-4">
              {activeLaunch.completedTasks} of {activeLaunch.totalTasks} tasks completed
              <ArrowRight className="h-3 w-3 mx-1 inline" />
              {activeLaunch.progress}% overall progress
            </CardFooter>
          </Card>
        </section>
      )}
    </div>
  );
}
