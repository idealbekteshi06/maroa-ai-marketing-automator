import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon?: LucideIcon;
  title: string;
  helper?: string;
  cta?: ReactNode;
}

export function EmptyState({ icon: Icon, title, helper, cta }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-20 px-8 rounded-2xl"
      style={{
        background: "hsl(var(--m-surface))",
        border: "1px solid hsl(var(--m-border-subtle))",
      }}
    >
      {Icon && (
        <div
          className="mb-4 p-3 rounded-2xl"
          style={{ background: "hsl(var(--m-surface-elevated))" }}
        >
          <Icon size={28} strokeWidth={1.5} style={{ color: "hsl(var(--m-muted-foreground))" }} />
        </div>
      )}
      <h3 className="text-headline">{title}</h3>
      {helper && (
        <p
          className="text-body mt-2 max-w-md"
          style={{ color: "hsl(var(--m-muted-foreground))" }}
        >
          {helper}
        </p>
      )}
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}
