"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "soft" | "ghost" | "outline" | "danger" | "aura" | "plain";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-ink shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_6px_16px_var(--shadow-tint-strong)] hover:bg-primary-strong active:scale-[0.97]",
  soft: "bg-primary-soft text-primary-strong hover:brightness-[0.97] active:scale-[0.97] dark:text-primary",
  ghost: "text-ink-muted hover:bg-surface-sunk hover:text-ink active:scale-[0.97]",
  outline: "border border-line bg-surface text-ink hover:bg-surface-sunk active:scale-[0.97]",
  danger: "bg-danger text-white hover:brightness-95 active:scale-[0.97] dark:text-[#2a0f0d]",
  aura: "aura-bg text-[#3a2340] shadow-[var(--shadow-glow)] hover:brightness-105 active:scale-[0.97]",
  plain: "",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-13 px-6 text-base gap-2",
  icon: "h-11 w-11",
  "icon-sm": "h-9 w-9",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold transition-[transform,background-color,filter,color] duration-150 disabled:opacity-50 disabled:active:scale-100",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
