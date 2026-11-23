"use client";

import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/cn";

export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;

export function MenuContent({ children, align = "end" }: { children: React.ReactNode; align?: "start" | "end" | "center" }) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        sideOffset={6}
        collisionPadding={12}
        className="popover z-[60] min-w-48 rounded-2xl bg-surface-raised p-1.5 text-ink shadow-[var(--shadow-lift)] ring-1 ring-line"
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

export function MenuItem({
  children,
  onSelect,
  danger,
  icon,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        "flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-xl px-3 text-[15px] outline-none data-[highlighted]:bg-surface-sunk",
        danger && "text-danger",
      )}
    >
      {icon && <span className="text-ink-muted [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>}
      {children}
    </DropdownMenu.Item>
  );
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-line" />;
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <DropdownMenu.Label className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{children}</DropdownMenu.Label>;
}
