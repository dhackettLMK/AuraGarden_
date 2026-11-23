"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { CalendarDays, LayoutList, Lightbulb, Settings2, SquareKanban, Users, Sparkles, Target } from "lucide-react";
import { motion } from "motion/react";
import { getDB } from "@/lib/db";
import { alive } from "@/lib/data/core";
import { useProject, useProjects, useSections, useTasks } from "@/lib/hooks";
import { useGame } from "@/lib/game/GameProvider";
import { suggestionsFor } from "@/lib/data/projects";
import { updateProject } from "@/lib/data/projects";
import { ProjectIcon } from "@/components/icons/ProjectIcon";
import { SwapNServeBanner } from "@/components/icons/BrandBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { Chip } from "@/components/ui/Chip";
import { formatAura } from "@/lib/format";
import { friendlyDue, friendlyDay } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { calendarDay } from "@/lib/day";
import { useUI } from "@/lib/ui-store";
import { SectionedTasks } from "@/features/tasks/SectionedTasks";
import { Board } from "@/features/tasks/Board";
import { TaskRow } from "@/features/tasks/TaskRow";
import { ProjectEditor } from "./ProjectEditor";
import { RankBadge } from "./RankBadge";
import { projectRank, useProjectBelt } from "./useProjectRank";

type Tab = "overview" | "tasks" | "notes" | "people" | "calendar";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "overview", label: "Overview", icon: Target },
  { id: "tasks", label: "Tasks", icon: LayoutList },
  { id: "notes", label: "Notes", icon: Lightbulb },
  { id: "people", label: "People", icon: Users },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const project = useProject(id);
  const projects = useProjects() ?? [];
  const tasks = useTasks();
  const sections = useSections(id);
  const game = useGame();
  const [tab, setTab] = useState<Tab>("tasks");
  const [view, setView] = useState<"list" | "board">("list");
  const [editOpen, setEditOpen] = useState(false);

  if (project === undefined || !tasks || !sections)
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 rounded-[24px]" />
        <Skeleton className="h-12 rounded-full" />
        <Skeleton className="h-64 rounded-[20px]" />
      </div>
    );
  if (!project || project.deletedAt)
    return (
      <EmptyState title="This project has gone" line="It might be in Trash. Settings can bring it back." pose="thinking">
        <Button onClick={() => router.push("/projects")}>All projects</Button>
      </EmptyState>
    );

  const aura = game.projectAura[project.id] ?? 0;
  const mine = tasks.filter((t) => t.projectId === project.id);
  const isSwap = project.icon.kind === "brand" && project.icon.brand === "swapnserve";

  return (
    <div>
      <ProjectHeader project={project} aura={aura} week={game.projectAuraWeek[project.id] ?? 0} isSwap={isSwap} onEdit={() => setEditOpen(true)} />

      <nav className="no-scrollbar sticky top-[calc(64px+env(safe-area-inset-top))] z-20 -mx-4 mb-5 mt-5 flex gap-1 overflow-x-auto bg-background/90 px-4 py-2 backdrop-blur md:mx-0 md:px-0" role="tablist" aria-label="Project sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn("relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors", tab === t.id ? "text-primary-ink" : "text-ink-muted hover:text-ink")}
          >
            {tab === t.id && <motion.span layoutId="project-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative inline-flex items-center gap-1.5">
              <t.icon size={16} />
              {t.label}
            </span>
          </button>
        ))}
      </nav>

      {tab === "overview" && <Overview projectId={project.id} />}
      {tab === "tasks" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-muted">{mine.filter((t) => t.status !== "done").length} open</p>
            <Segmented
              label="View"
              size="sm"
              value={view}
              onChange={setView}
              options={[
                { value: "list", label: <LayoutList size={16} />, aria: "List" },
                { value: "board", label: <SquareKanban size={16} />, aria: "Board" },
              ]}
            />
          </div>
          {mine.length === 0 && <ProjectEmpty projectId={project.id} />}
          {view === "list" ? <SectionedTasks projectId={project.id} sections={sections} tasks={mine} projects={projects} /> : <Board tasks={mine} projects={projects} showProject={false} />}
        </div>
      )}
      {tab === "notes" && <LinkedNotes projectId={project.id} />}
      {tab === "people" && <LinkedPeople projectId={project.id} />}
      {tab === "calendar" && <ProjectCalendar projectId={project.id} />}

      <ProjectEditor project={project} open={editOpen} onOpenChange={setEditOpen} onDeleted={() => router.push("/projects")} />
    </div>
  );
}

