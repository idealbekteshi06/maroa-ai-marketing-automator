import { Plus, X } from "lucide-react";

interface DynamicListProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  error?: string;
  required?: boolean;
}

export default function DynamicList({ label, items, onChange, placeholder, min = 1, max = 5, error, required }: DynamicListProps) {
  const update = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };

  const add = () => {
    if (items.length < max) onChange([...items, ""]);
  };

  const remove = (i: number) => {
    if (items.length > min) onChange(items.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <label className="mb-3 block text-[13px] font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-[var(--brand)]">*</span>}
      </label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-xl border border-[var(--border-default)] bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all hover:border-[var(--border-strong)] focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/20"
            />
            {items.length > min && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-[var(--bg-muted)] hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      {items.length < max && (
        <button
          type="button"
          onClick={add}
          className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-[var(--brand)] transition-colors hover:text-[var(--brand-hover)]"
        >
          <Plus className="h-3.5 w-3.5" /> Add another
        </button>
      )}
      {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
