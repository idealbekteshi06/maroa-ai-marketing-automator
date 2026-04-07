import React from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "raised" | "bordered" | "ghost";

interface MCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)]",
  raised: "bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-lg)]",
  bordered: "bg-transparent border border-[var(--border)]",
  ghost: "bg-transparent",
};

const paddingStyles: Record<string, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const MCard = React.forwardRef<HTMLDivElement, MCardProps>(
  ({ variant = "default", hoverable = true, padding = "md", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-xl)] transition-all",
          variantStyles[variant],
          paddingStyles[padding],
          hoverable && variant !== "ghost" && "hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)] hover:-translate-y-[1px]",
          className
        )}
        style={{ transitionDuration: "var(--transition-base)" }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MCard.displayName = "MCard";
