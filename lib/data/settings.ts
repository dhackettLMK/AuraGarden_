import type { HomeWidget, Settings, TabKey } from "../types";
import { DEFAULT_TZ } from "../day";
import { get, patch, put } from "./core";

export const SETTINGS_ID = "main";

export const ALL_TABS: TabKey[] = ["home", "my-list", "tasks", "calendar", "thoughts", "people", "garden", "trophies", "projects"];
export const DEFAULT_TABS: TabKey[] = ["home", "projects", "calendar", "garden"];
export const DEFAULT_SIDEBAR: TabKey[] = ["home", "my-list", "tasks", "calendar", "thoughts", "people", "garden", "trophies"];
export const DEFAULT_WIDGETS: HomeWidget[] = ["ring", "today", "projects", "garden", "trophies", "capture", "people"];

export function defaultSettings(displayName: string, giftSlug: string | null): Settings {
  const t = Date.now();
  return {
    id: SETTINGS_ID,
    createdAt: t,
    updatedAt: t,
    deletedAt: null,
    displayName,
    avatar: null,
    birthday: null,
    timezone: guessTimezone(),
    dailyGoal: 6,
    sound: true,
    volume: 0.7,
    haptics: true,
    celebration: "full",
    numberStyle: "short",
    theme: "auto",
    accent: null,
    reduceMotion: false,
    showOscar: true,
    tabs: DEFAULT_TABS,
    sidebarOrder: DEFAULT_SIDEBAR,
    moduleNames: {},
    homeWidgets: DEFAULT_WIDGETS.map((id) => ({ id, hidden: false })),
    savedFilters: [],
    oscarOutfit: null,
    tulipColor: null,
    giftSlug,
    unwrappedAt: null,
    onboardedAt: null,
    linkSavedAt: null,
    linkReminderAt: null,
    installPromptedAt: null,
    petCount: 0,
    openDays: [],
    restDays: [],
    bestStreak: 0,
    realmsSeen: 1,
    levelSeen: 1,
    tagColors: {},
  };
}

function guessTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ;
  } catch {
    return DEFAULT_TZ;
  }
}

export async function getSettings() {
  return get("settings", SETTINGS_ID);
}

/** Fill in fields added after a garden was created. */
export function withDefaults(s: Settings | undefined): Settings | undefined {
  if (!s) return s;
  return { ...defaultSettings(s.displayName, s.giftSlug), ...s };
}

export async function updateSettings(changes: Partial<Settings>) {
  const current = await getSettings();
  if (!current) return;
  return patch("settings", SETTINGS_ID, changes);
}

export async function saveSettings(s: Settings) {
  return put("settings", s);
}

export const MODULE_LABELS: Record<TabKey, string> = {
  home: "Home",
  projects: "Projects",
  calendar: "Calendar",
  garden: "Garden",
  "my-list": "My List",
  tasks: "Tasks",
  thoughts: "Thoughts",
  people: "People",
  trophies: "Trophies",
};

export function moduleLabel(s: Settings | undefined, key: TabKey) {
  return s?.moduleNames?.[key]?.trim() || MODULE_LABELS[key];
}
