import React from "react";
import { cn } from "@/lib/utils";

interface MToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export const MToggle: React.FC<MToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled,
  size = "md",
}) => {
  const sizes = {
    sm: { track: "w-9 h-5", circle: "h-3.5 w-3.5", translate: "translate-x-4" },
    md: { track: "w-12 h-7", circle: "h-5 w-5", translate: "translate-x-5" },
    lg: { track: "w-14 h-8", circle: "h-6 w-6", translate: "translate-x-6" },
  };
  const s = sizes[size];

  return (
    <label className={cn("inline-flex items-start gap-3 cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
          s.track,
          checked ? "bg-[var(--brand)]" : "bg-[var(--border-strong)]"
        )}
        style={{ transitionDuration: "var(--transition-base)" }}
      >
        <span
          className={cn(
            "inline-block rounded-full bg-white shadow-sm transition-transform",
            s.circle,
            checked ? s.translate : "translate-x-1"
          )}
          style={{ transitionDuration: "var(--transition-spring)", transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
      </button>
      {(label || description) && (
        <div className="min-w-0">
          {label && <span className="text-sm font-medium text-[var(--text-primary)] block">{label}</span>}
          {description && <span className="text-xs text-[var(--text-muted)] block mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  );
};
