import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useMaroaToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useMaroaToast must be used within MToastProvider");
  return ctx;
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />,
  error: <XCircle className="h-5 w-5 text-[var(--error)]" />,
  warning: <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />,
  info: <Info className="h-5 w-5 text-[var(--info)]" />,
};

const progressColors: Record<ToastType, string> = {
  success: "bg-[var(--success)]",
  error: "bg-[var(--error)]",
  warning: "bg-[var(--warning)]",
  info: "bg-[var(--info)]",
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const duration = toast.duration || 4000;
  const [progress, setProgress] = useState(100);
  const [exiting, setExiting] = useState(false);
  const startRef = useRef(Date.now());
  const frameRef = useRef<number>();

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        setExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [duration, toast.id, onRemove]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={cn(
        "relative w-80 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] overflow-hidden",
        !exiting && "animate-slide-right"
      )}
      style={exiting ? { animation: "slideOutRight 300ms ease forwards", opacity: 0, transform: "translateX(100%)" } : undefined}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)]">{toast.title}</p>
          {toast.description && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{toast.description}</p>}
        </div>
        <button
          onClick={handleClose}
          className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="h-0.5 w-full bg-[var(--bg-muted)]">
        <div
          className={cn("h-full transition-none", progressColors[toast.type])}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const MToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-4), { ...t, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        className="fixed top-4 right-4 flex flex-col gap-2"
        style={{ zIndex: 500 }}
        aria-label="Notifications"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
