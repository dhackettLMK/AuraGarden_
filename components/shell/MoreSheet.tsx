"use client";

import Link from "next/link";
import { Sheet } from "@/components/ui/Sheet";
import { moduleLabel } from "@/lib/data/settings";
import { useSettings } from "@/lib/hooks";
import { useUI } from "@/lib/ui-store";
import type { TabKey } from "@/lib/types";
import { NAV, SETTINGS_NAV } from "./nav";

const ORDER: TabKey[] = ["home", "projects", "my-list", "tasks", "calendar", "thoughts", "people", "garden", "trophies"];

export function MoreSheet() {
  const open = useUI((s) => s.moreOpen);
  const setOpen = useUI((s) => s.setMoreOpen);
  const settings = useSettings();
  const tabs = new Set(settings?.tabs ?? []);
  const items = [...ORDER.filter((k) => !tabs.has(k)), ...ORDER.filter((k) => tabs.has(k))];
  return (
    <Sheet open={open} onOpenChange={setOpen} title="Everything" size="sm">
      <ul className="grid grid-cols-3 gap-2.5">
        {items.map((key) => {
          const { href, icon: Icon } = NAV[key];
          return (
            <li key={key}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className="flex aspect-[1.05] flex-col items-center justify-center gap-2 rounded-[20px] bg-surface-sunk text-[14px] font-semibold text-ink transition active:scale-95"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-primary shadow-[var(--shadow-soft)]">
                  <Icon size={22} strokeWidth={1.9} />
                </span>
                {moduleLabel(settings, key)}
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href={SETTINGS_NAV.href}
            onClick={() => setOpen(false)}
            className="flex aspect-[1.05] flex-col items-center justify-center gap-2 rounded-[20px] bg-surface-sunk text-[14px] font-semibold text-ink transition active:scale-95"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-primary shadow-[var(--shadow-soft)]">
              <SETTINGS_NAV.icon size={22} strokeWidth={1.9} />
            </span>
            Settings
          </Link>
        </li>
      </ul>
    </Sheet>
  );
}
