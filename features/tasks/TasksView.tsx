"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { BookmarkPlus, CalendarClock, CalendarDays, CheckSquare, ChevronDown, FolderInput, LayoutList, SlidersHorizontal, SquareKanban, Tag, Trash2, X } from "lucide-react";
import { useProjects, useSettings, useTasks } from "@/lib/hooks";
import { todayKey } from "@/lib/day";
import { allTags, updateTask } from "@/lib/data/tasks";
import { updateSettings } from "@/lib/data/settings";
import { uid } from "@/lib/data/core";
import { cn } from "@/lib/cn";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Field";
import { toast } from "@/components/ui/toast-store";
import type { Priority, SavedFilter, TaskStatus } from "@/lib/types";
import { GROUP_LABELS, applyFilter, groupTasks, type GroupKey } from "./grouping";
import { SortableTaskList } from "./SortableTaskList";
import { Board } from "./Board";
import { DoneList } from "./SectionedTasks";
import { useHold } from "./hold-store";
import { useTaskActions } from "./useTaskActions";
import { useTaskPicker } from "./picker-store";

const ORDER: GroupKey[] = ["overdue", "today", "tomorrow", "week", "later", "nodate"];

/** All tasks across projects (brief 6.3). */
export function TasksView() {
  const tasks = useTasks();
  const projects = useProjects() ?? [];
  const settings = useSettings();
  const tags = useLiveQuery(() => allTags(), []) ?? [];
  const held = useHold((s) => s.held);
  const { removeMany } = useTaskActions();
  const openPicker = useTaskPicker((s) => s.open);
  const [view, setView] = useState<"list" | "board">("list");
  const [projectId, setProjectId] = useState<string | "all" | null>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tagSheet, setTagSheet] = useState(false);
  const today = todayKey();

  const filtered = useMemo(() => (tasks ? applyFilter(tasks, { projectId, tag, priority, status }) : []), [tasks, projectId, tag, priority, status]);
  const groups = useMemo(() => {
    const g = groupTasks(filtered, today);
    // Keep just-ticked rows in place for a moment before they glide into Done.
    for (const [id, grp] of Object.entries(held)) {
      const t = g.get("done")?.find((x) => x.id === id);
      if (t) {
        g.set("done", g.get("done")!.filter((x) => x.id !== id));
        g.get(grp as GroupKey)?.push(t);
      }
    }
    return g;
  }, [filtered, today, held]);

  if (!tasks) return <ListSkeleton />;
  const activeFilters = (projectId !== "all" ? 1 : 0) + (tag ? 1 : 0) + (priority ? 1 : 0) + (status ? 1 : 0);
  const toggleSel = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const clearSel = () => {
    setSelected(new Set());
    setSelectMode(false);
  };
  const saveFilter = async () => {
    const name = window.prompt("Name this filter", tag ? `#${tag}` : "My filter");
    if (!name) return;
    const f: SavedFilter = { id: uid("f_"), name, projectId: projectId === "all" ? null : projectId, tag, priority, status };
    await updateSettings({ savedFilters: [...(settings?.savedFilters ?? []), f] });
    toast("Filter saved");
  };
  const applySaved = (f: SavedFilter) => {
    setProjectId(f.projectId ?? "all");
    setTag(f.tag);
    setPriority(f.priority);
    setStatus(f.status);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          label="View"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "list", label: <><LayoutList size={16} /> List</> },
            { value: "board", label: <><SquareKanban size={16} /> Board</> },
          ]}
        />
        <Link href="/calendar" className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-muted hover:bg-surface-sunk hover:text-ink">
          <CalendarDays size={16} /> <span className="hidden sm:inline">Calendar</span>
        </Link>
        <div className="flex-1" />
        <Button variant={activeFilters ? "soft" : "ghost"} size="sm" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}>
          <SlidersHorizontal size={16} /> <span className="hidden sm:inline">Filter</span>{activeFilters ? ` ${activeFilters}` : ""}
        </Button>
        <Button variant={selectMode ? "soft" : "ghost"} size="sm" onClick={() => (selectMode ? clearSel() : setSelectMode(true))}>
          <CheckSquare size={16} /> <span className={selectMode ? "" : "hidden sm:inline"}>{selectMode ? "Cancel" : "Select"}</span>
        </Button>
      </div>

      {(settings?.savedFilters?.length ?? 0) > 0 && (
        <div className="no-scrollbar -mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
          {settings!.savedFilters.map((f) => (
            <span key={f.id} className="inline-flex shrink-0 items-center">
              <Chip onClick={() => applySaved(f)}>{f.name}</Chip>
              <button
                onClick={() => updateSettings({ savedFilters: settings!.savedFilters.filter((x) => x.id !== f.id) })}
                className="-ml-1 inline-flex h-9 w-8 items-center justify-center text-ink-faint hover:text-ink"
                aria-label={`Remove saved filter ${f.name}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {filtersOpen && (
        <div className="card mb-5 space-y-3 p-4">
          <FilterRow label="Project">
            <Chip active={projectId === "all"} onClick={() => setProjectId("all")}>All</Chip>
            <Chip active={projectId === null} onClick={() => setProjectId(null)}>My List</Chip>
            {projects.map((p) => (
              <Chip key={p.id} active={projectId === p.id} onClick={() => setProjectId(p.id)} color={p.color}>
                {p.name}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="Priority">
            {([null, 3, 2, 1] as (Priority | null)[]).map((p) => (
              <Chip key={String(p)} active={priority === p} onClick={() => setPriority(p)}>
                {p === null ? "Any" : ["", "Low", "Medium", "High"][p]}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="Status">
            {([null, "todo", "doing", "done"] as (TaskStatus | null)[]).map((s) => (
              <Chip key={String(s)} active={status === s} onClick={() => setStatus(s)}>
                {s === null ? "Any" : { todo: "To do", doing: "Doing", done: "Done" }[s]}
              </Chip>
            ))}
          </FilterRow>
          {tags.length > 0 && (
            <FilterRow label="Tag">
              <Chip active={tag === null} onClick={() => setTag(null)}>Any</Chip>
              {tags.map((t) => (
                <Chip key={t} active={tag === t} onClick={() => setTag(t)}>
                  #{t}
                </Chip>
              ))}
            </FilterRow>
          )}
          <div className="flex justify-end gap-2 pt-1">
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setProjectId("all"); setTag(null); setPriority(null); setStatus(null); }}>
                Clear
              </Button>
            )}
            <Button variant="soft" size="sm" onClick={saveFilter} disabled={!activeFilters}>
              <BookmarkPlus size={16} /> Save filter
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title={activeFilters ? "Nothing matches" : "No tasks yet"} line={activeFilters ? "Try loosening the filters." : "Nothing here yet. Want to plant something?"} pose="thinking" />
      ) : view === "board" ? (
        <Board tasks={filtered} projects={projects} />
      ) : (
        <div className="space-y-7">
          {ORDER.map((k) => {
            const list = groups.get(k) ?? [];
            if (!list.length) return null;
            return (
              <section key={k} aria-label={GROUP_LABELS[k]} className={cn(k === "overdue" && "rounded-[24px] bg-gentle/35 p-3 md:p-4")}>
                <h3 className={cn("mb-2 flex items-center gap-2 font-display text-[18px] font-semibold", k === "overdue" && "text-gentle-ink")}>
                  {GROUP_LABELS[k]}
                  <span className="text-sm font-medium tabular text-ink-faint">{list.length}</span>
                </h3>
                <SortableTaskList tasks={list} projects={projects} sortable={false} selectMode={selectMode} selected={selected} onSelect={toggleSel} />
              </section>
            );
          })}
          {(groups.get("done")?.length ?? 0) > 0 && (
            <section>
              <button onClick={() => setDoneOpen((v) => !v)} aria-expanded={doneOpen} className="flex h-10 items-center gap-2 rounded-full px-2 text-sm font-bold text-ink-muted hover:text-ink">
                <ChevronDown size={18} className={cn("transition-transform", !doneOpen && "-rotate-90")} />
                Done <span className="rounded-full bg-surface-sunk px-2 py-0.5 text-xs tabular">{groups.get("done")!.length}</span>
              </button>
              {doneOpen && <DoneList tasks={groups.get("done")!} projects={projects} showProject />}
            </section>
          )}
        </div>
      )}

      {selectMode && (
        <div className="fixed inset-x-3 bottom-[calc(92px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-lg items-center gap-1 rounded-[22px] bg-ink p-2 text-background shadow-[var(--shadow-lift)] md:bottom-6">
          <span className="px-3 text-sm font-semibold tabular">{selected.size} selected</span>
          <div className="flex-1" />
          <BulkBtn label="Move" icon={<FolderInput size={18} />} disabled={!selected.size} onClick={() => openPicker("move", null, [...selected])} />
          <BulkBtn label="Reschedule" icon={<CalendarClock size={18} />} disabled={!selected.size} onClick={() => openPicker("schedule", null, [...selected])} />
          <BulkBtn label="Tag" icon={<Tag size={18} />} disabled={!selected.size} onClick={() => setTagSheet(true)} />
          <BulkBtn
            label="Delete"
            icon={<Trash2 size={18} />}
            disabled={!selected.size}
            onClick={async () => {
              if (!window.confirm(`Delete ${selected.size} task${selected.size === 1 ? "" : "s"}? You can undo.`)) return;
              await removeMany([...selected]);
              clearSel();
            }}
          />
        </div>
      )}
      <BulkTagSheet
        open={tagSheet}
        onOpenChange={setTagSheet}
        onApply={async (t) => {
          for (const id of selected) {
            const task = tasks.find((x) => x.id === id);
            if (task && !task.tags.includes(t)) await updateTask(id, { tags: [...task.tags, t] });
          }
          toast(`Tagged #${t}`);
          setTagSheet(false);
        }}
      />
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function BulkBtn({ label, icon, onClick, disabled }: { label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl hover:bg-white/10 disabled:opacity-40 dark:hover:bg-black/10">
      {icon}
    </button>
  );
}

function BulkTagSheet({ open, onOpenChange, onApply }: { open: boolean; onOpenChange: (v: boolean) => void; onApply: (t: string) => void }) {
  const [t, setT] = useState("");
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Add a tag" size="sm">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = t.trim().replace(/^#/, "").toLowerCase();
          if (v) onApply(v);
          setT("");
        }}
      >
        <Input value={t} onChange={(e) => setT(e.target.value)} placeholder="e.g. exam" aria-label="Tag" autoFocus />
        <Button type="submit" disabled={!t.trim()}>
          Add
        </Button>
      </form>
    </Sheet>
  );
}
