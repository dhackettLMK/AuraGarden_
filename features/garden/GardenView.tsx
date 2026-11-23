"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, EyeOff, Eye, Map as MapIcon, Move, Palette, Sprout as SproutIcon, X, Shirt } from "lucide-react";
import { getDB } from "@/lib/db";
import { patch } from "@/lib/data/core";
import { updateSettings } from "@/lib/data/settings";
import { useMediaQuery, useNow, useProjects, useReducedMotion, useSettings } from "@/lib/hooks";
import { useGame } from "@/lib/game/GameProvider";
import { seasonOf, timeOfDay, type Season, type TimeOfDay } from "@/lib/day";
import { formatAura } from "@/lib/format";
import { UNLOCKS, unlockById } from "@/config/realms";
import { GardenScene, type CornerSpec } from "@/components/garden/Scene";
import { CORNER_NAMES, CORNER_STAGES, cornerStage } from "@/components/garden/art/corners";
import { DECOR_ITEMS, DECOR_SPOTS } from "@/components/garden/slots";
import { ItemThumb } from "@/components/garden/ItemThumb";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { WorldMap } from "./WorldMap";
import { Wardrobe } from "./Wardrobe";
import type { GardenItemRecord } from "@/lib/types";

const TULIP_COLORS = ["#F28AA5", "#F4C443", "#EE8A6B", "#B79CF2", "#FFFDF7", "#D9575B"];

export function GardenView() {
  return (
    <Suspense>
      <GardenInner />
    </Suspense>
  );
}

