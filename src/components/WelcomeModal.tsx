import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Clock, Calendar, BarChart3, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LiveAgentActivityFeed, { type AgentStep } from "@/components/LiveAgentActivityFeed";
import { toast } from "sonner";
import { apiFireAndForget } from "@/lib/apiClient";

const STORAGE_KEY = "maroa-welcome-shown";
const PHASE2_KEY = "maroa-welcome-phase2-shown";

type Phase = "intro" | "live" | "done";

interface BusinessLikeMeta {
  business_name?: string;
  industry?: string;
  city?: string;
  country?: string;
}

function buildSteps(meta: BusinessLikeMeta): AgentStep[] {
  const biz = meta.business_name?.trim();
  const city = meta.city?.trim();
  const country = meta.country?.trim();
  const place = [city, country].filter(Boolean).join(", ");
  const industry = meta.industry?.trim();

  return [
    {
      id: "reviews",
      label: biz ? `Reading ${biz}'s online reviews` : "Reading your online reviews",
      detail: "Pulling Google · Facebook · Instagram mentions",
      durationMs: 1900,
    },
    {
      id: "voice",
      label: "Listening to how customers describe you",
      detail: 'Mining verbatim phrases — "worth the drive," "felt like family"',
      durationMs: 2200,
    },
    {
      id: "brand",
      label: "Locking in your brand voice",
      detail: industry
        ? `Tuned for ${industry} · warm · understated confidence`
        : "Warm · understated confidence · category-aware",
      durationMs: 1600,
    },
    {
      id: "competitors",
      label: place
        ? `Mapping the top competitors in ${place}`
        : "Mapping your top 3 competitors",
      detail: "Identifying gaps in their content + ad strategy",
      durationMs: 2000,
    },
    {
      id: "psychology",
      label: "Choosing the right marketing psychology levers",
      detail: "Social proof · loss aversion · reciprocity (industry-safe)",
      durationMs: 1500,
    },
    {
      id: "strategy",
      label: "Drafting your 30-day marketing plan",
      detail: "12 posts · 4 ad variants · 2 emails · 1 launch",
      durationMs: 2400,
    },
    {
      id: "captions",
      label: "Writing your first 3 social captions",
      detail: "Voice-polished · slop-checked · ready for your approval",
      durationMs: 2600,
    },
  ];
}

export default function WelcomeModal() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("intro");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const force = params.get("welcome") === "force";
    if (force) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PHASE2_KEY);
      setShow(true);
      return;
    }
    const shown = localStorage.getItem(STORAGE_KEY);
    if (!shown) setShow(true);
  }, []);

  const dismiss = (showPayoff = false) => {
    localStorage.setItem(STORAGE_KEY, "true");
    localStorage.setItem(PHASE2_KEY, "true");
    setShow(false);
    if (showPayoff) {
      const userId = user?.id;
      const email = user?.email;
      if (userId) {
        apiFireAndForget("/webhook/instant-content", {
          user_id: userId,
          business_id: userId,
          email: email ?? "",
        });
      }
      const tId = toast.loading("Writing your first content now…", {
        description: "Drafting captions + image — usually ~25 seconds. You'll see it in the Content tab.",
        duration: 30000,
      });
      setTimeout(() => {
        toast.dismiss(tId);
        toast.success("Your first content is ready for review.", {
          description: "Open the Content tab to approve, edit, or schedule it.",
          duration: 8000,
          action: {
            label: "Open Content",
            onClick: () => {
              window.dispatchEvent(new CustomEvent("dashboard-navigate", { detail: "content" }));
            },
          },
        });
      }, 28000);
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("welcome");
        window.history.replaceState({}, "", url.toString());
      }, 100);
    }
  };

  const dismissSilent = () => dismiss(false);
  const dismissWithPayoff = () => dismiss(true);

  const meta = useMemo<BusinessLikeMeta>(() => {
    const md = (user?.user_metadata || {}) as Record<string, unknown>;
    let onboarding: Record<string, unknown> = {};
    try {
      const raw = localStorage.getItem("maroa-onboarding-v3");
      if (raw) {
        const parsed = JSON.parse(raw);
        onboarding = (parsed?.form as Record<string, unknown>) || parsed || {};
      }
    } catch {
      onboarding = {};
    }
    return {
      business_name:
        (md.business_name as string) ||
        (onboarding.business_name as string) ||
        undefined,
      industry: (onboarding.industry as string) || undefined,
      city: (onboarding.city as string) || undefined,
      country: (onboarding.country as string) || undefined,
    };
  }, [user]);

  const steps = useMemo(() => buildSteps(meta), [meta]);

  if (!show) return null;

  const firstName = user?.user_metadata?.first_name || "";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md"
        onClick={phase === "intro" ? dismissSilent : undefined}
      />

      {phase === "intro" && (
        <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
          <button
            onClick={dismissSilent}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Welcome to maroa.ai{firstName ? `, ${firstName}` : ""}!
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your AI marketing engine is set up and starting to work. Here's what
              happens next — no action needed from you:
            </p>
          </div>

          <div className="mb-6 space-y-4">
            {[
              {
                icon: Clock,
                label: "Right now",
                desc: "AI is reading your reviews, locking in your brand voice, and drafting your first content",
              },
              {
                icon: Calendar,
                label: "Next 24 hours",
                desc: "Your first social posts arrive in your inbox for one-click approval",
              },
              {
                icon: BarChart3,
                label: "First Sunday",
                desc: "AI Brain delivers competitor analysis + SEO audit + the week's plan",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={() => setPhase("live")} className="w-full h-11 group">
            Watch your AI team get to work
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <button
            onClick={dismissSilent}
            className="mt-2 block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Skip — take me straight to the dashboard
          </button>
        </div>
      )}

      {phase === "live" && (
        <div className="relative w-full max-w-lg animate-in zoom-in-95 fade-in duration-300">
          <button
            onClick={dismissSilent}
            className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <LiveAgentActivityFeed
            steps={steps}
            ctaLabel="Show me what my AI built"
            onComplete={dismissWithPayoff}
          />
        </div>
      )}
    </div>
  );
}
