"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Inbox, RefreshCw, Settings2 } from "lucide-react";
import { useMediaQuery, useNow, useProjects, useTasks } from "@/lib/hooks";
import { addDays, dayDiff, weekStart } from "@/lib/day";
import { dayName, longDate, monthName, shortMonth } from "@/lib/dates";
import { updateEvent } from "@/lib/data/events";
import { updateTask } from "@/lib/data/tasks";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeafCheckbox } from "@/features/tasks/LeafCheckbox";
import { useTaskActions } from "@/features/tasks/useTaskActions";
import { cn } from "@/lib/cn";
import type { Task } from "@/lib/types";
import { itemsOnDay, refreshAll, useCalendarItems, useFeedRefresher, type CalItem } from "./data";
import { EventSheet, type EventDraft } from "./EventSheet";
import { CalendarsSheet } from "./CalendarsSheet";

type View = "month" | "week" | "3day" | "day" | "agenda";
const HOUR_PX = 52;
const DAY_MS = 86_400_000;

function localKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function startOf(day: string) {
  return new Date(`${day}T00:00:00`).getTime();
}

export function CalendarView() {
  return (
    <Suspense>
      <CalendarInner />
    </Suspense>
  );
}

function CalendarInner() {
  const params = useSearchParams();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const now = useNow(60_000);
  const today = localKey(new Date(now));
  const [view, setView] = useState<View | null>(null);
  const [anchor, setAnchor] = useState(params.get("date") ?? today);
  const [editing, setEditing] = useState<EventDraft | null>(null);
  const [calendarsOpen, setCalendarsOpen] = useState(false);
  const [placing, setPlacing] = useState<Task | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const projects = useProjects() ?? [];
  const tasks = useTasks() ?? [];
  useFeedRefresher();
  const v: View = view ?? (desktop ? "week" : "3day");

  const days = useMemo(() => {
    if (v === "day") return [anchor];
    if (v === "3day") return [anchor, addDays(anchor, 1), addDays(anchor, 2)];
    if (v === "week") return Array.from({ length: 7 }, (_, i) => addDays(weekStart(anchor), i));
    if (v === "agenda") return Array.from({ length: 30 }, (_, i) => addDays(anchor, i));
    const first = `${anchor.slice(0, 7)}-01`;
    const gridStart = weekStart(first);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [v, anchor]);
  const from = startOf(days[0]);
  const to = startOf(days.at(-1)!) + DAY_MS;
  const items = useCalendarItems(from, to, projects);

  const step = (dir: number) => {
    if (v === "month") {
      const [y, m] = anchor.split("-").map(Number);
      const d = new Date(y, m - 1 + dir, 1);
      setAnchor(localKey(d));
    } else setAnchor(addDays(anchor, dir * (v === "week" ? 7 : v === "3day" ? 3 : v === "agenda" ? 30 : 1)));
  };
  const title =
    v === "month" || v === "agenda"
      ? `${monthName(Number(anchor.slice(5, 7)))} ${anchor.slice(0, 4)}`
      : v === "day"
        ? longDate(anchor)
        : `${Number(days[0].slice(8))} ${shortMonth(Number(days[0].slice(5, 7)))} – ${Number(days.at(-1)!.slice(8))} ${shortMonth(Number(days.at(-1)!.slice(5, 7)))}`;

  const unscheduled = tasks.filter((t) => t.status !== "done" && !t.blockStart).sort((a, b) => (a.dueDate ?? "9") < (b.dueDate ?? "9") ? -1 : 1);

  // Pull to refresh on phones.
  const pull = useRef<{ y: number; at: number } | null>(null);

  return (
    <div
      className="space-y-3"
      onTouchStart={(e) => {
        if (window.scrollY <= 0) pull.current = { y: e.touches[0].clientY, at: Date.now() };
      }}
      onTouchEnd={async (e) => {
        const p = pull.current;
        pull.current = null;
        if (p && e.changedTouches[0].clientY - p.y > 90) {
          setRefreshing(true);
          await refreshAll();
          setRefreshing(false);
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => step(-1)} aria-label="Previous">
            <ChevronLeft size={20} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => step(1)} aria-label="Next">
            <ChevronRight size={20} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(today)}>
            Today
          </Button>
        </div>
        <h2 className="min-w-0 flex-1 truncate font-display text-[19px] font-semibold">{title}</h2>
        {refreshing && <RefreshCw size={16} className="animate-spin text-ink-muted" aria-label="Refreshing" />}
        <Button variant="ghost" size="icon-sm" onClick={() => setCalendarsOpen(true)} aria-label="Calendars and imports">
          <Settings2 size={18} />
        </Button>
        <Button size="sm" onClick={() => setEditing({ day: anchor === today ? today : anchor, hour: 9 })} aria-label="New event">
          <CalendarPlus size={16} /> <span className="hidden sm:inline">New event</span>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Segmented<View>
          label="Calendar view"
          size="sm"
          value={v}
          onChange={setView}
          className="no-scrollbar max-w-full overflow-x-auto"
          options={[
            { value: "month", label: "Month" },
            { value: "week", label: "Week" },
            { value: "3day", label: "3 days" },
            { value: "day", label: "Day" },
            { value: "agenda", label: "Agenda" },
          ]}
        />
        {v !== "month" && v !== "agenda" && !desktop && (
          <Button variant={trayOpen ? "soft" : "ghost"} size="sm" onClick={() => setTrayOpen((o) => !o)} aria-expanded={trayOpen}>
            <Inbox size={16} /> {unscheduled.length}
          </Button>
        )}
      </div>

      {placing && (
        <div className="flex items-center gap-2 rounded-2xl bg-gentle px-4 py-2.5 text-[15px] font-semibold text-gentle-ink" role="status">
          Tap a time to block out “{placing.title}”
          <button className="ml-auto underline" onClick={() => setPlacing(null)}>
            Cancel
          </button>
        </div>
      )}

      <div className={cn("flex gap-4", desktop && v !== "month" && v !== "agenda" && "items-start")}>
        <div className="min-w-0 flex-1">
          {!items ? (
            <Skeleton className="h-[520px] w-full rounded-[24px]" />
          ) : v === "month" ? (
            <MonthGrid days={days} anchor={anchor} today={today} items={items} onPick={(d) => { setAnchor(d); setView("day"); }} />
          ) : v === "agenda" ? (
            <Agenda days={days} items={items} today={today} onOpen={(i) => setEditing({ item: i })} />
          ) : (
            <TimeGrid
              days={days}
              today={today}
              now={now}
              items={items}
              placing={placing}
              onPlace={async (start) => {
                if (!placing) return;
                await updateTask(placing.id, { blockStart: start, blockEnd: start + 3_600_000, dueDate: localKey(new Date(start)) });
                setPlacing(null);
              }}
              onCreate={(day, hour) => setEditing({ day, hour })}
              onOpen={(i) => setEditing({ item: i })}
              onDropTask={async (taskId, start) => {
                await updateTask(taskId, { blockStart: start, blockEnd: start + 3_600_000, dueDate: localKey(new Date(start)) });
              }}
            />
          )}
        </div>
        {v !== "month" && v !== "agenda" && (desktop || trayOpen) && (
          <TaskTray tasks={unscheduled} desktop={desktop} onPick={(t) => { setPlacing(t); setTrayOpen(false); }} />
        )}
      </div>

      <EventSheet draft={editing} onClose={() => setEditing(null)} projects={projects} />
      <CalendarsSheet open={calendarsOpen} onOpenChange={setCalendarsOpen} />
    </div>
  );
}

function ItemChip({ item, onOpen, compact }: { item: CalItem; onOpen: (i: CalItem) => void; compact?: boolean }) {
  const { toggle } = useTaskActions();
  if (item.kind === "task" && item.task) {
    const t = item.task;
    return (
      <div className="flex items-center gap-1 rounded-lg bg-surface px-1 py-0.5 text-[12px] font-semibold shadow-[0_1px_2px_var(--shadow-tint)]" style={{ boxShadow: `inset 3px 0 0 ${item.color}` }}>
        <LeafCheckbox size={16} checked={t.status === "done"} onChange={(v, o) => void toggle(t, v, o)} label={t.status === "done" ? `Mark ${t.title} not done` : `Complete ${t.title}`} />
        <span className={cn("truncate", t.status === "done" && "text-ink-faint line-through")}>{t.title}</span>
      </div>
    );
  }
  return (
    <button onClick={() => onOpen(item)} className={cn("block w-full truncate rounded-lg px-1.5 py-0.5 text-left text-[12px] font-semibold text-white", compact && "py-0")} style={{ background: item.color }}>
      {item.title}
    </button>
  );
}

function MonthGrid({ days, anchor, today, items, onPick }: { days: string[]; anchor: string; today: string; items: CalItem[]; onPick: (d: string) => void }) {
  const month = anchor.slice(0, 7);
  return (
    <div className="overflow-hidden rounded-[24px] bg-surface shadow-[var(--shadow-soft)]">
      <div className="grid grid-cols-7 border-b border-line text-center text-[12px] font-bold uppercase tracking-wide text-ink-faint">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <div key={d} className="py-2">{dayName(d).slice(0, 2)}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const list = itemsOnDay(items, d);
          return (
            <button key={d} onClick={() => onPick(d)} className={cn("min-h-[76px] border-b border-r border-line/60 p-1 text-left align-top md:min-h-[112px]", d.slice(0, 7) !== month && "bg-surface-sunk/50 text-ink-faint")} aria-label={`${longDate(d)}, ${list.length} items`}>
              <span className={cn("mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold", d === today && "bg-primary text-primary-ink")}>{Number(d.slice(8))}</span>
              <div className="hidden space-y-0.5 md:block">
                {list.slice(0, 3).map((i) => (
                  <span key={i.key} className="block truncate rounded-md px-1 text-[11px] font-semibold text-white" style={{ background: i.color }}>
                    {i.title}
                  </span>
                ))}
                {list.length > 3 && <span className="block px-1 text-[11px] font-semibold text-ink-muted">+{list.length - 3} more</span>}
              </div>
              <div className="flex flex-wrap gap-0.5 md:hidden">
                {list.slice(0, 4).map((i) => (
                  <span key={i.key} className="h-1.5 w-1.5 rounded-full" style={{ background: i.color }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Agenda({ days, items, today, onOpen }: { days: string[]; items: CalItem[]; today: string; onOpen: (i: CalItem) => void }) {
  const withItems = days.map((d) => [d, itemsOnDay(items, d)] as const).filter(([, l]) => l.length);
  if (!withItems.length) return <EmptyState title="A clear month" line="Nothing planned. Room for something lovely." pose="wave" />;
  return (
    <div className="space-y-4">
      {withItems.map(([d, list]) => (
        <section key={d}>
          <h3 className={cn("mb-1.5 text-sm font-bold uppercase tracking-wide", d === today ? "text-primary" : "text-ink-faint")}>{d === today ? "Today" : longDate(d)}</h3>
          <ul className="space-y-1.5">
            {list.map((i) => (
              <li key={i.key} className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5 shadow-[var(--shadow-soft)]">
                <span className="w-16 shrink-0 text-sm font-semibold tabular text-ink-muted">{i.allDay ? "All day" : new Date(i.start).toLocaleTimeString("en-IE", { hour: "numeric", minute: "2-digit" })}</span>
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: i.color }} />
                <div className="min-w-0 flex-1">{i.kind === "task" ? <ItemChip item={i} onOpen={onOpen} /> : <button onClick={() => onOpen(i)} className="block w-full truncate text-left font-medium">{i.title}</button>}</div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Week, 3-day and day views: a time grid with a "now" line and drag to move or resize. */
function TimeGrid({
  days,
  today,
  now,
  items,
  placing,
  onPlace,
  onCreate,
  onOpen,
  onDropTask,
}: {
  days: string[];
  today: string;
  now: number;
  items: CalItem[];
  placing: Task | null;
  onPlace: (start: number) => void;
  onCreate: (day: string, hour: number) => void;
  onOpen: (i: CalItem) => void;
  onDropTask: (taskId: string, start: number) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ key: string; dy: number; dx: number; mode: "move" | "resize" } | null>(null);
  const colWidth = useRef(100);

  useEffect(() => {
    scroller.current?.scrollTo({ top: HOUR_PX * 7.5 });
  }, []);

  const allDay = (d: string) => itemsOnDay(items, d).filter((i) => i.allDay);
  const timed = (d: string) => itemsOnDay(items, d).filter((i) => !i.allDay);
  const nowDay = days.indexOf(today);
  const nowMin = (now - startOf(today)) / 60_000;

  function startDrag(e: React.PointerEvent, item: CalItem, mode: "move" | "resize") {
    if (item.readOnly) return;
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const col = target.closest("[data-col]") as HTMLElement | null;
    colWidth.current = col?.getBoundingClientRect().width ?? 100;
    const sx = e.clientX;
    const sy = e.clientY;
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - sy;
      const dx = ev.clientX - sx;
      if (Math.abs(dy) > 4 || Math.abs(dx) > 4) moved = true;
      setDrag({ key: item.key, dy, dx, mode });
    };
    const onUp = async (ev: PointerEvent) => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      setDrag(null);
      if (!moved) {
        if (mode === "move") onOpen(item);
        return;
      }
      const mins = Math.round(((ev.clientY - sy) / HOUR_PX) * 4) * 15;
      const dayShift = mode === "move" ? Math.round((ev.clientX - sx) / colWidth.current) : 0;
      const shift = mins * 60_000 + dayShift * DAY_MS;
      if (item.kind === "event" && item.event) {
        const e0 = item.event;
        if (mode === "move") await updateEvent(e0.id, { start: e0.start + shift, end: e0.end + shift });
        else await updateEvent(e0.id, { end: Math.max(e0.start + 15 * 60_000, e0.end + shift) });
      } else if (item.kind === "block" && item.task) {
        const t = item.task;
        if (mode === "move") await updateTask(t.id, { blockStart: t.blockStart! + shift, blockEnd: t.blockEnd! + shift, dueDate: localKey(new Date(t.blockStart! + shift)) });
        else await updateTask(t.id, { blockEnd: Math.max(t.blockStart! + 15 * 60_000, t.blockEnd! + shift) });
      }
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  }

  return (
    <div className="overflow-hidden rounded-[24px] bg-surface shadow-[var(--shadow-soft)]">
      <div className="grid border-b border-line" style={{ gridTemplateColumns: `52px repeat(${days.length}, minmax(0, 1fr))` }}>
        <div />
        {days.map((d) => (
          <div key={d} className="border-l border-line/60 px-1 py-2 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{dayName(new Date(`${d}T00:00:00`).getDay())}</p>
            <p className={cn("mx-auto mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full font-display text-[17px] font-semibold", d === today && "bg-primary text-primary-ink")}>{Number(d.slice(8))}</p>
            <div className="mt-1 space-y-0.5 text-left">
              {allDay(d).map((i) => (
                <ItemChip key={i.key} item={i} onOpen={onOpen} compact />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div ref={scroller} className="relative max-h-[62vh] overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: `52px repeat(${days.length}, minmax(0, 1fr))`, height: HOUR_PX * 24 }}>
          <div className="relative">
            {Array.from({ length: 24 }).map((_, h) => (
              <span key={h} className="absolute right-2 -translate-y-2 text-[11px] font-semibold tabular text-ink-faint" style={{ top: h * HOUR_PX }}>
                {h === 0 ? "" : `${h % 12 || 12}${h < 12 ? "am" : "pm"}`}
              </span>
            ))}
          </div>
          {days.map((d, di) => (
            <div
              key={d}
              data-col
              className={cn("relative border-l border-line/60", placing && "cursor-copy bg-gentle/10")}
              onClick={(e) => {
                if (e.target !== e.currentTarget) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const mins = Math.floor(((e.clientY - rect.top) / HOUR_PX) * 4) * 15;
                const start = startOf(d) + mins * 60_000;
                if (placing) onPlace(start);
                else onCreate(d, Math.floor(mins / 60));
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/task-id");
                if (!id) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const mins = Math.floor(((e.clientY - rect.top) / HOUR_PX) * 4) * 15;
                onDropTask(id, startOf(d) + mins * 60_000);
              }}
              aria-label={`${longDate(d)}. Tap a time to add`}
            >
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-line/50" style={{ top: h * HOUR_PX }} />
              ))}
              {layout(timed(d)).map(({ item: i, col, cols }) => {
                const s = Math.max(startOf(d), i.start);
                const e = Math.min(startOf(d) + DAY_MS, i.end);
                let top = ((s - startOf(d)) / 3_600_000) * HOUR_PX;
                let height = Math.max(22, ((e - s) / 3_600_000) * HOUR_PX - 2);
                let tx = 0;
                if (drag?.key === i.key) {
                  if (drag.mode === "move") {
                    top += drag.dy;
                    tx = drag.dx;
                  } else height = Math.max(22, height + drag.dy);
                }
                return (
                  <div
                    key={i.key}
                    onPointerDown={(ev) => startDrag(ev, i, "move")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(ev) => ev.key === "Enter" && onOpen(i)}
                    aria-label={`${i.title}, ${new Date(i.start).toLocaleTimeString("en-IE", { hour: "numeric", minute: "2-digit" })}`}
                    className={cn("absolute touch-none select-none overflow-hidden rounded-[10px] px-1.5 py-1 text-[12px] font-semibold leading-tight text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]", drag?.key === i.key && "z-10 opacity-90 shadow-[var(--shadow-lift)]", i.kind === "block" && "border-2 border-dashed border-white/60")}
                    style={{ top, height, left: `calc(${(col / cols) * 100}% + 2px)`, width: `calc(${100 / cols}% - 4px)`, background: i.color, transform: tx ? `translateX(${tx}px)` : undefined }}
                  >
                    <span className="line-clamp-2">{i.kind === "block" ? `◷ ${i.title}` : i.title}</span>
                    {height > 40 && i.location && <span className="block truncate font-medium opacity-85">{i.location}</span>}
                    {!i.readOnly && <span onPointerDown={(ev) => startDrag(ev, i, "resize")} className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize" aria-hidden="true" />}
                  </div>
                );
              })}
              {di === nowDay && nowDay >= 0 && (
                <div className="pointer-events-none absolute inset-x-0 z-[5] flex items-center" style={{ top: (nowMin / 60) * HOUR_PX }} aria-hidden="true">
                  <span className="-ml-1.5 h-3 w-3 rounded-full bg-danger" />
                  <span className="h-0.5 flex-1 bg-danger" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Side-by-side columns for overlapping items. */
function layout(items: CalItem[]) {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: { item: CalItem; col: number; cols: number }[] = [];
  let group: { item: CalItem; col: number }[] = [];
  let groupEnd = 0;
  const flush = () => {
    const cols = Math.max(1, ...group.map((g) => g.col + 1));
    for (const g of group) out.push({ ...g, cols });
    group = [];
  };
  for (const it of sorted) {
    if (group.length && it.start >= groupEnd) flush();
    const used = new Set(group.filter((g) => g.item.end > it.start).map((g) => g.col));
    let col = 0;
    while (used.has(col)) col++;
    group.push({ item: it, col });
    groupEnd = Math.max(groupEnd, it.end);
  }
  flush();
  return out;
}

function TaskTray({ tasks, desktop, onPick }: { tasks: Task[]; desktop: boolean; onPick: (t: Task) => void }) {
  return (
    <aside className={cn("rounded-[24px] bg-surface p-3 shadow-[var(--shadow-soft)]", desktop ? "sticky top-20 w-64 shrink-0" : "fixed inset-x-3 bottom-[calc(92px+env(safe-area-inset-bottom))] z-30 max-h-[40vh] overflow-y-auto")} aria-label="Unscheduled tasks">
      <p className="mb-2 px-1 text-sm font-bold text-ink-muted">Unscheduled tasks</p>
      {tasks.length === 0 && <p className="px-1 text-sm text-ink-muted">Everything has a time. Nice.</p>}
      <ul className="space-y-1.5">
        {tasks.slice(0, 40).map((t) => (
          <li key={t.id}>
            <button
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/task-id", t.id)}
              onClick={() => onPick(t)}
              className="w-full truncate rounded-xl bg-surface-sunk px-3 py-2 text-left text-[14px] font-medium hover:bg-primary-soft"
              title="Drag onto a time, or tap then tap a time"
            >
              {t.title}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export { dayDiff };
