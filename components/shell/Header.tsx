"use client";

import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/lib/db";
import { greetingFor } from "@/lib/day";
import { moduleLabel } from "@/lib/data/settings";
import { useNow, useSettings } from "@/lib/hooks";
import { useUI } from "@/lib/ui-store";
import { AuraPill, StreakSun, SyncCloud } from "./AuraPill";
import { routeKey } from "./nav";

function useTitle() {
  const pathname = usePathname();
  const settings = useSettings();
  const now = useNow();
  const segs = pathname.split("/").filter(Boolean);
  const detailId = segs.length === 2 ? segs[1] : null;
  const detail = useLiveQuery(async () => {
    if (!detailId) return null;
    const db = getDB();
    if (segs[0] === "projects") return (await db.projects.get(detailId))?.name ?? null;
    if (segs[0] === "people") return (await db.contacts.get(detailId))?.name ?? null;
    if (segs[0] === "thoughts") return (await db.thoughts.get(detailId))?.title || "Thought";
    return null;
  }, [detailId, segs[0]]);
  const key = routeKey(pathname);
  if (key === "home") {
    const name = settings?.displayName;
    return { title: greetingFor(now, settings?.timezone), name, greeting: true };
  }
  if (detail) return { title: detail, name: null, greeting: false };
  if (key === "settings") return { title: "Settings", name: null, greeting: false };
  if (key) return { title: moduleLabel(settings, key), name: null, greeting: false };
  return { title: "AuraGarden", name: null, greeting: false };
}

export function Header() {
  const { title, name, greeting } = useTitle();
  const setMore = useUI((s) => s.setMoreOpen);
  return (
    <header className="sticky top-0 z-30 bg-background/88 pt-safe backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-2 px-4 md:px-8">
        <h1
          className={`min-w-0 flex-1 truncate font-display font-semibold ${greeting ? "text-[20px] md:text-[28px]" : "text-[22px] md:text-[28px]"}`}
        >
          {title}
          {name && <span className="hidden sm:inline">, {name}</span>}
        </h1>
        <SyncCloud />
        <StreakSun />
        <AuraPill />
        <button
          onClick={() => setMore(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunk md:hidden"
          aria-label="More"
        >
          <LayoutGrid size={20} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
