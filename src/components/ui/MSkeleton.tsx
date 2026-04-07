import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

const Base: React.FC<SkeletonProps> = ({ className, style }) => (
  <div className={cn("skeleton", className)} style={style} />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className }) => (
  <div className={cn("space-y-2.5", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Base key={i} className={cn("h-3.5", i === lines - 1 ? "w-3/4" : "w-full")} />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("rounded-[var(--radius-xl)] border border-[var(--border)] p-6 space-y-4", className)}>
    <Base className="h-4 w-1/3" />
    <Base className="h-8 w-1/2" />
    <div className="space-y-2">
      <Base className="h-3 w-full" />
      <Base className="h-3 w-5/6" />
    </div>
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({ size = 40, className }) => (
  <Base className={cn("rounded-full shrink-0", className)} style={{ width: size, height: size }} />
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({ rows = 5, cols = 4, className }) => (
  <div className={cn("space-y-3", className)}>
    <div className="flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Base key={i} className="h-3.5 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4">
        {Array.from({ length: cols }).map((_, c) => (
          <Base key={c} className="h-10 flex-1 rounded-[var(--radius-md)]" />
        ))}
      </div>
    ))}
  </div>
);

export { Base as Skeleton };
