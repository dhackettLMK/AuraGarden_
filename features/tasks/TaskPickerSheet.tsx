"use client";

import { CalendarDays, Inbox, Sun, Sunrise, CalendarRange, XCircle } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ProjectIcon } from "@/components/icons/ProjectIcon";
import { addDays, todayKey, weekStart } from "@/lib/day";
import { friendlyDay } from "@/lib/dates";
import { useProjects } from "@/lib/hooks";
import { updateTask } from "@/lib/data/tasks";
import { toast } from "@/components/ui/toast-store";
import { useTaskPicker } from "./picker-store";

/** Schedule and Move pickers, shared by swipe actions, menus and bulk edit. */
export function TaskPickerSheet() {
  const { kind, task, bulkIds, close } = useTaskPicker();
  const projects = useProjects() ?? [];
  const [custom, setCustom] = useState("");
  const ids = bulkIds ?? (task ? [task.id] : []);
  const today = todayKey();

  async function setDate(d: string | null) {
    for (const id of ids) await updateTask(id, { dueDate: d, ...(d ? {} : { dueTime: null }) });
    toast(d ? `Scheduled for ${friendlyDay(d, today).toLowerCase()}` : "Date cleared");
    close();
  }
  async function setProject(projectId: string | null) {
    for (const id of ids) await updateTask(id, { projectId, sectionId: projectId ? null : "sec_mylist_today" });
    toast(projectId ? `Moved to ${projects.find((p) => p.id === projectId)?.name}` : "Moved to My List");
    close();
  }

  const nextMonday = addDays(weekStart(today), 7);
  const options = [
    { label: "Today", day: today, icon: Sun },
    { label: "Tomorrow", day: addDays(today, 1), icon: Sunrise },
    { label: "Next week", day: nextMonday, icon: CalendarRange },
  ];

  return (
    <Sheet open={kind !== null} onOpenChange={(v) => !v && close()} title={kind === "move" ? "Move to" : "When?"} size="sm">
      {kind === "schedule" && (
        <div className="space-y-2">
          {options.map((o) => (
            <button key={o.label} onClick={() => setDate(o.day)} className="flex h-13 w-full items-center gap-3 rounded-2xl bg-surface-sunk px-4 text-left font-semibold hover:bg-primary-soft">
              <o.icon size={20} className="text-primary" /> {o.label}
              <span className="ml-auto text-sm font-medium text-ink-muted">{friendlyDay(o.day, today) === o.label ? "" : friendlyDay(o.day, today)}</span>
            </button>
          ))}
          <form
            className="flex gap-2 pt-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (custom) void setDate(custom);
            }}
          >
            <Input type="date" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Pick a date" className="flex-1" />
            <Button type="submit" disabled={!custom}>
              <CalendarDays size={18} /> Set
            </Button>
          </form>
          <button onClick={() => setDate(null)} className="flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-ink-muted hover:bg-surface-sunk">
            <XCircle size={16} /> No date
          </button>
        </div>
      )}
      {kind === "move" && (
        <div className="space-y-1.5">
          <button onClick={() => setProject(null)} className="flex h-13 w-full items-center gap-3 rounded-2xl bg-surface-sunk px-3 text-left font-semibold hover:bg-primary-soft">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-surface text-primary">
              <Inbox size={18} />
            </span>
            My List
          </button>
          {projects.map((p) => (
            <button key={p.id} onClick={() => setProject(p.id)} className="flex h-13 w-full items-center gap-3 rounded-2xl bg-surface-sunk px-3 text-left font-semibold hover:bg-primary-soft">
              <ProjectIcon project={p} size={32} />
              {p.name}
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
