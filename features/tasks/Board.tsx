"use client";

import { DndContext, DragOverlay, closestCorners, useDroppable, useDraggable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useState } from "react";
import { completeTask, uncompleteTask } from "@/lib/game/actions";
import { updateTask } from "@/lib/data/tasks";
import { cn } from "@/lib/cn";
import type { Project, Task, TaskStatus } from "@/lib/types";
import { useUI } from "@/lib/ui-store";
import { friendlyDue } from "@/lib/dates";
import { ProjectIcon } from "@/components/icons/ProjectIcon";
import { LeafCheckbox } from "./LeafCheckbox";
import { useTaskActions } from "./useTaskActions";
import { useListSensors } from "./SortableTaskList";
import { instantFeedback } from "@/lib/game/instant";

const COLUMNS: { status: TaskStatus; label: string; tint: string }[] = [
  { status: "todo", label: "To do", tint: "bg-surface-sunk/70" },
  { status: "doing", label: "Doing", tint: "bg-gentle/40" },
  { status: "done", label: "Done", tint: "bg-primary-soft/50" },
];

/** Kanban board (brief 6.3). Dropping a card on Done celebrates like a tick. */
export function Board({ tasks, projects, showProject = true }: { tasks: Task[]; projects: Project[]; showProject?: boolean }) {
  const sensors = useListSensors();
  const [activeId, setActiveId] = useState<string | null>(null);
  const byId = new Map(projects.map((p) => [p.id, p]));
  const active = tasks.find((t) => t.id === activeId);

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const task = tasks.find((t) => t.id === e.active.id);
    const to = e.over?.id as TaskStatus | undefined;
    if (!task || !to || task.status === to) return;
    if (to === "done") {
      instantFeedback();
      await completeTask(task);
    }
    else if (task.status === "done") {
      await uncompleteTask(task);
      if (to === "doing") await updateTask(task.id, { status: "doing" });
    } else await updateTask(task.id, { status: to });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd}>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {COLUMNS.map((col) => {
          const list = tasks.filter((t) => t.status === col.status);
          return (
            <Column key={col.status} id={col.status} label={col.label} count={list.length} tint={col.tint}>
              {list.map((t) => (
                <DraggableCard key={t.id} task={t} project={t.projectId ? byId.get(t.projectId) : null} showProject={showProject} />
              ))}
            </Column>
          );
        })}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.16,1,0.3,1)" }}>
        {active ? <Card task={active} project={active.projectId ? byId.get(active.projectId) : null} showProject={showProject} lifted /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ id, label, count, tint, children }: { id: string; label: string; count: number; tint: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section ref={setNodeRef} aria-label={label} className={cn("flex min-h-64 w-[82vw] shrink-0 snap-center flex-col rounded-[22px] p-2.5 transition-shadow md:w-auto", tint, isOver && "ring-2 ring-primary/60")}>
      <h3 className="flex items-center gap-2 px-1.5 pb-2 pt-1 text-sm font-bold text-ink-muted">
        {label}
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs tabular">{count}</span>
      </h3>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
    </section>
  );
}

function DraggableCard({ task, project, showProject }: { task: Task; project?: Project | null; showProject: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={cn("touch-manipulation", isDragging && "opacity-30")}>
      <Card task={task} project={project} showProject={showProject} />
    </div>
  );
}

function Card({ task, project, showProject, lifted }: { task: Task; project?: Project | null; showProject: boolean; lifted?: boolean }) {
  const openTask = useUI((s) => s.openTask);
  const { toggle } = useTaskActions();
  const done = task.status === "done";
  return (
    <div className={cn("rounded-[16px] bg-surface p-3 shadow-[0_1px_2px_var(--shadow-tint)]", lifted && "rotate-[-1.5deg] shadow-[var(--shadow-lift)]")}>
      <div className="flex items-start gap-2">
        <LeafCheckbox size={22} checked={done} onChange={(v, o) => void toggle(task, v, o)} label={done ? "Mark not done" : `Complete ${task.title}`} />
        <button type="button" onClick={() => openTask(task)} className="min-w-0 flex-1 pt-0.5 text-left">
          <span className={cn("hand-strike block text-[15px] font-medium leading-snug")} data-done={done}>
            {task.title}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] font-medium text-ink-muted">
            {task.dueDate && <span>{friendlyDue(task.dueDate, task.dueTime)}</span>}
            {showProject && project && (
              <span className="inline-flex items-center gap-1">
                <ProjectIcon project={project} size={14} className="!rounded-[4px]" /> {project.name}
              </span>
            )}
            {task.tags.slice(0, 2).map((t) => (
              <span key={t} className="text-primary">#{t}</span>
            ))}
          </span>
        </button>
      </div>
    </div>
  );
}
