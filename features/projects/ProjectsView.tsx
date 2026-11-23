"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Archive, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useProjects, useTasks } from "@/lib/hooks";
import { reorder } from "@/lib/data/core";
import { useGame } from "@/lib/game/GameProvider";
import { ProjectIcon } from "@/components/icons/ProjectIcon";
import { SwapNServeBanner } from "@/components/icons/BrandBanner";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatAura } from "@/lib/format";
import type { Project, Task } from "@/lib/types";
import { useListSensors } from "@/features/tasks/SortableTaskList";
import { ProjectEditor } from "./ProjectEditor";
import { RankBadge } from "./RankBadge";
import { useProjectBelt } from "./useProjectRank";

export function ProjectsView() {
  return (
    <Suspense>
      <ProjectsInner />
    </Suspense>
  );
}

function ProjectsInner() {
  const all = useProjects({ includeArchived: true });
  const tasks = useTasks();
  const params = useSearchParams();
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const creating = editorOpen || params.get("new") === "1";
  const sensors = useListSensors();

  if (!all || !tasks)
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-[20px]" />
        ))}
      </div>
    );

  const active = all.filter((p) => !p.archived);
  const archived = all.filter((p) => p.archived);
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = active.map((p) => p.id);
    void reorder("projects", arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id))));
  };
  const setOpen = (v: boolean) => {
    setEditorOpen(v);
    if (!v && params.get("new")) router.replace("/projects");
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <p className="flex-1 text-[15px] text-ink-muted"><span className="hidden sm:inline">{active.length ? "Drag to reorder. Tap one to open it." : ""}</span></p>
        <Button size="sm" onClick={() => setEditorOpen(true)}>
          <Plus size={18} /> New project
        </Button>
      </div>
      {active.length === 0 ? (
        <EmptyState title="No projects yet" line="Nothing here yet. Want to plant something?" pose="thinking">
          <Button onClick={() => setEditorOpen(true)}>
            <Plus size={18} /> Start a project
          </Button>
        </EmptyState>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={active.map((p) => p.id)} strategy={rectSortingStrategy}>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((p, i) => (
                <SortableCard key={p.id} project={p} tasks={tasks} index={i} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {archived.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setShowArchived((v) => !v)} className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-ink-muted hover:bg-surface-sunk" aria-expanded={showArchived}>
            <Archive size={16} /> Archived ({archived.length})
          </button>
          {showArchived && (
            <ul className="mt-3 grid gap-3 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
              {archived.map((p, i) => (
                <li key={p.id}>
                  <ProjectCard project={p} tasks={tasks} index={i} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <ProjectEditor project={null} open={creating} onOpenChange={setOpen} />
    </div>
  );
}

function SortableCard({ project, tasks, index }: { project: Project; tasks: Task[]; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 10 : undefined }} {...attributes} {...listeners} className="touch-manipulation">
      <ProjectCard project={project} tasks={tasks} index={index} dragging={isDragging} />
    </li>
  );
}

export function ProjectCard({ project, tasks, index = 0, dragging, banner = true }: { project: Project; tasks: Task[]; index?: number; dragging?: boolean; banner?: boolean }) {
  const game = useGame();
  const aura = game.projectAura[project.id] ?? 0;
  const week = game.projectAuraWeek[project.id] ?? 0;
  const belt = useProjectBelt(project, aura);
  const mine = tasks.filter((t) => t.projectId === project.id);
  const open = mine.filter((t) => t.status !== "done").length;
  const done = mine.length - open;
  const isSwap = project.icon.kind === "brand" && project.icon.brand === "swapnserve";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, type: "spring", stiffness: 320, damping: 26 }}>
      <Link
        href={`/projects/${project.id}`}
        draggable={false}
        className={`group relative block overflow-hidden rounded-[20px] bg-surface p-4 shadow-[var(--shadow-soft)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] ${dragging ? "scale-[1.02] shadow-[var(--shadow-lift)]" : ""}`}
      >
        <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: project.color }} aria-hidden="true" />
        {isSwap && banner && <SwapNServeBanner className="-mx-1 mb-3 mt-1 h-[72px] !p-2.5" />}
        <div className="flex items-start gap-3">
          <ProjectIcon project={project} size={52} belt={belt} />
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="line-clamp-2 font-display text-[19px] font-semibold leading-tight">{project.name}</h2>
            <div className="mt-1.5">
              <RankBadge project={project} aura={aura} />
            </div>
          </div>
          <ProgressRing value={mine.length ? done / mine.length : 0} size={40} stroke={4.5} color={project.color} label={`${done} of ${mine.length} done`} />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-medium text-ink-muted">
            <span className="font-bold text-ink tabular">{open}</span> open {open === 1 ? "task" : "tasks"}
          </span>
          <span className="tabular font-semibold text-ink-muted">
            <span className="aura-text font-bold">+{formatAura(week)}</span> this week
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
