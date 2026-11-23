import {
  AppleTree, Balloon, BenchFeeder, Butterflies, CardboardBox, CherryTree, Cottage, DaisyPatch, FairyLights, Fountain, Gate,
  Gazebo, Greenhouse, Hut, Pond, Pool, ShellVilla, Sprout, SteppingStones, Sunflowers, TreeWithHammock, TulipBed, WishingWell,
} from "./art/home";
import { Sprout as SproutIcon, Sparkles } from "lucide-react";

const ART: Record<string, { node: React.ReactNode; box: string }> = {
  grass: { node: <CardboardBox />, box: "-80 -100 160 120" },
  daisy: { node: <DaisyPatch />, box: "-50 -50 100 60" },
  sun: {
    node: (
      <g>
        <circle r="60" fill="#FFE38A" opacity=".35" />
        <circle r="34" fill="#FFE38A" />
      </g>
    ),
    box: "-70 -70 140 140",
  },
  tulips: { node: <TulipBed />, box: "-80 -70 160 90" },
  path: { node: <SteppingStones points={[[-40, 10, 1], [10, -10, 0.85], [50, -26, 0.7]]} />, box: "-80 -50 160 80" },
  hut: { node: <Hut />, box: "-100 -150 200 170" },
  butterflies: { node: <Butterflies />, box: "-40 -60 180 110" },
  "apple-tree": { node: <AppleTree t={0.2} />, box: "-90 -170 180 180" },
  pond: { node: <Pond />, box: "-130 -80 260 130" },
  bench: { node: <BenchFeeder />, box: "-90 -120 180 130" },
  sunflowers: { node: <Sunflowers />, box: "-70 -170 140 180" },
  hammock: { node: <TreeWithHammock />, box: "-230 -300 360 310" },
  cottage: { node: <Cottage />, box: "-140 -190 280 210" },
  lights: { node: <FairyLights night width={240} />, box: "-130 -30 260 70" },
  pool: { node: <Pool />, box: "-140 -70 280 130" },
  cherry: { node: <CherryTree />, box: "-120 -300 240 310" },
  villa: { node: <ShellVilla />, box: "-140 -190 320 210" },
  fountain: { node: <Fountain />, box: "-75 -120 150 130" },
  greenhouse: { node: <Greenhouse />, box: "-120 -160 240 180" },
  rainbow: { node: <Balloon />, box: "-70 -130 140 180" },
  well: { node: <WishingWell />, box: "-70 -160 140 170" },
  gazebo: { node: <Gazebo />, box: "-120 -215 240 235" },
  gate: { node: <Gate />, box: "-80 -150 160 160" },
};

/** Thumbnail art for a garden unlock, used on reveal cards and the next-up panel. */
export function ItemThumb({ id, size = 64, silhouette = false }: { id: string; size?: number; silhouette?: boolean }) {
  const a = ART[id];
  if (!a) {
    if (id.startsWith("realm-")) return <Sparkles size={size * 0.6} className="text-primary" strokeWidth={1.5} />;
    return <SproutIcon size={size * 0.6} className="text-primary" strokeWidth={1.5} />;
  }
  return (
    <svg viewBox={a.box} width={size} height={size} aria-hidden="true" style={silhouette ? { filter: "brightness(0) opacity(0.22)" } : undefined}>
      {a.node}
    </svg>
  );
}

export { Sprout };
