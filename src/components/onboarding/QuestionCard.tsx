import type { ReactNode } from "react";

interface QuestionCardProps {
  heading: string;
  description?: string;
  children: ReactNode;
}

export default function QuestionCard({ heading, description, children }: QuestionCardProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.025em] text-foreground" style={{ textWrap: "balance" }}>
          {heading}
        </h2>
        {description && (
          <p className="mt-3 text-[17px] leading-[1.55] text-muted-foreground" style={{ maxWidth: "52ch" }}>
            {description}
          </p>
        )}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
