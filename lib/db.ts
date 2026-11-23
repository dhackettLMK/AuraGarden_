import Dexie, { type Table } from "dexie";
import type {
  AchievementRecord,
  AuraRecord,
  CalendarEvent,
  CalendarSubscription,
  Catchup,
  Contact,
  GardenItemRecord,
  MetaRow,
  OutboxRow,
  Project,
  Section,
  Settings,
  Task,
  Thought,
} from "./types";

export interface FeedCacheRow {
  subscriptionId: string;
  url: string;
  fetchedAt: number;
  events: FeedEvent[];
}

export interface FeedEvent {
  uid: string;
  title: string;
  start: number;
  end: number;
  allDay: boolean;
  location: string;
}

export class GardenDB extends Dexie {
  projects!: Table<Project, string>;
  sections!: Table<Section, string>;
  tasks!: Table<Task, string>;
  thoughts!: Table<Thought, string>;
  contacts!: Table<Contact, string>;
  catchups!: Table<Catchup, string>;
  events!: Table<CalendarEvent, string>;
  calendar_subscriptions!: Table<CalendarSubscription, string>;
  aura_ledger!: Table<AuraRecord, string>;
  garden_items!: Table<GardenItemRecord, string>;
  achievements!: Table<AchievementRecord, string>;
  settings!: Table<Settings, string>;
  meta!: Table<MetaRow, string>;
  outbox!: Table<OutboxRow, string>;
  feed_cache!: Table<FeedCacheRow, string>;

  constructor(name = "auragarden") {
    super(name);
    this.version(1).stores({
      projects: "id, order, updatedAt",
      sections: "id, projectId, order, updatedAt",
      tasks: "id, projectId, sectionId, status, dueDate, completedAt, updatedAt",
      thoughts: "id, updatedAt, createdAt",
      contacts: "id, name, updatedAt",
      catchups: "id, contactId, date, updatedAt",
      events: "id, start, updatedAt",
      calendar_subscriptions: "id, order, updatedAt",
      aura_ledger: "id, day, source, projectId, refId, at, updatedAt",
      garden_items: "id, itemId, updatedAt",
      achievements: "id, achievementId, updatedAt",
      settings: "id, updatedAt",
      meta: "key",
      outbox: "key, queuedAt",
      feed_cache: "subscriptionId",
    });
  }
}

let instance: GardenDB | null = null;

/** The single Dexie instance. Only touch it from lib/data. */
export function getDB(): GardenDB {
  if (!instance) instance = new GardenDB();
  return instance;
}

/** Tests swap in a fresh database. */
export function setDB(db: GardenDB) {
  instance = db;
}
