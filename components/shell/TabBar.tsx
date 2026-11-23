"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { DEFAULT_TABS, moduleLabel } from "@/lib/data/settings";
import { useSettings } from "@/lib/hooks";
import { useUI } from "@/lib/ui-store";
import { cn } from "@/lib/cn";
import { NAV, isActive } from "./nav";

/** Phone tab bar: four tabs she chooses plus a raised centre + (brief 5). */
export function TabBar() {
  const pathname = usePathname();
  const settings = useSettings();
  const openQuickAdd = useUI((s) => s.openQuickAdd);
  const tabs = (settings?.tabs?.length === 4 ? settings.tabs : DEFAULT_TABS).slice(0, 4);
  const items = [tabs[0], tabs[1], null, tabs[2], tabs[3]];
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(10px,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="relative mx-auto flex h-[68px] max-w-md items-stretch rounded-[26px] bg-surface/95 px-1 shadow-[0_-1px_0_var(--line),0_10px_30px_var(--shadow-tint-strong)] ring-1 ring-line backdrop-blur">
        {items.map((key, i) =>
          key === null ? (
            <div key="plus" className="flex flex-1 items-start justify-center">
              <button
                onClick={() => openQuickAdd()}
                aria-label="Quick add"
                className="relative -mt-5 inline-flex h-[62px] w-[62px] items-center justify-center rounded-full bg-primary text-primary-ink shadow-[0_8px_20px_var(--shadow-tint-strong),0_0_0_5px_var(--background)] transition-transform active:scale-90"
              >
                <Plus size={28} strokeWidth={2.25} />
              </button>
            </div>
          ) : (
            <TabLink key={key + i} href={NAV[key].href} label={moduleLabel(settings, key)} active={isActive(pathname, NAV[key].href)} icon={NAV[key].icon} />
          ),
        )}
      </div>
    </nav>
  );
}

function TabLink({
  href,
  label,
  active,
  icon: Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[12px] font-semibold transition-colors",
        active ? "text-primary-strong dark:text-primary" : "text-ink-muted",
      )}
    >
      {active && (
        <motion.span
          layoutId="tab-pill"
          className="absolute inset-x-2 inset-y-2 rounded-2xl bg-primary-soft"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      <span className="relative">
        <Icon size={22} strokeWidth={active ? 2.1 : 1.75} />
      </span>
      <span className="relative max-w-[72px] truncate">{label}</span>
    </Link>
  );
}
