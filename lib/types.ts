/**
 * Core record types. Every synced record carries id, createdAt, updatedAt and
 * deletedAt (soft delete / trash). Timestamps are epoch milliseconds.
 */

export interface BaseRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  /** Soft delete: set when moved to Trash. Purged after 30 days. */
  deletedAt: number | null;
}

/** Synced collections (brief 12.3). */
export type Collection =
  | "projects"
  | "sections"
  | "tasks"
  | "thoughts"
  | "contacts"
  | "catchups"
  | "events"
  | "calendar_subscriptions"
  | "aura_ledger"
  | "garden_items"
  | "achievements"
  | "settings";

export const COLLECTIONS: Collection[] = [
  "projects",
  "sections",
  "tasks",
  "thoughts",
  "contacts",
  "catchups",
  "events",
  "calendar_subscriptions",
  "aura_ledger",
  "garden_items",
  "achievements",
  "settings",
];

export type ProjectIcon =
  | { kind: "brand"; brand: "setu" | "swapnserve" }
  | { kind: "custom"; name: "hurley" | "belt" | "orb" | "leaf" | "star" }
  | { kind: "emoji"; emoji: string }
  | { kind: "lucide"; name: string }
  | { kind: "image"; dataUrl: string };

/** Which built-in rank ladder and garden corner a project uses. */
export type ProjectKind = "college" | "swapnserve" | "hurley" | "martial" | "custom";

export interface Project extends BaseRecord {
  name: string;
  description: string;
  color: string;
  icon: ProjectIcon;
  kind: ProjectKind;
  order: number;
  archived: boolean;
  /** Optional overrides for rank names, keyed by rank index. */
  rankNames?: Record<number, string>;
  pinnedThoughtIds?: string[];
}

export interface Section extends BaseRecord {
  /** null means the section belongs to My List. */
  projectId: string | null;
  name: string;
  order: number;
}

export type TaskStatus = "todo" | "doing" | "done";
export type Priority = 0 | 1 | 2 | 3; // none, low, medium, high

export type Recurrence =
  | { kind: "daily" }
  | { kind: "weekdays" }
  | { kind: "weekly"; days: number[] } // 0 = Sunday
  | { kind: "monthly" }
  | { kind: "rrule"; rule: string };

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task extends BaseRecord {
  title: string;
  notes: string; // Tiptap HTML
  /** null means My List. */
  projectId: string | null;
  sectionId: string | null;
  status: TaskStatus;
  priority: Priority;
  /** Local date YYYY-MM-DD */
  dueDate: string | null;
  /** HH:mm */
  dueTime: string | null;
  /** Time block, epoch ms. */
  blockStart: number | null;
  blockEnd: number | null;
  recurrence: Recurrence | null;
  tags: string[];
  big: boolean;
  subtasks: Subtask[];
  completedAt: number | null;
  order: number;
  /** My List: marked for today. */
  today?: boolean;
}

export type Mood = 1 | 2 | 3 | 4 | 5;

export interface Thought extends BaseRecord {
  title: string;
  body: string; // Tiptap HTML
  text: string; // plain text for search
  tags: string[];
  projectIds: string[];
  pinned: boolean;
  mood: Mood | null;
  prompt: string | null;
  order: number;
}

export interface Contact extends BaseRecord {
  name: string;
  photo: string | null; // data URL webp
  color: string;
  phone: string;
  email: string;
  instagram: string;
  linkedin: string;
  organisation: string;
  role: string;
  howMet: string;
  birthday: string | null; // YYYY-MM-DD or --MM-DD
  tags: string[];
  notes: string;
  projectIds: string[];
  keepInTouchDays: number | null;
  lastContacted: number | null;
  order: number;
}

export interface Catchup extends BaseRecord {
  contactId: string;
  date: string; // YYYY-MM-DD
  note: string;
}

export interface CalendarEvent extends BaseRecord {
  title: string;
  start: number;
  end: number;
  allDay: boolean;
  location: string;
  notes: string;
  color: string | null;
  projectId: string | null;
  recurrence: Recurrence | null;
  /** Events imported from an .ics file keep their UID here. */
  sourceUid?: string;
  order: number;
}

