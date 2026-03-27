import { CheckCircle2, Circle, User, Share2, CreditCard, FileText, Flag } from "lucide-react";

interface SetupProgressProps {
  business: any;
  photoCount: number;
  contentCount: number;
  approvedCount: number;
}

export default function SetupProgress({ business, photoCount, contentCount, approvedCount }: SetupProgressProps) {
  const steps = [
    {
      label: "Profile complete",
      icon: User,
      done: !!(business?.business_name && business?.industry),
    },
    {
      label: "Social accounts connected",
      icon: Share2,
      done: !!business?.social_accounts_connected || !!business?.meta_access_token,
    },
    {
      label: "Budget set",
      icon: CreditCard,
      done: (business?.daily_budget ?? 0) > 0,
    },
    {
      label: "First content approved",
      icon: FileText,
      done: approvedCount > 0,
    },
    {
      label: "Onboarding complete",
      icon: Flag,
      done: !!business?.onboarding_complete,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  if (percentage === 100) return null;

  const motivatingText =
    percentage === 0
      ? "Let's get your marketing engine running"
      : percentage <= 40
      ? "Great start — keep going!"
      : percentage <= 80
      ? "Almost there!"
      : "Your marketing is fully automated! 🎉";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Setup Progress</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{motivatingText}</p>
        </div>
        <span className="text-lg font-bold text-primary">{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-border overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step icons */}
      <div className="flex items-center justify-between">
        {steps.map((step) => (
          <div key={step.label} className="flex flex-col items-center gap-1.5">
            {step.done ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/30" />
            )}
            <span className={`text-[10px] text-center max-w-[60px] leading-tight ${step.done ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
