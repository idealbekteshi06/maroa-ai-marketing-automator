import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "brand";
type BadgeSize = "sm" | "md";

interface MBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--bg-muted)] text-[var(--text-secondary)]",
  success: "bg-[var(--success-subtle)] text-[var(--success)]",
  warning: "bg-[var(--warning-subtle)] text-[var(--warning)]",
  error: "bg-[var(--error-subtle)] text-[var(--error)]",
  info: "bg-[var(--info-subtle)] text-[var(--info)]",
  brand: "bg-[var(--brand-dim)] text-[var(--brand)]",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-[var(--text-muted)]",
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  error: "bg-[var(--error)]",
  info: "bg-[var(--info)]",
  brand: "bg-[var(--brand)]",
};

export const MBadge: React.FC<MBadgeProps> = ({
  variant = "default",
  size = "sm",
  dot,
  className,
  children,
  ...props
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full font-medium",
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
      variantStyles[variant],
      className
    )}
    {...props}
  >
    {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />}
    {children}
  </span>
);