function GardenInner() {
  const params = useSearchParams();
  const router = useRouter();
  const wide = useMediaQuery("(min-width: 768px)");
  const reduce = useReducedMotion();
  const game = useGame();
  const settings = useSettings();
  const projects = useProjects() ?? [];
  const records = useLiveQuery(() => getDB().garden_items.toArray(), []);
  const now = useNow(60_000);
  const [view, setView] = useState<"garden" | "map">(params.get("view") === "map" ? "map" : "garden");
  const [decor, setDecor] = useState(false);
  const [selected, setSelected] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [weather, setWeather] = useState<"clear" | "drizzle" | "rainbow">("clear");
  const [wardrobe, setWardrobe] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const spot = params.get("spot");

  // Now and then a soft Irish drizzle passes, followed by a rainbow once unlocked.
  useEffect(() => {
    if (reduce) return;
    let t: ReturnType<typeof setTimeout>;
    const cycle = () => {
      t = setTimeout(() => {
        if (Math.random() < 0.3) {
          setWeather("drizzle");
          t = setTimeout(() => {
            setWeather("rainbow");
            t = setTimeout(() => {
              setWeather("clear");
              cycle();
            }, 30_000);
          }, 22_000);
        } else cycle();
      }, 45_000);
    };
    cycle();
    return () => clearTimeout(t);
  }, [reduce]);

  useEffect(() => {
    if (spot === "rainbow") {
      const t = setTimeout(() => setWeather("rainbow"), 0);
      return () => clearTimeout(t);
    }
  }, [spot]);

  // Mark everything as seen once she visits the garden.
  useEffect(() => {
    if (!records) return;
    for (const r of records) if (!r.seen) void patch("garden_items", r.id, { seen: true });
  }, [records]);

  const byItem = useMemo(() => new Map((records ?? []).map((r) => [r.itemId, r])), [records]);
  const unlocked = useMemo(() => new Set((records ?? []).map((r) => r.itemId)), [records]);

  const corners: CornerSpec[] = useMemo(() => {
    let custom = 0;
    return projects.map((p) => {
      const aura = game.projectAura[p.id] ?? 0;
      const slot = p.kind === "custom" ? `corner-${custom++ % 4}` : `corner-${p.kind}`;
      const stage = cornerStage(aura);
      return { key: `corner:${p.id}`, kind: p.kind, stage, color: p.color, name: `${p.name}: ${CORNER_NAMES[p.kind][Math.max(0, stage - 1)]}`, slot };
    });
  }, [projects, game.projectAura]);

  if (!records || !settings)
    return <Skeleton className={cn("w-full rounded-[28px]", wide ? "aspect-[16/10]" : "aspect-[4/5]")} />;

  // ?time= and ?season= preview any sky or season (handy for screenshots).
  const tod = (params.get("time") as TimeOfDay | null) ?? timeOfDay(now, settings.timezone);
  const season = (params.get("season") as Season | null) ?? seasonOf(now, settings.timezone);
  const next = UNLOCKS.filter((u) => u.at > game.total);
  const needsTulipColour = unlocked.has("tulips") && !settings.tulipColor;

  async function savePicture() {
    const svg = stageRef.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const vb = svg.viewBox.baseVal;
    const data = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(data)}`;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = vb.width * 1.5;
    canvas.height = vb.height * 1.5;
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const a = document.createElement("a");
    a.download = "my-auragarden.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
    toast("Garden picture saved");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="View"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "garden", label: <><SproutIcon size={16} /> <span className="sm:hidden">Garden</span><span className="hidden sm:inline">My garden</span></> },
            { value: "map", label: <><MapIcon size={16} /> <span className="sm:hidden">Map</span><span className="hidden sm:inline">World map</span></> },
          ]}
        />
        <div className="flex-1" />
        {view === "garden" && (
          <>
            <Button variant="ghost" size="sm" onClick={() => setWardrobe(true)} aria-label="Oscar's wardrobe">
              <Shirt size={16} /> <span className="hidden sm:inline">Wardrobe</span>
            </Button>
            <Button variant={decor ? "soft" : "ghost"} size="sm" onClick={() => setDecor((d) => !d)} aria-pressed={decor} aria-label="Decor mode">
              <Move size={16} /> <span className="hidden sm:inline">{decor ? "Done" : "Decor"}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={savePicture} aria-label="Save a picture of my garden">
              <Download size={16} /> <span className="hidden sm:inline">Save picture</span>
            </Button>
          </>
        )}
      </div>

      {view === "map" ? (
        <WorldMap total={game.total} unlocked={unlocked} realmsOpen={game.realmsOpen} timeOfDay={tod} onOpenHome={() => setView("garden")} />
      ) : (
        <>
          <div ref={(el) => { stageRef.current = el; setStageEl(el); }} className="relative -mx-4 overflow-hidden shadow-[var(--shadow-soft)] md:mx-0 md:rounded-[28px]">
            <GardenScene
              layout={wide ? "wide" : "tall"}
              unlocked={unlocked}
              records={byItem}
              total={game.total}
              corners={corners}
              timeOfDay={tod}
              season={season}
              weather={weather}
              spotlight={spot}
              decor={decor}
              ambient={!reduce}
              tulipColor={settings.tulipColor}
              onTapItem={(id, rect) => setSelected({ id, rect })}
              oscar={{
                level: game.level,
                outfit: settings.oscarOutfit,
                onPet: () => void updateSettings({ petCount: (settings.petCount ?? 0) + 1 }),
              }}
              title={`Your garden: ${unlocked.size} things growing`}
            />
            {decor && (
              <p className="absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-ink/80 px-4 py-1.5 text-sm font-semibold text-background">
                Decor mode: tap anything to move or hide it
              </p>
            )}
            <AnimatePresence>
              {selected && (
                <ItemPopover
                  key={selected.id}
                  id={selected.id}
                  rect={selected.rect}
                  container={stageEl}
                  record={byItem.get(selected.id)}
                  corners={corners}
                  decor={decor}
                  wide={wide}
                  onClose={() => setSelected(null)}
                />
              )}
            </AnimatePresence>
          </div>

          {needsTulipColour && (
            <section className="card flex flex-wrap items-center gap-3 p-4">
              <Palette size={18} className="text-primary" />
              <p className="flex-1 font-semibold">Pick a colour for your tulips</p>
              <div className="flex gap-2">
                {TULIP_COLORS.map((c) => (
                  <button key={c} onClick={() => updateSettings({ tulipColor: c })} className="h-9 w-9 rounded-full ring-1 ring-black/10" style={{ background: c }} aria-label={`Tulips in ${c}`} />
                ))}
              </div>
            </section>
          )}

          {decor && <HiddenItems records={records} />}

          <NextUp total={game.total} next={next} />
        </>
      )}
      {spot && (
        <button onClick={() => router.replace("/garden")} className="sr-only">
          Clear spotlight
        </button>
      )}
      <Wardrobe open={wardrobe} onOpenChange={setWardrobe} />
    </div>
  );
}

function NextUp({ total, next }: { total: number; next: typeof UNLOCKS }) {
  const settings = useSettings();
  const n = next[0];
  if (!n) return null;
  const prevAt = UNLOCKS.filter((u) => u.at <= total).at(-1)?.at ?? 0;
  const progress = Math.max(0.02, (total - prevAt) / (n.at - prevAt));
  return (
    <section className="card p-4 md:p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-sunk">
          <ItemThumb id={n.id} size={52} silhouette />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-muted">Next up</p>
          <p className="font-display text-[19px] font-semibold leading-tight">{n.name}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-sunk">
            <div className="h-full rounded-full aura-bg transition-[width] duration-700" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-1 text-[13px] font-medium text-ink-muted">
            {formatAura(n.at - total, settings?.numberStyle)} aura to go
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
        <p className="mr-1 text-sm font-semibold text-ink-muted">After that</p>
        {next.slice(1, 3).map((u) => (
          <div key={u.id} className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-sunk" title="A surprise">
            <ItemThumb id={u.id} size={40} silhouette />
          </div>
        ))}
        {next.length > 3 && (
          <div className="flex h-12 items-center justify-center rounded-xl bg-surface-sunk px-3 font-display text-lg font-semibold text-ink-muted" aria-label={`${next.length - 3} more surprises`}>
            ? <span className="ml-1 text-sm text-ink-muted">×{next.length - 3}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function ItemPopover({
  id,
  rect,
  container,
  record,
  corners,
  decor,
  wide,
  onClose,
}: {
  id: string;
  rect: DOMRect;
  container: HTMLDivElement | null;
  record?: GardenItemRecord;
  corners: CornerSpec[];
  decor: boolean;
  wide: boolean;
  onClose: () => void;
}) {
  const box = container?.getBoundingClientRect();
  const corner = corners.find((c) => c.key === id);
  const unlock = unlockById(id);
  const left = box ? Math.min(box.width - 250, Math.max(10, rect.left - box.left + rect.width / 2 - 120)) : 10;
  const top = box ? Math.max(10, rect.top - box.top - 10) : 10;
  const canMove = DECOR_ITEMS.has(id);
  const spots = DECOR_SPOTS[wide ? "wide" : "tall"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="absolute z-10 w-60 -translate-y-full rounded-2xl bg-surface p-3.5 shadow-[var(--shadow-lift)] ring-1 ring-line"
      style={{ left, top }}
      role="dialog"
      aria-label={corner?.name ?? unlock?.name ?? id}
    >
      <button onClick={onClose} className="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunk" aria-label="Close">
        <X size={16} />
      </button>
      <p className="pr-6 font-display text-[17px] font-semibold leading-tight">{corner?.name ?? unlock?.name ?? "Oscar's garden"}</p>
      {corner ? (
        <p className="mt-1 text-sm text-ink-muted">
          Grows with project aura: {CORNER_STAGES.map((s) => formatAura(s)).join(" · ")}
        </p>
      ) : (
        record && (
          <p className="mt-1 text-sm text-ink-muted">
            Unlocked {new Date(record.unlockedAt).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
            {unlock && unlock.at > 0 ? ` · took ${formatAura(unlock.at)} aura` : ""}
          </p>
        )
      )}
      {unlock?.blurb && <p className="mt-1.5 text-[14px]">{unlock.blurb}</p>}
      {decor && record && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="soft" onClick={() => { void patch("garden_items", record.id, { hidden: true }); onClose(); }}>
            <EyeOff size={15} /> Hide
          </Button>
          {canMove && (
            <Button
              size="sm"
              variant="soft"
              onClick={() => {
                const cur = record.slot?.startsWith("spot-") ? Number(record.slot.slice(5)) : -1;
                const nextSpot = cur + 1 >= spots.length ? null : `spot-${cur + 1}`;
                void patch("garden_items", record.id, { slot: nextSpot });
              }}
            >
              <Move size={15} /> Move
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function HiddenItems({ records }: { records: GardenItemRecord[] }) {
  const hidden = records.filter((r) => r.hidden);
  if (!hidden.length) return null;
  return (
    <section className="card p-4">
      <p className="mb-2 font-semibold">Hidden</p>
      <div className="flex flex-wrap gap-2">
        {hidden.map((r) => (
          <Button key={r.id} size="sm" variant="outline" onClick={() => patch("garden_items", r.id, { hidden: false })}>
            <Eye size={15} /> {unlockById(r.itemId)?.name ?? r.itemId}
          </Button>
        ))}
      </div>
    </section>
  );
}
