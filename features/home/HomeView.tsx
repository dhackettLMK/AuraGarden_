"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { ArrowRight, Cake, Check, ChevronDown, ChevronUp, Eye, EyeOff, HeartHandshake, Lightbulb, ListTodo, Pencil, Send, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { getDB } from "@/lib/db";
import { alive } from "@/lib/data/core";
import { updateSettings, DEFAULT_WIDGETS } from "@/lib/data/settings";
import { createTask } from "@/lib/data/tasks";
import { createThought, escapeHtml } from "@/lib/data/thoughts";
import { useMediaQuery, useNow, useProjects, useSettings, useTasks } from "@/lib/hooks";
import { useGame } from "@/lib/game/GameProvider";
import { onThoughtWritten } from "@/lib/game/actions";
import { pickLine, type LineCategory } from "@/config/oscar-lines";
import { ACHIEVEMENTS } from "@/config/achievements";
import { formatAura } from "@/lib/format";
import { dayDiff, timeOfDay, todayKey, seasonOf } from "@/lib/day";
import { longDate, formatTime } from "@/lib/dates";
import { catchupDue, daysToBirthday } from "@/lib/people";
import { parseQuickInput } from "@/lib/parse";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { GardenScene } from "@/components/garden/Scene";
import { Badge } from "@/components/trophies/Badge";
import { toast } from "@/components/ui/toast-store";
import { ProjectCard } from "@/features/projects/ProjectsView";
import { TaskRow } from "@/features/tasks/TaskRow";
import { useCalendarItems, itemsOnDay } from "@/features/calendar/data";
import { Avatar } from "@/features/people/Avatar";
import { loadAchievementContext, progressOf } from "@/lib/game/achievements-check";
import { cn } from "@/lib/cn";
import type { HomeWidget, Task } from "@/lib/types";
import { HomeOscar } from "./HomeOscar";

const LABELS: Record<HomeWidget, string> = {
  ring: "Daily aura ring",
  today: "Today",
  projects: "Projects",
  garden: "Garden window",
  trophies: "Trophy shelf",
  capture: "Quick capture",
  people: "People this week",
};

