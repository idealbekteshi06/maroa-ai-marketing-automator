import React from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface MAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  imageUrl?: string;
  size?: AvatarSize;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const pastelColors = [
  { bg: "#DBEAFE", text: "#1E40AF" },
  { bg: "#FCE7F3", text: "#9D174D" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#E0E7FF", text: "#3730A3" },
  { bg: "#FEE2E2", text: "#991B1B" },
  { bg: "#CFFAFE", text: "#155E75" },
  { bg: "#F3E8FF", text: "#6B21A8" },
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export const MAvatar: React.FC<MAvatarProps> = ({
  name,
  imageUrl,
  size = "md",
  className,
  ...props
}) => {
  const colorIndex = hashName(name) % pastelColors.length;
  const color = pastelColors[colorIndex];

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full font-semibold shrink-0 overflow-hidden",
        sizeStyles[size],
        className
      )}
      style={!imageUrl ? { backgroundColor: color.bg, color: color.text } : undefined}
      aria-label={name}
      role="img"
      {...props}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
};
