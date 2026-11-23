/**
 * Realm 1, the Home Garden (brief 9.2). Each item is drawn around (0, 0) =
 * the centre of its base on the ground. See docs/ART_STYLE.md.
 */
import type { Season } from "@/lib/day";

export interface ArtProps {
  night?: boolean;
  season?: Season;
  t?: number;
  variant?: string | null;
}

const SHADOW = "rgba(46,42,38,0.13)";

export function Shadow({ rx, ry = rx * 0.22, dx = 6 }: { rx: number; ry?: number; dx?: number }) {
  return <ellipse cx={dx} cy={2} rx={rx} ry={ry} fill={SHADOW} />;
}

/* ------------------------------------------------------------------ */
/* Flowers and small plants                                             */
/* ------------------------------------------------------------------ */

export function Daisy({ x = 0, y = 0, s = 1, petal = "#FFFDF7", centre = "#F4C443", nod = 0 }: { x?: number; y?: number; s?: number; petal?: string; centre?: string; nod?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0c1-10 0-18-2-26" stroke="#5F9A55" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M-1-8c-6-4-10-2-11 1 4 2 8 2 11-1z" fill="#7DB46E" />
      <g className="sway-nod" style={{ transformOrigin: "-2px -26px", animationDelay: `${nod}s` }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <ellipse key={i} cx={-2} cy={-33} rx="2.6" ry="6.4" fill={petal} transform={`rotate(${i * 36} -2 -26)`} />
        ))}
        <circle cx="-2" cy="-26" r="3.8" fill={centre} />
        <circle cx="-3" cy="-27" r="1.4" fill="#FCE3A1" />
      </g>
    </g>
  );
}

export function DaisyPatch(_: ArtProps) {
  return (
    <g>
      <Shadow rx={34} />
      <ellipse cx="0" cy="0" rx="34" ry="8" fill="#93C47C" />
      <Daisy x={-14} y={0} s={1.1} nod={0.2} />
      <Daisy x={10} y={2} s={0.9} nod={0.9} />
      <Daisy x={-1} y={4} s={0.75} nod={1.6} />
    </g>
  );
}

export function Sprout(_: ArtProps) {
  return (
    <g>
      <ellipse cx="0" cy="1" rx="14" ry="4" fill="#8A6242" opacity=".35" />
      <g className="sway" style={{ transformOrigin: "0 0" }}>
        <path d="M0 0c0-8 0-14 1-20" stroke="#5F9A55" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M1-14c-8-8-17-6-19-3 5 5 12 6 19 3z" fill="#7DB46E" />
        <path d="M1-18c5-9 14-10 17-6-4 6-11 8-17 6z" fill="#9ACB7F" />
      </g>
    </g>
  );
}

export function Tulip({ x = 0, s = 1, color = "#F28AA5", d = 0 }: { x?: number; s?: number; color?: string; d?: number }) {
  return (
    <g transform={`translate(${x} 0) scale(${s})`}>
      <path d="M0 0c0-12 1-22 0-34" stroke="#5F9A55" strokeWidth="2.6" fill="none" />
      <path d="M0-6c-9-6-12-16-10-24 6 4 9 12 10 24z" fill="#7DB46E" />
      <g className="sway-nod" style={{ transformOrigin: "0 -34px", animationDelay: `${d}s` }}>
        <path d="M-8-44c0 8 3 12 8 12s8-4 8-12c-3 3-5 3-8-2-3 5-5 5-8 2z" fill={color} />
        <path d="M0-46c-3 4-3 10 0 14 3-4 3-10 0-14z" fill={shade(color, -0.12)} />
        <path d="M-6-42c1 4 3 6 5 7" stroke="#fff" strokeOpacity=".35" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}

export function TulipBed({ variant }: ArtProps) {
  const c = variant ?? "#F28AA5";
  return (
    <g>
      <Shadow rx={62} ry={12} />
      <path d="M-66 0c0-10 30-16 66-16s66 6 66 16-30 14-66 14-66-4-66-14z" fill="#8A6242" />
      <path d="M-62-2c0-8 28-13 62-13s62 5 62 13" fill="#A07250" />
      {[-48, -28, -8, 12, 32, 50].map((x, i) => (
        <Tulip key={x} x={x} s={i % 2 ? 0.95 : 1.08} color={i % 3 === 1 ? shade(c, 0.12) : c} d={i * 0.4} />
      ))}
    </g>
  );
}

export function Sunflower({ x = 0, s = 1, d = 0 }: { x?: number; s?: number; d?: number }) {
  return (
    <g transform={`translate(${x} 0) scale(${s})`}>
      <path d="M0 0c2-40 0-80-4-118" stroke="#5F9A55" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M0-40c-16-10-28-6-32 0 10 6 22 6 32 0zM-2-70c14-12 28-10 32-4-10 8-22 8-32 4z" fill="#6FA864" />
      <g className="sway-nod" style={{ transformOrigin: "-4px -118px", animationDelay: `${d}s` }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <ellipse key={i} cx="-4" cy="-138" rx="5" ry="14" fill={i % 2 ? "#F4C443" : "#F7D265"} transform={`rotate(${i * 22.5} -4 -118)`} />
        ))}
        <circle cx="-4" cy="-118" r="13" fill="#7A4E2D" />
        <circle cx="-7" cy="-121" r="5" fill="#8E5E37" />
      </g>
    </g>
  );
}