export interface CalendarSubscription extends BaseRecord {
  name: string;
  url: string;
  color: string;
  hidden: boolean;
  order: number;
  lastFetchedAt: number | null;
  lastError: string | null;
}

export type AuraSource =
  | "task"
  | "subtask"
  | "bonus"
  | "thought"
  | "catchup"
  | "contact"
  | "achievement"
  | "rank";

export interface AuraRecord extends BaseRecord {
  base: number;
  multiplier: number;
  amount: number;
  reason: string;
  source: AuraSource;
  /** Garden day (3 a.m. cut-off) YYYY-MM-DD */
  day: string;
  voided: boolean;
  /** For per-project aura (ranks and corners). */
  projectId: string | null;
  /** The thing that earned it (task id, etc). */
  refId: string | null;
  /** Epoch ms when awarded, used for combos and stats. */
  at: number;
}

export interface GardenItemRecord extends BaseRecord {
  /** Matches an unlock id in config/realms.ts */
  itemId: string;
  unlockedAt: number;
  auraAtUnlock: number;
  hidden: boolean;
  /** Decor mode slot override. */
  slot: string | null;
  /** Item choice, e.g. tulip colour. */
  variant: string | null;
  seen: boolean;
}

export interface AchievementRecord extends BaseRecord {
  achievementId: string;
  earnedAt: number;
  bonus: number;
  seen: boolean;
}

export type CelebrationStyle = "full" | "calm" | "minimal";
export type ThemePref = "light" | "dark" | "auto";
export type NumberStyle = "short" | "full";
export type TabKey =
  | "home"
  | "projects"
  | "calendar"
  | "garden"
  | "my-list"
  | "tasks"
  | "thoughts"
  | "people"
  | "trophies";

export type HomeWidget =
  | "ring"
  | "today"
  | "projects"
  | "garden"
  | "trophies"
  | "capture"
  | "people";

export interface SavedFilter {
  id: string;
  name: string;
  projectId: string | null;
  tag: string | null;
  priority: Priority | null;
  status: TaskStatus | null;
}

export interface Settings extends BaseRecord {
  displayName: string;
  avatar: string | null;
  birthday: string | null;
  timezone: string;
  dailyGoal: number;
  sound: boolean;
  volume: number;
  haptics: boolean;
  celebration: CelebrationStyle;
  numberStyle: NumberStyle;
  theme: ThemePref;
  accent: string | null;
  reduceMotion: boolean;
  showOscar: boolean;
  tabs: TabKey[];
  sidebarOrder: TabKey[];
  moduleNames: Partial<Record<TabKey, string>>;
  homeWidgets: { id: HomeWidget; hidden: boolean }[];
  savedFilters: SavedFilter[];
  oscarOutfit: string | null;
  tulipColor: string | null;
  /** Gift slug this garden was started from, e.g. "laura". */
  giftSlug: string | null;
  unwrappedAt: number | null;
  onboardedAt: number | null;
  linkSavedAt: number | null;
  linkReminderAt: number | null;
  installPromptedAt: number | null;
  petCount: number;
  openDays: string[];
  restDays: string[];
  bestStreak: number;
  realmsSeen: number;
  levelSeen: number;
  tagColors: Record<string, string>;
}

export type AnyRecord =
  | Project
  | Section
  | Task
  | Thought
  | Contact
  | Catchup
  | CalendarEvent
  | CalendarSubscription
  | AuraRecord
  | GardenItemRecord
  | AchievementRecord
  | Settings;

export interface CollectionMap {
  projects: Project;
  sections: Section;
  tasks: Task;
  thoughts: Thought;
  contacts: Contact;
  catchups: Catchup;
  events: CalendarEvent;
  calendar_subscriptions: CalendarSubscription;
  aura_ledger: AuraRecord;
  garden_items: GardenItemRecord;
  achievements: AchievementRecord;
  settings: Settings;
}

/** Local-only state about this device and its garden. */
export interface MetaRow {
  key: string;
  value: unknown;
}

export interface OutboxRow {
  /** `${collection}:${id}` so repeated edits collapse into one change. */
  key: string;
  collection: Collection;
  id: string;
  queuedAt: number;
}
