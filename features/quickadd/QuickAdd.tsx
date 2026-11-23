"use client";

import { Dialog } from "radix-ui";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays, CheckCircle2, CornerDownLeft, Flag, FolderHeart, Hash, Lightbulb, ListTodo, Search, Sun, Sunrise,
  User, X, CalendarPlus, Clock,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useProjects } from "@/lib/hooks";
import { useUI, type QuickAddType } from "@/lib/ui-store";
import { parseQuickInput } from "@/lib/parse";
import { createTask } from "@/lib/data/tasks";
import { createThought, escapeHtml } from "@/lib/data/thoughts";
import { createContact } from "@/lib/data/contacts";
import { createEvent } from "@/lib/data/events";
import { addDays, todayKey } from "@/lib/day";
import { friendlyDay, formatTime } from "@/lib/dates";
import { ProjectIcon } from "@/components/icons/ProjectIcon";
import type { Priority } from "@/lib/types";
import { searchAll, type SearchHit } from "./search";
import { onThoughtWritten, onContactAdded } from "@/lib/game/hooks";

const TYPES: { value: QuickAddType; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "task", label: "Task", icon: CheckCircle2 },
  { value: "todo", label: "To-do", icon: ListTodo },
  { value: "thought", label: "Thought", icon: Lightbulb },
  { value: "event", label: "Event", icon: CalendarPlus },
  { value: "person", label: "Person", icon: User },
];

const KIND_ICON = { task: CheckCircle2, project: FolderHeart, thought: Lightbulb, person: User, event: CalendarDays };

/**
 * One sheet for quick add and search (brief 6.9). Enter saves and keeps the
 * sheet open for rapid entry; arrow keys move through search results.
 */
