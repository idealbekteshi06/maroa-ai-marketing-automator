interface ChipSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  min?: number;
  max?: number;
  error?: string;
  required?: boolean;
}

export default function ChipSelect({ label, options, selected, onChange, min, max, error, required }: ChipSelectProps) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      if (max && selected.length >= max) return;
      onChange([...selected, opt]);
    }
  };

  return (
    <div>
      <label className="mb-3 block text-[13px] font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-[var(--brand)]">*</span>}
        {min && <span className="ml-1 text-[11px] text-muted-foreground">(select at least {min})</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-150 ${
                active
                  ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-[0_1px_2px_rgba(10,132,255,0.25)]"
                  : "border-[var(--border-default)] bg-white text-muted-foreground hover:border-[var(--border-strong)] hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
