/**
 * Project corners (brief 9.4): each project grows its own corner of the Home
 * Garden from aura earned in that project alone.
 */
import type { ProjectKind } from "@/lib/types";
import { Shadow, shade } from "./home";

export const CORNER_STAGES = [500, 5_000, 50_000];

export const CORNER_NAMES: Record<ProjectKind, [string, string, string]> = {
  college: ["A stack of books with a tiny graduation cap", "A reading nook with a study lamp", "A little library with a SETU-slate roof"],
  swapnserve: ["A washing line of little clothes", "A clothes-swap rail with hangers", "A sunny yellow swap stall"],
  hurley: ["A hurley and sliotar by the fence", "Two crossed hurleys on the shed wall", "A mini pitch with goalposts"],
  martial: ["A wooden training dummy", "A practice mat with a belt display", "A small dojo with paper lanterns"],
  custom: ["A pennant flag", "A banner with the project's icon", "A little pavilion"],
};

export function cornerStage(aura: number) {
  return CORNER_STAGES.filter((s) => aura >= s).length; // 0..3
}

export function Corner({ kind, stage, color, night }: { kind: ProjectKind; stage: number; color: string; night?: boolean }) {
  if (stage <= 0) return null;
  switch (kind) {
    case "college":
      return stage === 1 ? <Books /> : stage === 2 ? <ReadingNook night={night} /> : <Library night={night} />;
    case "swapnserve":
      return stage === 1 ? <WashingLine /> : stage === 2 ? <SwapRail /> : <SwapStall />;
    case "hurley":
      return stage === 1 ? <HurleyLean /> : stage === 2 ? <CrossedHurleys /> : <MiniPitch />;
    case "martial":
      return stage === 1 ? <Dummy /> : stage === 2 ? <Mat /> : <Dojo night={night} />;
    default:
      return stage === 1 ? <Pennant color={color} /> : stage === 2 ? <Banner color={color} /> : <Pavilion color={color} />;
  }
}

function Books() {
  return (
    <g>
      <Shadow rx={26} />
      <rect x="-22" y="-10" width="44" height="10" rx="2" fill="#445463" />
      <rect x="-19" y="-19" width="38" height="9" rx="2" fill="#C76A58" />
      <rect x="-20" y="-28" width="40" height="9" rx="2" fill="#7A9F7A" />
      <path d="M-12-30h24l-12-6z" fill="#2E3A45" />
      <rect x="-6" y="-31" width="12" height="3" fill="#2E3A45" />
      <path d="M6-33l6 6" stroke="#F4C443" strokeWidth="1.4" />
    </g>
  );
}

function ReadingNook({ night }: { night?: boolean }) {
  return (
    <g>
      <Shadow rx={46} />
      <path d="M-40 0v-30c0-10 6-16 16-16h28c10 0 16 6 16 16V0z" fill="#B07AA1" />
      <rect x="-34" y="-24" width="52" height="16" rx="6" fill="#C996BC" />
      <path d="M34 0v-58" stroke="#4A3F35" strokeWidth="3" />
      <path d="M22-58h24l-6-12h-12z" fill={night ? "#FFE7A3" : "#F6E7C1"} />
      {night && <circle cx="34" cy="-50" r="22" fill="#FFD36E" opacity=".3" />}
      <rect x="-14" y="-30" width="18" height="5" rx="1.5" fill="#445463" />
    </g>
  );
}

function Library({ night }: { night?: boolean }) {
  return (
    <g>
      <Shadow rx={70} ry={12} />
      <rect x="-60" y="-80" width="120" height="80" rx="4" fill="#F3E6CF" />
      <path d="M-70-76L0-120l70 44z" fill="#445463" />
      <path d="M0-120l70 44H0z" fill="#3B4A58" />
      <rect x="-16" y="-48" width="32" height="48" rx="16" fill="#445463" />
      {[-44, 30].map((x) => (
        <g key={x}>
          <rect x={x} y="-62" width="18" height="24" rx="3" fill={night ? "#FFD889" : "#BFE3EE"} />
          {[0, 5, 10].map((d) => (
            <rect key={d} x={x + 2 + d} y="-46" width="4" height="8" fill={["#C76A58", "#7A9F7A", "#F4C443"][d / 5]} />
          ))}
        </g>
      ))}
      <text x="0" y="-86" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFFDF7" fontFamily="var(--font-jakarta), sans-serif">
        LIBRARY
      </text>
    </g>
  );
}

