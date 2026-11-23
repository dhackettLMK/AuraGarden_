"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { ArchiveRestore, Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { getDB } from "@/lib/db";
import { purge, restore, TRASH_DAYS } from "@/lib/data/core";
import { relativeTime } from "@/lib/dates";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/toast-store";
import type { Collection } from "@/lib/types";

const KINDS: { c: Collection; label: string; name: (r: Record<string, unknown>) => string }[] = [
  { c: "tasks", label: "Task", name: (r) => String(r.title || "Untitled") },
  { c: "projects", label: "Project", name: (r) => String(r.name) },
  { c: "sections", label: "Section", name: (r) => String(r.name) },
  { c: "thoughts", label: "Thought", name: (r) => String(r.title || r.text || "Untitled thought").slice(0, 60) },
  { c: "contacts", label: "Person", name: (r) => String(r.name) },
  { c: "events", label: "Event", name: (r) => String(r.title) },
  { c: "catchups", label: "Catch-up", name: (r) => String(r.note || "Catch-up") },
  { c: "calendar_subscriptions", label: "Calendar", name: (r) => String(r.name) },
];

/** Trash keeps deleted items for 30 days (brief 6). */
export function TrashSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const items = useLiveQuery(async () => {
    const db = getDB();
    const out: { c: Collection; id: string; label: string; name: string; deletedAt: number }[] = [];
    for (const k of KINDS) {
      const rows = (await db[k.c].toArray()) as unknown as Record<string, unknown>[];
      for (const r of rows)
        if (r.deletedAt) out.push({ c: k.c, id: String(r.id), label: k.label, name: k.name(r), deletedAt: Number(r.deletedAt) });
    }
    return out.sort((a, b) => b.deletedAt - a.deletedAt);
  }, []);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Trash" description={`Deleted things stay here for ${TRASH_DAYS} days.`}>
      {items && items.length === 0 && <EmptyState title="Trash is empty" line="Nothing thrown out. Tidy garden." pose="proud" size={80} />}
      <ul className="space-y-2">
        {items?.map((it) => (
          <li key={`${it.c}:${it.id}`} className="flex items-center gap-2 rounded-2xl bg-surface-sunk py-2 pl-4 pr-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{it.name}</p>
              <p className="text-[13px] text-ink-muted">
                {it.label} · deleted {relativeTime(it.deletedAt)}
              </p>
            </div>
            <button
              onClick={async () => {
                await restore(it.c, it.id);
                toast("Restored");
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-primary hover:bg-surface"
            >
              <ArchiveRestore size={16} /> Restore
            </button>
            <button
              onClick={async () => {
                if (window.confirm(`Delete "${it.name}" forever?`)) await purge(it.c, it.id);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-danger"
              aria-label={`Delete ${it.name} forever`}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