/** Home (brief 6.1). */
export function HomeView() {
  const settings = useSettings();
  const game = useGame();
  const now = useNow(60_000);
  const wideRail = useMediaQuery("(min-width: 1280px)");
  const [editing, setEditing] = useState(false);
  const [line] = useState(() => {
    const tod = timeOfDay(Date.now(), settings?.timezone);
    const cat: LineCategory = tod === "late" ? "late" : tod === "morning" || tod === "dawn" ? "morning" : tod === "afternoon" ? "afternoon" : "evening";
    return pickLine(cat, { name: Math.random() < 0.5 ? (settings?.displayName ?? "") : "" });
  });
  if (!settings) return null;
  const widgets = (settings.homeWidgets?.length ? settings.homeWidgets : DEFAULT_WIDGETS.map((id) => ({ id, hidden: false }))).filter((w) => LABELS[w.id]);
  const shown = widgets.filter((w) => !w.hidden && !(wideRail && (w.id === "garden" || w.id === "today")));

  const move = (i: number, dir: number) => {
    const next = [...widgets];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    void updateSettings({ homeWidgets: next });
  };

  return (
    <div className={cn("relative", wideRail && "grid grid-cols-[1fr_340px] gap-6")}>
      <div className="min-w-0 space-y-5">
        <section className="flex items-center gap-3 pt-1">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink-muted">{longDate(todayKey(settings.timezone, now))}</p>
            <p className="mt-1 font-display text-[22px] font-semibold leading-snug md:text-[26px]">
              {line}
            </p>
          </div>
          <button onClick={() => setEditing((e) => !e)} className={cn("inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold", editing ? "bg-primary text-primary-ink" : "text-ink-muted hover:bg-surface-sunk")} aria-pressed={editing}>
            {editing ? <Check size={16} /> : <Pencil size={16} />} <span className="hidden sm:inline">{editing ? "Done" : "Edit Home"}</span>
          </button>
        </section>

        {editing ? (
          <ul className="space-y-2" aria-label="Home widgets">
            {widgets.map((w, i) => (
              <li key={w.id} className="flex items-center gap-2 rounded-2xl bg-surface p-3 shadow-[var(--shadow-soft)]">
                <span className={cn("flex-1 font-semibold", w.hidden && "text-ink-faint line-through")}>{LABELS[w.id]}</span>
                <Button variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${LABELS[w.id]} up`}>
                  <ChevronUp size={18} />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === widgets.length - 1} aria-label={`Move ${LABELS[w.id]} down`}>
                  <ChevronDown size={18} />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => updateSettings({ homeWidgets: widgets.map((x) => (x.id === w.id ? { ...x, hidden: !x.hidden } : x)) })} aria-label={w.hidden ? `Show ${LABELS[w.id]}` : `Hide ${LABELS[w.id]}`}>
                  {w.hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          shown.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, type: "spring", stiffness: 320, damping: 26 }}>
              {w.id === "ring" && <RingWidget />}
              {w.id === "today" && <TodayWidget />}
              {w.id === "projects" && <ProjectsStrip />}
              {w.id === "garden" && <GardenWindow />}
              {w.id === "trophies" && <TrophyShelf />}
              {w.id === "capture" && <QuickCapture />}
              {w.id === "people" && <PeopleWeek />}
            </motion.div>
          ))
        )}
        {!editing && <LinkReminder />}
        {!editing && <MoreShortcuts />}
      </div>
      {wideRail && (
        <aside className="space-y-5">
          <GardenWindow compact />
          <TodayWidget />
        </aside>
      )}
      {settings.showOscar && <HomeOscar level={game.level} outfit={settings.oscarOutfit} name={settings.displayName} />}
    </div>
  );
}

function Card({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("card p-4 md:p-5", className)} aria-label={title}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-[19px] font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Completions today against her goal. Counts tasks, not aura, so boosts don't make it trivial. */
function RingWidget() {
  const game = useGame();
  const settings = useSettings();
  const goal = settings?.dailyGoal ?? 6;
  const done = game.todayCompletions;
  const pct = Math.min(1, done / goal);
  return (
    <Card>
      <div className="flex items-center gap-4">
        <ProgressRing value={pct} size={96} stroke={10} gradient label={`${done} of ${goal} done today`}>
          <span className="text-center">
            <span className="block font-display text-[26px] font-bold leading-none tabular">{done}</span>
            <span className="text-[12px] font-semibold text-ink-muted">of {goal}</span>
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[19px] font-semibold leading-tight">{done >= goal ? "Daily goal smashed!" : done === 0 ? "Today's a fresh start" : `${goal - done} more for your goal`}</p>
          <p className="mt-1 text-[14px] text-ink-muted">
            <span className="aura-text font-bold">+{formatAura(game.todayAura)}</span> aura today
            {game.streak > 0 && <> · {game.streak}-day streak</>}
          </p>
          <p className="mt-1 text-[13px] font-semibold text-ink-muted">Every task earns +{formatAura(Math.round(25 * game.boosts.total))} right now</p>
        </div>
      </div>
    </Card>
  );
}

function TodayWidget() {
  const tasks = useTasks() ?? [];
  const projects = useProjects() ?? [];
  const settings = useSettings();
  const today = todayKey(settings?.timezone);
  const start = new Date(`${today}T00:00:00`).getTime();
  const items = useCalendarItems(start, start + 86_400_000, projects);
  const events = (items ? itemsOnDay(items, today) : []).filter((i) => i.kind === "event" || i.kind === "feed" || i.kind === "block");
  const byId = new Map(projects.map((p) => [p.id, p]));
  const due = tasks.filter((t) => t.status !== "done" && (t.dueDate === today || (!t.projectId && t.sectionId === "sec_mylist_today" && !t.dueDate)));
  const overdue = tasks.filter((t) => t.status !== "done" && t.dueDate && dayDiff(today, t.dueDate) < 0);
  const doneToday = tasks.filter((t) => t.status === "done" && t.completedAt && todayKey(settings?.timezone, t.completedAt) === today);
  return (
    <Card title="Today" action={<Link href="/tasks" className="text-sm font-semibold text-primary">All tasks</Link>}>
      {events.length > 0 && (
        <ol className="mb-3 space-y-1.5 border-l-2 border-line pl-3">
          {events.map((e) => (
            <li key={e.key} className="relative flex items-baseline gap-2 text-[15px]">
              <span className="absolute -left-[17px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface" style={{ background: e.color }} />
              <span className="w-14 shrink-0 text-[13px] font-semibold tabular text-ink-muted">{e.allDay ? "All day" : formatTime(new Date(e.start).toTimeString().slice(0, 5))}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{e.title}</span>
            </li>
          ))}
        </ol>
      )}
      {due.length === 0 && events.length === 0 && overdue.length === 0 && (
        <p className="text-[15px] text-ink-muted">{doneToday.length ? "All done for today. Go touch grass." : "Nothing due today. Add something, or enjoy the space."}</p>
      )}
      <ul className="space-y-2">
        {due.map((t) => (
          <li key={t.id}>
            <TaskRow task={t} project={t.projectId ? byId.get(t.projectId) : null} projects={projects} />
          </li>
        ))}
      </ul>
      {overdue.length > 0 && (
        <div className="mt-4 rounded-[20px] bg-gentle/35 p-3">
          <p className="mb-2 text-sm font-bold text-gentle-ink">Still waiting for you</p>
          <ul className="space-y-2">
            {overdue.slice(0, 4).map((t: Task) => (
              <li key={t.id}>
                <TaskRow task={t} project={t.projectId ? byId.get(t.projectId) : null} projects={projects} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function ProjectsStrip() {
  const projects = useProjects() ?? [];
  const tasks = useTasks() ?? [];
  if (!projects.length) return null;
  return (
    <section aria-label="Projects">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-[19px] font-semibold">Projects</h2>
        <Link href="/projects" className="text-sm font-semibold text-primary">See all</Link>
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {projects.map((p, i) => (
          <li key={p.id} className="w-[272px] shrink-0 snap-start">
            <ProjectCard project={p} tasks={tasks} index={i} banner={false} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function GardenWindow({ compact }: { compact?: boolean }) {
  const records = useLiveQuery(() => getDB().garden_items.toArray(), []);
  const game = useGame();
  const settings = useSettings();
  const now = useNow(5 * 60_000);
  const unlocked = useMemo(() => new Set((records ?? []).map((r) => r.itemId)), [records]);
  const byItem = useMemo(() => new Map((records ?? []).map((r) => [r.itemId, r])), [records]);
  const next = game.nextUnlock;
  return (
    <Link href="/garden" className="card group block overflow-hidden" aria-label="Open the garden">
      <div className="pointer-events-none">
        <GardenScene layout="wide" unlocked={unlocked} records={byItem} total={game.total} timeOfDay={timeOfDay(now, settings?.timezone)} season={seasonOf(now, settings?.timezone)} oscar={{ level: game.level, outfit: settings?.oscarOutfit ?? null }} tulipColor={settings?.tulipColor} title="Your garden" ambient={!compact} />
      </div>
      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{next ? `${formatAura(next.at - game.total)} aura to ${next.name.replace(/^An? /, "").toLowerCase()}` : "Every realm is open. Legend."}</p>
          {next && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunk">
              <div className="h-full rounded-full aura-bg" style={{ width: `${Math.min(100, (game.total / next.at) * 100)}%` }} />
            </div>
          )}
        </div>
        <ArrowRight size={18} className="text-ink-muted transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function TrophyShelf() {
  const ctx = useLiveQuery(() => loadAchievementContext(), []);
  if (!ctx) return null;
  const latest = [...ctx.earned.values()].sort((a, b) => b.earnedAt - a.earnedAt).slice(0, 3);
  const closest = ctx.all
    .filter((a) => !ctx.earned.has(a.id) && !a.secret)
    .map((a) => ({ a, p: progressOf(a, ctx.stats, ctx.projectAura, ctx.kindAura) }))
    .sort((x, y) => y.p.ratio - x.p.ratio)[0];
  return (
    <Card title="Trophy shelf" action={<Link href="/trophies" className="text-sm font-semibold text-primary">Trophy Room</Link>}>
      <div className="flex flex-wrap items-center gap-4">
        {latest.length ? (
          latest.map((r) => {
            const a = ctx.catalogue.find((x) => x.id === r.achievementId);
            if (!a) return null;
            return (
              <div key={r.id} className="flex w-20 flex-col items-center text-center">
                <Badge tier={a.tier} family={a.family} earned size={56} />
                <span className="mt-1 line-clamp-2 text-[12px] font-semibold leading-tight">{a.name}</span>
              </div>
            );
          })
        ) : (
          <p className="text-[15px] text-ink-muted">Your first task puts your first trophy here.</p>
        )}
        {closest && (
          <div className="min-w-[180px] flex-1 rounded-2xl bg-surface-sunk p-3">
            <p className="text-[13px] font-semibold text-ink-muted">Closest next</p>
            <p className="font-semibold">{closest.a.name}</p>
            <p className="text-[13px] text-ink-muted">
              {formatAura(Math.max(0, closest.p.target - closest.p.current))} more {closest.a.unit ?? ""} for <span className="capitalize">{closest.a.tier}</span>
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-primary" style={{ width: `${closest.p.ratio * 100}%` }} />
            </div>
          </div>
        )}
      </div>
      <span className="sr-only">{ACHIEVEMENTS.length} trophies in total</span>
    </Card>
  );
}

function QuickCapture() {
  const [text, setText] = useState("");
  const [as, setAs] = useState<"task" | "todo" | "thought">("task");
  const projects = useProjects() ?? [];
  return (
    <Card>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const v = text.trim();
          if (!v) return;
          setText("");
          if (as === "thought") {
            const t = await createThought({ body: `<p>${escapeHtml(v)}</p>`, text: v });
            await onThoughtWritten(t.id);
            toast("Saved to Thoughts");
          } else {
            const p = parseQuickInput(v, projects);
            await createTask({ title: p.title || v, projectId: as === "todo" ? null : p.projectId, dueDate: p.dueDate, dueTime: p.dueTime, priority: p.priority, tags: p.tags, sectionId: as === "todo" || !p.projectId ? "sec_mylist_today" : null });
            toast(as === "todo" ? "Added to My List" : "Task added");
          }
        }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 rounded-full bg-surface-sunk pl-4 pr-1.5 focus-within:ring-2 focus-within:ring-primary/60">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What's on your mind?" aria-label="What's on your mind?" className="h-12 min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-faint" />
          <button type="submit" disabled={!text.trim()} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-ink disabled:opacity-40" aria-label="Save">
            <Send size={18} />
          </button>
        </div>
        <Segmented
          label="Save as"
          size="sm"
          value={as}
          onChange={setAs}
          options={[
            { value: "task", label: <><CheckCircle2 size={15} /> Task</> },
            { value: "todo", label: <><ListTodo size={15} /> To-do</> },
            { value: "thought", label: <><Lightbulb size={15} /> Thought</> },
          ]}
        />
      </form>
    </Card>
  );
}

function PeopleWeek() {
  const contacts = useLiveQuery(async () => alive(await getDB().contacts.toArray()), []) ?? [];
  const settings = useSettings();
  const today = todayKey(settings?.timezone);
  const birthdays = contacts.map((c) => ({ c, d: daysToBirthday(c.birthday, today) })).filter((x) => x.d !== null && x.d <= 7).sort((a, b) => a.d! - b.d!);
  const due = contacts.filter((c) => (catchupDue(c, today) ?? -1) >= 0);
  if (!birthdays.length && !due.length) return null;
  return (
    <Card title="People this week" action={<Link href="/people" className="text-sm font-semibold text-primary">People</Link>}>
      <ul className="space-y-2">
        {birthdays.map(({ c, d }) => (
          <li key={`b-${c.id}`}>
            <Link href={`/people/${c.id}`} className="flex items-center gap-3 rounded-2xl bg-blush/30 p-2.5">
              <Avatar contact={c} size={40} />
              <span className="flex-1 font-semibold">{c.name}</span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-blush-ink">
                <Cake size={15} /> {d === 0 ? "Birthday today!" : d === 1 ? "Birthday tomorrow" : `Birthday in ${d} days`}
              </span>
            </Link>
          </li>
        ))}
        {due.map((c) => (
          <li key={`c-${c.id}`}>
            <Link href={`/people/${c.id}`} className="flex items-center gap-3 rounded-2xl bg-surface-sunk p-2.5">
              <Avatar contact={c} size={40} />
              <span className="flex-1 font-semibold">{c.name}</span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted">
                <HeartHandshake size={15} /> Catch-up due
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** On phones everything else lives in More, and as shortcuts here (brief 5). */
function MoreShortcuts() {
  const links = [
    { href: "/my-list", label: "My List" },
    { href: "/tasks", label: "Tasks" },
    { href: "/thoughts", label: "Thoughts" },
    { href: "/people", label: "People" },
    { href: "/trophies", label: "Trophies" },
    { href: "/settings", label: "Settings" },
  ];
  return (
    <nav aria-label="Shortcuts" className="grid grid-cols-3 gap-2 md:hidden">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="rounded-2xl bg-surface-sunk py-3 text-center text-sm font-semibold text-ink-muted">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/** If she's never saved her secret link, Oscar reminds her gently once a month (brief 12.4). */
function LinkReminder() {
  const s = useSettings();
  const now = useNow(60 * 60_000);
  if (!s || s.linkSavedAt || !s.onboardedAt) return null;
  const last = s.linkReminderAt ?? s.onboardedAt;
  if (now - last < 30 * 86_400_000) return null;
  return (
    <section className="flex items-center gap-3 rounded-[24px] bg-primary-soft/70 p-4">
      <div className="min-w-0 flex-1">
        <p className="font-display text-[17px] font-semibold">{pickLine("saveLink")}</p>
        <p className="text-[14px] text-ink-muted">It&apos;s the only key to your garden.</p>
      </div>
      <Link href="/settings#link" className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-ink">
        Save it
      </Link>
      <button onClick={() => updateSettings({ linkReminderAt: Date.now() })} className="text-sm font-semibold text-ink-muted" aria-label="Remind me later">
        Later
      </button>
    </section>
  );
}
