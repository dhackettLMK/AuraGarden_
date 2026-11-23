"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp, Download, Gift, Maximize2, RefreshCw, Trash2, Upload, UserRound, Volume2 } from "lucide-react";
import { getDB } from "@/lib/db";
import { alive } from "@/lib/data/core";
import { exportAll, importAll, getGardenKey } from "@/lib/data/garden";
import { ALL_TABS, DEFAULT_SIDEBAR, MODULE_LABELS, updateSettings } from "@/lib/data/settings";
import { useSettings } from "@/lib/hooks";
import { resizeImage } from "@/lib/image";
import { toVCF } from "@/lib/vcard";
import { getGift } from "@/config/gifts";
import { relativeTime } from "@/lib/dates";
import { useSyncStore } from "@/lib/sync/status";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { Sheet } from "@/components/ui/Sheet";
import { toast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { TrashSheet } from "./TrashSheet";
import { CalendarsSheet } from "@/features/calendar/CalendarsSheet";
import { SaveLinkPanel } from "@/features/link/SaveLinkPanel";
import { gardenLink, qrDataUrl } from "@/features/link/link-tools";
import { GiftTag } from "@/features/unwrap/GiftBox";
import { DeleteGardenSheet, RotateLinkButton } from "./GardenDanger";
import { JoinSheet } from "@/features/welcome/JoinSheet";
import type { CelebrationStyle, NumberStyle, TabKey, ThemePref } from "@/lib/types";

const ACCENTS = [null, "#4F7A5A", "#6C8EBF", "#B07AA1", "#D9822B", "#C76A58"];

/** Settings (brief 6.8). */
export function SettingsView() {
  const s = useSettings();
  const router = useRouter();
  const [trash, setTrash] = useState(false);
  const [calendars, setCalendars] = useState(false);
  const [bigQr, setBigQr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rescan, setRescan] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const sync = useSyncStore();
  const tags = useLiveQuery(async () => {
    const db = getDB();
    const all = [...alive(await db.tasks.toArray()), ...alive(await db.thoughts.toArray()), ...alive(await db.contacts.toArray())];
    const counts = new Map<string, number>();
    for (const r of all) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort();
  }, []);
  if (!s) return null;
  const gift = s.giftSlug ? getGift(s.giftSlug) : null;
  const set = (c: Parameters<typeof updateSettings>[0]) => updateSettings(c);
  const sidebar = s.sidebarOrder?.length ? s.sidebarOrder : DEFAULT_SIDEBAR;

  async function renameTag(from: string, to: string) {
    const db = getDB();
    const target = to.trim().replace(/^#/, "").toLowerCase();
    for (const table of ["tasks", "thoughts", "contacts"] as const) {
      const rows = alive((await db[table].toArray()) as { id: string; tags: string[]; deletedAt: number | null }[]).filter((r) => r.tags.includes(from));
      for (const r of rows) {
        const { patch } = await import("@/lib/data/core");
        await patch(table, r.id, { tags: target ? [...new Set(r.tags.map((t) => (t === from ? target : t)))] : r.tags.filter((t) => t !== from) } as never);
      }
    }
    toast(target ? `Renamed #${from} to #${target}` : `Removed #${from}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Section title="Profile" icon={<UserRound size={18} />}>
        <div className="flex items-center gap-4">
          <button onClick={() => avatarRef.current?.click()} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-primary-soft text-2xl font-bold text-primary" aria-label="Change avatar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {s.avatar ? <img src={s.avatar} alt="" className="h-full w-full object-cover" /> : s.displayName.slice(0, 1)}
          </button>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={async (e) => e.target.files?.[0] && set({ avatar: await resizeImage(e.target.files[0]) })} />
          <div className="min-w-0 flex-1">
            <Label htmlFor="s-name">Display name</Label>
            <Input id="s-name" defaultValue={s.displayName} onBlur={(e) => e.target.value.trim() && set({ displayName: e.target.value.trim() })} />
          </div>
        </div>
        <div className="mt-3">
          <Label htmlFor="s-bday">Your birthday (optional)</Label>
          <Input id="s-bday" type="date" defaultValue={s.birthday ?? ""} onChange={(e) => set({ birthday: e.target.value || null })} />
          <p className="mt-1 text-[13px] text-ink-muted">For a secret trophy and a little surprise in the garden.</p>
        </div>
      </Section>

      <Section title="My garden link" icon={<Gift size={18} />} id="link">
        {sync.status === "attention" && sync.message?.includes("new link") && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-gentle/60 px-4 py-3 text-[14px] text-gentle-ink">
            <span className="flex-1">{sync.message}</span>
            <Button size="sm" onClick={() => setRescan(true)}>
              Scan the new link
            </Button>
          </div>
        )}
        {sync.status === "off" ? (
          <p className="mb-3 rounded-2xl bg-gentle/50 px-4 py-3 text-[14px] text-gentle-ink">Sync is off on this site, so your garden lives on this device only. Export a backup below now and then.</p>
        ) : (
          <p className="mb-3 text-[14px] text-ink-muted">
            {sync.status === "synced" && sync.lastSyncAt ? `Synced ${relativeTime(sync.lastSyncAt)}.` : sync.status === "offline" ? "Offline. Changes will sync when you're back." : sync.status === "attention" ? (sync.message?.includes("new link") ? "" : (sync.message ?? "Sync needs attention.")) : "Syncing…"} This link is the only key to your garden.
          </p>
        )}
        <SaveLinkPanel />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const k = await getGardenKey();
              if (k) setBigQr(await qrDataUrl(gardenLink(k), 900));
            }}
          >
            <Maximize2 size={16} /> Open on another device
          </Button>
          <RotateLinkButton />
        </div>
      </Section>

      <Section title="Aura" icon={<Volume2 size={18} />}>
        <Row label="Daily goal" hint="Tasks a day for the ring.">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => set({ dailyGoal: Math.max(1, s.dailyGoal - 1) })} aria-label="Fewer">
              −
            </Button>
            <span className="w-8 text-center font-display text-lg font-semibold tabular">{s.dailyGoal}</span>
            <Button variant="outline" size="icon-sm" onClick={() => set({ dailyGoal: Math.min(30, s.dailyGoal + 1) })} aria-label="More">
              +
            </Button>
          </div>
        </Row>
        <Row label="Sound">
          <Switch checked={s.sound} onCheckedChange={(sound) => set({ sound })} label="Sound" />
        </Row>
        {s.sound && (
          <Row label="Volume">
            <input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => set({ volume: Number(e.target.value) })} aria-label="Volume" className="w-40 accent-[var(--primary)]" />
          </Row>
        )}
        <Row label="Haptics">
          <Switch checked={s.haptics} onCheckedChange={(haptics) => set({ haptics })} label="Haptics" />
        </Row>
        <Row label="Celebrations" stack>
          <Segmented<CelebrationStyle> label="Celebration style" size="sm" value={s.celebration} onChange={(celebration) => set({ celebration })} className="w-full" options={[{ value: "full", label: "Full" }, { value: "calm", label: "Calm" }, { value: "minimal", label: "Minimal" }]} />
        </Row>
        <Row label="Numbers" stack>
          <Segmented<NumberStyle> label="Number style" size="sm" value={s.numberStyle} onChange={(numberStyle) => set({ numberStyle })} className="w-full" options={[{ value: "short", label: "Short (1.2M)" }, { value: "full", label: "Full (1,234,567)" }]} />
        </Row>
      </Section>

      <Section title="Appearance">
        <Row label="Theme" stack>
          <Segmented<ThemePref> label="Theme" size="sm" value={s.theme} onChange={(theme) => set({ theme })} className="w-full" options={[{ value: "light", label: "Light" }, { value: "dark", label: "Night garden" }, { value: "auto", label: "Auto" }]} />
        </Row>
        <Row label="Accent colour">
          <div className="flex gap-1.5" role="radiogroup" aria-label="Accent colour">
            {ACCENTS.map((c) => (
              <button key={c ?? "default"} role="radio" aria-checked={s.accent === c} aria-label={c ?? "Default"} onClick={() => set({ accent: c })} className={cn("h-8 w-8 rounded-full ring-offset-2 ring-offset-surface", s.accent === c && "ring-2 ring-ink")} style={{ background: c ?? "linear-gradient(135deg, #4F7A5A 50%, #8FC29A 50%)" }} />
            ))}
          </div>
        </Row>
        <Row label="Reduce motion" hint="Fades instead of slides and bounces.">
          <Switch checked={s.reduceMotion} onCheckedChange={(reduceMotion) => set({ reduceMotion })} label="Reduce motion" />
        </Row>
        <Row label="Show Oscar on Home">
          <Switch checked={s.showOscar} onCheckedChange={(showOscar) => set({ showOscar })} label="Show Oscar on Home" />
        </Row>
      </Section>

      <Section title="Make it yours">
        <p className="mb-2 text-sm font-semibold text-ink-muted">Phone tabs (pick four)</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TABS.map((t) => {
            const on = s.tabs.includes(t);
            return (
              <button
                key={t}
                aria-pressed={on}
                onClick={() => {
                  const next = on ? s.tabs.filter((x) => x !== t) : [...s.tabs, t];
                  if (next.length > 4) next.shift();
                  if (next.length === 4) set({ tabs: next as TabKey[] });
                  else set({ tabs: next as TabKey[] });
                }}
                className={cn("h-9 rounded-full px-3.5 text-sm font-semibold", on ? "bg-primary text-primary-ink" : "bg-surface-sunk text-ink-muted")}
              >
                {s.moduleNames?.[t] || MODULE_LABELS[t]}
              </button>
            );
          })}
        </div>
        {s.tabs.length !== 4 && <p className="mt-1 text-[13px] text-gentle-ink">Pick {4 - s.tabs.length} more. Until then the defaults show.</p>}

        <p className="mb-2 mt-5 text-sm font-semibold text-ink-muted">Sidebar order and names</p>
        <ul className="space-y-1.5">
          {sidebar.map((t, i) => (
            <li key={t} className="flex items-center gap-2 rounded-2xl bg-surface-sunk py-1 pl-3 pr-1">
              <input defaultValue={s.moduleNames?.[t] ?? ""} placeholder={MODULE_LABELS[t]} aria-label={`Name for ${MODULE_LABELS[t]}`} onBlur={(e) => set({ moduleNames: { ...s.moduleNames, [t]: e.target.value.trim() } })} className="h-10 min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink" />
              <Button variant="ghost" size="icon-sm" disabled={i === 0} aria-label={`Move ${MODULE_LABELS[t]} up`} onClick={() => { const n = [...sidebar]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set({ sidebarOrder: n }); }}>
                <ChevronUp size={18} />
              </Button>
              <Button variant="ghost" size="icon-sm" disabled={i === sidebar.length - 1} aria-label={`Move ${MODULE_LABELS[t]} down`} onClick={() => { const n = [...sidebar]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set({ sidebarOrder: n }); }}>
                <ChevronDown size={18} />
              </Button>
            </li>
          ))}
        </ul>

        <p className="mb-2 mt-5 text-sm font-semibold text-ink-muted">Tags</p>
        {tags?.length ? (
          <ul className="space-y-1.5">
            {tags.map(([t, n]) => (
              <li key={t} className="flex items-center gap-2 rounded-2xl bg-surface-sunk py-1 pl-3 pr-1">
                <span className="text-primary">#</span>
                <input defaultValue={t} aria-label={`Rename tag ${t}`} onBlur={(e) => e.target.value.trim() !== t && renameTag(t, e.target.value)} className="h-10 min-w-0 flex-1 bg-transparent outline-none" />
                <span className="text-sm tabular text-ink-muted">{n}</span>
                <Button variant="ghost" size="icon-sm" aria-label={`Remove tag ${t}`} onClick={() => renameTag(t, "")}>
                  <Trash2 size={16} />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-ink-muted">No tags yet. Add #tags to tasks, thoughts or people.</p>
        )}
      </Section>

      <Section title="Calendars" icon={<CalendarDays size={18} />}>
        <Button variant="outline" onClick={() => setCalendars(true)}>
          Manage calendars and imports
        </Button>
      </Section>

      <Section title="Data">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const blob = new Blob([JSON.stringify(await exportAll(), null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `auragarden-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
            }}
          >
            <Download size={16} /> Export everything (JSON)
          </Button>
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}>
            <Upload size={16} /> Import JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const blob = new Blob([toVCF(alive(await getDB().contacts.toArray()))], { type: "text/vcard" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "auragarden-contacts.vcf";
              a.click();
            }}
          >
            <Download size={16} /> Export contacts (.vcf)
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTrash(true)}>
            <Trash2 size={16} /> Open Trash
          </Button>
          {gift && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/${gift.slug}?replay=1`)}>
              <RefreshCw size={16} /> Replay the unwrap
            </Button>
          )}
        </div>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              await importAll(JSON.parse(await f.text()));
              toast("Imported. Everything's back.");
            } catch (err) {
              toast(err instanceof Error ? err.message : "Couldn't import that file.");
            }
          }}
        />
        <div className="mt-5 border-t border-line pt-4">
          <Button variant="ghost" className="text-danger hover:text-danger" onClick={() => setDeleting(true)}>
            <Trash2 size={18} /> Delete this garden
          </Button>
        </div>
      </Section>

      <Section title="About">
        <div className="text-center">
          {gift ? (
            <>
              <p className="font-display text-[20px] font-semibold">Made for {gift.recipient} by {gift.signature}</p>
              <div className="mt-3">
                <GiftTag line={gift.tagLine} signature={gift.signature} written />
              </div>
            </>
          ) : (
            <p className="font-display text-[20px] font-semibold">AuraGarden</p>
          )}
          <p className="mt-4 text-[13px] text-ink-muted">
            No accounts, no trackers. Your garden lives on your devices{sync.status !== "off" ? " and syncs privately under your secret link" : ""}. <Link href="/trophies" className="text-primary underline">Trophy Room</Link>
          </p>
        </div>
      </Section>

      <TrashSheet open={trash} onOpenChange={setTrash} />
      <CalendarsSheet open={calendars} onOpenChange={setCalendars} />
      <DeleteGardenSheet open={deleting} onOpenChange={setDeleting} />
      <JoinSheet open={rescan} onOpenChange={setRescan} />
      <Sheet open={!!bigQr} onOpenChange={(v) => !v && setBigQr(null)} title="Scan to open your garden" description="On the other device, open the camera and point it here." size="md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {bigQr && <img src={bigQr} alt="QR code for your secret garden link" className="mx-auto aspect-square w-full max-w-[420px] rounded-3xl bg-white p-3" />}
      </Sheet>
    </div>
  );
}

function Section({ title, icon, children, id }: { title: string; icon?: React.ReactNode; children: React.ReactNode; id?: string }) {
  return (
    <section className="card scroll-mt-20 p-4 md:p-5" aria-label={title} id={id}>
      <h2 className="mb-3 flex items-center gap-2 font-display text-[20px] font-semibold">
        {icon && <span className="text-primary">{icon}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, hint, children, stack }: { label: string; hint?: string; children: React.ReactNode; stack?: boolean }) {
  return (
    <div className={cn("flex gap-3 border-b border-line/60 py-3 last:border-0", stack ? "flex-col" : "items-center justify-between")}>
      <div>
        <p className="font-semibold">{label}</p>
        {hint && <p className="text-[13px] text-ink-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
