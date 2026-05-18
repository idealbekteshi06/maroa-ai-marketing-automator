import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <header className="flex items-end justify-between gap-6 pb-8">
      <div>
        <h1 className="text-title-1 m-tnum">{title}</h1>
        {subtitle && (
          <p className="text-body mt-2" style={{ color: "hsl(var(--m-muted-foreground))" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}
