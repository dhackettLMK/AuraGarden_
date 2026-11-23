"use client";

import { DndContext, DragOverlay, closestCenter, pointerWithin, useDroppable, type CollisionDetection, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { ChevronDown, GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { reorder, softDelete, patch } from "@/lib/data/core";
import { createSection, renameSection } from "@/lib/data/sections";
import type { Project, Section, Task } from "@/lib/types";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/Menu";
import { undoToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { friendlyDay } from "@/lib/dates";
import { calendarDay } from "@/lib/day";
import { SortableItem, useListSensors } from "./SortableTaskList";
import { TaskRow } from "./TaskRow";
import { InlineAdd } from "./InlineAdd";
import { useHold } from "./hold-store";

const NO_SECTION = "__none";

/**
 * Tasks grouped into her own sections (brief 6.2, 6.4). Sections can be added,
 * renamed, reordered and deleted; tasks drag within and between sections.
 */
export function SectionedTasks({
  projectId,
  sections,
  tasks,
  projects,
  showProject = false,
}: {
  projectId: string | null;
  sections: Section[];
  tasks: Task[];
  projects: Project[];
  showProject?: boolean;
}) {
  const sensors = useListSensors();
  const held = useHold((s) => s.held);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const [newSection, setNewSection] = useState("");
  const byProject = new Map(projects.map((p) => [p.id, p]));

  const open = tasks.filter((t) => t.status !== "done" || held[t.id]).sort((a, b) => a.order - b.order);
  const done = tasks.filter((t) => t.status === "done" && !held[t.id]).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const sectionIds = new Set(sections.map((s) => s.id));
  const buckets: { id: string; section: Section | null; tasks: Task[] }[] = [];
  const loose = open.filter((t) => !t.sectionId || !sectionIds.has(t.sectionId));
  if (projectId !== null || loose.length) buckets.push({ id: NO_SECTION, section: null, tasks: loose });
  for (const s of sections) buckets.push({ id: s.id, section: s, tasks: open.filter((t) => t.sectionId === s.id) });

  // Tasks collide with tasks (or an empty section); sections only with sections.
  const collision: CollisionDetection = (args) => {
    const isSec = String(args.active.id).startsWith("sec:");
    const pool = args.droppableContainers.filter((c) => String(c.id).startsWith("sec:") === isSec);
    if (isSec) return closestCenter({ ...args, droppableContainers: pool });
    const zones = pool.filter((c) => String(c.id).startsWith("drop:"));
    const within = args.pointerCoordinates ? pointerWithin({ ...args, droppableContainers: zones }) : [];
    const emptyZone = within.find((w) => !buckets.find((b) => `drop:${b.id}` === String(w.id))?.tasks.length);
    if (emptyZone) return [emptyZone];
    return closestCenter({ ...args, droppableContainers: pool.filter((c) => !String(c.id).startsWith("drop:")) });
  };

  const sectionOf = (taskId: string) => buckets.find((b) => b.tasks.some((t) => t.id === taskId))?.id;

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const aId = String(active.id);
    const oId = String(over.id);
    if (aId.startsWith("sec:")) {
      // Reordering sections.
      const ids = sections.map((s) => s.id);
      const from = ids.indexOf(aId.slice(4));
      const to = ids.indexOf(oId.replace(/^(sec:|drop:)/, ""));
      if (from >= 0 && to >= 0 && from !== to) await reorder("sections", arrayMove(ids, from, to));
      return;
    }
    const fromSec = sectionOf(aId);
    const toSec = oId.startsWith("drop:") ? oId.slice(5) : sectionOf(oId);
    if (!fromSec || !toSec) return;
    const target = buckets.find((b) => b.id === toSec)!;
    if (fromSec !== toSec) {
      await patch("tasks", aId, { sectionId: toSec === NO_SECTION ? null : toSec });
      const ids = target.tasks.map((t) => t.id);
      const idx = oId.startsWith("drop:") ? ids.length : Math.max(0, ids.indexOf(oId));
      ids.splice(idx, 0, aId);
      await reorder("tasks", ids);
    } else if (aId !== oId && !oId.startsWith("drop:")) {
      const ids = target.tasks.map((t) => t.id);
      await reorder("tasks", arrayMove(ids, ids.indexOf(aId), ids.indexOf(oId)));
    }
  }

  const activeTask = tasks.find((t) => t.id === activeId);

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={collision} onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd}>
        <SortableContext items={sections.map((s) => `sec:${s.id}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-7">
            {buckets.map((b) => (
              <SectionBlock key={b.id} bucket={b} projectId={projectId} projects={projects} byProject={byProject} showProject={showProject} />
            ))}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.16,1,0.3,1)" }}>
          {activeTask ? (
            <div className="rotate-[-1deg] [&_[data-task-id]>div:last-child]:shadow-[var(--shadow-lift)]">
              <TaskRow task={activeTask} project={activeTask.projectId ? byProject.get(activeTask.projectId) : null} showProject={showProject} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <form
        className="mt-6 flex items-center gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!newSection.trim()) return;
          await createSection(projectId, newSection);
          setNewSection("");
        }}
      >
        <input
          value={newSection}
          onChange={(e) => setNewSection(e.target.value)}
          placeholder="New section"
          aria-label="New section name"
          className="h-11 min-w-0 flex-1 rounded-full bg-transparent px-4 text-[15px] font-semibold outline-none ring-1 ring-line placeholder:font-medium placeholder:text-ink-faint focus:ring-2 focus:ring-primary/60"
        />
        <button type="submit" disabled={!newSection.trim()} className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-primary disabled:text-ink-faint">
          <Plus size={16} /> Add section
        </button>
      </form>

      {done.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setDoneOpen((v) => !v)} aria-expanded={doneOpen} className="flex h-10 items-center gap-2 rounded-full px-2 text-sm font-bold text-ink-muted hover:text-ink">
            <ChevronDown size={18} className={cn("transition-transform", !doneOpen && "-rotate-90")} />
            Done <span className="rounded-full bg-surface-sunk px-2 py-0.5 text-xs tabular">{done.length}</span>
          </button>
          {doneOpen && <DoneList tasks={done} projects={projects} showProject={showProject} />}
        </div>
      )}
    </div>
  );
}

function SectionBlock({
  bucket,
  projectId,
  projects,
  byProject,
  showProject,
}: {
  bucket: { id: string; section: Section | null; tasks: Task[] };
  projectId: string | null;
  projects: Project[];
  byProject: Map<string, Project>;
  showProject: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `drop:${bucket.id}` });
  const s = bucket.section;
  const headerSortable = s ? `sec:${s.id}` : null;
  return (
    <section aria-label={s?.name ?? "Tasks"} ref={setNodeRef} className={cn("rounded-[22px] transition-colors", isOver && "bg-primary-soft/40")}>
      {s && headerSortable && (
        <SortableItem id={headerSortable} as="div">
          {(handle) => (
            <div className="mb-2 flex items-center gap-1">
              <SectionGrip handle={handle} label={`Reorder section ${s.name}`} />
              <h2 className="min-w-0 flex-1 font-display text-[18px] font-semibold">
                <InlineEdit value={s.name} onSave={(v) => renameSection(s.id, v)} label="Section name" />
              </h2>
              <span className="text-sm tabular text-ink-faint">{bucket.tasks.length || ""}</span>
              <SectionMenu section={s} />
            </div>
          )}
        </SortableItem>
      )}
      <SortableContext items={bucket.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {bucket.tasks.map((t) => (
              <SortableItem key={t.id} id={t.id}>
                {(handle) => <TaskRow task={t} project={t.projectId ? byProject.get(t.projectId) : null} showProject={showProject} dragHandle={handle} projects={projects} />}
              </SortableItem>
            ))}
          </AnimatePresence>
        </ul>
      </SortableContext>
      <InlineAdd
        className="mt-2"
        projectId={projectId}
        sectionId={bucket.id === NO_SECTION ? null : bucket.id}
        placeholder={s ? `Add to ${s.name}` : "Add task"}
        today={bucket.id === "sec_mylist_today"}
      />
    </section>
  );
}

function SectionMenu({ section }: { section: Section }) {
  return (
    <Menu>
      <MenuTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunk" aria-label={`${section.name} options`}>
        <MoreHorizontal size={18} />
      </MenuTrigger>
      <MenuContent>
        <MenuItem
          icon={<Pencil />}
          onSelect={() => {
            const v = window.prompt("Rename section", section.name);
            if (v?.trim()) void renameSection(section.id, v.trim());
          }}
        >
          Rename
        </MenuItem>
        <MenuItem
          icon={<Trash2 />}
          danger
          onSelect={async () => {
            const undo = await softDelete("sections", section.id);
            undoToast(`Deleted section ${section.name}. Its tasks stay.`, undo);
          }}
        >
          Delete section
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

export function DoneList({ tasks, projects, showProject }: { tasks: Task[]; projects: Project[]; showProject: boolean }) {
  const byProject = new Map(projects.map((p) => [p.id, p]));
  const groups = new Map<string, Task[]>();
  for (const t of tasks) {
    const d = t.completedAt ? calendarDay(t.completedAt) : "earlier";
    groups.set(d, [...(groups.get(d) ?? []), t]);
  }
  return (
    <div className="mt-2 space-y-4">
      {[...groups.entries()].map(([day, list]) => (
        <div key={day}>
          <p className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-ink-faint">{day === "earlier" ? "Earlier" : friendlyDay(day)}</p>
          <ul className="space-y-2">
            {list.map((t) => (
              <li key={t.id}>
                <TaskRow task={t} project={t.projectId ? byProject.get(t.projectId) : null} showProject={showProject} projects={projects} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SectionGrip({ handle, label }: { handle: React.HTMLAttributes<HTMLButtonElement> & { setRef?: (el: HTMLElement | null) => void }; label: string }) {
  const { setRef, ...rest } = handle;
  return (
     
    <button {...rest} ref={setRef} className="-ml-2 inline-flex h-8 w-8 cursor-grab touch-none items-center justify-center rounded-lg text-ink-faint/70 hover:text-ink-muted" aria-label={label}>
      <GripVertical size={15} />
    </button>
  );
}
