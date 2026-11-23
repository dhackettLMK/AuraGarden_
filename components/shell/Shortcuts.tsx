"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useUI } from "@/lib/ui-store";

const LIST: [string, string][] = [
  ["⌘/Ctrl K", "Quick add and search"],
  ["N", "Add a task"],
  ["G then H", "Go Home"],
  ["G then P", "Go to Projects"],
  ["G then C", "Go to Calendar"],
  ["G then G", "Go to the Garden"],
  ["?", "Show shortcuts"],
];

/** Desktop keyboard shortcuts (brief 5). */
export function Shortcuts() {
  const router = useRouter();
  const open = useUI((s) => s.shortcutsOpen);
  const setOpen = useUI((s) => s.setShortcutsOpen);
  const openQuickAdd = useUI((s) => s.openQuickAdd);
  const gAt = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openQuickAdd({ mode: "search" });
        return;
      }
      const el = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const k = e.key.toLowerCase();
      if (Date.now() - gAt.current < 900) {
        gAt.current = 0;
        const dest = { h: "/", p: "/projects", c: "/calendar", g: "/garden" }[k];
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
        return;
      }
      if (k === "g") gAt.current = Date.now();
      else if (k === "n") {
        e.preventDefault();
        openQuickAdd({ type: "task" });
      } else if (e.key === "?") setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, openQuickAdd, setOpen]);

  return (
    <Sheet open={open} onOpenChange={setOpen} title="Keyboard shortcuts" size="sm">
      <dl className="space-y-1">
        {LIST.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-xl px-2 py-2.5">
            <dt className="text-[15px]">{v}</dt>
            <dd>
              <kbd className="rounded-lg bg-surface-sunk px-2.5 py-1 font-sans text-sm font-semibold">{k}</kbd>
            </dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}
