interface TextInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: string;
  error?: string;
  required?: boolean;
  type?: "text" | "url";
}

export default function TextInput({ label, value, onChange, placeholder, help, error, required, type = "text" }: TextInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-[var(--brand)]">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-1 ${
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
