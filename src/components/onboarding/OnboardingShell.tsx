import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import ProgressBar from "./ProgressBar";

interface OnboardingShellProps {
  block: number;
  totalBlocks: number;
  onBack: () => void;
  onContinue: () => void;
  continueDisabled: boolean;
  continueLabel?: string;
  loading?: boolean;
  children: ReactNode;
}

export default function OnboardingShell({
  block,
  totalBlocks,
  onBack,
  onContinue,
  continueDisabled,
  continueLabel = "Continue",
  loading,
  children,
}: OnboardingShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ProgressBar current={block} total={totalBlocks} />

      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col px-6 pb-32 pt-8 md:pt-12">
        {/* Back button */}
        {block > 0 && (
          <button
            type="button"
            onClick={onBack}
            className="mb-8 flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        {/* Content with transition */}
        <div key={block} className="flex-1 animate-[fadeSlideIn_200ms_ease]">
          {children}
        </div>
      </div>

      {/* Sticky continue bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-default)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[640px] items-center justify-end px-6 py-4">
          <button
            type="button"
            onClick={onContinue}
            disabled={continueDisabled || loading}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-7 py-[15px] text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(10,132,255,0.25)] transition-all hover:-translate-y-px hover:bg-[var(--brand-hover)] hover:shadow-[0_4px_12px_rgba(10,132,255,0.3)] disabled:pointer-events-none disabled:opacity-40"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
