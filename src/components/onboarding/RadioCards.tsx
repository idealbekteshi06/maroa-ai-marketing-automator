import type { LucideIcon } from "lucide-react";

interface RadioOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface RadioCardsProps {
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  autoAdvance?: () => void;
}

export default function RadioCards({ label, options, value, onChange, error, required, autoAdvance }: RadioCardsProps) {
  const handleSelect = (v: string) => {
    onChange(v);
    if (autoAdvance) {
      setTimeout(autoAdvance, 600);
    }
  };

  return (
    <div>
      <label className="mb-3 block text-[13px] font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-[var(--brand)]">*</span>}
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`flex items-center gap-3.5 rounded-2xl border px-5 py-4 text-left transition-all duration-200 ${
                selected
                  ? "border-[var(--brand)] bg-[var(--brand-subtle)] shadow-[0_0_0_1px_var(--brand)] scale-[1.02]"
                  : "border-[var(--border-default)] bg-white hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-xs)]"
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                selected ? "bg-[var(--brand)] text-white" : "bg-[var(--bg-muted)] text-muted-foreground"
              }`}>
                <opt.icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <span className={`text-sm font-medium ${selected ? "text-[var(--brand)]" : "text-foreground"}`}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
