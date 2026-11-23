"use client";

import { useEffect, useState } from "react";
import { MapPin, Repeat, Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { createEvent, updateEvent } from "@/lib/data/events";
import { softDelete } from "@/lib/data/core";
import { undoToast } from "@/components/ui/toast-store";
import { useUI } from "@/lib/ui-store";
import { recurrenceLabel } from "@/lib/data/tasks";
import type { Project, Recurrence } from "@/lib/types";
import type { CalItem } from "./data";

export type EventDraft = { item: CalItem } | { day: string; hour: number };

function toLocal(ms: number) {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function EventSheet({ draft, onClose, projects }: { draft: EventDraft | null; onClose: () => void; projects: Project[] }) {
  const openTask = useUI((s) => s.openTask);
  const item = draft && "item" in draft ? draft.item : null;

  // Tasks open in the task editor.
  useEffect(() => {
    if (item?.task) {
      openTask(item.task);
      onClose();
    }
  }, [item, openTask, onClose]);
  if (item?.task) return null;

  if (item?.kind === "feed") {
    const f = item.feed!;
    return (
      <Sheet open onOpenChange={(v) => !v && onClose()} title={item.title} description={f.subscription.name} size="sm">
        <div className="space-y-2 text-[15px]">
          <p className="font-semibold">
            {item.allDay
              ? new Date(item.start).toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" })
              : `${new Date(item.start).toLocaleString("en-IE", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} – ${new Date(item.end).toLocaleTimeString("en-IE", { hour: "numeric", minute: "2-digit" })}`}
          </p>
          {item.location && (
            <p className="flex items-center gap-1.5 text-ink-muted">
              <MapPin size={15} /> {item.location}
            </p>
          )}
          <p className="pt-2 text-sm text-ink-muted">This comes from a calendar you subscribed to, so it&apos;s read-only here.</p>
        </div>
      </Sheet>
    );
  }
  return draft ? <EventForm key={item?.key ?? "new"} draft={draft} onClose={onClose} projects={projects} /> : null;
}

function EventForm({ draft, onClose, projects }: { draft: EventDraft; onClose: () => void; projects: Project[] }) {
  const existing = "item" in draft ? draft.item.event! : null;
  const defaultStart = "day" in draft ? new Date(`${draft.day}T${String(Math.min(22, draft.hour)).padStart(2, "0")}:00:00`).getTime() : 0;
  const [title, setTitle] = useState(existing?.title ?? "");
  const [allDay, setAllDay] = useState(existing?.allDay ?? false);
  const [start, setStart] = useState(toLocal(existing?.start ?? defaultStart));
  const [end, setEnd] = useState(toLocal(existing?.end ?? defaultStart + 3_600_000));
  const [location, setLocation] = useState(existing?.location ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [projectId, setProjectId] = useState(existing?.projectId ?? "");
  const [rec, setRec] = useState<string>(existing?.recurrence?.kind ?? "none");

  async function save() {
    if (!title.trim()) return;
    let s = new Date(start).getTime();
    let e = new Date(end).getTime();
    if (allDay) {
      s = new Date(`${start.slice(0, 10)}T00:00:00`).getTime();
      e = s + 86_400_000;
    }
    if (e <= s) e = s + 3_600_000;
    const recurrence: Recurrence | null = rec === "none" ? null : rec === "weekly" ? { kind: "weekly", days: [new Date(s).getDay()] } : ({ kind: rec } as Recurrence);
    const data = { title: title.trim(), start: s, end: e, allDay, location, notes, projectId: projectId || null, recurrence };
    if (existing) await updateEvent(existing.id, data);
    else await createEvent(data);
    onClose();
  }

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()} title={existing ? "Edit event" : "New event"} size="md">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Input autoFocus={!existing} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's on?" aria-label="Title" className="font-display text-[19px] font-semibold" />
        <div className="flex items-center justify-between rounded-2xl bg-surface-sunk px-4 py-3">
          <span className="font-semibold">All day</span>
          <Switch checked={allDay} onCheckedChange={setAllDay} label="All day" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="ev-start">Starts</Label>
            <Input id="ev-start" type={allDay ? "date" : "datetime-local"} value={allDay ? start.slice(0, 10) : start} onChange={(e) => setStart(allDay ? `${e.target.value}T09:00` : e.target.value)} />
          </div>
          {!allDay && (
            <div>
              <Label htmlFor="ev-end">Ends</Label>
              <Input id="ev-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          )}
          <div>
            <Label htmlFor="ev-loc">Where</Label>
            <Input id="ev-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label htmlFor="ev-proj">Project</Label>
            <select id="ev-proj" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="h-12 w-full rounded-[14px] bg-surface-sunk px-3 outline-none focus:ring-2 focus:ring-primary/60">
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ev-rec">
              <span className="inline-flex items-center gap-1">
                <Repeat size={14} /> Repeat
              </span>
            </Label>
            <select id="ev-rec" value={rec} onChange={(e) => setRec(e.target.value)} className="h-12 w-full rounded-[14px] bg-surface-sunk px-3 outline-none focus:ring-2 focus:ring-primary/60">
              {(["none", "daily", "weekdays", "weekly", "monthly"] as const).map((k) => (
                <option key={k} value={k}>
                  {k === "none" ? "Doesn't repeat" : k === "weekly" ? "Every week" : recurrenceLabel({ kind: k } as Recurrence)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="ev-notes">Notes</Label>
          <Textarea id="ev-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 border-t border-line pt-4">
          {existing && (
            <Button
              variant="ghost"
              className="text-danger hover:text-danger"
              onClick={async () => {
                const undo = await softDelete("events", existing.id);
                undoToast(`Deleted ${existing.title}`, undo);
                onClose();
              }}
            >
              <Trash2 size={18} /> Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button type="submit" disabled={!title.trim()}>
            {existing ? "Save" : "Add event"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
