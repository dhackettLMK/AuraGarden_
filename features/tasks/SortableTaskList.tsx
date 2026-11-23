"use client";

import {
  DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "motion/react";
import { reorder } from "@/lib/data/core";
import type { Project, Task } from "@/lib/types";
import { TaskRow } from "./TaskRow";

export function useListSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

/** A drag-to-reorder list of task rows (dnd-kit). */
export function SortableTaskList({
  tasks,
  projects,
  showProject = true,
  sortable = true,
  selectMode,
  selected,
  onSelect,
}: {
  tasks: Task[];
  projects: Project[];
  showProject?: boolean;
  sortable?: boolean;
  selectMode?: boolean;
  selected?: Set<string>;
  onSelect?: (id: string) => void;
}) {
  const sensors = useListSensors();
  const byId = new Map(projects.map((p) => [p.id, p]));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = tasks.map((t) => t.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    void reorder("tasks", next);
  };
  const rows = (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {tasks.map((t) => (
          <SortableItem key={t.id} id={t.id} disabled={!sortable}>
            {(handle) => (
              <TaskRow
                task={t}
                project={t.projectId ? byId.get(t.projectId) : null}
                showProject={showProject}
                dragHandle={sortable ? handle : undefined}
                projects={projects}
                selectMode={selectMode}
                selected={selected?.has(t.id)}
                onSelect={onSelect}
              />
            )}
          </SortableItem>
        ))}
      </AnimatePresence>
    </ul>
  );
  if (!sortable) return rows;
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {rows}
      </SortableContext>
    </DndContext>
  );
}

export function SortableItem({
  id,
  disabled,
  children,
  as: Tag = "li",
}: {
  id: string;
  disabled?: boolean;
  as?: "li" | "div";
  children: (handle: React.HTMLAttributes<HTMLButtonElement> & { setRef?: (el: HTMLElement | null) => void }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <Tag
      ref={setNodeRef as never}
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 20 : undefined, position: "relative" }}
      className={isDragging ? "opacity-90 [&_[data-task-id]>div:last-child]:shadow-[var(--shadow-lift)]" : undefined}
    >
      <motion.div
        layout={isDragging ? false : "position"}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.18 } }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        {children({ ...attributes, ...listeners, setRef: setActivatorNodeRef } as never)}
      </motion.div>
    </Tag>
  );
}
