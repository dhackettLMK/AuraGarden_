"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useRef, useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Cake, Download, HeartHandshake, Plus, Search, Upload, UserPlus } from "lucide-react";
import { getDB } from "@/lib/db";
import { alive, byOrder, reorder, putMany } from "@/lib/data/core";
import { blankContact, createContact } from "@/lib/data/contacts";
import { useProjects } from "@/lib/hooks";
import { todayKey } from "@/lib/day";
import { catchupDue, daysToBirthday } from "@/lib/people";
import { parseVCF, toVCF } from "@/lib/vcard";
import { onContactAdded } from "@/lib/game/actions";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/toast-store";
import { useListSensors } from "@/features/tasks/SortableTaskList";
import type { Contact } from "@/lib/types";
import { Avatar } from "./Avatar";

type ListKey = "all" | "due" | "birthdays" | `tag:${string}` | `project:${string}`;

/** People (brief 6.6). */
export function PeopleView() {
  const rows = useLiveQuery(() => getDB().contacts.toArray(), []);
  const projects = useProjects() ?? [];
  const [list, setList] = useState<ListKey>("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sensors = useListSensors();
  const today = todayKey();

  const contacts = useMemo(() => alive(rows).sort(byOrder), [rows]);
  const tags = useMemo(() => [...new Set(contacts.flatMap((c) => c.tags))].sort(), [contacts]);
  const query = q.trim().toLowerCase();

  let shown: Contact[] = contacts;
  if (list === "due") shown = contacts.filter((c) => (catchupDue(c, today) ?? -1) >= 0).sort((a, b) => (catchupDue(b, today) ?? 0) - (catchupDue(a, today) ?? 0));
  else if (list === "birthdays") shown = contacts.filter((c) => (daysToBirthday(c.birthday, today) ?? 999) <= 60).sort((a, b) => daysToBirthday(a.birthday, today)! - daysToBirthday(b.birthday, today)!);
  else if (list.startsWith("tag:")) shown = contacts.filter((c) => c.tags.includes(list.slice(4)));
  else if (list.startsWith("project:")) shown = contacts.filter((c) => c.projectIds.includes(list.slice(8)));
  if (query) shown = shown.filter((c) => [c.name, c.organisation, c.role, c.email, c.phone, c.instagram, c.linkedin, c.howMet, c.notes, c.tags.join(" ")].join(" ").toLowerCase().includes(query));

  async function importFile(f: File) {
    const parsed = parseVCF(await f.text());
    if (!parsed.length) {
      toast("No contacts found in that file.");
      return;
    }
    const existing = new Set(contacts.map((c) => c.name.toLowerCase()));
    const fresh = parsed.filter((p) => !existing.has(p.name.toLowerCase()));
    const start = contacts.length;
    await putMany("contacts", fresh.map((p, i) => blankContact(p, start + i)));
    toast(`Imported ${fresh.length} ${fresh.length === 1 ? "person" : "people"}${parsed.length > fresh.length ? ` (${parsed.length - fresh.length} already here)` : ""}`);
  }

  function exportFile() {
    const blob = new Blob([toVCF(contacts)], { type: "text/vcard" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "auragarden-contacts.vcf";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = contacts.map((c) => c.id);
    void reorder("contacts", arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id))));
  };

  if (!rows) return <ListSkeleton />;
  const dueCount = contacts.filter((c) => (catchupDue(c, today) ?? -1) >= 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" aria-label="Search people" className="h-11 w-full rounded-full bg-surface-sunk pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/60" />
        </label>
        <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()} aria-label="Import contacts from a .vcf file">
          <Upload size={16} /> <span className="hidden sm:inline">Import</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={exportFile} disabled={!contacts.length} aria-label="Export contacts as .vcf">
          <Download size={16} /> <span className="hidden sm:inline">Export</span>
        </Button>
        <Button size="sm" onClick={() => setAdding(true)} aria-label="Add person">
          <UserPlus size={16} /> <span className="hidden sm:inline">Add person</span>
        </Button>
        <input ref={fileRef} type="file" accept=".vcf,text/vcard,text/x-vcard" className="hidden" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
      </div>

      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Chip active={list === "all"} onClick={() => setList("all")}>All</Chip>
        <Chip active={list === "due"} onClick={() => setList("due")}>
          <HeartHandshake size={14} /> Due a catch-up{dueCount ? ` · ${dueCount}` : ""}
        </Chip>
        <Chip active={list === "birthdays"} onClick={() => setList("birthdays")}>
          <Cake size={14} /> Birthdays
        </Chip>
        {tags.map((t) => (
          <Chip key={t} active={list === `tag:${t}`} onClick={() => setList(`tag:${t}`)}>
            #{t}
          </Chip>
        ))}
        {projects.map((p) => (
          <Chip key={p.id} active={list === `project:${p.id}`} color={p.color} onClick={() => setList(`project:${p.id}`)}>
            {p.name}
          </Chip>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={contacts.length ? "Nobody here" : "Your people live here"}
          line={contacts.length ? (list === "due" ? "Everyone's caught up. Lovely." : "Nobody matches that.") : "Add the people who matter, or import them from your phone."}
          pose="wave"
        >
          {!contacts.length && (
            <>
              <Button onClick={() => setAdding(true)}>
                <Plus size={18} /> Add a person
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload size={18} /> Import .vcf
              </Button>
            </>
          )}
        </EmptyState>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={shown.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <ul className="grid gap-2 md:grid-cols-2">
              {shown.map((c) => (
                <PersonRow key={c.id} contact={c} today={today} sortable={list === "all" && !query} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <AddPersonSheet open={adding} onOpenChange={setAdding} />
    </div>
  );
}

function PersonRow({ contact: c, today, sortable }: { contact: Contact; today: string; sortable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id, disabled: !sortable });
  const bday = daysToBirthday(c.birthday, today);
  const due = catchupDue(c, today);
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 10 : undefined }} {...attributes} {...listeners}>
      <Link href={`/people/${c.id}`} draggable={false} className="card flex items-center gap-3 p-3 transition-shadow hover:shadow-[var(--shadow-lift)]">
        <Avatar contact={c} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{c.name}</p>
          <p className="truncate text-[13px] text-ink-muted">{[c.role, c.organisation].filter(Boolean).join(" · ") || c.howMet || " "}</p>
        </div>
        {bday !== null && bday <= 14 && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blush/60 px-2 py-1 text-xs font-semibold text-blush-ink">
            <Cake size={13} /> {bday === 0 ? "Today!" : `${bday}d`}
          </span>
        )}
        {due !== null && due >= 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gentle px-2 py-1 text-xs font-semibold text-gentle-ink">
            <HeartHandshake size={13} /> Catch up
          </span>
        )}
      </Link>
    </li>
  );
}

function AddPersonSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Add a person" size="sm">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const c = await createContact({ name: name.trim(), phone: phone.trim() });
          await onContactAdded(c.id);
          setName("");
          setPhone("");
          onOpenChange(false);
        }}
      >
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Name" autoComplete="off" />
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" aria-label="Phone" type="tel" autoComplete="off" />
        <Button type="submit" className="w-full" disabled={!name.trim()}>
          Add person
        </Button>
      </form>
    </Sheet>
  );
}