export function Sunflowers(_: ArtProps) {
  return (
    <g>
      <Shadow rx={50} />
      <Sunflower x={-28} s={0.95} d={0.3} />
      <Sunflower x={4} s={1.15} d={1.1} />
      <Sunflower x={32} s={0.85} d={1.8} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Oscar's homes                                                         */
/* ------------------------------------------------------------------ */

export function CardboardBox({ season }: ArtProps) {
  return (
    <g>
      <Shadow rx={56} ry={10} />
      <path d="M-50 0v-56h100V0z" fill="#D8A86E" />
      <path d="M10-56h40V0H10z" fill="#C4925A" />
      {/* flaps */}
      <path d="M-50-56l-14-20 52 2 2 18z" fill="#E4B880" />
      <path d="M50-56l16-16-48-4-8 20z" fill="#C99760" />
      <path d="M-20-56h40" stroke="#B8854F" strokeWidth="3" />
      {/* door cut-out */}
      <path d="M-22 0v-26a14 14 0 0128 0V0z" fill="#5C3F28" />
      <path d="M-30-40h22" stroke="#B07A45" strokeWidth="2" strokeDasharray="4 4" />
      <text x="16" y="-26" fontSize="10" fontWeight="700" fill="#9A6B3B" fontFamily="var(--font-caveat), cursive" transform="rotate(-6 16 -26)">
        Oscar
      </text>
      {season === "winter" && <Wreath x={-8} y={-30} s={0.7} />}
    </g>
  );
}

export function Hut({ season, night }: ArtProps) {
  return (
    <g>
      <Shadow rx={84} ry={13} />
      <rect x="-70" y="-84" width="140" height="84" rx="8" fill="#C99A6B" />
      <rect x="20" y="-84" width="50" height="84" fill="#B5885B" />
      {[-72, -58, -44, -30, -16].map((y) => (
        <path key={y} d={`M-70 ${y}h140`} stroke="#A87B52" strokeWidth="1.6" opacity=".55" />
      ))}
      {/* roof */}
      <path d="M-86-80L0-138l86 58c4 3 2 8-3 8H-83c-5 0-7-5-3-8z" fill="#8A6242" />
      <path d="M0-138l86 58c4 3 2 8-3 8H0z" fill="#74513A" />
      <path d="M-64-92l12-8M-40-108l12-8M20-118l12 8M44-102l12 8" stroke="#A07250" strokeWidth="3" strokeLinecap="round" />
      {/* round door */}
      <circle cx="-10" cy="-30" r="30" fill="#5C8C5B" />
      <path d="M-40 0v-30a30 30 0 0160 0V0z" fill="#4E7A55" />
      <path d="M-10-60v60" stroke="#3F6449" strokeWidth="2" />
      <circle cx="6" cy="-26" r="3.2" fill="#F4C443" />
      {/* window */}
      <circle cx="44" cy="-50" r="13" fill={night ? "#FFD889" : "#BFE3EE"} />
      <path d="M44-63v26M31-50h26" stroke="#8A6242" strokeWidth="3" />
      {night && <circle cx="44" cy="-50" r="26" fill="#FFD36E" opacity=".25" />}
      {season === "winter" && <Wreath x={-10} y={-46} s={0.9} />}
    </g>
  );
}

export function Cottage({ season, night }: ArtProps) {
  return (
    <g>
      <Shadow rx={120} ry={15} />
      {/* porch deck */}
      <path d="M-120 0h240v-12H-120z" fill="#A87B52" />
      <rect x="-100" y="-118" width="200" height="106" rx="6" fill="#F3E6CF" />
      <rect x="40" y="-118" width="60" height="106" fill="#E4D3B5" />
      {/* roof */}
      <path d="M-122-112L0-176l122 64c5 3 3 9-3 9h-238c-6 0-8-6-3-9z" fill="#C76A58" />
      <path d="M0-176l122 64c5 3 3 9-3 9H0z" fill="#AE5848" />
      <rect x="54" y="-178" width="20" height="40" fill="#B9A58C" />
      <path d="M54-178h20" stroke="#8A7A66" strokeWidth="4" />
      {/* door */}
      <rect x="-20" y="-76" width="40" height="64" rx="20" fill="#4E7A8C" />
      <circle cx="12" cy="-42" r="3" fill="#F4C443" />
      {/* windows with window box */}
      {[-68, 52].map((x) => (
        <g key={x}>
          <rect x={x} y="-92" width="34" height="32" rx="5" fill={night ? "#FFD889" : "#BFE3EE"} />
          <path d={`M${x + 17}-92v32M${x}-76h34`} stroke="#FFFFFF" strokeWidth="2.6" />
          <rect x={x - 4} y="-60" width="42" height="9" rx="3" fill="#8A6242" />
          {[0, 9, 18, 27, 36].map((dx, i) => (
            <circle key={dx} cx={x - 1 + dx} cy="-63" r="4.2" fill={["#F2A3B5", "#F4C443", "#FFFDF7", "#EE8A6B", "#F2A3B5"][i]} />
          ))}
          {night && <rect x={x - 10} y="-98" width="54" height="44" rx="12" fill="#FFD36E" opacity=".22" />}
        </g>
      ))}
      {/* porch posts and canopy */}
      <path d="M-110-12v-58M110-12v-58" stroke="#8A6242" strokeWidth="6" strokeLinecap="round" />
      <path d="M-118-74h236l-12-14h-212z" fill="#7A9F7A" />
      {season === "winter" && <Wreath x={0} y={-58} s={0.8} />}
    </g>
  );
}

export function ShellVilla({ season, night }: ArtProps) {
  return (
    <g>
      <Shadow rx={150} ry={16} />
      {/* hot tub */}
      <g transform="translate(118 0)">
        <ellipse cx="0" cy="-10" rx="44" ry="16" fill="#A87B52" />
        <ellipse cx="0" cy="-16" rx="38" ry="11" fill="#8FD3D1" />
        <path d="M-20-30c3-6-3-10 0-16M0-32c3-6-3-10 0-16M20-30c3-6-3-10 0-16" stroke="#FFFFFF" strokeOpacity=".7" strokeWidth="2" fill="none" className="steam" />
      </g>
      {/* spiral shell house */}
      <path d="M-120 0c-8-90 40-170 120-170 70 0 110 50 110 100 0 40-30 70-70 70" fill="#F6E3CF" />
      <path d="M-120 0c-8-90 40-170 120-170 70 0 110 50 110 100 0 40-30 70-70 70z" fill="#F1D8BF" />
      <path d="M40 0c20 0 40-16 40-40 0-34-28-60-70-60-50 0-84 40-84 100" fill="none" stroke="#E3BFA0" strokeWidth="10" strokeLinecap="round" />
      <path d="M10-40c-18 0-30 14-30 30" fill="none" stroke="#E3BFA0" strokeWidth="9" strokeLinecap="round" />
      <path d="M-70-120c20-26 60-36 92-24" stroke="#FFF7EC" strokeWidth="8" strokeLinecap="round" fill="none" opacity=".8" />
      {/* door and porthole windows */}
      <rect x="-64" y="-64" width="40" height="64" rx="20" fill="#5FA8C2" />
      <circle cx="-30" cy="-34" r="3" fill="#F4C443" />
      {[[-10, -110], [44, -120], [70, -80]].map(([x, y]) => (
        <g key={`${x}`}>
          <circle cx={x} cy={y} r="14" fill={night ? "#FFD889" : "#BFE3EE"} />
          <circle cx={x} cy={y} r="14" fill="none" stroke="#E3BFA0" strokeWidth="4" />
          {night && <circle cx={x} cy={y} r="26" fill="#FFD36E" opacity=".22" />}
        </g>
      ))}
      {season === "winter" && <Wreath x={-44} y={-48} s={0.8} />}
    </g>
  );
}

export function Wreath({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r="13" fill="none" stroke="#3F7A4D" strokeWidth="7" />
      {Array.from({ length: 8 }).map((_, i) => (
        <circle key={i} cx={13 * Math.cos((i * Math.PI) / 4)} cy={13 * Math.sin((i * Math.PI) / 4)} r="2.4" fill={i % 2 ? "#D9575B" : "#5E9A63"} />
      ))}
      <path d="M-5 11l5-5 5 5-5 6z" fill="#D9575B" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Trees                                                                */
/* ------------------------------------------------------------------ */

export function Canopy({ r, colors, seed = 1 }: { r: number; colors: [string, string, string]; seed?: number }) {
  const blobs = [
    [0, -r * 0.2, r * 0.82],
    [-r * 0.55, 0, r * 0.62],
    [r * 0.55, r * 0.05, r * 0.6],
    [-r * 0.2, -r * 0.62, r * 0.6],
    [r * 0.3, -r * 0.55, r * 0.55],
  ];
  return (
    <g>
      {blobs.map(([x, y, rr], i) => (
        <circle key={i} cx={x} cy={y + r * 0.12} r={rr} fill={colors[1]} />
      ))}
      {blobs.map(([x, y, rr], i) => (
        <circle key={`h${i}`} cx={x - rr * 0.12} cy={y - rr * 0.08} r={rr * 0.86} fill={colors[0]} />
      ))}
      <circle cx={-r * 0.35} cy={-r * 0.55} r={r * 0.32} fill={colors[2]} opacity=".55" />
      <circle cx={r * 0.1 * seed} cy={-r * 0.1} r={r * 0.18} fill={colors[2]} opacity=".35" />
    </g>
  );
}

export function AppleTree({ t = 0, season }: ArtProps) {
  // Grows with her aura: t from 0 (sapling) to 1 (full tree).
  const s = 0.38 + 0.62 * Math.min(1, Math.max(0, t));
  const leaf = seasonLeaves(season);
  return (
    <g>
      <Shadow rx={70 * s + 20} ry={12} dx={14} />
      <g transform={`scale(${s})`}>
        <path d="M-10 0c4-50 2-90-6-130h28c-6 40-8 80-4 130z" fill="#8A6242" />
        <path d="M2 0c2-50 2-90 10-130h0c-6 40-8 80-4 130z" fill="#74513A" />
        <path d="M-2-90c-20-12-30-26-34-40M6-100c18-10 28-22 30-36" stroke="#8A6242" strokeWidth="9" strokeLinecap="round" fill="none" />
        <g className="sway-tree" style={{ transformOrigin: "0px -120px" }}>
          <g transform="translate(0 -170)">
            <Canopy r={92} colors={leaf} />
            {season !== "winter" &&
              t > 0.25 &&
              [[-50, -10], [30, -40], [56, 20], [-20, 30], [-60, 40], [10, 10], [40, 56]].slice(0, Math.ceil(3 + t * 4)).map(([x, y], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="8.5" fill={season === "spring" ? "#FFFFFF" : "#D9575B"} />
                  <circle cx={x - 3} cy={y - 3} r="2.6" fill="#fff" opacity=".6" />
                </g>
              ))}
          </g>
        </g>
      </g>
    </g>
  );
}

export function Tree({ season, blossom = false }: ArtProps & { blossom?: boolean }) {
  const leaf: [string, string, string] = blossom
    ? season === "winter"
      ? ["#D8C7CF", "#C2AFB8", "#EFE4EA"]
      : ["#F7C6D3", "#EDA6BB", "#FFE6EE"]
    : seasonLeaves(season);
  return (
    <g>
      <Shadow rx={80} ry={12} dx={14} />
      <path d="M-11 0c4-50 2-90-6-140h30c-6 40-8 80-4 140z" fill={blossom ? "#6E4A3A" : "#8A6242"} />
      <path d="M2 0c2-50 2-90 12-140c-6 40-8 80-4 140z" fill={blossom ? "#5C3D30" : "#74513A"} />
      <path d="M-4-96c-24-12-36-30-40-46M8-106c20-12 30-26 32-42" stroke={blossom ? "#6E4A3A" : "#8A6242"} strokeWidth="10" strokeLinecap="round" fill="none" />
      <g className="sway-tree" style={{ transformOrigin: "0px -130px" }}>
        <g transform="translate(0 -184)">
          <Canopy r={98} colors={leaf} seed={-1} />
        </g>
      </g>
      {blossom && season !== "winter" && (
        <g className="petals-fall">
          {[[-60, -60], [20, -30], [70, -80], [-20, -10]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="4" ry="2.6" fill="#F7C6D3" />
          ))}
        </g>
      )}
    </g>
  );
}

export function CherryTree(p: ArtProps) {
  return <Tree {...p} blossom />;
}

function seasonLeaves(season?: Season): [string, string, string] {
  switch (season) {
    case "autumn":
      return ["#E3A04A", "#C9783A", "#F4C97A"];
    case "winter":
      return ["#9BB59A", "#7F9A80", "#E8F0EC"];
    case "spring":
      return ["#9ACB7F", "#78AE68", "#D7EFC0"];
    default:
      return ["#7DB46E", "#5F9A55", "#B9DE9E"];
  }
}

export function TreeWithHammock(p: ArtProps) {
  return (
    <g>
      <Tree {...p} />
      {/* the hammock hangs towards the apple tree on the left */}
      <path d="M-6-96C-60-40-140-40-206-80" stroke="#C99A6B" strokeWidth="2" fill="none" />
      <path d="M-30-74c-40 40-110 40-150 0 30 18 120 18 150 0z" fill="#F2A3B5" />
      <path d="M-40-70c-40 30-90 30-130 2" stroke="#fff" strokeWidth="3" strokeDasharray="8 8" fill="none" opacity=".6" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Ground pieces                                                         */
/* ------------------------------------------------------------------ */

export function SteppingStones({ points }: { points: [number, number, number][] }) {
  return (
    <g>
      {points.map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <ellipse cx="2" cy="3" rx="26" ry="10" fill="rgba(46,42,38,0.12)" />
          <ellipse cx="0" cy="0" rx="26" ry="10" fill="#D9D2C5" />
          <ellipse cx="-4" cy="-2" rx="17" ry="5.5" fill="#E8E2D7" />
        </g>
      ))}
    </g>
  );
}

export function Pond({ night }: ArtProps) {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="118" ry="40" fill="#B9B1A2" />
      <ellipse cx="0" cy="-2" rx="110" ry="35" fill="#6FB5C8" />
      <ellipse cx="-6" cy="-6" rx="98" ry="28" fill={night ? "#3D6B87" : "#9ED3E0"} />
      <g className="shimmer">
        <path d="M-60-12h30M10-20h40M-20 6h26M40 4h22" stroke="#FFFFFF" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" />
      </g>
      {[[-50, 2, 1], [44, -8, 0.8], [10, 12, 0.7]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M0 0a16 8 0 1 0 1 0l-1 0 8-4z" fill="#6FA864" />
          <ellipse cx="0" cy="0" rx="16" ry="7" fill="#7DB46E" />
          <path d="M0 0l14-4" stroke="#6FB5C8" strokeWidth="3" />
          {i === 0 && (
            <g transform="translate(-2 -6)">
              {Array.from({ length: 6 }).map((_, k) => (
                <ellipse key={k} cx="0" cy="-4" rx="2.6" ry="5" fill="#F7C6D3" transform={`rotate(${k * 60})`} />
              ))}
              <circle r="2.4" fill="#F4C443" />
            </g>
          )}
        </g>
      ))}
      {/* reeds */}
      {[-104, -96, 96, 104].map((x, i) => (
        <path key={x} d={`M${x} -4c${i % 2 ? 4 : -4}-20 0-40 ${i % 2 ? 6 : -6}-56`} stroke="#5F9A55" strokeWidth="3" fill="none" className="sway" style={{ transformOrigin: `${x}px -4px` }} />
      ))}
      <ellipse cx="-100" cy="-58" rx="3.6" ry="10" fill="#8A6242" />
      <ellipse cx="106" cy="-58" rx="3.6" ry="10" fill="#8A6242" />
    </g>
  );
}

export function BenchFeeder(_: ArtProps) {
  return (
    <g>
      <Shadow rx={74} ry={10} />
      {/* bench */}
      <g transform="translate(-24 0)">
        <rect x="-48" y="-30" width="96" height="9" rx="3" fill="#B5885B" />
        <rect x="-48" y="-52" width="96" height="8" rx="3" fill="#C99A6B" />
        <rect x="-48" y="-40" width="96" height="7" rx="3" fill="#C99A6B" />
        <path d="M-40-21V0M40-21V0M-40-52v-6M40-52v-6" stroke="#74513A" strokeWidth="6" strokeLinecap="round" />
      </g>
      {/* bird feeder on a pole, with a robin */}
      <g transform="translate(56 0)">
        <path d="M0 0v-96" stroke="#74513A" strokeWidth="5" />
        <path d="M-20-96h40l-6 14h-28z" fill="#C99A6B" />
        <path d="M-24-96l24-16 24 16z" fill="#C76A58" />
        <rect x="-12" y="-82" width="24" height="4" fill="#E9C48C" />
        <g transform="translate(14 -78)" className="robin">
          <ellipse cx="0" cy="0" rx="9" ry="7" fill="#7A5A44" />
          <ellipse cx="-3" cy="2" rx="5.5" ry="4.5" fill="#E0703F" />
          <circle cx="-6" cy="-5" r="5" fill="#7A5A44" />
          <circle cx="-7.4" cy="-6" r="1.2" fill="#1F1D1B" />
          <path d="M-11-5l-4 1 4 1" fill="#E3A04A" />
          <path d="M8 0l6-3" stroke="#5C4330" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
}

export function FairyLights({ night, width = 600 }: ArtProps & { width?: number }) {
  const n = 18;
  const pts = Array.from({ length: n }, (_, i) => {
    const x = -width / 2 + (width * i) / (n - 1);
    const sag = 18 * Math.sin((Math.PI * ((i % 6) / 5)) || 0);
    return [x, sag] as const;
  });
  const path = `M${pts.map(([x, y]) => `${x} ${y}`).join(" L")}`;
  return (
    <g>
      <path d={path} stroke="#4A3F35" strokeWidth="1.6" fill="none" opacity=".7" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          {night && <circle cx={x} cy={y + 7} r="12" fill="#FFD36E" opacity=".28" className="twinkle" style={{ animationDelay: `${i * 0.23}s` }} />}
          <ellipse cx={x} cy={y + 7} rx="3.6" ry="5" fill={night ? "#FFE7A3" : ["#F7D265", "#F2A3B5", "#B9DE9E", "#9CC9FF"][i % 4]} />
        </g>
      ))}
    </g>
  );
}

