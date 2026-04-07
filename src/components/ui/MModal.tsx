import React, { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface MModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)]",
};

export const MModal: React.FC<MModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Tab" && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        const first = dialogRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocus.current?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 400 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className={cn(
          "relative w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-2xl)] animate-scale-in overflow-hidden flex flex-col",
          sizeStyles[size],
          "max-h-[85dvh]",
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between p-6 pb-0">
            <div>
              {title && <h2 id="modal-title" className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>}
              {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-[var(--radius-md)] p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close modal"
              style={{ transitionDuration: "var(--transition-fast)" }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="border-t border-[var(--border)] p-6 pt-4 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
