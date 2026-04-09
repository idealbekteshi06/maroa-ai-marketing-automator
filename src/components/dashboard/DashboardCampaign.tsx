import { useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Rocket, Calendar, ChevronDown, ChevronUp, Sparkles, Mail, Megaphone, Clock } from "lucide-react";

interface CampaignResult {
  theme?: string;
  campaign_name?: string;
  schedule?: { day: number; title: string; description: string; channel: string }[];
  day_by_day?: { day: number; title: string; description: string; channel: string }[];
  emails?: { subject: string; preview: string; send_day: number }[];
  email_sequence?: { subject: string; preview: string; send_day: number }[];
  ad_copy?: { headline: string; description: string; cta: string; platform: string }[];
  ads?: { headline: string; description: string; cta: string; platform: string }[];
  summary?: string;
}
import { apiPost } from "@/lib/apiClient";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

const durationOptions = [
  { value: 7, label: "7 Days", desc: "Quick sprint" },
  { value: 14, label: "14 Days", desc: "Standard campaign" },
  { value: 30, label: "30 Days", desc: "Full-scale push" },
];

const channelColors: Record<string, string> = {
  instagram: "bg-pink-500/10 text-pink-600",
  facebook: "bg-blue-500/10 text-blue-600",
  email: "bg-teal-500/10 text-teal-600",
  google: "bg-yellow-500/10 text-yellow-700",
  linkedin: "bg-indigo-500/10 text-indigo-600",
  tiktok: "bg-purple-500/10 text-purple-600",
  default: "bg-muted text-muted-foreground",
};

function getChannelStyle(channel: string) {
  const key = channel?.toLowerCase() || "";
  for (const [k, v] of Object.entries(channelColors)) {
    if (key.includes(k)) return v;
  }
  return channelColors.default;
}

