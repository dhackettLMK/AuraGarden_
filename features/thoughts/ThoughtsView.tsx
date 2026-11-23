"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LayoutGrid, List, Pin, Plus, Search, Sparkles, X } from "lucide-react";
import { getDB } from "@/lib/db";
import { alive, reorder } from "@/lib/data/core";
import { createThought } from "@/lib/data/thoughts";
import { useProjects } from "@/lib/hooks";
import { relativeTime } from "@/lib/dates";
import { pickLine } from "@/config/oscar-lines";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Oscar } from "@/components/oscar/Oscar";
import { useListSensors } from "@/features/tasks/SortableTaskList";
import { cn } from "@/lib/cn";
import type { Thought } from "@/lib/types";
import { MoodIcon } from "./mood";

/** Thoughts: a journal and brain dump (brief 6.5). */
export function ThoughtsView() {
  const router = useRouter();
  const rows = useLiveQuery(() => getDB().thoughts.toArray(), []);
  const projects = useProjects() ?? [];
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [prompt] = useState(() => pickLine("thought"));
  const [promptDismissed, setPromptDismissed] = useState(false);
  const sensors = useListSensors();

  const thoughts = useMemo(
    () =>
      alive(rows).sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order,
      ),
    [rows],
  );
  const tags = useMemo(
    () => [...new Set(thoughts.flatMap((t) => t.tags))].sort(),
    [thoughts],
  );
  const query = q.trim().toLowerCase();
  const shown = thoughts.filter(
    (t) =>
      (!tag || t.tags.includes(tag)) &&
      (!query ||
        `${t.title} ${t.text} ${t.tags.join(" ")}`
          .toLowerCase()
          .includes(query)),
  );
  const today = new Date().toDateString();
  const answeredToday = thoughts.some(
    (t) => t.prompt && new Date(t.createdAt).toDateString() === today,
  );

  async function newThought(p?: string) {
    const t = await createThought({ prompt: p ?? null, title: p ?? "" });
    router.push(`/thoughts/${t.id}?new=1`);
  }

  if (!rows)
    return (
      <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
        {[120, 180, 140, 200].map((h, i) => (
          <Skeleton
            key={i}
            className="mb-3 w-full rounded-[20px]"
            style={{ height: h }}
          />
        ))}
      </div>
    );

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = shown.map((t) => t.id);
    void reorder(
      "thoughts",
      arrayMove(
        ids,
        ids.indexOf(String(e.active.id)),
        ids.indexOf(String(e.over.id)),
      ),
    );
  };

  return (
    <div className="space-y-4">
      {!answeredToday && !promptDismissed && (
        <section className="flex items-center gap-3 rounded-[24px] bg-primary-soft/70 p-3 pr-4">
          <Oscar size={62} pose="thinking" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-muted">Oscar asks</p>
            <p className="font-display text-[18px] font-semibold leading-snug">
              {prompt}
            </p>
          </div>
          <Button size="sm" onClick={() => newThought(prompt)}>
            <Sparkles size={16} /> Answer
          </Button>
          <button
            onClick={() => setPromptDismissed(true)}
            aria-label="Not today"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface"
          >
            <X size={16} />
          </button>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search thoughts"
            aria-label="Search thoughts"
            className="h-11 w-full rounded-full bg-surface-sunk pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/60"
          />
        </label>
        <Segmented
          label="Layout"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "grid", label: <LayoutGrid size={16} />, aria: "Grid" },
            { value: "list", label: <List size={16} />, aria: "List" },
          ]}
        />
        <Button size="sm" onClick={() => newThought()} aria-label="New thought">
          <Plus size={18} />{" "}
          <span className="hidden sm:inline">New thought</span>
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
          <Chip active={!tag} onClick={() => setTag(null)}>
            All
          </Chip>
          {tags.map((t) => (
            <Chip
              key={t}
              active={tag === t}
              onClick={() => setTag(tag === t ? null : t)}
            >
              #{t}
            </Chip>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState
          title={
            thoughts.length ? "Nothing matches" : "Your thoughts live here"
          }
          line={
            thoughts.length
              ? "Try another word or tag."
              : "Nothing here yet. Want to plant something?"
          }
          pose="thinking"
        >
          {!thoughts.length && (
            <Button onClick={() => newThought()}>
              <Plus size={18} /> Write a thought
            </Button>
          )}
        </EmptyState>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={shown.map((t) => t.id)}
            strategy={rectSortingStrategy}
          >
            <ul
              className={
                view === "grid"
                  ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-2"
              }
            >
              {shown.map((t) => (
                <SortableThought
                  key={t.id}
                  thought={t}
                  compact={view === "list"}
                  projectNames={
                    t.projectIds
                      .map((id) => projects.find((p) => p.id === id)?.name)
                      .filter(Boolean) as string[]
                  }
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableThought({
  thought: t,
  compact,
  projectNames,
}: {
  thought: Thought;
  compact: boolean;
  projectNames: string[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: t.id });
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <div {...attributes} {...listeners} className="touch-manipulation">
        <Link
          href={`/thoughts/${t.id}`}
          draggable={false}
          className={cn(
            "card block p-4 transition-shadow hover:shadow-[var(--shadow-lift)]",
            isDragging && "shadow-[var(--shadow-lift)]",
            compact && "py-3",
          )}
        >
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 font-display text-[17px] font-semibold leading-snug">
              {t.title || firstLine(t.text) || "Untitled thought"}
            </p>
            {t.mood && <MoodIcon mood={t.mood} />}
            {t.pinned && (
              <Pin
                size={16}
                className="mt-0.5 text-primary"
                fill="currentColor"
                aria-label="Pinned"
              />
            )}
          </div>
          {!compact && t.text && (
            <p className="mt-1.5 line-clamp-5 whitespace-pre-line text-[15px] text-ink-muted">
              {t.title ? t.text : t.text.split("\n").slice(1).join("\n")}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-ink-faint">
            <span>{relativeTime(t.updatedAt)}</span>
            {projectNames.map((n) => (
              <span
                key={n}
                className="rounded-full bg-surface-sunk px-2 py-0.5 text-ink-muted"
              >
                {n}
              </span>
            ))}
            {t.tags.slice(0, 4).map((x) => (
              <span key={x} className="text-primary">
                #{x}
              </span>
            ))}
          </div>
        </Link>
      </div>
    </li>
  );
}

function firstLine(s: string) {
  return s.trim().split("\n")[0]?.slice(0, 80);
}
