"use client";

import { cn } from "@/lib/cn";

export function Chip({
  children,
  active,
  onClick,
  className,
  color,
  as = "button",
  ...rest
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  color?: string;
  as?: "button" | "span";
} & Omit<React.HTMLAttributes<HTMLElement>, "onClick" | "color">) {
  const Cmp = as;
  return (
    <Cmp
      {...(as === "button" ? { type: "button" as const } : {})}
      onClick={onClick}
      aria-pressed={as === "button" && active !== undefined ? active : undefined}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-ink" : "bg-surface-sunk text-ink hover:bg-primary-soft",
        className,
      )}
      style={color && !active ? { boxShadow: `inset 0 0 0 1.5px ${color}33` } : undefined}
      {...rest}
    >
      {color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden="true" />}
      {children}
    </Cmp>
  );
}