export function QuickAdd() {
  const { open, type: initialType, projectId: initialProject, mode } = useUI((s) => s.quickAdd);
  const close = useUI((s) => s.closeQuickAdd);
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed inset-0 z-50 bg-[#1c1712]/35 backdrop-blur-[2px] dark:bg-black/55" />
        <Dialog.Content
          aria-describedby={undefined}
          className="sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-[28px] bg-surface shadow-[var(--shadow-lift)] outline-none md:w-[calc(100%-48px)] md:max-w-xl md:rounded-[24px]"
        >
          <Dialog.Title className="sr-only">{mode === "search" ? "Search" : "Quick add"}</Dialog.Title>
          {open && <QuickAddBody key={`${initialType}-${initialProject}-${mode}`} initialType={initialType} initialProject={initialProject} startInSearch={mode === "search"} onClose={close} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function QuickAddBody({
  initialType,
  initialProject,
  startInSearch,
  onClose,
}: {
  initialType: QuickAddType;
  initialProject: string | null;
  startInSearch: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const projectsLive = useProjects();
  const projects = useMemo(() => projectsLive ?? [], [projectsLive]);
  const [type, setType] = useState<QuickAddType>(initialType);
  const [text, setText] = useState("");
  const [projectId, setProjectId] = useState<string | null>(initialProject);
  const [dateChip, setDateChip] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<{ date?: boolean; project?: boolean; priority?: boolean }>({});
  const [added, setAdded] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const [showProjects, setShowProjects] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const today = todayKey();

  const parsed = useMemo(() => parseQuickInput(text, projects), [text, projects]);
  const query = startInSearch || text.trim().length >= 2 ? text : "";
  const hits = useLiveQuery(() => searchAll(query), [query]) ?? [];
  const showHits = startInSearch || (text.trim().length >= 2 && hits.length > 0);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const effProject = !dismissed.project && parsed.projectId ? parsed.projectId : projectId;
  const effDate = !dismissed.date && parsed.dueDate ? parsed.dueDate : dateChip;
  const effTime = !dismissed.date && parsed.dueDate ? parsed.dueTime : null;
  const effPriority: Priority = !dismissed.priority ? parsed.priority : 0;
  const title = parsed.title;

  async function save() {
    const raw = text.trim();
    if (!raw) return;
    if (type === "task" || type === "todo") {
      if (!title) return;
      await createTask({
        title,
        projectId: type === "todo" ? null : effProject,
        dueDate: effDate,
        dueTime: effTime,
        priority: effPriority,
        tags: parsed.tags,
        today: type === "todo" && effDate === today,
        sectionId: type === "todo" || !effProject ? (effDate && effDate !== today ? "sec_mylist_someday" : "sec_mylist_today") : null,
      });
    } else if (type === "thought") {
      const t = await createThought({ title: "", body: `<p>${escapeHtml(raw)}</p>`, text: raw, tags: parsed.tags, projectIds: effProject ? [effProject] : [] });
      await onThoughtWritten(t.id);
    } else if (type === "person") {
      const c = await createContact({ name: raw });
      await onContactAdded(c.id);
    } else if (type === "event") {
      const day = effDate ?? today;
      const [h, m] = (effTime ?? "09:00").split(":").map(Number);
      const start = new Date(`${day}T00:00:00`);
      start.setHours(h, m);
      await createEvent({ title: title || raw, start: start.getTime(), end: start.getTime() + 3_600_000, projectId: effProject, allDay: !effTime && !parsed.dueTime });
    }
    setAdded((a) => [raw, ...a].slice(0, 4));
    setText("");
    setDismissed({});
    setActive(-1);
  }

  function openHit(h: SearchHit) {
    onClose();
    router.push(h.href);
  }

  const chips: React.ReactNode[] = [];
  if (type !== "person" && type !== "thought" && effDate)
    chips.push(
      <ParsedChip key="d" icon={<CalendarDays size={14} />} onRemove={() => (parsed.dueDate && !dismissed.date ? setDismissed((d) => ({ ...d, date: true })) : setDateChip(null))}>
        {friendlyDay(effDate, today)}
        {effTime && ` ${formatTime(effTime)}`}
      </ParsedChip>,
    );
  if (type !== "todo" && type !== "person" && effProject) {
    const p = projects.find((x) => x.id === effProject);
    if (p)
      chips.push(
        <ParsedChip key="p" icon={<ProjectIcon project={p} size={16} className="!rounded-[5px]" />} onRemove={() => (parsed.projectId && !dismissed.project ? setDismissed((d) => ({ ...d, project: true })) : setProjectId(null))}>
          {p.name}
        </ParsedChip>,
      );
  }
  if ((type === "task" || type === "todo") && effPriority > 0)
    chips.push(
      <ParsedChip key="pr" icon={<Flag size={14} />} onRemove={() => setDismissed((d) => ({ ...d, priority: true }))}>
        {["", "Low", "Medium", "High"][effPriority]} priority
      </ParsedChip>,
    );
  for (const t of type === "person" ? [] : parsed.tags)
    chips.push(
      <ParsedChip key={`t${t}`} icon={<Hash size={14} />}>
        {t}
      </ParsedChip>,
    );

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line md:hidden" aria-hidden="true" />
      <div className="flex items-center gap-2 px-4 pt-3">
        <span className="text-ink-faint">{startInSearch ? <Search size={20} /> : <CornerDownLeft size={20} />}</span>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setActive(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && showHits) {
              e.preventDefault();
              setActive((a) => Math.min(hits.length - 1, a + 1));
            } else if (e.key === "ArrowUp" && showHits) {
              e.preventDefault();
              setActive((a) => Math.max(-1, a - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (active >= 0 && hits[active]) openHit(hits[active]);
              else if (!startInSearch) void save();
            }
          }}
          placeholder={startInSearch ? "Search everything…" : placeholderFor(type)}
          aria-label={startInSearch ? "Search" : "What's on your mind?"}
          role="combobox"
          aria-expanded={showHits}
          aria-controls="qa-results"
          aria-activedescendant={active >= 0 ? `qa-hit-${active}` : undefined}
          autoComplete="off"
          className="h-14 min-w-0 flex-1 bg-transparent text-[18px] font-medium outline-none placeholder:text-ink-faint"
        />
        <Dialog.Close className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunk" aria-label="Close">
          <X size={20} />
        </Dialog.Close>
      </div>

      {!startInSearch && (
        <>
          {chips.length > 0 && <div className="flex flex-wrap gap-1.5 px-4 pb-1">{chips}</div>}
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2" role="radiogroup" aria-label="Type">
            {TYPES.map((t) => (
              <button
                key={t.value}
                role="radio"
                aria-checked={type === t.value}
                onClick={() => {
                  setType(t.value);
                  inputRef.current?.focus();
                }}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors",
                  type === t.value ? "bg-ink text-background" : "bg-surface-sunk text-ink-muted hover:text-ink",
                )}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
          {type !== "person" && (
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3">
              {type !== "thought" && (
                <>
                  <QuickChip active={effDate === today} onClick={() => setDateChip(effDate === today ? null : today)} icon={<Sun size={15} />}>
                    Today
                  </QuickChip>
                  <QuickChip active={effDate === addDays(today, 1)} onClick={() => setDateChip(effDate === addDays(today, 1) ? null : addDays(today, 1))} icon={<Sunrise size={15} />}>
                    Tomorrow
                  </QuickChip>
                  <label className="relative inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-surface-sunk px-3.5 text-sm font-semibold text-ink-muted hover:text-ink">
                    <Clock size={15} /> Pick date
                    <input type="date" className="absolute inset-0 opacity-0" aria-label="Pick a date" onChange={(e) => setDateChip(e.target.value || null)} />
                  </label>
                </>
              )}
              {type !== "todo" && (
                <QuickChip active={showProjects} onClick={() => setShowProjects((v) => !v)} icon={<FolderHeart size={15} />}>
                  Project
                </QuickChip>
              )}
            </div>
          )}
          {showProjects && type !== "todo" && type !== "person" && (
            <div className="no-scrollbar -mt-1 flex gap-1.5 overflow-x-auto px-4 pb-3">
              {projects.map((p) => (
                <QuickChip
                  key={p.id}
                  active={effProject === p.id}
                  onClick={() => {
                    setProjectId(effProject === p.id ? null : p.id);
                    setDismissed((d) => ({ ...d, project: true }));
                    setShowProjects(false);
                  }}
                  icon={<ProjectIcon project={p} size={18} className="!rounded-[6px]" />}
                >
                  {p.name}
                </QuickChip>
              ))}
            </div>
          )}
        </>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-line/70 px-2 py-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        {showHits ? (
          <ul id="qa-results" role="listbox" aria-label={text ? "Results" : "Recent"}>
            {!text && <li className="px-3 pb-1 pt-1 text-xs font-bold uppercase tracking-wide text-ink-faint">Recent</li>}
            {hits.map((h, i) => {
              const Icon = KIND_ICON[h.kind];
              return (
                <li key={`${h.kind}-${h.id}`} id={`qa-hit-${i}`} role="option" aria-selected={i === active}>
                  <button
                    onClick={() => openHit(h)}
                    onMouseEnter={() => setActive(i)}
                    className={cn("flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left", i === active && "bg-surface-sunk")}
                  >
                    <Icon size={18} />
                    <span className="min-w-0 flex-1 truncate font-medium">{h.title}</span>
                    <span className="shrink-0 text-sm text-ink-muted">{h.sub}</span>
                  </button>
                </li>
              );
            })}
            {hits.length === 0 && <li className="px-3 py-6 text-center text-ink-muted">Nothing matches that yet.</li>}
          </ul>
        ) : added.length > 0 ? (
          <ul className="space-y-1 px-2 py-1" aria-live="polite">
            {added.map((a, i) => (
              <li key={`${a}-${i}`} className="flex items-center gap-2 text-[15px] text-ink-muted">
                <CheckCircle2 size={16} className="text-primary" /> Added “{a}”
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-2 text-sm text-ink-muted">
            Try <span className="font-semibold text-ink">essay draft fri 5pm #college !high</span>. Enter saves; the sheet stays open.
          </p>
        )}
      </div>
    </div>
  );
}

function placeholderFor(t: QuickAddType) {
  return { task: "What's on your mind?", todo: "Add to My List", thought: "A thought to keep", event: "Event, e.g. coffee with Aoife fri 3pm", person: "Their name" }[t];
}

function ParsedChip({ children, icon, onRemove }: { children: React.ReactNode; icon: React.ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary-soft pl-2.5 pr-1 text-[13px] font-semibold text-primary-strong dark:text-primary">
      {icon}
      {children}
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label="Remove" className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-black/5">
          <X size={13} />
        </button>
      ) : (
        <span className="w-1.5" />
      )}
    </span>
  );
}

function QuickChip({ children, active, onClick, icon }: { children: React.ReactNode; active?: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors",
        active ? "bg-primary text-primary-ink" : "bg-surface-sunk text-ink-muted hover:text-ink",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
