import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MTooltipProps {
  content: string;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const MTooltip: React.FC<MTooltipProps> = ({
  content,
  children,
  position = "top",
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const id = useRef(`tooltip-${Math.random().toString(36).slice(2)}`).current;

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), 200);
  }, []);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const positionStyles: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {React.cloneElement(children, { "aria-describedby": visible ? id : undefined })}
      {visible && (
        <div
          id={id}
          role="tooltip"
          className={cn(
            "absolute whitespace-normal max-w-[200px] px-2.5 py-1.5 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--text-primary)] text-[var(--text-inverse)] shadow-[var(--shadow-md)] animate-fade-in pointer-events-none",
            positionStyles[position],
            className
          )}
          style={{ zIndex: 600 }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
