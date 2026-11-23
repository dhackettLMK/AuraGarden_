"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * A round checkbox whose tick sprouts a leaf (brief 11.4). The fill and the
 * self-drawing checkmark happen at 0 ms, from local state.
 */
export function LeafCheckbox({
  checked,
  onChange,
  label,
  size = 28,
  color,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean, origin: { x: number; y: number }) => void;
  label: string;
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onChange(!checked, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      className={cn("relative inline-flex shrink-0 items-center justify-center rounded-full", className)}
      style={{ width: Math.max(44, size), height: Math.max(44, size), margin: -(Math.max(44, size) - size) / 2 }}
    >
      <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" className="overflow-visible">
        <motion.circle
          cx="14"
          cy="14"
          r="12"
          initial={false}
          animate={{
            fill: checked ? "var(--primary)" : "rgba(0,0,0,0)",
            stroke: checked ? "var(--primary)" : (color ?? "var(--ink-faint)"),
            scale: checked ? [1, 0.82, 1.06, 1] : 1,
          }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          strokeWidth="2"
          style={{ transformOrigin: "14px 14px" }}
        />
        <motion.path
          d="M8.2 14.4l3.8 3.8 7.6-8"
          fill="none"
          stroke="var(--primary-ink)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        />
        {/* the leaf that sprouts from the tick */}
        <motion.path
          d="M19.6 10.2c1.4-3.6 4.6-4.6 6.4-4-0.3 3-3.2 5-6.4 4z"
          fill="#9ACB7F"
          initial={false}
          animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 18, delay: checked ? 0.14 : 0 }}
          style={{ transformOrigin: "19.6px 10.2px" }}
        />
      </svg>
    </button>
  );
}
