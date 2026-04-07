import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

interface MButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconOnly?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[var(--brand)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--brand-hover)] active:scale-[0.97] focus-visible:shadow-[var(--shadow-focus)]",
  secondary: "bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]",
  ghost: "text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]",
  danger: "bg-[var(--error-subtle)] text-[var(--error)] border border-[var(--error)]/20 hover:bg-[var(--error)] hover:text-white",
  success: "bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success)]/20 hover:bg-[var(--success)] hover:text-white",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "px-2.5 py-1 text-xs rounded-[var(--radius-sm)] gap-1",
  sm: "px-3.5 py-1.5 text-sm rounded-[var(--radius-md)] gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-[var(--radius-lg)] gap-2",
  lg: "px-6 py-3 text-base rounded-[var(--radius-lg)] gap-2",
  xl: "px-8 py-3.5 text-base rounded-[var(--radius-xl)] gap-2.5",
};

export const MButton = React.forwardRef<HTMLButtonElement, MButtonProps>(
  ({ variant = "primary", size = "md", loading, iconOnly, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          iconOnly && "p-2.5 aspect-square",
          className
        )}
        style={{ transitionDuration: "var(--transition-fast)" }}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
MButton.displayName = "MButton";
