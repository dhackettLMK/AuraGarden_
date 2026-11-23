"use client";

import { Oscar, type OscarPose } from "@/components/oscar/Oscar";
import { cn } from "@/lib/cn";

/** Every empty state has Oscar and a real line of copy (brief 2.12). */
export function EmptyState({
  title,
  line,
  pose = "thinking",
  children,
  className,
  size = 96,
}: {
  title: string;
  line?: string;
  pose?: OscarPose;
  children?: React.ReactNode;
  className?: string;
  size?: number;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      <div className="relative">
        <div className="absolute inset-x-2 bottom-0 h-3 rounded-[50%] bg-ink/8 blur-[2px]" aria-hidden="true" />
        <Oscar size={size} pose={pose} />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
      {line && <p className="mt-1.5 max-w-xs text-[15px] text-ink-muted">{line}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}
