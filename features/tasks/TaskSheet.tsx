"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { TagInput } from "@/components/ui/TagInput";
import { RichText } from "@/components/editor/RichText";
import { getDB } from "@/lib/db";
import { alive, byOrder } from "@/lib/data/core";
import { allTags, recurrenceLabel, updateTask } from "@/lib/data/tasks";
import { useProjects, useTask } from "@/lib/hooks";
import { useUI } from "@/lib/ui-store";
import { completeTask, toggleSubtask, uncompleteTask } from "@/lib/game/actions";
import { uid } from "@/lib/data/core";
import type { Priority, Recurrence, Task, TaskStatus } from "@/lib/types";
import { useTaskActions } from "./useTaskActions";
import { LeafCheckbox } from "./LeafCheckbox";
import { dayName } from "@/lib/dates";

/** The full task editor (brief 6.3). Every field saves as she goes. */
export function TaskSheet() {
  const editing = useUI((s) => s.editingTask);
  const openTask = useUI((s) => s.openTask);
  const task = useTask(editing?.id);
  const open = !!editing;
  return (
    <Sheet open={open} onOpenChange={(v) => !v && openTask(null)} title={task?.status === "done" ? "Done task" : "Task"} size="lg" initialFocus={false}>
      {task ? <TaskForm task={task} onClose={() => openTask(null)} /> : <div className="h-64" />}
    </Sheet>
  );
}

