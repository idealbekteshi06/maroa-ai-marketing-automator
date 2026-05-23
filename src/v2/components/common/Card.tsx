import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

/** Calm B2B card — flat, hairline border, no glass, no shadow theatre. */
export function Card({ title, action, children, className = "", padded = true }: CardProps) {
  return (
    <section
      className={`rounded-xl ${className}`}
      style={{
        background: "hsl(var(--m-surface-elevated))",
        border: "1px solid hsl(var(--m-border-subtle))",
      }}
    >
      {(title || action) && (
        <header
          className="flex items-center justify-between px-5 h-12"
          style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}
        >
          {title && <h2 className="text-[13px] font-semibold">{title}</h2>}
          {action}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

interface PillProps {
  tone?: "neutral" | "success" | "warning" | "info" | "muted";
  children: ReactNode;
}
export function Pill({ tone = "neutral", children }: PillProps) {
  const map = {
    neutral: { bg: "hsl(var(--m-foreground) / 0.06)", fg: "hsl(var(--m-foreground))" },
    success: { bg: "hsl(var(--m-success) / 0.1)", fg: "hsl(var(--m-success))" },
    warning: { bg: "hsl(var(--m-warning) / 0.12)", fg: "hsl(var(--m-warning))" },
    info: { bg: "hsl(var(--m-info) / 0.1)", fg: "hsl(var(--m-info))" },
    muted: { bg: "hsl(var(--m-surface))", fg: "hsl(var(--m-muted-foreground))" },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium"
      style={{ background: map.bg, color: map.fg }}
    >
      {children}
    </span>
  );
}

interface BtnProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  onClick?: () => void;
  children: ReactNode;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}
export function Btn({
  variant = "secondary",
  size = "sm",
  onClick,
  children,
  type = "button",
  className = "",
  disabled,
}: BtnProps) {
  const sizeCls = size === "sm" ? "h-8 px-3 text-[12px]" : "h-9 px-4 text-[13px]";
  const styles =
    variant === "primary"
      ? { background: "hsl(var(--m-foreground))", color: "hsl(var(--m-background))", border: "1px solid hsl(var(--m-foreground))" }
      : variant === "danger"
      ? { background: "hsl(var(--m-destructive) / 0.08)", color: "hsl(var(--m-destructive))", border: "1px solid hsl(var(--m-destructive) / 0.2)" }
      : variant === "ghost"
      ? { background: "transparent", color: "hsl(var(--m-muted-foreground))", border: "1px solid transparent" }
      : { background: "hsl(var(--m-surface-elevated))", color: "hsl(var(--m-foreground))", border: "1px solid hsl(var(--m-border-subtle))" };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-opacity hover:opacity-90 disabled:opacity-40 ${sizeCls} ${className}`}
      style={styles}
    >
      {children}
    </button>
  );
}
