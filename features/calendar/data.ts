"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo } from "react";
import { getDB, type FeedEvent } from "@/lib/db";
import { alive, baseRecord, patch, put, nextOrder } from "@/lib/data/core";
import { getMeta } from "@/lib/data/garden";
import { nextOccurrence } from "@/lib/data/tasks";
import { calendarDay } from "@/lib/day";
import type { CalendarEvent, CalendarSubscription, Project, Task } from "@/lib/types";

export interface CalItem {
  key: string;
  kind: "event" | "feed" | "task" | "block";
  title: string;
  start: number;
  end: number;
  allDay: boolean;
  color: string;
  location?: string;
  event?: CalendarEvent;
  task?: Task;
  feed?: { subscription: CalendarSubscription; event: FeedEvent };
  readOnly: boolean;
}

const DAY = 86_400_000;
export const SUB_COLORS = ["#6C8EBF", "#B07AA1", "#5AA9A3", "#D9822B", "#7A6FD0", "#C76A58"];

/** Expand an event's repeats inside [from, to). */
export function occurrences(e: CalendarEvent, from: number, to: number): { start: number; end: number }[] {
  const dur = e.end - e.start;
  if (!e.recurrence) return e.end >= from && e.start < to ? [{ start: e.start, end: e.end }] : [];
  const out: { start: number; end: number }[] = [];
  const startDate = new Date(e.start);
  const time = [startDate.getHours(), startDate.getMinutes()] as const;
  let day = calendarDay(e.start, Intl.DateTimeFormat().resolvedOptions().timeZone);
  for (let i = 0; i < 800; i++) {
    const s = new Date(`${day}T00:00:00`);
    s.setHours(time[0], time[1]);
    const start = s.getTime();
    if (start >= to) break;
    if (start + dur >= from) out.push({ start, end: start + dur });
    day = nextOccurrence(e.recurrence, day);
  }
  return out;
}

function localDay(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Everything on the calendar in a range: her events, feed events, due tasks and time blocks. */
export function useCalendarItems(from: number, to: number, projects: Project[]) {
  const events = useLiveQuery(() => getDB().events.toArray(), []);
  const subs = useLiveQuery(() => getDB().calendar_subscriptions.toArray(), []);
  const feeds = useLiveQuery(() => getDB().feed_cache.toArray(), []);
  const tasks = useLiveQuery(() => getDB().tasks.toArray(), []);
  return useMemo(() => {
    if (!events || !subs || !feeds || !tasks) return undefined;
    const color = new Map(projects.map((p) => [p.id, p.color]));
    const items: CalItem[] = [];
    for (const e of alive(events))
      for (const o of occurrences(e, from, to))
        items.push({ key: `${e.id}:${o.start}`, kind: "event", title: e.title, start: o.start, end: o.end, allDay: e.allDay, color: e.color ?? (e.projectId ? (color.get(e.projectId) ?? "#4F7A5A") : "#4F7A5A"), location: e.location, event: e, readOnly: false });
    const visible = new Map(alive(subs).filter((s) => !s.hidden).map((s) => [s.id, s]));
    for (const f of feeds) {
      const sub = visible.get(f.subscriptionId);
      if (!sub) continue;
      for (const ev of f.events)
        if (ev.end >= from && ev.start < to)
          items.push({ key: `${sub.id}:${ev.uid}`, kind: "feed", title: ev.title, start: ev.start, end: ev.end, allDay: ev.allDay, color: sub.color, location: ev.location, feed: { subscription: sub, event: ev }, readOnly: true });
    }
    for (const t of alive(tasks)) {
      const c = t.projectId ? (color.get(t.projectId) ?? "#4F7A5A") : "#4F7A5A";
      if (t.blockStart && t.blockEnd && t.blockEnd >= from && t.blockStart < to)
        items.push({ key: `b:${t.id}`, kind: "block", title: t.title, start: t.blockStart, end: t.blockEnd, allDay: false, color: c, task: t, readOnly: false });
      else if (t.dueDate) {
        const s = new Date(`${t.dueDate}T00:00:00`).getTime();
        if (s + DAY > from && s < to) items.push({ key: `t:${t.id}`, kind: "task", title: t.title, start: s, end: s + DAY, allDay: true, color: c, task: t, readOnly: false });
      }
    }
    return items.sort((a, b) => a.start - b.start);
  }, [events, subs, feeds, tasks, from, to, projects]);
}

export function itemsOnDay(items: CalItem[], day: string) {
  const s = new Date(`${day}T00:00:00`).getTime();
  const e = s + DAY;
  return items.filter((i) => i.start < e && i.end > s && (!i.allDay || localDay(i.start) <= day));
}

export async function addSubscription(name: string, url: string) {
  const db = getDB();
  const rows = alive(await db.calendar_subscriptions.toArray());
  const sub: CalendarSubscription = {
    ...baseRecord(),
    name: name.trim() || "Calendar",
    url: url.trim(),
    color: SUB_COLORS[rows.length % SUB_COLORS.length],
    hidden: false,
    order: nextOrder(rows),
    lastFetchedAt: null,
    lastError: null,
  };
  await put("calendar_subscriptions", sub);
  await refreshFeed(sub);
  return sub;
}

/** Fetch one feed through the server route and cache it on the device. */
export async function refreshFeed(sub: CalendarSubscription) {
  const key = await getMeta<string>("gardenKey");
  if (!key) return;
  try {
    // The feed route only serves gardens the server knows about.
    const { ensureRegistered, syncEnabled } = await import("@/lib/sync/engine");
    if (await syncEnabled()) await ensureRegistered(key);
    const res = await fetch("/api/calendar/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Garden ${key}` },
      body: JSON.stringify({ url: sub.url }),
    });
    const data = (await res.json()) as { events?: FeedEvent[]; fetchedAt?: number; error?: string };
    if (!res.ok || !data.events) throw new Error(data.error ?? "Couldn't load that calendar.");
    await getDB().feed_cache.put({ subscriptionId: sub.id, url: sub.url, fetchedAt: data.fetchedAt ?? Date.now(), events: data.events });
    if (sub.lastError) await patch("calendar_subscriptions", sub.id, { lastError: null, lastFetchedAt: Date.now() });
  } catch (e) {
    await patch("calendar_subscriptions", sub.id, { lastError: e instanceof Error ? e.message : "Couldn't load that calendar." });
  }
}

/** Refresh stale feeds when the calendar opens and every 15 minutes. */
export function useFeedRefresher() {
  const subs = useLiveQuery(async () => alive(await getDB().calendar_subscriptions.toArray()), []);
  const ids = subs?.map((s) => `${s.id}:${s.url}`).join(",");
  useEffect(() => {
    if (!subs?.length || !navigator.onLine) return;
    const run = async () => {
      const cache = await getDB().feed_cache.toArray();
      for (const s of subs) {
        const c = cache.find((x) => x.subscriptionId === s.id);
        if (!c || c.url !== s.url || Date.now() - c.fetchedAt > 15 * 60_000) await refreshFeed(s);
      }
    };
    void run();
    const t = setInterval(run, 15 * 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
}

export async function refreshAll() {
  const subs = alive(await getDB().calendar_subscriptions.toArray());
  await Promise.all(subs.map(refreshFeed));
}
