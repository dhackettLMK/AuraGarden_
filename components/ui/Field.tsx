"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const inputClass =
  "w-full rounded-[14px] bg-surface-sunk px-4 py-3 text-base text-ink placeholder:text-ink-faint outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-2 focus:ring-primary/60";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(inputClass, "min-h-24 resize-y", className)} {...props} />;
  },
);

export function Label({ children, htmlFor, className }: { children: React.ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-semibold text-ink-muted", className)}>
      {children}
    </label>
  );
}

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="mt-1.5 text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}
