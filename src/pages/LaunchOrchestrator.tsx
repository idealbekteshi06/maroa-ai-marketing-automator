import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Rocket, Calendar, CheckCircle, Circle, Clock, Plus, Flag,
  Target, Megaphone, BarChart3, ArrowRight, Zap, TrendingUp, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  wf12ListLaunches,
  wf12GetLaunchDetail,
  wf12PlanLaunch,
  wf12UpdateActivity,
} from "@/lib/api";

/* ── Backend shapes (services/wf12) ── */

interface PlanActivity {
  activity?: string;
  channel?: string;
  owner?: string;
  effort_days?: number;
  deliverables?: string[];
}

interface PlanPhase {
  phase?: string;
  week_start_offset?: number;
  goals?: string[];
  key_activities?: PlanActivity[];
  metrics_to_watch?: string[];
}

interface LaunchPlan {
  launch_name?: string;
  one_line_positioning?: string;
  story_arc?: string;
  phases?: PlanPhase[];
  budget_allocation?: Record<string, number>;
}

interface LaunchRow {
  id?: string;
  business_id?: string;
  name?: string;
  launch_type?: string;
  launch_date?: string;
  status?: string;
  plan?: LaunchPlan;
  created_at?: string;
}

interface LaunchActivityRow {
  id?: string;
  launch_id?: string;
  phase?: string;
  activity?: string;
  channel?: string;
  owner?: string;
  effort_days?: number;
  status?: string;
  completed_at?: string | null;
}

interface Wf12ListResponse {
  items?: LaunchRow[];
}

interface Wf12DetailResponse {
  launch?: LaunchRow | null;
  activities?: LaunchActivityRow[];
}

interface Wf12PlanResponse {
  launchId?: string;
  plan?: LaunchPlan;
}

/* ── Display helpers ── */

const statusBadge: Record<string, string> = {
  in_progress: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  active: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  planning: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  completed: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  upcoming: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30",
};

const statusLabel: Record<string, string> = {
  in_progress: "In Progress",
  active: "Active",
  planning: "Planning",
  completed: "Completed",
  upcoming: "Upcoming",
};

const phaseLabel: Record<string, string> = {
  pre_launch: "Pre-launch",
  launch_week: "Launch Week",
  post_launch: "Post-launch",
  momentum: "Momentum",
};