function toLocalInput(ms: number | null) {
  if (!ms) return "";
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function TaskForm({ task, onClose }: { task: Task; onClose: () => void }) {
  const projects = useProjects() ?? [];
  const sections = useLiveQuery(
    async () => alive(await getDB().sections.toArray()).filter((s) => s.projectId === task.projectId).sort(byOrder),
    [task.projectId],
  );
  const tags = useLiveQuery(() => allTags(), []) ?? [];
  const { remove } = useTaskActions();
  const [title, setTitle] = useState(task.title);
  const [subDraft, setSubDraft] = useState("");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const save = (changes: Partial<Task>) => updateTask(task.id, changes);

  useEffect(() => () => {
    if (notesTimer.current) clearTimeout(notesTimer.current);
  }, []);

  const recKind = task.recurrence?.kind ?? "none";
  const recurrenceOptions = useMemo(
    () => [
      { value: "none", label: "Doesn't repeat" },
      { value: "daily", label: "Every day" },
      { value: "weekdays", label: "Every weekday" },
      { value: "weekly", label: "Chosen weekdays" },
      { value: "monthly", label: "Every month" },
      { value: "rrule", label: "Custom (RRULE)" },
    ],
    [],
  );

  const setStatus = async (s: TaskStatus) => {
    if (s === "done") await completeTask(task);
    else if (task.status === "done") {
      await uncompleteTask(task);
      if (s === "doing") await save({ status: "doing" });
    } else await save({ status: s });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="mt-2.5">
          <LeafCheckbox checked={task.status === "done"} onChange={(v) => void (v ? completeTask(task) : uncompleteTask(task))} label="Done" />
        </span>
        <textarea
          value={title}
          rows={1}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title.trim() !== task.title && save({ title: title.trim() })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
          aria-label="Title"
          className="field-sizing-content min-h-12 w-full resize-none rounded-[14px] bg-transparent px-2 py-2 font-display text-[22px] font-semibold leading-tight outline-none focus:bg-surface-sunk"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Status</Label>
          <Segmented<TaskStatus>
            label="Status"
            value={task.status}
            onChange={setStatus}
            className="w-full"
            options={[
              { value: "todo", label: "To do" },
              { value: "doing", label: "Doing" },
              { value: "done", label: "Done" },
            ]}
          />
        </div>
        <div>
          <Label>Priority</Label>
          <Segmented<Priority>
            label="Priority"
            value={task.priority}
            onChange={(priority) => save({ priority })}
            className="w-full"
            options={[
              { value: 0, label: "None" },
              { value: 1, label: "Low" },
              { value: 2, label: "Med" },
              { value: 3, label: "High" },
            ]}
          />
        </div>
        <div>
          <Label htmlFor="t-project">Project</Label>
          <select
            id="t-project"
            value={task.projectId ?? ""}
            onChange={(e) => save({ projectId: e.target.value || null, sectionId: e.target.value ? null : "sec_mylist_today" })}
            className="h-12 w-full rounded-[14px] bg-surface-sunk px-3 outline-none focus:ring-2 focus:ring-primary/60"
          >
            <option value="">My List</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="t-section">Section</Label>
          <select
            id="t-section"
            value={task.sectionId ?? ""}
            onChange={(e) => save({ sectionId: e.target.value || null })}
            className="h-12 w-full rounded-[14px] bg-surface-sunk px-3 outline-none focus:ring-2 focus:ring-primary/60"
          >
            {task.projectId && <option value="">No section</option>}
            {sections?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="t-due">Due date</Label>
          <div className="flex gap-2">
            <Input id="t-due" type="date" value={task.dueDate ?? ""} onChange={(e) => save({ dueDate: e.target.value || null })} />
            <Input type="time" aria-label="Due time" value={task.dueTime ?? ""} onChange={(e) => save({ dueTime: e.target.value || null })} className="w-36" disabled={!task.dueDate} />
          </div>
        </div>
        <div>
          <Label htmlFor="t-rec">Repeat</Label>
          <select
            id="t-rec"
            value={recKind}
            onChange={(e) => {
              const k = e.target.value;
              const rec: Recurrence | null =
                k === "none" ? null : k === "weekly" ? { kind: "weekly", days: [new Date().getDay()] } : k === "rrule" ? { kind: "rrule", rule: "FREQ=WEEKLY;INTERVAL=2" } : ({ kind: k } as Recurrence);
              save({ recurrence: rec });
            }}
            className="h-12 w-full rounded-[14px] bg-surface-sunk px-3 outline-none focus:ring-2 focus:ring-primary/60"
            aria-describedby="t-rec-label"
          >
            {recurrenceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span id="t-rec-label" className="sr-only">{recurrenceLabel(task.recurrence)}</span>
          {task.recurrence?.kind === "weekly" && (
            <div className="mt-2 flex gap-1" role="group" aria-label="Repeat on">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const rec = task.recurrence as Extract<Recurrence, { kind: "weekly" }>;
                const on = rec.days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => save({ recurrence: { kind: "weekly", days: on ? rec.days.filter((x) => x !== d) : [...rec.days, d] } })}
                    className={`h-9 flex-1 rounded-full text-xs font-bold ${on ? "bg-primary text-primary-ink" : "bg-surface-sunk text-ink-muted"}`}
                  >
                    {dayName(d).slice(0, 2)}
                  </button>
                );
              })}
            </div>
          )}
          {task.recurrence?.kind === "rrule" && (
            <Input
              className="mt-2 font-mono text-sm"
              defaultValue={task.recurrence.rule}
              aria-label="RRULE"
              onBlur={(e) => save({ recurrence: { kind: "rrule", rule: e.target.value.trim() || "FREQ=DAILY" } })}
            />
          )}
        </div>
        <div className="sm:col-span-2">
          <Label>Time block</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="datetime-local"
              aria-label="Block start"
              value={toLocalInput(task.blockStart)}
              onChange={(e) => {
                const start = e.target.value ? new Date(e.target.value).getTime() : null;
                save({ blockStart: start, blockEnd: start ? Math.max(task.blockEnd ?? 0, start + 3_600_000) : null });
              }}
              className="min-w-0 flex-1"
            />
            <span className="text-ink-muted">to</span>
            <Input
              type="datetime-local"
              aria-label="Block end"
              value={toLocalInput(task.blockEnd)}
              onChange={(e) => save({ blockEnd: e.target.value ? new Date(e.target.value).getTime() : null })}
              className="min-w-0 flex-1"
              disabled={!task.blockStart}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-surface-sunk px-4 py-3">
        <div>
          <p className="font-semibold">Big task</p>
          <p className="text-sm text-ink-muted">Worth +50 aura instead of +25.</p>
        </div>
        <Switch checked={task.big} onCheckedChange={(big) => save({ big })} label="Big task" />
      </div>

      <div>
        <Label>Subtasks</Label>
        <ul className="space-y-1.5">
          {task.subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-2xl bg-surface-sunk py-1 pl-2 pr-1">
              <LeafCheckbox checked={s.done} size={24} onChange={() => void toggleSubtask(task, s.id)} label={s.done ? `Untick ${s.title}` : `Tick ${s.title}`} />
              <input
                defaultValue={s.title}
                aria-label="Subtask"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== s.title) save({ subtasks: task.subtasks.map((x) => (x.id === s.id ? { ...x, title: v } : x)) });
                }}
                className={`min-w-0 flex-1 bg-transparent py-2 outline-none ${s.done ? "text-ink-muted line-through" : ""}`}
              />
              <button type="button" onClick={() => save({ subtasks: task.subtasks.filter((x) => x.id !== s.id) })} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-faint hover:bg-surface" aria-label={`Remove ${s.title}`}>
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!subDraft.trim()) return;
            void save({ subtasks: [...task.subtasks, { id: uid("sub_"), title: subDraft.trim(), done: false }] });
            setSubDraft("");
          }}
        >
          <Input value={subDraft} onChange={(e) => setSubDraft(e.target.value)} placeholder="Add a subtask" aria-label="New subtask" />
          <Button type="submit" variant="soft" size="icon" aria-label="Add subtask" disabled={!subDraft.trim()}>
            <Plus size={20} />
          </Button>
        </form>
      </div>

      <div>
        <Label>Tags</Label>
        <TagInput value={task.tags} onChange={(t) => save({ tags: t })} suggestions={tags} />
      </div>

      <div>
        <Label>Notes</Label>
        <RichText
          value={task.notes}
          placeholder="Anything worth remembering…"
          onChange={(html) => {
            if (notesTimer.current) clearTimeout(notesTimer.current);
            notesTimer.current = setTimeout(() => save({ notes: html }), 400);
          }}
        />
      </div>

      <div className="flex items-center justify-between border-t border-line pt-4">
        <Button
          variant="ghost"
          className="text-danger hover:text-danger"
          onClick={() => {
            onClose();
            void remove(task);
          }}
        >
          <Trash2 size={18} /> Delete
        </Button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}
