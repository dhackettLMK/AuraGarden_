"use client";

import { ContextMenu } from "radix-ui";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useRef, useState } from "react";
import {
  CalendarClock, CalendarDays, Check, ChevronRight, Copy, Flag, FolderInput, GripVertical, ListChecks, Repeat,
  Trash2, Weight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { friendlyDue } from "@/lib/dates";
import { addDays, dayDiff, todayKey } from "@/lib/day";
import { useMediaQuery } from "@/lib/hooks";
import type { Project, Task } from "@/lib/types";
import { useUI } from "@/lib/ui-store";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { ProjectIcon } from "@/components/icons/ProjectIcon";
import { updateTask } from "@/lib/data/tasks";
import { LeafCheckbox } from "./LeafCheckbox";
import { useTaskActions } from "./useTaskActions";
import { useTaskPicker } from "./picker-store";

const PRIORITY_COLORS = ["", "#7BA978", "#E3A04A", "#C8524B"];

export interface TaskRowProps {
  task: Task;
  project?: Project | null;
  showProject?: boolean;
  dragHandle?: React.HTMLAttributes<HTMLButtonElement> & { setRef?: (el: HTMLElement | null) => void };
  selected?: boolean;
  selectMode?: boolean;
  onSelect?: (id: string) => void;
  projects?: Project[];
}

/**
 * A task or to-do row. Swipe right to complete, left for Schedule / Move /
 * Delete (phones). Long-press or right-click for the context menu.
 */
export function TaskRow({ task, project, showProject = true, dragHandle, selected, selectMode, onSelect, projects = [] }: TaskRowProps) {
  const { toggle, remove, schedule, move, duplicate } = useTaskActions();
  const openTask = useUI((s) => s.openTask);
  const openPicker = useTaskPicker((s) => s.open);
  const touch = useMediaQuery("(pointer: coarse)");
  const x = useMotionValue(0);
  const [trayOpen, setTrayOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const done = task.status === "done";
  const today = todayKey();
  const overdue = !done && task.dueDate && dayDiff(today, task.dueDate) < 0;
  const completeBg = useTransform(x, [0, 90], [0, 1]);
  const subDone = task.subtasks.filter((s) => s.done).length;

  const onDragEnd = () => {
    const v = x.get();
    if (v > 90 && !done) {
      const r = rowRef.current?.getBoundingClientRect();
      void toggle(task, true, r ? { x: r.left + 28, y: r.top + r.height / 2 } : undefined);
      animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
    } else if (v < -70) {
      setTrayOpen(true);
      animate(x, -204, { type: "spring", stiffness: 500, damping: 40 });
    } else {
      setTrayOpen(false);
      animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
    }
  };
  const closeTray = () => {
    setTrayOpen(false);
    animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
  };

  const meta: React.ReactNode[] = [];
  if (task.dueDate)
    meta.push(
      <span key="due" className={cn("inline-flex items-center gap-1", overdue && "rounded-full bg-gentle px-1.5 text-gentle-ink")}>
        <CalendarDays size={13} strokeWidth={2} />
        {friendlyDue(task.dueDate, task.dueTime, today)}
      </span>,
    );
  if (task.recurrence) meta.push(<Repeat key="rec" size={13} strokeWidth={2} aria-label="Repeats" />);
  if (task.subtasks.length)
    meta.push(
      <span key="sub" className="inline-flex items-center gap-1">
        <ListChecks size={13} strokeWidth={2} />
        {subDone}/{task.subtasks.length}
      </span>,
    );
  if (task.big)
    meta.push(
      <span key="big" className="inline-flex items-center gap-1 font-semibold text-primary">
        <Weight size={13} strokeWidth={2} /> Big
      </span>,
    );
  if (showProject && project)
    meta.push(
      <span key="prj" className="inline-flex min-w-0 items-center gap-1">
        <ProjectIcon project={project} size={16} className="!rounded-[5px]" />
        <span className="truncate">{project.name}</span>
      </span>,
    );
  for (const tag of task.tags.slice(0, 3)) meta.push(<span key={`t-${tag}`} className="text-primary">#{tag}</span>);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild disabled={selectMode}>
        <div ref={rowRef} className="relative" data-task-id={task.id}>
          {/* swipe backgrounds */}
          {touch && (
            <>
              <motion.div style={{ opacity: completeBg }} className="absolute inset-0 flex items-center rounded-[18px] bg-primary pl-5 text-primary-ink" aria-hidden="true">
                <Check size={22} strokeWidth={2.5} />
              </motion.div>
              <div className="absolute inset-y-0 right-0 flex items-stretch gap-1 overflow-hidden rounded-[18px] p-1" aria-hidden={!trayOpen}>
                <TrayButton hidden={!trayOpen} label="Schedule" icon={<CalendarClock size={18} />} className="bg-gentle text-gentle-ink" onClick={() => { closeTray(); openPicker("schedule", task); }} />
                <TrayButton hidden={!trayOpen} label="Move" icon={<FolderInput size={18} />} className="bg-primary-soft text-primary-strong dark:text-primary" onClick={() => { closeTray(); openPicker("move", task); }} />
                <TrayButton hidden={!trayOpen} label="Delete" icon={<Trash2 size={18} />} className="bg-danger text-white dark:text-[#2a0f0d]" onClick={() => { closeTray(); void remove(task); }} />
              </div>
            </>
          )}
          <motion.div
            style={{ x }}
            drag={touch && !selectMode ? "x" : false}
            dragDirectionLock
            dragConstraints={{ left: -220, right: 140 }}
            dragElastic={0.08}
            onDragEnd={onDragEnd}
            className={cn(
              "group relative flex items-start gap-2.5 rounded-[18px] bg-surface py-2.5 pl-3 pr-2 shadow-[0_1px_2px_var(--shadow-tint)] transition-colors",
              selected && "ring-2 ring-primary",
            )}
          >
            {selectMode ? (
              <button
                role="checkbox"
                aria-checked={!!selected}
                aria-label={`Select ${task.title}`}
                onClick={() => onSelect?.(task.id)}
                className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink-faint data-[on=true]:border-primary data-[on=true]:bg-primary"
                data-on={!!selected}
              >
                {selected && <Check size={16} className="text-primary-ink" strokeWidth={3} />}
              </button>
            ) : (
              <span className="mt-[1px]">
                <LeafCheckbox
                  checked={done}
                  onChange={(v, origin) => void toggle(task, v, origin)}
                  label={done ? `Mark "${task.title}" not done` : `Complete "${task.title}"`}
                  color={task.priority ? PRIORITY_COLORS[task.priority] : undefined}
                />
              </span>
            )}
            <div className="min-w-0 flex-1 py-0.5">
              <div className="flex items-start gap-1.5">
                {task.priority > 0 && !done && (
                  <Flag size={14} className="mt-[5px] shrink-0" style={{ color: PRIORITY_COLORS[task.priority] }} fill="currentColor" aria-label={`Priority ${["", "low", "medium", "high"][task.priority]}`} />
                )}
                <span className="hand-strike min-w-0 text-[16px] leading-snug" data-done={done}>
                  <InlineEdit value={task.title} onSave={(title) => updateTask(task.id, { title })} label="Task title" className="break-words" />
                </span>
              </div>
              {meta.length > 0 && (
                <button
                  type="button"
                  onClick={() => openTask(task)}
                  className="mt-0.5 flex min-h-6 max-w-full flex-wrap items-center gap-x-2.5 gap-y-0.5 text-left text-[13px] font-medium text-ink-muted"
                >
                  <span className="sr-only">Details for {task.title}: </span>
                  {meta}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => openTask(task)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-surface-sunk hover:text-ink"
              aria-label={`Open details for ${task.title}`}
            >
              <ChevronRight size={18} />
            </button>
            {dragHandle && <DragHandleButton handle={dragHandle} label={`Reorder ${task.title}`} />}
          </motion.div>
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="popover z-[60] min-w-52 rounded-2xl bg-surface-raised p-1.5 text-ink shadow-[var(--shadow-lift)] ring-1 ring-line" collisionPadding={12}>
          <CMItem icon={<ChevronRight size={18} />} onSelect={() => openTask(task)}>Open</CMItem>
          <CMItem icon={<CalendarDays size={18} />} onSelect={() => schedule(task, today)}>Do today</CMItem>
          <CMItem icon={<CalendarClock size={18} />} onSelect={() => schedule(task, addDays(today, 1))}>Tomorrow</CMItem>
          <CMItem icon={<CalendarClock size={18} />} onSelect={() => openPicker("schedule", task)}>Schedule…</CMItem>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className="flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-xl px-3 text-[15px] outline-none data-[highlighted]:bg-surface-sunk data-[state=open]:bg-surface-sunk">
              <FolderInput size={18} className="text-ink-muted" /> Move to <ChevronRight size={16} className="ml-auto text-ink-faint" />
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent className="popover z-[61] min-w-52 rounded-2xl bg-surface-raised p-1.5 shadow-[var(--shadow-lift)] ring-1 ring-line" sideOffset={4}>
                <CMItem onSelect={() => move(task, null)}>My List</CMItem>
                {projects.map((p) => (
                  <CMItem key={p.id} icon={<ProjectIcon project={p} size={20} className="!rounded-md" />} onSelect={() => move(task, p.id)}>
                    {p.name}
                  </CMItem>
                ))}
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>
          <CMItem icon={<Copy size={18} />} onSelect={() => duplicate(task)}>Duplicate</CMItem>
          <ContextMenu.Separator className="my-1 h-px bg-line" />
          <CMItem icon={<Trash2 size={18} />} danger onSelect={() => remove(task)}>Delete</CMItem>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

function CMItem({ children, onSelect, icon, danger }: { children: React.ReactNode; onSelect: () => void; icon?: React.ReactNode; danger?: boolean }) {
  return (
    <ContextMenu.Item
      onSelect={onSelect}
      className={cn("flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-xl px-3 text-[15px] outline-none data-[highlighted]:bg-surface-sunk", danger && "text-danger")}
    >
      {icon && <span className={cn("text-ink-muted", danger && "text-danger")}>{icon}</span>}
      {children}
    </ContextMenu.Item>
  );
}

function TrayButton({ label, icon, className, onClick, hidden }: { label: string; icon: React.ReactNode; className: string; onClick: () => void; hidden?: boolean }) {
  return (
    <button type="button" tabIndex={hidden ? -1 : 0} onClick={onClick} className={cn("flex w-16 flex-col items-center justify-center gap-0.5 rounded-[14px] text-[11px] font-bold", className)}>
      {icon}
      {label}
    </button>
  );
}

type Handle = React.HTMLAttributes<HTMLButtonElement> & { setRef?: (el: HTMLElement | null) => void };

function DragHandleButton({ handle, label }: { handle: Handle; label: string }) {
  const { setRef, ...rest } = handle;
  return (
    <button
      type="button"
      {...rest}
      // dnd-kit's activator ref setter is a callback, not a ref read.
       
      ref={setRef}
      className="inline-flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-ink-faint opacity-60 hover:bg-surface-sunk group-hover:opacity-100 active:cursor-grabbing"
      aria-label={label}
    >
      <GripVertical size={16} />
    </button>
  );
}
