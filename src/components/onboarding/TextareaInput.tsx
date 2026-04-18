interface TextareaInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  rows?: number;
}

export default function TextareaInput({ label, value, onChange, placeholder, help, error, required, maxLength, rows = 3 }: TextareaInputProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="text-[13px] font-medium text-foreground">
          {label}{required && <span className="ml-0.5 text-[var(--brand)]">*</span>}
        </label>
        {maxLength && (
          <span className={`text-[11px] tabular-nums ${value.length > maxLength ? "text-red-500" : "text-muted-foreground"}`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-1 ${
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-200"
            : "border-[var(--border-default)] focus:border-[var(--brand)] focus:ring-[var(--brand)]/20 hover:border-[var(--border-strong)]"
        }`}
      />
      {help && !error && <p className="mt-1.5 text-[12px] text-muted-foreground">{help}</p>}
      {error && <p className="mt-1.5 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
