"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useRef, useState } from "react";
import { ArrowLeft, AtSign, Briefcase, Camera, HeartHandshake, Mail, MessageCircle, MessageSquareText, Phone, Trash2 } from "lucide-react";
import { getDB } from "@/lib/db";
import { alive, softDelete } from "@/lib/data/core";
import { logCatchup, updateContact } from "@/lib/data/contacts";
import { onCatchupLogged } from "@/lib/game/actions";
import { resizeImage } from "@/lib/image";
import { todayKey } from "@/lib/day";
import { catchupDue, daysToBirthday, digits, whatsappNumber } from "@/lib/people";
import { friendlyDay, relativeTime } from "@/lib/dates";
import { useProjects } from "@/lib/hooks";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { TagInput } from "@/components/ui/TagInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { undoToast } from "@/components/ui/toast-store";
import type { Contact } from "@/lib/types";
import { Avatar } from "./Avatar";

export function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const contact = useLiveQuery(async () => (await getDB().contacts.get(id)) ?? null, [id]);
  const catchups = useLiveQuery(async () => alive(await getDB().catchups.where("contactId").equals(id).toArray()).sort((a, b) => (a.date < b.date ? 1 : -1)), [id]) ?? [];
  const tags = useLiveQuery(async () => [...new Set((await getDB().contacts.toArray()).flatMap((c) => c.tags))], []) ?? [];
  const projects = useProjects() ?? [];
  const [logOpen, setLogOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = todayKey();

  if (contact === undefined) return <Skeleton className="h-96 w-full rounded-[24px]" />;
  if (!contact || contact.deletedAt)
    return (
      <EmptyState title="That person has gone" line="They might be in Trash." pose="thinking">
        <Button onClick={() => router.push("/people")}>All people</Button>
      </EmptyState>
    );

  const save = (changes: Partial<Contact>) => updateContact(contact.id, changes);
  const bday = daysToBirthday(contact.birthday, today);
  const due = catchupDue(contact, today);
  const actions = [
    contact.phone && { label: "Call", icon: Phone, href: `tel:${digits(contact.phone)}` },
    contact.phone && { label: "Text", icon: MessageSquareText, href: `sms:${digits(contact.phone)}` },
    contact.phone && { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/${whatsappNumber(contact.phone)}` },
    contact.email && { label: "Email", icon: Mail, href: `mailto:${contact.email}` },
    contact.instagram && { label: "Instagram", icon: AtSign, href: `https://instagram.com/${contact.instagram.replace(/^@/, "")}` },
    contact.linkedin && { label: "LinkedIn", icon: Briefcase, href: contact.linkedin.startsWith("http") ? contact.linkedin : `https://www.linkedin.com/in/${contact.linkedin}` },
  ].filter(Boolean) as { label: string; icon: typeof Phone; href: string }[];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/people" className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-muted hover:bg-surface-sunk">
        <ArrowLeft size={16} /> People
      </Link>

      <section className="card flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:text-left">
        <button onClick={() => fileRef.current?.click()} className="group relative rounded-full" aria-label="Change photo">
          <Avatar contact={contact} size={88} />
          <span className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink-muted shadow-[var(--shadow-soft)]">
            <Camera size={16} />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) await save({ photo: await resizeImage(f) });
          }}
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[26px] font-semibold leading-tight">
            <InlineEdit value={contact.name} onSave={(name) => name && save({ name })} label="Name" />
          </h2>
          <p className="mt-0.5 text-[15px] text-ink-muted">
            {[contact.role, contact.organisation].filter(Boolean).join(" · ") || "Add a role or organisation below"}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {bday !== null && <span className="rounded-full bg-blush/60 px-2.5 py-1 text-xs font-semibold text-blush-ink">🎂 {bday === 0 ? "Birthday today!" : `Birthday in ${bday} days`}</span>}
            {contact.lastContacted && <span className="rounded-full bg-surface-sunk px-2.5 py-1 text-xs font-semibold text-ink-muted">Last caught up {relativeTime(contact.lastContacted)}</span>}
            {due !== null && due >= 0 && <span className="rounded-full bg-gentle px-2.5 py-1 text-xs font-semibold text-gentle-ink">Due a catch-up</span>}
          </div>
        </div>
      </section>

      {actions.length > 0 && (
        <nav aria-label="Get in touch" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {actions.map((a) => (
            <a key={a.label} href={a.href} target={a.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex min-w-20 shrink-0 flex-col items-center gap-1 rounded-2xl bg-surface p-3 text-[13px] font-semibold shadow-[var(--shadow-soft)] active:scale-95">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <a.icon size={20} />
              </span>
              {a.label}
            </a>
          ))}
        </nav>
      )}

      <section className="card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Catch-ups</h3>
          <Button size="sm" onClick={() => setLogOpen(true)}>
            <HeartHandshake size={16} /> Log a catch-up
          </Button>
        </div>
        {catchups.length ? (
          <ul className="space-y-1.5">
            {catchups.map((c) => (
              <li key={c.id} className="flex gap-3 rounded-2xl bg-surface-sunk px-3 py-2.5 text-[15px]">
                <span className="w-24 shrink-0 font-semibold text-ink-muted">{friendlyDay(c.date, today)}</span>
                <span className="min-w-0 flex-1">{c.note || "Caught up"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-ink-muted">No catch-ups yet. Log one after you see them.</p>
        )}
      </section>

      <section className="card grid gap-4 p-4 sm:grid-cols-2">
        <Field label="Phone" value={contact.phone} type="tel" onSave={(phone) => save({ phone })} />
        <Field label="Email" value={contact.email} type="email" onSave={(email) => save({ email })} />
        <Field label="Instagram" value={contact.instagram} onSave={(instagram) => save({ instagram: instagram.replace(/^@/, "") })} prefix={<AtSign size={14} />} />
        <Field label="LinkedIn" value={contact.linkedin} onSave={(linkedin) => save({ linkedin })} />
        <Field label="Organisation" value={contact.organisation} onSave={(organisation) => save({ organisation })} />
        <Field label="Role" value={contact.role} onSave={(role) => save({ role })} />
        <Field label="How you met" value={contact.howMet} onSave={(howMet) => save({ howMet })} />
        <div>
          <Label htmlFor="p-bday">Birthday</Label>
          <Input id="p-bday" type="date" defaultValue={contact.birthday && !contact.birthday.startsWith("--") ? contact.birthday : ""} onChange={(e) => save({ birthday: e.target.value || null })} />
        </div>
        <div>
          <Label htmlFor="p-kit">Keep in touch every</Label>
          <div className="flex items-center gap-2">
            <Input id="p-kit" type="number" min={1} max={365} defaultValue={contact.keepInTouchDays ?? ""} placeholder="e.g. 14" onChange={(e) => save({ keepInTouchDays: e.target.value ? Number(e.target.value) : null })} className="w-28" />
            <span className="text-ink-muted">days</span>
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label>Tags</Label>
          <TagInput value={contact.tags} onChange={(t) => save({ tags: t })} suggestions={tags} />
        </div>
        {projects.length > 0 && (
          <div className="sm:col-span-2">
            <Label>Projects</Label>
            <div className="flex flex-wrap gap-1.5">
              {projects.map((p) => {
                const on = contact.projectIds.includes(p.id);
                return (
                  <Chip key={p.id} active={on} color={p.color} onClick={() => save({ projectIds: on ? contact.projectIds.filter((x) => x !== p.id) : [...contact.projectIds, p.id] })}>
                    {p.name}
                  </Chip>
                );
              })}
            </div>
          </div>
        )}
        <div className="sm:col-span-2">
          <Label htmlFor="p-notes">Notes</Label>
          <Textarea id="p-notes" defaultValue={contact.notes} onBlur={(e) => e.target.value !== contact.notes && save({ notes: e.target.value })} placeholder="Things to remember" />
        </div>
      </section>

      <Button
        variant="ghost"
        className="text-danger hover:text-danger"
        onClick={async () => {
          const undo = await softDelete("contacts", contact.id);
          undoToast(`Deleted ${contact.name}`, undo);
          router.push("/people");
        }}
      >
        <Trash2 size={18} /> Delete {contact.name.split(" ")[0]}
      </Button>

      <LogCatchupSheet open={logOpen} onOpenChange={setLogOpen} contact={contact} />
    </div>
  );
}

function Field({ label, value, onSave, type = "text", prefix }: { label: string; value: string; onSave: (v: string) => void; type?: string; prefix?: React.ReactNode }) {
  const id = `f-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">{prefix}</span>}
        <Input id={id} type={type} defaultValue={value} onBlur={(e) => e.target.value.trim() !== value && onSave(e.target.value.trim())} className={prefix ? "pl-9" : undefined} />
      </div>
    </div>
  );
}

function LogCatchupSheet({ open, onOpenChange, contact }: { open: boolean; onOpenChange: (v: boolean) => void; contact: Contact }) {
  const [date, setDate] = useState(todayKey());
  const [note, setNote] = useState("");
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`Catch-up with ${contact.name.split(" ")[0]}`} size="sm">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          await logCatchup(contact.id, date, note.trim());
          await onCatchupLogged(contact.id);
          setNote("");
          onOpenChange(false);
        }}
      >
        <div>
          <Label htmlFor="cu-date">When</Label>
          <Input id="cu-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="cu-note">What you talked about</Label>
          <Textarea id="cu-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Coffee in town, she's starting a new job" />
        </div>
        <Button type="submit" className="w-full">
          Save catch-up
        </Button>
      </form>
    </Sheet>
  );
}
