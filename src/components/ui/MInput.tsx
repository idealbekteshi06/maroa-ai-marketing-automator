import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface MInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
}

export const MInput = forwardRef<HTMLInputElement, MInputProps>(
  ({ label, helper, error, success, icon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-lg)]",
              "px-4 py-3 text-[var(--text-primary)]",
              "placeholder:text-[var(--text-disabled)]",
              "transition-all focus:outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:shadow-[var(--shadow-focus)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-[var(--error)] bg-[var(--error-subtle)]",
              success && "border-[var(--success)]",
              icon && "pl-11",
              className
            )}
            style={{ transitionDuration: "var(--transition-fast)" }}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
        {!error && helper && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-[var(--text-muted)]">
            {helper}
          </p>
        )}
      </div>
    );
  }
);
MInput.displayName = "MInput";