function Tee({ x, y, color }: { x: number; y: number; color: string }) {
  return <path d={`M${x - 9} ${y}l-6 6 4 4 3-2v12h16v-12l3 2 4-4-6-6z`} fill={color} />;
}

function WashingLine() {
  return (
    <g>
      <path d="M-50 0v-54M50 0v-54" stroke="#8A6242" strokeWidth="4" />
      <path d="M-50-50c30 10 70 10 100 0" stroke="#4A3F35" strokeWidth="1.4" fill="none" />
      <g className="sway" style={{ transformOrigin: "0 -46px" }}>
        <Tee x={-28} y={-46} color="#F6C828" />
        <Tee x={2} y={-44} color="#9CC9FF" />
        <path d="M22-46h18l-3 22h-4l-2-14-2 14h-4z" fill="#F2A3B5" />
      </g>
    </g>
  );
}

function SwapRail() {
  return (
    <g>
      <Shadow rx={52} />
      <path d="M-46 0v-70M46 0v-70M-50-70h100" stroke="#BFC6CC" strokeWidth="5" strokeLinecap="round" />
      {[-34, -16, 2, 20, 36].map((x, i) => (
        <g key={x}>
          <path d={`M${x}-70v6`} stroke="#4A3F35" strokeWidth="1.6" />
          <path d={`M${x - 10}-58l10-6 10 6v34h-20z`} fill={["#F6C828", "#F2A3B5", "#9CC9FF", "#7A9F7A", "#C59BF5"][i]} />
        </g>
      ))}
    </g>
  );
}

function SwapStall() {
  return (
    <g>
      <Shadow rx={74} ry={12} />
      <rect x="-64" y="-50" width="128" height="50" rx="4" fill="#C99A6B" />
      <path d="M-64 0v-110M64 0v-110" stroke="#A87B52" strokeWidth="6" />
      <path d="M-74-110h148l-8 22h-132z" fill="#F6C828" />
      {[-60, -36, -12, 12, 36].map((x) => (
        <path key={x} d={`M${x}-88h20l-10 14z`} fill="#FFFDF7" />
      ))}
      {/* smiley sign: a simple original smile, not the logo */}
      <circle cx="0" cy="-128" r="16" fill="#F6C828" />
      <circle cx="-5" cy="-131" r="2" fill="#2E2A26" />
      <circle cx="5" cy="-131" r="2" fill="#2E2A26" />
      <path d="M-7-124c4 5 10 5 14 0" stroke="#2E2A26" strokeWidth="2" fill="none" strokeLinecap="round" />
      {[-44, -20, 4, 28].map((x, i) => (
        <rect key={x} x={x} y="-46" width="18" height="12" rx="3" fill={["#9CC9FF", "#F2A3B5", "#7A9F7A", "#FFFDF7"][i]} />
      ))}
    </g>
  );
}

function Hurley({ x, y, rot, s = 1 }: { x: number; y: number; rot: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x="-2.5" y="-60" width="5" height="52" rx="2.5" fill="#E9C48C" />
      <rect x="-2.5" y="-60" width="5" height="12" rx="2.5" fill="#2F2B27" />
      <path d="M-6-10c2-4 14-4 16 2 2 6-4 10-10 10s-8-6-6-12z" fill="#E9C48C" />
    </g>
  );
}

function HurleyLean() {
  return (
    <g>
      <Hurley x={0} y={0} rot={12} />
      <circle cx="14" cy="-4" r="5" fill="#FFFDF7" />
      <path d="M10-6c3 1 6 3 7 6" stroke="#C23B3B" strokeWidth="1" fill="none" />
    </g>
  );
}

function CrossedHurleys() {
  return (
    <g>
      <rect x="-40" y="-80" width="80" height="80" rx="4" fill="#A87B52" />
      <path d="M-40-80h80" stroke="#8A6242" strokeWidth="6" />
      <Hurley x={-10} y={-8} rot={-30} s={1.1} />
      <Hurley x={10} y={-8} rot={30} s={1.1} />
      <circle cx="0" cy="-58" r="6" fill="#FFFDF7" />
    </g>
  );
}