function ProjectHeader({ project, aura, week, isSwap, onEdit }: { project: NonNullable<ReturnType<typeof useProject>>; aura: number; week: number; isSwap: boolean; onEdit: () => void }) {
  const belt = useProjectBelt(project, aura);
  const { next, progress } = projectRank(project, aura);
  return (
    <section className="relative overflow-hidden rounded-[24px] bg-surface shadow-[var(--shadow-soft)]">
      <div className="absolute inset-0 opacity-[0.14]" style={{ background: `radial-gradient(120% 140% at 0% 0%, ${project.color}, transparent 60%)` }} aria-hidden="true" />
      <div className={cn("relative flex flex-col gap-4 p-4 md:p-6", isSwap && "md:flex-row md:items-center")}>
        {isSwap && <SwapNServeBanner className="h-28 md:order-2 md:h-36 md:w-64 md:shrink-0" priority />}
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <ProjectIcon project={project} size={64} belt={belt} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <RankBadge project={project} aura={aura} />
              <span className="text-sm font-semibold tabular text-ink-muted">
                <span className="aura-text font-bold">{formatAura(aura)}</span> project aura · +{formatAura(week)} this week
              </span>
            </div>
            <div className="mt-2 text-[15px] text-ink-muted">
              <InlineEdit value={project.description} onSave={(description) => updateProject(project.id, { description })} placeholder="Add a description" label="Project description" multiline as="p" />
            </div>
            {next && (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-surface-sunk">
                  <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(2, progress * 100)}%`, background: project.color }} />
                </div>
                <p className="mt-1.5 text-[13px] font-medium text-ink-muted">
                  {formatAura(next.at - aura)} aura to <span className="font-semibold text-ink">{next.name}</span>
                </p>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit project">
            <Settings2 size={20} />
          </Button>
        </div>
      </div>
    </section>
  );
}

function ProjectEmpty({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const openQuickAdd = useUI((s) => s.openQuickAdd);
  if (!project) return null;
  return (
    <EmptyState className="py-6" size={88} title="A fresh patch" line="Nothing here yet. Want to plant something?" pose="thinking">
      {suggestionsFor(project).map((s) => (
        <Chip key={s} onClick={() => openQuickAdd({ type: "task", projectId })}>
          <Sparkles size={14} /> {s}
        </Chip>
      ))}
    </EmptyState>
  );
}

function Overview({ projectId }: { projectId: string }) {
  const tasks = useTasks() ?? [];
  const projects = useProjects() ?? [];
  const project = projects.find((p) => p.id === projectId);
  const pinned = useLiveQuery(async () => alive(await getDB().thoughts.toArray()).filter((t) => t.projectIds.includes(projectId) && t.pinned), [projectId]) ?? [];
  const open = tasks.filter((t) => t.projectId === projectId && t.status !== "done").sort((a, b) => (a.dueDate ?? "9") < (b.dueDate ?? "9") ? -1 : 1);
  const done = tasks.filter((t) => t.projectId === projectId && t.status === "done");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="card p-4">
        <h3 className="mb-3 font-display text-lg font-semibold">Next up</h3>
        {open.length ? (
          <ul className="space-y-2">
            {open.slice(0, 4).map((t) => (
              <li key={t.id}>
                <TaskRow task={t} project={project} showProject={false} projects={projects} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-ink-muted">All clear here. Add something when you&apos;re ready.</p>
        )}
      </section>
      <section className="card p-4">
        <h3 className="mb-3 font-display text-lg font-semibold">So far</h3>
        <dl className="grid grid-cols-2 gap-3">
          <Stat label="Tasks done" value={done.length} />
          <Stat label="Still open" value={open.length} />
        </dl>
        <h3 className="mb-2 mt-5 font-display text-lg font-semibold">Pinned notes</h3>
        {pinned.length ? (
          <ul className="space-y-2">
            {pinned.map((t) => (
              <li key={t.id}>
                <Link href={`/thoughts/${t.id}`} className="block rounded-2xl bg-surface-sunk px-3 py-2.5 text-[15px] hover:bg-primary-soft">
                  <span className="font-semibold">{t.title || "Untitled"}</span>
                  <span className="line-clamp-2 text-ink-muted">{t.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-ink-muted">Pin a thought linked to this project and it shows up here.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-surface-sunk p-3">
      <dt className="text-[13px] font-semibold text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-display text-2xl font-semibold tabular">{value}</dd>
    </div>
  );
}

function LinkedNotes({ projectId }: { projectId: string }) {
  const notes = useLiveQuery(async () => alive(await getDB().thoughts.toArray()).filter((t) => t.projectIds.includes(projectId)).sort((a, b) => b.updatedAt - a.updatedAt), [projectId]);
  if (!notes) return <Skeleton className="h-40" />;
  if (!notes.length) return <EmptyState title="No notes yet" line="Link a thought to this project and it lands here." pose="thinking" />;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {notes.map((t) => (
        <li key={t.id}>
          <Link href={`/thoughts/${t.id}`} className="card block p-4 hover:shadow-[var(--shadow-lift)]">
            <p className="font-display text-[17px] font-semibold">{t.title || "Untitled thought"}</p>
            <p className="mt-1 line-clamp-3 text-[15px] text-ink-muted">{t.text}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function LinkedPeople({ projectId }: { projectId: string }) {
  const people = useLiveQuery(async () => alive(await getDB().contacts.toArray()).filter((c) => c.projectIds.includes(projectId)), [projectId]);
  if (!people) return <Skeleton className="h-40" />;
  if (!people.length) return <EmptyState title="Nobody linked yet" line="Link people to this project from their contact card." pose="wave" />;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {people.map((c) => (
        <li key={c.id}>
          <Link href={`/people/${c.id}`} className="card flex items-center gap-3 p-3 hover:shadow-[var(--shadow-lift)]">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full font-bold text-[#2E2A26]" style={{ background: c.color }}>
              {c.name.slice(0, 1)}
            </span>
            <span className="font-semibold">{c.name}</span>
            <span className="text-sm text-ink-muted">{c.role}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProjectCalendar({ projectId }: { projectId: string }) {
  const tasks = useTasks() ?? [];
  const events = useLiveQuery(async () => alive(await getDB().events.toArray()).filter((e) => e.projectId === projectId).sort((a, b) => a.start - b.start), [projectId]);
  const due = tasks.filter((t) => t.projectId === projectId && t.dueDate && t.status !== "done").sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));
  if (!events) return <Skeleton className="h-40" />;
  if (!events.length && !due.length) return <EmptyState title="Nothing scheduled" line="Due dates and events for this project gather here." pose="thinking" />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="card p-4">
        <h3 className="mb-3 font-display text-lg font-semibold">Due dates</h3>
        <ul className="space-y-2">
          {due.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-2xl bg-surface-sunk px-3 py-2.5 text-[15px]">
              <span className="truncate">{t.title}</span>
              <span className="shrink-0 text-sm font-semibold text-ink-muted">{friendlyDue(t.dueDate, t.dueTime)}</span>
            </li>
          ))}
          {!due.length && <p className="text-ink-muted">No due dates.</p>}
        </ul>
      </section>
      <section className="card p-4">
        <h3 className="mb-3 font-display text-lg font-semibold">Events</h3>
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded-2xl bg-surface-sunk px-3 py-2.5 text-[15px]">
              <span className="truncate">{e.title}</span>
              <span className="shrink-0 text-sm font-semibold text-ink-muted">{friendlyDay(calendarDay(e.start))}</span>
            </li>
          ))}
          {!events.length && <p className="text-ink-muted">No events linked.</p>}
        </ul>
      </section>
    </div>
  );
}