export default function DashboardCampaign() {
  const { businessId, isReady } = useAuth();
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState(14);
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState("");
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    schedule: true,
    emails: false,
    ads: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = useCallback(async (): Promise<void> => {
    if (!businessId || !goal.trim()) {
      toast.error(ERROR_MESSAGES.PROFILE_INCOMPLETE);
      return;
    }

    setGenerating(true);
    setResult(null);
    setGenMessage("Understanding your goal...");

    try {
      const msgs = [
        "Understanding your goal...",
        "Researching best strategies...",
        "Building day-by-day schedule...",
        "Writing email sequences...",
        "Crafting ad copy...",
        "Finalizing your campaign...",
      ];
      let i = 0;
      const interval: ReturnType<typeof setInterval> = setInterval(() => {
        i++;
        if (i < msgs.length) setGenMessage(msgs[i]);
      }, 4000);

      const data = await apiPost<CampaignResult>("/api/campaigns/instant", { userId: businessId, goal: goal.trim(), duration });
      clearInterval(interval);
      setResult(data);
      setExpandedSections({ schedule: true, emails: true, ads: true });
      toast.success(SUCCESS_MESSAGES.CAMPAIGN_LAUNCHED);
    } catch {
      toast.error(ERROR_MESSAGES.GENERATION_FAILED);
    } finally {
      setGenerating(false);
      setGenMessage("");
    }
  }, [businessId, duration, goal]);

  const schedule = result?.schedule || result?.day_by_day || [];
  const emails = result?.emails || result?.email_sequence || [];
  const ads = result?.ad_copy || result?.ads || [];
  const theme = result?.theme || result?.campaign_name || "";

  if (!isReady) {
    return (
      <div className="space-y-4">
        <div className="h-14 rounded-lg skeleton" />
        <div className="h-32 rounded-lg skeleton" />
        <div className="h-12 rounded-lg skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">One-Click Campaign Generator</h2>
          <p className="text-xs text-muted-foreground">Tell the AI your goal — get a complete multi-channel campaign in 60 seconds</p>
        </div>
      </div>

      {/* Goal Input */}
      <div className="rounded-lg border border-border bg-card p-5">
        <label className="block text-sm font-medium text-foreground mb-2">What do you want to achieve?</label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={"What do you want to achieve? Examples:\n- Get 20 new gym members this month\n- Promote our summer sale\n- Launch a new product line\n- Increase foot traffic by 30%"}
          className="w-full rounded-lg border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          rows={4}
          disabled={generating}
        />

        {/* Duration Selector */}
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground mb-2">Campaign Duration</p>
          <div className="grid grid-cols-3 gap-3">
            {durationOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDuration(opt.value)}
                disabled={generating}
                className={`rounded-lg border p-3 text-center transition-all ${
                  duration === opt.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <p className={`text-sm font-bold ${duration === opt.value ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Launch Button */}
        <Button
          className="w-full mt-4 h-11 text-sm"
          onClick={handleGenerate}
          disabled={generating || !goal.trim()}
        >
          {generating ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {genMessage}</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" /> Launch Campaign</>
          )}
        </Button>
      </div>

      {/* Generating Progress */}
      {generating && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm font-medium text-primary">{genMessage}</p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-primary/50 animate-pulse" style={{ width: "60%" }} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Building your complete multi-channel campaign...</p>
        </div>
      )}

      {/* Results */}
      {result ? (
        <div className="space-y-4">
          {/* Campaign Theme */}
          {(theme || result.summary) && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
              {theme && <h3 className="text-base font-bold text-foreground">{theme}</h3>}
              {result.summary && <p className="text-sm text-muted-foreground mt-1">{result.summary}</p>}
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> {duration} days
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {schedule.length} scheduled actions
                </span>
              </div>
            </div>
          )}

          {/* Day-by-Day Schedule */}
          {schedule.length > 0 && (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => toggleSection("schedule")}
                className="flex items-center justify-between w-full px-5 py-3 border-b border-border hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Day-by-Day Schedule</h3>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{schedule.length} actions</span>
                </div>
                {expandedSections.schedule ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {expandedSections.schedule && (
                <div className="divide-y divide-border">
                  {schedule.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary shrink-0">
                        D{item.day}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
                      </div>
                      {item.channel && (
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${getChannelStyle(item.channel)}`}>
                          {item.channel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Email Sequence */}
          {emails.length > 0 && (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => toggleSection("emails")}
                className="flex items-center justify-between w-full px-5 py-3 border-b border-border hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-teal-500" />
                  <h3 className="text-sm font-semibold text-foreground">Email Sequence</h3>
                  <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-600">{emails.length} emails</span>
                </div>
                {expandedSections.emails ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {expandedSections.emails && (
                <div className="divide-y divide-border">
                  {emails.map((email, i) => (
                    <div key={i} className="px-5 py-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[13px] font-medium text-foreground">{email.subject}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">Day {email.send_day}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{email.preview}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ad Copy */}
          {ads.length > 0 && (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => toggleSection("ads")}
                className="flex items-center justify-between w-full px-5 py-3 border-b border-border hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-pink-500" />
                  <h3 className="text-sm font-semibold text-foreground">Ad Copy</h3>
                  <span className="rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-medium text-pink-600">{ads.length} variants</span>
                </div>
                {expandedSections.ads ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {expandedSections.ads && (
                <div className="divide-y divide-border">
                  {ads.map((ad, i) => (
                    <div key={i} className="px-5 py-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[13px] font-bold text-foreground">{ad.headline}</p>
                        {ad.platform && (
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${getChannelStyle(ad.platform)}`}>
                            {ad.platform}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{ad.description}</p>
                      {ad.cta && (
                        <span className="inline-block mt-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                          CTA: {ad.cta}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : !generating ? (
        /* Empty State */
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Rocket className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Describe your goal above and let AI build a complete campaign for you</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mx-auto">
            The AI will create a day-by-day schedule, email sequence, and ad copy tailored to your business.
          </p>
        </div>
      ) : null}
    </div>
  );
}
