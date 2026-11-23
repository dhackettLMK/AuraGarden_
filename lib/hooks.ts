"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getDB } from "./db";
import { alive, byOrder } from "./data/core";
import { SETTINGS_ID, withDefaults } from "./data/settings";

export function useSettings() {
  return withDefaults(useLiveQuery(() => getDB().settings.get(SETTINGS_ID), []));
}

/** "loading" until IndexedDB answers, then "none" or "ready". */
export function useGardenStatus(): "loading" | "none" | "ready" {
  const key = useLiveQuery(async () => (await getDB().meta.get("gardenKey"))?.value ?? null, []);
  if (key === undefined) return "loading";
  return key ? "ready" : "none";
}

export function useProjects(opts: { includeArchived?: boolean } = {}) {
  const rows = useLiveQuery(() => getDB().projects.toArray(), []);
  if (!rows) return undefined;
  return alive(rows)
    .filter((p) => opts.includeArchived || !p.archived)
    .sort(byOrder);
}

export function useProject(id: string | undefined) {
  return useLiveQuery(async () => (id ? ((await getDB().projects.get(id)) ?? null) : null), [id]);
}

export function useSections(projectId: string | null | undefined) {
  const rows = useLiveQuery(() => getDB().sections.toArray(), []);
  if (!rows || projectId === undefined) return undefined;
  return alive(rows)
    .filter((s) => s.projectId === projectId)
    .sort(byOrder);
}

export function useTasks() {
  const rows = useLiveQuery(() => getDB().tasks.toArray(), []);
  return rows ? alive(rows) : undefined;
}

export function useTask(id: string | undefined) {
  return useLiveQuery(async () => (id ? ((await getDB().tasks.get(id)) ?? null) : null), [id]);
}

export function useLedger() {
  return useLiveQuery(() => getDB().aura_ledger.toArray(), []);
}

/** Re-render on an interval, e.g. for clocks and greetings. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

const noopSubscribe = () => () => {};
/** True only on the client after hydration. */
export function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

export function useReducedMotion() {
  const sys = useMediaQuery("(prefers-reduced-motion: reduce)");
  const s = useSettings();
  return sys || !!s?.reduceMotion;
}
