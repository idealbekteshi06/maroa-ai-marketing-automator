/**
 * Paid Ads Hub — channel-separated paid advertising command center
 * ============================================================================
 * - Three channel cards (Meta / Google / TikTok) fed by /webhook/paid-ads-overview:
 *   connection state, campaign counts, spend, ROAS, eligibility hints.
 * - Guided 4-step campaign wizard (goal → audience → budget & schedule →
 *   offer & review). The AI builds the campaign around the user's answers
 *   (AdWizardInput is injected as hard constraints into the strategy prompt).
 * - Per-channel campaign lists with status, spend, ROAS and on-demand
 *   "Audit now" (meta/google → canonical ad-optimizer engine).
 *
 * Campaigns are ALWAYS created as drafts — real spend stays behind the
 * per-business ads_live consent gates.
 * ============================================================================
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Eye,
  Facebook,
  Loader2,
  Megaphone,
  MousePointerClick,
  Music2,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  getPaidAdsOverview,
  getMetaCampaigns,
  getGoogleCampaigns,
  getTiktokCampaigns,
  metaCampaignCreate,
  googleCampaignCreate,
  tiktokCampaignCreate,
  adOptimizerAuditCampaign,
  type AdWizardInput,
  type PaidAdsChannel,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Channel metadata
// ---------------------------------------------------------------------------

type ChannelKey = "meta" | "google" | "tiktok";

const CHANNELS: Record<
  ChannelKey,
  {
    label: string;
    sublabel: string;
    icon: typeof Facebook;
    accent: string;
    minDailyBudget: number | null;
  }
> = {
  meta: {
    label: "Meta Ads",
    sublabel: "Facebook + Instagram",
    icon: Facebook,
    accent: "text-blue-500",
    minDailyBudget: null,
  },
  google: {
    label: "Google Ads",
    sublabel: "Search + Performance Max",
    icon: Search,
    accent: "text-emerald-500",
    minDailyBudget: null,
  },
  tiktok: {
    label: "TikTok Ads",
    sublabel: "Smart+ / Spark Ads",
    icon: Music2,
    accent: "text-pink-500",
    minDailyBudget: 50,
  },
};

const OBJECTIVES: Array<{
  value: string;
  label: string;
  description: string;
  icon: typeof Eye;
}> = [
  {
    value: "awareness",
    label: "Awareness",
    description: "Get seen by more people in your area",
    icon: Eye,
  },
  {
    value: "traffic",
    label: "Traffic",
    description: "Send visitors to your website",
    icon: MousePointerClick,
  },
  {
    value: "leads",
    label: "Leads",
    description: "Collect contacts and inquiries",
    icon: Users,
  },
  {
    value: "sales",
    label: "Sales",
    description: "Drive purchases and conversions",
    icon: ShoppingCart,
  },
];

const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55+", "all"] as const;

// ---------------------------------------------------------------------------
// Campaign row helpers — ai_strategy may be a JSON string OR an object
// ---------------------------------------------------------------------------

interface CampaignRow {
  id?: string;
  campaign_id?: string;
  status?: string;
  objective?: string;
  platform?: string;
  daily_budget?: number | string;
  total_spend?: number | string;
  roas?: number | string;
  ai_strategy?: unknown;
  created_at?: string;
  [key: string]: unknown;
}

interface CampaignListResponse {
  campaigns?: CampaignRow[];
  summary?: Record<string, unknown>;
}

function parseAiStrategy(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

function campaignDisplayName(c: CampaignRow, channel: ChannelKey): string {
  const strategy = parseAiStrategy(c?.ai_strategy);
  const fromStrategy = strategy?.campaign_name;
  if (typeof fromStrategy === "string" && fromStrategy.trim()) {
    return fromStrategy;
  }
  if (typeof c?.objective === "string" && c.objective.trim()) return c.objective;
  return `${CHANNELS[channel].label} campaign`;
}

function fmtMoney(v: unknown): string {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function fmtRoas(v: unknown): string {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}x`;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success border-success/30",
  draft: "bg-muted text-muted-foreground border-border",
  paused: "bg-warning/10 text-warning border-warning/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  archived: "bg-muted/50 text-muted-foreground border-border",
};

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "unknown").toLowerCase();
  return (
    <Badge
      variant="outline"
      className={`text-[10px] capitalize ${STATUS_STYLES[s] ?? "bg-muted text-muted-foreground border-border"}`}
    >
      {s}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PaidAdsHub() {
  const { businessId } = useAuth();
  const [wizardChannel, setWizardChannel] = useState<ChannelKey | null>(null);
  const [activeTab, setActiveTab] = useState<ChannelKey>("meta");

  const overviewQuery = useQuery({
    queryKey: ["paid-ads", "overview", businessId],
    queryFn: () => getPaidAdsOverview({ business_id: businessId! }),
    enabled: !!businessId,
    retry: false,
  });

  const channels = overviewQuery.data?.channels;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Megaphone className="h-3.5 w-3.5" />
              Paid Ads Hub
            </div>
            <h1 className="mt-1 text-3xl font-medium tracking-tight text-foreground">
              Paid advertising
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a channel, answer a short questionnaire, and the AI builds
              the campaign around your answers. Everything starts as a draft —
              nothing spends money without your approval.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => overviewQuery.refetch()}
            disabled={overviewQuery.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${overviewQuery.isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* ── Channel cards ── */}
        {overviewQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-56 rounded-lg" />
            ))}
          </div>
        ) : overviewQuery.isError ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Couldn't load the channel overview
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {(overviewQuery.error as Error)?.message ||
                      "Unknown error"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(CHANNELS) as ChannelKey[]).map((key) => (
              <ChannelCard
                key={key}
                channel={key}
                data={channels?.[key]}
                onCreate={() => setWizardChannel(key)}
              />
            ))}
          </div>
        )}

        {/* ── Per-channel campaign lists ── */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ChannelKey)}
        >
          <TabsList>
            <TabsTrigger value="meta">Meta</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="tiktok">TikTok</TabsTrigger>
          </TabsList>
          {(Object.keys(CHANNELS) as ChannelKey[]).map((key) => (
            <TabsContent key={key} value={key} className="pt-3">
              <ChannelCampaignList
                channel={key}
                businessId={businessId}
                onCreate={() => setWizardChannel(key)}
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* ── Campaign wizard ── */}
        {wizardChannel && (
          <CampaignWizard
            channel={wizardChannel}
            businessId={businessId}
            eligibility={channels?.[wizardChannel]?.eligibility}
            onClose={() => setWizardChannel(null)}
            onCreated={() => {
              setActiveTab(wizardChannel);
              setWizardChannel(null);
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Channel card
// ---------------------------------------------------------------------------

function ChannelCard({
  channel,
  data,
  onCreate,
}: {
  channel: ChannelKey;
  data?: PaidAdsChannel;
  onCreate: () => void;
}) {
  const meta = CHANNELS[channel];
  const Icon = meta.icon;
  const connected = data?.connected === true;
  const ineligibleReasons =
    data?.eligibility?.eligible === false ? data.eligibility.reasons ?? [] : [];

  const createButton = (
    <Button
      size="sm"
      className="w-full"
      onClick={onCreate}
      disabled={!connected}
    >
      <Plus className="mr-1.5 h-4 w-4" />
      Create campaign
    </Button>
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-border p-2">
              <Icon className={`h-5 w-5 ${meta.accent}`} />
            </div>
            <div>
              <CardTitle className="text-base">{meta.label}</CardTitle>
              <CardDescription className="text-xs">
                {meta.sublabel}
              </CardDescription>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-success" : "bg-warning"}`}
          />
          <span
            className={`text-xs ${connected ? "text-success" : "text-warning"}`}
          >
            {connected ? "Connected" : "Not connected — connect in Settings"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-3">
        <div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-border p-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Campaigns
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {data?.campaigns ?? 0}
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                  {data?.active ?? 0} active
                </span>
              </p>
            </div>
            <div className="rounded border border-border p-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Total spend
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {fmtMoney(data?.total_spend ?? 0)}
              </p>
            </div>
            <div className="col-span-2 rounded border border-border p-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Avg ROAS
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {fmtRoas(data?.avg_roas ?? 0)}
              </p>
            </div>
          </div>
          {ineligibleReasons.length > 0 && (
            <div className="mt-2 space-y-1">
              {ineligibleReasons.map((r) => (
                <p
                  key={r}
                  className="flex items-start gap-1 text-[11px] text-warning"
                >
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  {r}
                </p>
              ))}
            </div>
          )}
        </div>
        {connected ? (
          createButton
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="w-full">{createButton}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px] text-xs">
              Connect your {meta.label} account in Settings → Connections
              before creating a campaign.
            </TooltipContent>
          </Tooltip>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Campaign wizard (4 steps)
// ---------------------------------------------------------------------------

const WIZARD_STEPS = ["Goal", "Audience", "Budget & schedule", "Offer & review"];

function CampaignWizard({
  channel,
  businessId,
  eligibility,
  onClose,
  onCreated,
}: {
  channel: ChannelKey;
  businessId: string | null;
  eligibility?: PaidAdsChannel["eligibility"];
  onClose: () => void;
  onCreated: () => void;
}) {
  const qc = useQueryClient();
  const meta = CHANNELS[channel];
  const [step, setStep] = useState(0);

  // Answers
  const [objective, setObjective] = useState<string>("");
  const [targetAudience, setTargetAudience] = useState("");
  const [ageRange, setAgeRange] = useState<string>("all");
  const [locationsRaw, setLocationsRaw] = useState("");
  const [dailyBudget, setDailyBudget] = useState<string>("");
  const [durationChoice, setDurationChoice] = useState<string>("30");
  const [customDuration, setCustomDuration] = useState<string>("");
  const [offer, setOffer] = useState("");

  const locations = useMemo(
    () =>
      locationsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [locationsRaw],
  );

  const budgetNum = parseFloat(dailyBudget);
  const budgetValid = Number.isFinite(budgetNum) && budgetNum > 0;
  const durationDays =
    durationChoice === "custom"
      ? parseInt(customDuration, 10)
      : parseInt(durationChoice, 10);
  const durationValid = Number.isFinite(durationDays) && durationDays > 0;
  const belowTiktokFloor =
    channel === "tiktok" && budgetValid && budgetNum < 50;

  const stepValid = [
    !!objective,
    targetAudience.trim().length > 0,
    budgetValid && durationValid,
    true,
  ][step];

  const wizard: AdWizardInput = {
    objective: objective || undefined,
    target_audience: targetAudience.trim() || undefined,
    age_range: ageRange,
    locations: locations.length > 0 ? locations : undefined,
    daily_budget: budgetValid ? budgetNum : undefined,
    duration_days: durationValid ? durationDays : undefined,
    offer: offer.trim() || undefined,
  };

  const create = useMutation({
    mutationFn: async () => {
      const body = { business_id: businessId!, wizard };
      if (channel === "meta") return metaCampaignCreate(body);
      if (channel === "google") return googleCampaignCreate(body);
      return tiktokCampaignCreate(body);
    },
    onSuccess: () => {
      toast.success("Campaign drafted", {
        description:
          "Review it below; it goes live only with your approval.",
      });
      qc.invalidateQueries({ queryKey: ["paid-ads", "overview", businessId] });
      qc.invalidateQueries({
        queryKey: ["paid-ads", "campaigns", channel, businessId],
      });
      onCreated();
    },
    onError: (e: Error) => {
      // The backend returns { error, eligibility } on TikTok eligibility 400s
      // and budget-ceiling / AI-credit messages on other failures. The shared
      // POST client surfaces status + endpoint; we add the known eligibility
      // reasons from the overview so the user sees WHY it was rejected.
      const reasons =
        channel === "tiktok" && eligibility?.eligible === false
          ? eligibility.reasons ?? []
          : [];
      toast.error("Campaign creation failed", {
        description: [e?.message || "Unknown error", ...reasons]
          .filter(Boolean)
          .join(" · "),
        duration: 8000,
      });
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <meta.icon className={`h-4 w-4 ${meta.accent}`} />
            New {meta.label} campaign
          </DialogTitle>
          <DialogDescription className="text-xs">
            Answer a few questions — the AI builds the strategy around your
            answers. The campaign is saved as a draft.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-1.5">
          {WIZARD_STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col gap-1">
              <div
                className={`h-1 rounded-full ${
                  i < step
                    ? "bg-success"
                    : i === step
                      ? "bg-primary"
                      : "bg-muted"
                }`}
              />
              <p
                className={`text-[10px] ${
                  i === step
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Step 1 — Goal ── */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-2">
            {OBJECTIVES.map((o) => {
              const OIcon = o.icon;
              const active = objective === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setObjective(o.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <OIcon
                      className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`}
                    />
                    {active && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {o.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {o.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step 2 — Audience ── */}
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">
                Who should see this? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                className="mt-1 min-h-[80px]"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. 'young parents in Prishtina interested in healthy snacks'"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Age range</Label>
                <Select value={ageRange} onValueChange={setAgeRange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_RANGES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a === "all" ? "All ages" : a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Locations (comma-separated)</Label>
                <Input
                  className="mt-1"
                  value={locationsRaw}
                  onChange={(e) => setLocationsRaw(e.target.value)}
                  placeholder="Prishtina, Tirana, Skopje"
                />
              </div>
            </div>
            {locations.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {locations.map((l) => (
                  <Badge key={l} variant="outline" className="text-[10px]">
                    {l}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3 — Budget & schedule ── */}
        {step === 2 && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">
                Daily budget (USD) <span className="text-destructive">*</span>
              </Label>
              <Input
                className="mt-1"
                type="number"
                min={1}
                step="1"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                placeholder={channel === "tiktok" ? "50" : "10"}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                USD per day. Your plan's monthly budget ceiling is enforced at
                creation — if the budget exceeds it, the exact limit is shown
                in the rejection.
              </p>
              {belowTiktokFloor && (
                <p className="mt-1 flex items-start gap-1 text-[11px] text-warning">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  TikTok campaigns require a minimum of $50/day (ad groups
                  $20/day). Budgets below the floor are rejected.
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs">
                Duration <span className="text-destructive">*</span>
              </Label>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <Select value={durationChoice} onValueChange={setDurationChoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {durationChoice === "custom" && (
                  <Input
                    type="number"
                    min={1}
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    placeholder="days"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4 — Offer & review ── */}
        {step === 3 && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Offer / promo (optional)</Label>
              <Textarea
                className="mt-1 min-h-[60px]"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder="e.g. '20% off first order with code WELCOME20'"
              />
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Review
              </p>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                <dt className="text-muted-foreground">Channel</dt>
                <dd className="text-foreground">{meta.label}</dd>
                <dt className="text-muted-foreground">Goal</dt>
                <dd className="capitalize text-foreground">
                  {objective || "—"}
                </dd>
                <dt className="text-muted-foreground">Audience</dt>
                <dd className="text-foreground">{targetAudience || "—"}</dd>
                <dt className="text-muted-foreground">Age range</dt>
                <dd className="text-foreground">
                  {ageRange === "all" ? "All ages" : ageRange}
                </dd>
                <dt className="text-muted-foreground">Locations</dt>
                <dd className="text-foreground">
                  {locations.length > 0 ? locations.join(", ") : "—"}
                </dd>
                <dt className="text-muted-foreground">Daily budget</dt>
                <dd className="tabular-nums text-foreground">
                  {budgetValid ? `$${budgetNum.toFixed(2)}/day` : "—"}
                </dd>
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="text-foreground">
                  {durationValid ? `${durationDays} days` : "—"}
                </dd>
                <dt className="text-muted-foreground">Offer</dt>
                <dd className="text-foreground">{offer.trim() || "—"}</dd>
              </dl>
            </div>
            <p className="text-[11px] text-muted-foreground">
              The campaign is created as a <strong>draft</strong> — it goes
              live only with your approval.
            </p>
          </div>
        )}

        {/* ── Footer nav ── */}
        <div className="flex items-center justify-between pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            disabled={create.isPending}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button size="sm" onClick={() => setStep(step + 1)} disabled={!stepValid}>
              Next
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => create.mutate()}
              disabled={
                create.isPending || !businessId || !stepValid || belowTiktokFloor
              }
            >
              {create.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              Create campaign
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Per-channel campaign list
// ---------------------------------------------------------------------------

function ChannelCampaignList({
  channel,
  businessId,
  onCreate,
}: {
  channel: ChannelKey;
  businessId: string | null;
  onCreate: () => void;
}) {
  const meta = CHANNELS[channel];

  const campaignsQuery = useQuery({
    queryKey: ["paid-ads", "campaigns", channel, businessId],
    queryFn: async (): Promise<CampaignListResponse> => {
      const params = { business_id: businessId! };
      if (channel === "meta") {
        return (await getMetaCampaigns(params)) as CampaignListResponse;
      }
      if (channel === "google") {
        return (await getGoogleCampaigns(params)) as CampaignListResponse;
      }
      return (await getTiktokCampaigns(params)) as CampaignListResponse;
    },
    enabled: !!businessId,
    retry: false,
  });

  const audit = useMutation({
    mutationFn: (campaignId: string) =>
      adOptimizerAuditCampaign({ businessId: businessId!, campaignId }),
    onSuccess: (data) => {
      const d = data as {
        decision?: string;
        decision_reason?: string;
      } | null;
      if (d?.decision) {
        toast.success(`Audit decision: ${d.decision}`, {
          description: d.decision_reason || undefined,
          duration: 8000,
        });
      } else {
        toast.success("Audit complete");
      }
    },
    onError: (e: Error) =>
      toast.error("Audit failed", {
        description: e?.message || "Unknown error",
      }),
  });

  const campaigns = campaignsQuery.data?.campaigns ?? [];
  const supportsAudit = channel === "meta" || channel === "google";

  if (campaignsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (campaignsQuery.isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Couldn't load {meta.label} campaigns
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {(campaignsQuery.error as Error)?.message || "Unknown error"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium text-foreground">
            No {meta.label.replace(" Ads", "")} campaigns yet
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Create your first — the AI drafts it around your answers.
          </p>
          <Button size="sm" className="mt-3" onClick={onCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create campaign
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Campaign</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Daily budget</th>
                <th className="px-3 py-2 text-right">Total spend</th>
                <th className="px-3 py-2 text-right">ROAS</th>
                {supportsAudit && <th className="px-3 py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => {
                const id =
                  (typeof c?.id === "string" && c.id) ||
                  (typeof c?.campaign_id === "string" && c.campaign_id) ||
                  "";
                return (
                  <tr
                    key={id || i}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-3 py-2">
                      <p className="text-sm font-medium text-foreground">
                        {campaignDisplayName(c, channel)}
                      </p>
                      {c?.created_at && (
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={c?.status} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {fmtMoney(c?.daily_budget)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {fmtMoney(c?.total_spend)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {fmtRoas(c?.roas)}
                    </td>
                    {supportsAudit && (
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => audit.mutate(id)}
                          disabled={!id || audit.isPending}
                        >
                          {audit.isPending && audit.variables === id ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Audit now
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