export function Lantern({ night }: ArtProps) {
  return (
    <g>
      <path d="M0 0v-80" stroke="#4A3F35" strokeWidth="4" />
      <path d="M0-80c10 0 14 4 14 8" stroke="#4A3F35" strokeWidth="3" fill="none" />
      <g transform="translate(14 -64)">
        {night && <circle cx="0" cy="8" r="26" fill="#FFD36E" opacity=".3" className="twinkle" />}
        <path d="M-9 0h18l-3 22h-12z" fill={night ? "#FFE7A3" : "#F6E7C1"} />
        <path d="M-11 0h22M-8 22h16" stroke="#4A3F35" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
  );
}

export function Pool(_: ArtProps) {
  return (
    <g>
      <rect x="-130" y="-46" width="260" height="92" rx="30" fill="#E8E2D7" />
      <rect x="-116" y="-36" width="232" height="72" rx="24" fill="#5FB3CF" />
      <rect x="-108" y="-30" width="216" height="60" rx="20" fill="#8FD3E6" />
      <g className="shimmer">
        <path d="M-80-10c20-6 40 6 60 0M10 8c20-6 40 6 60 0M-60 18c14-4 28 4 42 0" stroke="#FFFFFF" strokeOpacity=".75" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      {/* float ring for Oscar */}
      <g transform="translate(54 -4)" className="bob">
        <ellipse cx="0" cy="0" rx="26" ry="11" fill="#FF8FA3" />
        <ellipse cx="0" cy="-1" rx="13" ry="5" fill="#8FD3E6" />
        <path d="M-24-4a26 11 0 0 1 10-6M14-10a26 11 0 0 1 10 6M-2 10a26 11 0 0 1 10 0" stroke="#FFFFFF" strokeWidth="5" fill="none" />
      </g>
      {/* ladder */}
      <path d="M-100-40v-22M-86-40v-22" stroke="#BFC6CC" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

export function Fountain(_: ArtProps) {
  return (
    <g>
      <Shadow rx={64} ry={12} />
      <ellipse cx="0" cy="-6" rx="64" ry="20" fill="#BDB4A5" />
      <ellipse cx="0" cy="-12" rx="56" ry="15" fill="#8FD3E6" />
      <rect x="-10" y="-70" width="20" height="58" rx="6" fill="#D9D2C5" />
      <ellipse cx="0" cy="-70" rx="30" ry="9" fill="#D9D2C5" />
      <ellipse cx="0" cy="-73" rx="24" ry="6" fill="#8FD3E6" />
      <g className="fountain-spray">
        <path d="M0-74c0-20 0-30 0-34M0-104c-10 6-20 22-24 34M0-104c10 6 20 22 24 34" stroke="#BFE7F2" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="-24" cy="-66" r="2.4" fill="#BFE7F2" />
        <circle cx="24" cy="-66" r="2.4" fill="#BFE7F2" />
      </g>
    </g>
  );
}

export function Greenhouse(_: ArtProps) {
  return (
    <g>
      <Shadow rx={110} ry={14} />
      <path d="M-100 0v-90h200V0z" fill="#D7EFE9" opacity=".85" />
      <path d="M-110-86L0-150l110 64z" fill="#C3E5DD" opacity=".9" />
      <path d="M-100 0v-90M-50 0v-90M0 0v-150M50 0v-90M100 0v-90M-100-45h200M-110-86h220M-55-118L0-86M55-118L0-86" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M-100 0v-90M100 0v-90" stroke="#E8F2EF" strokeWidth="6" />
      {/* plants inside */}
      {[-76, -30, 20, 66].map((x, i) => (
        <g key={x} transform={`translate(${x} -12)`}>
          <rect x="-12" y="-10" width="24" height="12" rx="3" fill="#C76A58" />
          <circle cx="-4" cy="-18" r="10" fill={i % 2 ? "#7DB46E" : "#9ACB7F"} />
          <circle cx="6" cy="-22" r="8" fill="#6FA864" />
          {i === 1 && <circle cx="2" cy="-16" r="3.4" fill="#D9575B" />}
        </g>
      ))}
      <path d="M-70-140l40 30" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" opacity=".55" />
    </g>
  );
}

export function WishingWell(_: ArtProps) {
  return (
    <g>
      <Shadow rx={56} ry={10} />
      <path d="M-46 0v-44h92V0z" fill="#BDB4A5" />
      {[-34, -18, -2, 14, 30].map((x, i) => (
        <rect key={x} x={x - 8} y={i % 2 ? -42 : -22} width="16" height="16" rx="4" fill="#D9D2C5" />
      ))}
      <ellipse cx="0" cy="-44" rx="48" ry="11" fill="#8A7F70" />
      <ellipse cx="0" cy="-44" rx="38" ry="7" fill="#3D6B87" />
      <path d="M-40-44v-70M40-44v-70" stroke="#8A6242" strokeWidth="7" />
      <path d="M-58-108L0-144l58 36z" fill="#C76A58" />
      <path d="M0-144l58 36H0z" fill="#AE5848" />
      <path d="M-40-96h80" stroke="#74513A" strokeWidth="5" />
      <path d="M0-96v26" stroke="#4A3F35" strokeWidth="1.6" />
      <rect x="-8" y="-70" width="16" height="12" rx="3" fill="#A87B52" />
    </g>
  );
}

export function Gazebo(_: ArtProps) {
  return (
    <g>
      <Shadow rx={110} ry={16} />
      <ellipse cx="0" cy="-4" rx="100" ry="18" fill="#E8E2D7" />
      {[-84, -42, 0, 42, 84].map((x) => (
        <rect key={x} x={x - 5} y="-130" width="10" height="126" rx="4" fill="#FFFDF7" />
      ))}
      <path d="M-106-130L0-196l106 66z" fill="#FFFDF7" />
      <path d="M0-196l106 66H0z" fill="#EFE8DA" />
      <circle cx="0" cy="-200" r="7" fill="#E7B53C" />
      <path d="M-100-128c30 12 70 12 100 0s70-12 100 0" stroke="#EFE8DA" strokeWidth="6" fill="none" />
      {/* climbing roses */}
      {[-84, 84, -42].map((x, j) =>
        Array.from({ length: 7 }).map((_, i) => (
          <g key={`${x}-${i}`}>
            <circle cx={x + (i % 2 ? 7 : -7)} cy={-12 - i * 17} r="7" fill="#6FA864" />
            {i % 2 === j % 2 && <circle cx={x + (i % 2 ? 9 : -9)} cy={-16 - i * 17} r="5" fill="#E46A7E" />}
          </g>
        )),
      )}
      {Array.from({ length: 9 }).map((_, i) => (
        <circle key={i} cx={-90 + i * 22} cy={-136 + (i % 2) * 6} r="6" fill={i % 3 ? "#E46A7E" : "#F2A3B5"} />
      ))}
    </g>
  );
}

export function Gate({ open = true }: ArtProps & { open?: boolean }) {
  return (
    <g>
      <rect x="-60" y="-110" width="16" height="110" rx="4" fill="#8A6242" />
      <rect x="44" y="-110" width="16" height="110" rx="4" fill="#8A6242" />
      <path d="M-62-112c20-40 104-40 124 0" stroke="#6E9E6B" strokeWidth="14" fill="none" strokeLinecap="round" />
      {[-50, -24, 4, 30, 50].map((x, i) => (
        <circle key={x} cx={x} cy={-132 - (i === 2 ? 8 : 0)} r="6" fill={["#F2A3B5", "#FFFDF7", "#F4C443", "#FFFDF7", "#F2A3B5"][i]} />
      ))}
      <g transform={open ? "translate(-44 0) skewY(-12) scale(0.45 1)" : "translate(-44 0)"}>
        {[4, 22, 40, 58, 76].map((x) => (
          <rect key={x} x={x} y="-92" width="12" height="88" rx="5" fill="#C99A6B" />
        ))}
        <rect x="0" y="-70" width="88" height="8" fill="#A87B52" />
        <rect x="0" y="-28" width="88" height="8" fill="#A87B52" />
      </g>
      {/* the path beyond */}
      {open && <path d="M-28 0c4-20 30-40 56-50h8c-20 10-34 30-30 50z" fill="#E8DFC9" opacity=".9" />}
    </g>
  );
}

export function Butterfly({ color = "#F2A3B5", s = 1 }: { color?: string; s?: number }) {
  return (
    <g transform={`scale(${s})`}>
      <g className="flap">
        <path d="M0 0c-10-14-22-14-22-4 0 8 10 10 22 4z" fill={color} />
        <path d="M0 0c-8 8-16 12-18 6s8-8 18-6z" fill={shade(color, -0.1)} />
      </g>
      <g className="flap-r">
        <path d="M0 0c10-14 22-14 22-4 0 8-10 10-22 4z" fill={color} />
        <path d="M0 0c8 8 16 12 18 6s-8-8-18-6z" fill={shade(color, -0.1)} />
      </g>
      <rect x="-1.5" y="-7" width="3" height="14" rx="1.5" fill="#4A3F35" />
    </g>
  );
}

export function Butterflies(_: ArtProps) {
  return (
    <g>
      <g className="drift-a">
        <Butterfly color="#F2A3B5" s={1} />
      </g>
      <g className="drift-b">
        <Butterfly color="#F7D265" s={0.8} />
      </g>
      <g className="drift-c">
        <Butterfly color="#B79CF2" s={0.7} />
      </g>
    </g>
  );
}

export function Balloon(_: ArtProps) {
  return (
    <g className="balloon">
      <path d="M0 0c-36-6-52-40-52-64 0-30 24-50 52-50s52 20 52 50c0 24-16 58-52 64z" fill="#F2A3B5" />
      <path d="M0 0c-14-6-20-40-20-64 0-30 10-50 20-50s20 20 20 50c0 24-6 58-20 64z" fill="#FFD36E" />
      <path d="M-52-64h104" stroke="#B79CF2" strokeWidth="10" opacity=".7" />
      <path d="M-14 6L-10 22M14 6L10 22" stroke="#4A3F35" strokeWidth="1.6" />
      <rect x="-12" y="22" width="24" height="16" rx="4" fill="#A87B52" />
    </g>
  );
}

/** Lighten (amt > 0) or darken (amt < 0) a hex colour. */
export function shade(hex: string, amt: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt)));
  return `#${ch.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("")}`;
}