function MiniPitch() {
  return (
    <g>
      <path d="M-90 0l20-40h140l20 40z" fill="#86C06F" />
      <path d="M-70-40h140" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M-80-20h160M0-40V0" stroke="#FFFFFF" strokeWidth="2" opacity=".8" />
      {[-80, 80].map((x) => (
        <g key={x}>
          <path d={`M${x - 10} -6v-56M${x + 10} -6v-56M${x - 10} -30h20`} stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

function Dummy() {
  return (
    <g>
      <Shadow rx={22} />
      <rect x="-9" y="-80" width="18" height="80" rx="8" fill="#A87B52" />
      <circle cx="0" cy="-88" r="12" fill="#8A6242" />
      <path d="M-30-58h60M-26-40h52" stroke="#74513A" strokeWidth="6" strokeLinecap="round" />
      <path d="M-9-20h18" stroke="#C23B3B" strokeWidth="4" />
    </g>
  );
}

function Mat() {
  return (
    <g>
      <path d="M-70 0l14-24h112l14 24z" fill="#C23B3B" />
      <path d="M-58-6l10-14h96l10 14z" fill="#D9575B" />
      <rect x="40" y="-80" width="44" height="44" rx="4" fill="#8A6242" />
      {["#F4F1EA", "#F2C94C", "#EE8A3A", "#4E9A5B"].map((c, i) => (
        <rect key={c} x="44" y={-76 + i * 10} width="36" height="5" rx="2" fill={c} />
      ))}
      <path d="M62 -36V0" stroke="#74513A" strokeWidth="4" />
    </g>
  );
}

function Dojo({ night }: { night?: boolean }) {
  return (
    <g>
      <Shadow rx={84} ry={12} />
      <rect x="-70" y="-70" width="140" height="70" fill="#F3E6CF" />
      {[-46, -22, 2, 26, 50].map((x) => (
        <path key={x} d={`M${x}-70V0`} stroke="#8A6242" strokeWidth="3" />
      ))}
      <path d="M-70-36h140" stroke="#8A6242" strokeWidth="3" />
      <path d="M-96-66c20-6 40-30 96-34 56 4 76 28 96 34z" fill="#3B3533" />
      <path d="M-80-98c20-4 40-20 80-22 40 2 60 18 80 22l-10 6h-140z" fill="#4A4340" />
      {[-60, 60].map((x) => (
        <g key={x} transform={`translate(${x} -62)`}>
          {night && <circle cx="0" cy="12" r="20" fill="#FFB36E" opacity=".35" />}
          <path d="M0 0v4" stroke="#3B3533" strokeWidth="2" />
          <ellipse cx="0" cy="13" rx="8" ry="10" fill={night ? "#FFB36E" : "#F2A3A0"} />
        </g>
      ))}
    </g>
  );
}

function Pennant({ color }: { color: string }) {
  return (
    <g>
      <path d="M0 0v-84" stroke="#8A6242" strokeWidth="4" />
      <g className="sway" style={{ transformOrigin: "0 -80px" }}>
        <path d="M2-82l40 12-40 12z" fill={color} />
        <path d="M2-70l40 0-40 12z" fill={shade(color, -0.15)} />
      </g>
    </g>
  );
}

function Banner({ color }: { color: string }) {
  return (
    <g>
      <path d="M-30 0v-100M30 0v-100M-36-100h72" stroke="#8A6242" strokeWidth="4" strokeLinecap="round" />
      <path d="M-26-96h52v54l-26-12-26 12z" fill={color} />
      <circle cx="0" cy="-72" r="11" fill="#FFFDF7" opacity=".85" />
      <path d="M-5-72l4 4 7-8" stroke={color} strokeWidth="3" fill="none" />
    </g>
  );
}

function Pavilion({ color }: { color: string }) {
  return (
    <g>
      <Shadow rx={70} ry={12} />
      <ellipse cx="0" cy="-3" rx="62" ry="12" fill="#E8E2D7" />
      {[-50, -16, 16, 50].map((x) => (
        <rect key={x} x={x - 4} y="-80" width="8" height="78" fill="#FFFDF7" />
      ))}
      <path d="M-70-78c10-30 40-50 70-56 30 6 60 26 70 56z" fill={color} />
      <path d="M0-134c30 6 60 26 70 56H0z" fill={shade(color, -0.12)} />
      {[-56, -28, 0, 28, 56].map((x) => (
        <path key={x} d={`M${x - 14}-78a14 10 0 0 0 28 0`} fill={shade(color, 0.25)} />
      ))}
      <path d="M0-134v-14" stroke="#4A3F35" strokeWidth="2" />
      <path d="M0-148l14 5-14 5z" fill={shade(color, -0.2)} />
    </g>
  );
}
