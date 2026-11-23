import { getDB } from "@/lib/db";
import { alive } from "@/lib/data/core";

export interface SearchHit {
  id: string;
  kind: "task" | "project" | "thought" | "person" | "event";
  title: string;
  sub: string;
  href: string;
  updatedAt: number;
}

function has(hay: (string | undefined | null)[], q: string) {
  return hay.some((h) => h && h.toLowerCase().includes(q));
}

/** Search everything on the device (brief 6.9). Empty query returns recent items. */
export async function searchAll(query: string, limit = 12): Promise<SearchHit[]> {
  const db = getDB();
  const q = query.trim().toLowerCase();
  const [tasks, projects, thoughts, contacts, events] = await Promise.all([
    db.tasks.toArray(),
    db.projects.toArray(),
    db.thoughts.toArray(),
    db.contacts.toArray(),
    db.events.toArray(),
  ]);
  const pName = new Map(projects.map((p) => [p.id, p.name]));
  const hits: SearchHit[] = [];
  for (const p of alive(projects))
    if (!q || has([p.name, p.description], q)) hits.push({ id: p.id, kind: "project", title: p.name, sub: "Project", href: `/projects/${p.id}`, updatedAt: p.updatedAt });
  for (const t of alive(tasks))
    if (!q || has([t.title, t.tags.join(" ")], q))
      hits.push({
        id: t.id,
        kind: "task",
        title: t.title,
        sub: `${t.status === "done" ? "Done · " : ""}${t.projectId ? (pName.get(t.projectId) ?? "Task") : "My List"}`,
        href: t.projectId ? `/projects/${t.projectId}` : "/my-list",
        updatedAt: t.updatedAt,
      });
  for (const t of alive(thoughts))
    if (!q || has([t.title, t.text, t.tags.join(" ")], q))
      hits.push({ id: t.id, kind: "thought", title: t.title || t.text.slice(0, 60) || "Untitled thought", sub: "Thought", href: `/thoughts/${t.id}`, updatedAt: t.updatedAt });
  for (const c of alive(contacts))
    if (!q || has([c.name, c.organisation, c.role, c.email, c.phone, c.instagram, c.notes, c.tags.join(" ")], q))
      hits.push({ id: c.id, kind: "person", title: c.name, sub: c.organisation || "Person", href: `/people/${c.id}`, updatedAt: c.updatedAt });
  for (const e of alive(events))
    if (!q || has([e.title, e.location], q))
      hits.push({ id: e.id, kind: "event", title: e.title, sub: new Date(e.start).toLocaleDateString("en-IE", { day: "numeric", month: "short" }), href: `/calendar?date=${new Date(e.start).toISOString().slice(0, 10)}`, updatedAt: e.updatedAt });

  if (!q) return hits.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);
  const score = (h: SearchHit) => (h.title.toLowerCase().startsWith(q) ? 0 : h.title.toLowerCase().includes(q) ? 1 : 2);
  return hits.sort((a, b) => score(a) - score(b) || b.updatedAt - a.updatedAt).slice(0, limit);
}