const phaseIcon: Record<string, typeof Megaphone> = {
  pre_launch: Flag,
  launch_week: Megaphone,
  post_launch: BarChart3,
  momentum: TrendingUp,
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function plannedTaskCount(l?: LaunchRow): number {
  return (l?.plan?.phases ?? []).reduce(
    (sum, ph) => sum + (ph?.key_activities?.length ?? 0),
    0,
  );
}

/* ── Timeline bar ── */
function TimelineBar({ phases, progressPct }: { phases: string[]; progressPct: number }) {
  const segments = phases.length > 0 ? phases : ["pre_launch", "launch_week", "post_launch"];
  const width = 100 / segments.length;
  const marker = Math.min(Math.max(progressPct, 0), 100);

  return (
    <div className="relative mt-2 mb-6">
      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
        {segments.map((_, i) => (
          <div
            key={i}
            className="h-full border-r border-background last:border-r-0"
            style={{
              width: `${width}%`,
              backgroundColor: `hsl(var(--primary) / ${Math.max(0.7 - i * 0.2, 0.15)})`,
            }}
          />
        ))}
      </div>
      {/* progress marker */}
      <div
        className="absolute top-0 -mt-1 w-0.5 h-5 bg-foreground rounded"
        style={{ left: `${marker}%` }}
      />
      <span
        className="absolute text-[10px] font-medium text-foreground -mt-0.5"
        style={{ left: `${marker}%`, transform: "translateX(-50%)" }}
      >
        {Math.round(marker)}%
      </span>
      <div className="flex justify-between mt-3 text-xs text-muted-foreground">
        {segments.map((ph, i) => (
          <span key={`${ph}-${i}`}>{phaseLabel[ph] ?? ph}</span>
        ))}
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  name: "",
  launchType: "",
  launchDate: "",
  description: "",
  audience: "",
  budget: "",
};

export default function LaunchOrchestrator() {
  const { businessId } = useAuth();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const launchesQuery = useQuery({
    queryKey: ["wf12", "launches", businessId],
    queryFn: async () =>
      (await wf12ListLaunches({ business_id: businessId! })) as Wf12ListResponse,
    enabled: !!businessId,
    retry: false,
  });

  const launches = launchesQuery.data?.items ?? [];
  const activeId = selectedId ?? launches[0]?.id ?? null;
  const activeLaunch = launches.find((l) => l?.id === activeId);

  const detailQuery = useQuery({
    queryKey: ["wf12", "launch", businessId, activeId],
    queryFn: async () =>
      (await wf12GetLaunchDetail({
        business_id: businessId!,
        launch_id: activeId!,
      })) as Wf12DetailResponse,
    enabled: !!businessId && !!activeId,
    retry: false,
  });

  const activities = detailQuery.data?.activities ?? [];
  const completedCount = activities.filter((a) => a?.status === "completed").length;
  const progressPct =
    activities.length > 0 ? Math.round((completedCount / activities.length) * 100) : 0;

  // Group the selected launch's activities by phase (preserving order).
  const phaseGroups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, LaunchActivityRow[]>();
    for (const a of activities) {
      const ph = a?.phase || "other";
      if (!map.has(ph)) {
        map.set(ph, []);
        order.push(ph);
      }
      map.get(ph)!.push(a);
    }
    return order.map((ph) => ({ phase: ph, items: map.get(ph)! }));
  }, [activities]);

  const now = Date.now();
  const activeCount = launches.filter((l) => l?.status !== "completed").length;
  const upcomingCount = launches.filter((l) => {
    const t = l?.launch_date ? new Date(l.launch_date).getTime() : NaN;
    return Number.isFinite(t) && t > now;
  }).length;

  const planMutation = useMutation({
    mutationFn: async () =>
      (await wf12PlanLaunch({
        businessId: businessId!,
        request: {
          name: form.name.trim(),
          launchType: form.launchType.trim() || "product launch",
          launchDate: form.launchDate,
          description: form.description.trim(),
          audience: form.audience.trim(),
          ...(form.budget.trim() ? { budget: Number(form.budget) } : {}),
        },
      })) as Wf12PlanResponse,
    onSuccess: (res) => {
      toast.success("Launch plan created");
      setDialogOpen(false);
      setForm({ ...EMPTY_FORM });
      if (res?.launchId) setSelectedId(res.launchId);
      qc.invalidateQueries({ queryKey: ["wf12", "launches", businessId] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create launch plan"),
  });

  const activityMutation = useMutation({
    mutationFn: ({ activityId, status }: { activityId: string; status: string }) =>
      wf12UpdateActivity({ businessId: businessId!, activityId, status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wf12", "launch", businessId, activeId] });
      qc.invalidateQueries({ queryKey: ["wf12", "launches", businessId] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update activity"),
  });

  const createDisabled =
    planMutation.isPending || !form.name.trim() || !form.launchDate;

  const newLaunchDialog = (
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
            Describe the launch — AI builds the multi-phase plan and task list.
          </DialogDescription>
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
              <label className="text-sm font-medium text-foreground">Launch Type</label>
              <Input
                placeholder="e.g. product launch"
                className="mt-1"
                value={form.launchType}
                onChange={(e) => setForm((f) => ({ ...f, launchType: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Launch Date</label>
              <Input
                type="date"
                className="mt-1"
                value={form.launchDate}
                onChange={(e) => setForm((f) => ({ ...f, launchDate: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <Input
              placeholder="Brief description of the launch goals"
              className="mt-1"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">Target Audience</label>
              <Input
                placeholder="e.g. health-conscious families"
                className="mt-1"
                value={form.audience}
                onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Budget (USD, optional)</label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 500"
                className="mt-1"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDialogOpen(false)}
            disabled={planMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={() => planMutation.mutate()} disabled={createDisabled}>
            {planMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-1" />
            )}
            {planMutation.isPending ? "Planning…" : "Create Launch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-8">
      {/* ── Hero stats ── */}
      <section className="flex flex-wrap gap-4">
        {[
          {
            icon: Rocket,
            label: "Active Launches",
            value: launchesQuery.isLoading ? "—" : String(activeCount),
            color: "text-blue-500",
          },
          {
            icon: Clock,
            label: "Upcoming",
            value: launchesQuery.isLoading ? "—" : String(upcomingCount),
            color: "text-yellow-500",
          },
          {
            icon: CheckCircle,
            label: "Tasks Complete",
            value:
              activeId && !detailQuery.isLoading
                ? `${completedCount} / ${activities.length}`
                : "—",
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

      {/* ── Launch cards ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Launches
          </h2>
          {newLaunchDialog}
        </div>

        {launchesQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : launches.length === 0 ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
              <div className="p-3 rounded-full bg-muted">
                <Rocket className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No launches yet — plan your first one
              </p>
              <Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" /> Plan a Launch
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {launches.map((l) => {
              const isSelected = l?.id === activeId;
              const status = l?.status || "planning";
              const totalPlanned = plannedTaskCount(l);
              return (
                <Card
                  key={l?.id}
                  className={`cursor-pointer transition-shadow hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
                  onClick={() => l?.id && setSelectedId(l.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{l?.name || "Untitled launch"}</CardTitle>
                      <Badge
                        variant="outline"
                        className={statusBadge[status] ?? statusBadge.upcoming}
                      >
                        {statusLabel[status] ?? status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" /> {formatDate(l?.launch_date)}
                      {l?.launch_type ? ` · ${l.launch_type}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {isSelected && activities.length > 0 ? (
                      <>
                        <Progress value={progressPct} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{progressPct}% complete</span>
                          <span>
                            {completedCount}/{activities.length} tasks
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        {totalPlanned > 0 ? `${totalPlanned} planned tasks` : "Plan drafted"}
                        {!isSelected ? " · select to view" : ""}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Timeline ── */}
      {activeLaunch && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Timeline — {activeLaunch?.name || "Launch"}
          </h3>
          <TimelineBar
            phases={(activeLaunch?.plan?.phases ?? [])
              .map((ph) => ph?.phase || "")
              .filter(Boolean)}
            progressPct={progressPct}
          />
        </section>
      )}

      {/* ── Expanded task checklist ── */}
      {activeLaunch && (
        <section>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Task Checklist — {activeLaunch?.name || "Launch"}
              </CardTitle>
              {activeLaunch?.plan?.one_line_positioning && (
                <CardDescription>{activeLaunch.plan.one_line_positioning}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {detailQuery.isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              ) : phaseGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tasks recorded for this launch yet.
                </p>
              ) : (
                phaseGroups.map((group) => {
                  const PhaseIcon = phaseIcon[group.phase] || Circle;
                  return (
                    <div key={group.phase}>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                        <PhaseIcon className="h-4 w-4 text-primary" />
                        {phaseLabel[group.phase] ?? group.phase}
                      </h4>
                      <div className="space-y-2 ml-6">
                        {group.items.map((task) => {
                          const done = task?.status === "completed";
                          return (
                            <label
                              key={task?.id}
                              className="flex items-center gap-2 text-sm cursor-pointer group"
                            >
                              <Checkbox
                                checked={done}
                                disabled={activityMutation.isPending}
                                onCheckedChange={(checked) => {
                                  if (!task?.id) return;
                                  activityMutation.mutate({
                                    activityId: task.id,
                                    status: checked ? "completed" : "pending",
                                  });
                                }}
                              />
                              <span
                                className={
                                  done
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground group-hover:text-primary transition-colors"
                                }
                              >
                                {task?.activity || "Untitled task"}
                                {task?.channel ? (
                                  <span className="text-xs text-muted-foreground"> · {task.channel}</span>
                                ) : null}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground border-t pt-4">
              {completedCount} of {activities.length} tasks completed
              <ArrowRight className="h-3 w-3 mx-1 inline" />
              {progressPct}% overall progress
            </CardFooter>
          </Card>
        </section>
      )}
    </div>
  );
}
