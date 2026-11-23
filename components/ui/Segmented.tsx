"use client";

import { cn } from "@/lib/cn";

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  label,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; aria?: string }[];
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-full bg-surface-sunk p-1", className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          aria-label={o.aria}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-all",
            size === "sm" ? "h-8 px-3 text-[13px]" : "h-9 px-3.5 text-sm",
            o.value === value ? "bg-surface text-ink shadow-[0_1px_3px_var(--shadow-tint-strong)]" : "text-ink-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
