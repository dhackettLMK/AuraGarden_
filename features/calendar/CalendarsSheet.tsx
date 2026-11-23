"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useRef, useState } from "react";
import { AlertCircle, Eye, EyeOff, FileUp, Link2, RefreshCw, Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { getDB } from "@/lib/db";
import { alive, byOrder, patch, putMany, softDelete, baseRecord } from "@/lib/data/core";
import { undoToast, toast } from "@/components/ui/toast-store";
import { parseICS } from "@/lib/ical";
import { relativeTime } from "@/lib/dates";
import type { CalendarEvent } from "@/lib/types";
import { SUB_COLORS, addSubscription, refreshFeed } from "./data";

type Provider = "google" | "apple" | "outlook";

/**
 * How-tos for getting a subscribable link (brief 6.7). These could not be
 * checked against the providers' help pages from the build environment; see
 * PROGRESS.md.
 */
const HOWTO: Record<Provider, { title: string; steps: string[]; note?: string }> = {
  google: {
    title: "Google Calendar",
    steps: [
      "On a computer, open Google Calendar and go to Settings (the gear).",
      "Under “Settings for my calendars”, choose the calendar.",
      "Open “Integrate calendar” and copy the “Secret address in iCal format”.",
      "Paste it below. Keep it secret: anyone with it can see the calendar.",
    ],
    note: "This setting isn't in the phone app, so use a computer or a browser in desktop mode.",
  },
  apple: {
    title: "Apple iCloud",
    steps: [
      "On your iPhone, open Calendar and tap Calendars.",
      "Tap the info button next to the calendar you want.",
      "Turn on Public Calendar, then tap Share Link and Copy.",
      "Paste it below.",
    ],
    note: "A public link can be viewed by anyone who has it.",
  },
  outlook: {
    title: "Outlook",
    steps: [
      "On outlook.com, open Settings, then Calendar, then Shared calendars.",
      "Under “Publish a calendar”, pick the calendar and “Can view all details”, then Publish.",
      "Copy the ICS link (not the HTML one).",
      "Paste it below.",
    ],
  },
};

export function CalendarsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const subs = useLiveQuery(async () => alive(await getDB().calendar_subscriptions.toArray()).sort(byOrder), []) ?? [];
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<Provider>("google");
  const fileRef = useRef<HTMLInputElement>(null);
  const how = HOWTO[provider];

  async function importIcs(file: File) {
    try {
      const now = Date.now();
      const parsed = parseICS(await file.text(), now - 400 * 86_400_000, now + 400 * 86_400_000);
      const existing = new Set((await getDB().events.toArray()).map((e) => e.sourceUid).filter(Boolean));
      const fresh = parsed.filter((p) => !existing.has(p.uid));
      const rows: CalendarEvent[] = fresh.map((p, i) => ({
        ...baseRecord(),
        title: p.title,
        start: p.start,
        end: p.end,
        allDay: p.allDay,
        location: p.location,
        notes: p.description,
        color: null,
        projectId: null,
        recurrence: null,
        sourceUid: p.uid,
        order: i,
      }));
      await putMany("events", rows);
      toast(`Imported ${rows.length} event${rows.length === 1 ? "" : "s"}. They're yours to edit.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't read that file.");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Calendars" description="Bring in your other calendars." size="lg">
      <div className="space-y-6">
        {subs.length > 0 && (
          <section>
            <h3 className="mb-2 font-semibold">Subscribed</h3>
            <ul className="space-y-2">
              {subs.map((s, i) => (
                <li key={s.id} className="rounded-2xl bg-surface-sunk p-3">
                  <div className="flex items-center gap-2">
                    <label className="relative h-7 w-7 shrink-0 cursor-pointer rounded-full ring-2 ring-white/70" style={{ background: s.color }} title="Colour">
                      <input type="color" value={s.color} onChange={(e) => patch("calendar_subscriptions", s.id, { color: e.target.value })} className="absolute inset-0 opacity-0" aria-label={`Colour for ${s.name}`} />
                    </label>
                    <input defaultValue={s.name} onBlur={(e) => e.target.value.trim() && e.target.value !== s.name && patch("calendar_subscriptions", s.id, { name: e.target.value.trim() })} aria-label="Calendar name" className="min-w-0 flex-1 bg-transparent font-semibold outline-none" />
                    <Button variant="ghost" size="icon-sm" onClick={() => refreshFeed(s)} aria-label={`Refresh ${s.name}`}>
                      <RefreshCw size={16} />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => patch("calendar_subscriptions", s.id, { hidden: !s.hidden })} aria-label={s.hidden ? `Show ${s.name}` : `Hide ${s.name}`}>
                      {s.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={async () => {
                        const undo = await softDelete("calendar_subscriptions", s.id);
                        undoToast(`Removed ${s.name}`, undo);
                      }}
                      aria-label={`Remove ${s.name}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  {s.lastError ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-danger">
                      <AlertCircle size={14} /> {s.lastError}
                    </p>
                  ) : (
                    <p className="mt-1 text-[12px] text-ink-muted">{s.lastFetchedAt ? `Updated ${relativeTime(s.lastFetchedAt)}` : "Refreshes every 15 minutes"}</p>
                  )}
                  <span className="sr-only">{SUB_COLORS[i % SUB_COLORS.length]}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <Link2 size={18} /> Add by link
          </h3>
          <Segmented<Provider>
            label="Where is your calendar?"
            size="sm"
            value={provider}
            onChange={setProvider}
            className="w-full"
            options={[
              { value: "google", label: "Google" },
              { value: "apple", label: "Apple" },
              { value: "outlook", label: "Outlook" },
            ]}
          />
          <ol className="list-decimal space-y-1 rounded-2xl bg-primary-soft/50 py-3 pl-8 pr-4 text-[14px]">
            {how.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {how.note && <p className="text-[13px] text-ink-muted">{how.note}</p>}
          <form
            className="space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!url.trim()) return;
              setBusy(true);
              await addSubscription(name || how.title, url);
              setBusy(false);
              setUrl("");
              setName("");
            }}
          >
            <Label htmlFor="sub-url">Calendar link</Label>
            <Input id="sub-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="webcal:// or https://…ics" autoComplete="off" spellCheck={false} />
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Name (e.g. ${how.title})`} aria-label="Calendar name" />
            <Button type="submit" disabled={!url.trim() || busy} className="w-full">
              {busy ? "Adding…" : "Add calendar"}
            </Button>
          </form>
        </section>

        <section className="space-y-2">
          <h3 className="flex items-center gap-2 font-semibold">
            <FileUp size={18} /> Import a file
          </h3>
          <p className="text-[14px] text-ink-muted">Upload an .ics once, like a timetable export. The events become yours and you can edit them.</p>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <FileUp size={16} /> Choose .ics file
          </Button>
          <input ref={fileRef} type="file" accept=".ics,text/calendar" className="hidden" onChange={(e) => e.target.files?.[0] && importIcs(e.target.files[0])} />
        </section>
      </div>
    </Sheet>
  );
}
