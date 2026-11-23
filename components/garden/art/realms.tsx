/**
 * Realms 2 and 3, fully drawn (brief 9.3). Each takes the set of unlocked
 * item ids and shows what she has earned. Realms 4–10 launch as teaser cards.
 */
import { Butterfly, Canopy, CherryTree, Daisy, Shadow, Tree, shade } from "./home";
import type { TimeOfDay } from "@/lib/day";

interface RealmSceneProps {
  unlocked: Set<string>;
  timeOfDay?: TimeOfDay;
  className?: string;
}

function skyFor(t?: TimeOfDay): [string, string] {
  if (t === "night" || t === "late") return ["#16204A", "#33406B"];
  if (t === "evening") return ["#7A7AB0", "#F2B99A"];
  if (t === "golden") return ["#F4B98A", "#FBE8C8"];
  if (t === "dawn") return ["#F6C8B8", "#FBEFDC"];
  return ["#BFE1F1", "#F7EEDC"];
}

export function MeadowScene({ unlocked, timeOfDay, className }: RealmSceneProps) {
  const has = (id: string) => unlocked.has(id);
  const [s0, s1] = skyFor(timeOfDay);
  const night = timeOfDay === "night" || timeOfDay === "late";
  return (
    <svg viewBox="0 0 1600 1000" className={className} role="img" aria-label="The Wildflower Meadow">
      <defs>
        <linearGradient id="meadow-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s0} />
          <stop offset="1" stopColor={s1} />
        </linearGradient>
        <linearGradient id="meadow-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D2E29A" />
          <stop offset="1" stopColor="#A9C873" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#meadow-sky)" />
      <circle cx="1250" cy="170" r="54" fill={night ? "#FFF6DA" : "#FFE38A"} />
      <path d="M0 520C220 400 420 430 640 480s480 20 960-80V1000H0z" fill="#C3DB94" />
      <path d="M0 600c300-80 600-60 900-10s500 20 700-30V1000H0z" fill="url(#meadow-grass)" />
      {/* rolling stripes of wildflowers */}
      {Array.from({ length: 120 }).map((_, i) => {
        const x = (i * 131) % 1600;
        const y = 640 + ((i * 89) % 340);
        const c = has("wildflowers") ? ["#F2A3B5", "#FFFDF7", "#F4C443", "#B79CF2", "#9CC9FF"][i % 5] : "#E8F0C8";
        return <circle key={i} cx={x} cy={y} r={3 + (i % 3)} fill={c} opacity={has("wildflowers") ? 1 : 0.6} />;
      })}
      {has("poppies") &&
        Array.from({ length: 60 }).map((_, i) => {
          const x = 80 + ((i * 53) % 640);
          const y = 700 + ((i * 37) % 220);
          return (
            <g key={`p${i}`} transform={`translate(${x} ${y}) scale(${0.7 + (i % 4) * 0.12})`}>
              <path d="M0 0c1-10 0-18-1-26" stroke="#6FA864" strokeWidth="2.2" fill="none" />
              <circle cx="-5" cy="-30" r="6.5" fill="#E2544A" />
              <circle cx="5" cy="-30" r="6.5" fill="#E2544A" />
              <circle cx="0" cy="-35" r="6.5" fill="#EE6A5E" />
              <circle cx="0" cy="-30" r="2.6" fill="#2E2A26" />
            </g>
          );
        })}
      {has("windmill") && (
        <g transform="translate(1260 520)">
          <path d="M-34 0l10-150h48l10 150z" fill="#F3E6CF" />
          <path d="M-30-150L0-190l30 40z" fill="#C76A58" />
          <rect x="-10" y="-40" width="20" height="40" rx="10" fill="#8A6242" />
          <g className="windmill-sails" style={{ transformOrigin: "0px -160px", transformBox: "view-box" }}>
            {[0, 90, 180, 270].map((r) => (
              <path key={r} d="M0-160l-12-110h24z" fill="#FFFDF7" opacity=".95" transform={`rotate(${r} 0 -160)`} />
            ))}
            <circle cx="0" cy="-160" r="9" fill="#8A6242" />
          </g>
        </g>
      )}
      {has("beehives") && (
        <g transform="translate(300 640)">
          {[0, 80].map((dx) => (
            <g key={dx} transform={`translate(${dx} 0)`}>
              <Shadow rx={32} />
              <rect x="-28" y="-70" width="56" height="70" rx="6" fill="#F4C443" />
              {[-52, -34, -16].map((y) => (
                <rect key={y} x="-30" y={y} width="60" height="5" fill="#D9A52E" />
              ))}
              <path d="M-34-70h68l-8-16h-52z" fill="#C99A6B" />
              <rect x="-8" y="-12" width="16" height="6" rx="3" fill="#7A4E2D" />
            </g>
          ))}
          {[[-20, -100], [60, -120], [110, -94]].map(([x, y], i) => (
            <g key={i} className="drift-a" style={{ animationDuration: `${6 + i}s` }}>
              <ellipse cx={x} cy={y} rx="6" ry="4" fill="#F4C443" />
              <path d={`M${x - 2} ${y - 4}v8M${x + 2} ${y - 4}v8`} stroke="#2E2A26" strokeWidth="1.4" />
            </g>
          ))}
        </g>
      )}
      {has("picnic") && (
        <g transform="translate(760 840)">
          <path d="M-110 0l40-60h170l40 60z" fill="#F2A3B5" />
          {[-80, -40, 0, 40].map((x) => (
            <path key={x} d={`M${x} 0l20-60`} stroke="#FFFFFF" strokeWidth="10" opacity=".6" />
          ))}
          <rect x="-20" y="-56" width="46" height="30" rx="6" fill="#C99A6B" />
          <path d="M-14-56c0-16 34-16 34 0" stroke="#8A6242" strokeWidth="4" fill="none" />
          <circle cx="60" cy="-30" r="9" fill="#D9575B" />
        </g>
      )}
      {has("hares") && (
        <g transform="translate(1060 760)">
          {[0, 70].map((dx, i) => (
            <g key={dx} transform={`translate(${dx} ${i * 20}) scale(${i ? 0.8 : 1})`}>
              <Shadow rx={22} />
              <ellipse cx="0" cy="-16" rx="22" ry="16" fill="#B08A68" />
              <circle cx="18" cy="-30" r="11" fill="#B08A68" />
              <ellipse cx="16" cy="-52" rx="4" ry="16" fill="#A07A5A" />
              <ellipse cx="24" cy="-50" rx="4" ry="14" fill="#B08A68" />
              <circle cx="22" cy="-32" r="2" fill="#2E2A26" />
              <circle cx="-22" cy="-16" r="6" fill="#F6EBD2" />
            </g>
          ))}
        </g>
      )}
      {has("kite") && (
        <g className="balloon">
          <path d="M1000 160l40-40 40 40-40 60z" fill="#B79CF2" />
          <path d="M1040 120v100M1000 160h80" stroke="#FFFFFF" strokeWidth="2" opacity=".7" />
          <path d="M1040 220c-20 80 30 160-40 300" stroke="#4A3F35" strokeWidth="1.6" fill="none" />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${1040 - i * 8} ${240 + i * 30}l-10 6 10 6z`} fill={["#F2A3B5", "#F4C443", "#9CC9FF"][i]} />
          ))}
        </g>
      )}
      {has("meadow-cottage") && (
        <g transform="translate(560 590) scale(0.9)">
          <Shadow rx={110} ry={14} />
          <rect x="-90" y="-100" width="180" height="100" rx="6" fill="#FFFDF7" />
          <path d="M-110-96c30-60 190-60 220 0z" fill="#D8B96A" />
          <path d="M-110-96c30-60 190-60 220 0" stroke="#C4A156" strokeWidth="10" fill="none" />
          <rect x="-18" y="-60" width="36" height="60" rx="18" fill="#7A9F7A" />
          {[-60, 40].map((x) => (
            <rect key={x} x={x} y="-80" width="28" height="26" rx="4" fill={night ? "#FFD889" : "#BFE3EE"} />
          ))}
          {[-70, -50, 50, 70].map((x) => (
            <Daisy key={x} x={x} y={2} s={0.8} petal="#F2A3B5" />
          ))}
        </g>
      )}
      {has("wildflowers") && (
        <g transform="translate(900 600)" className="drift-a">
          <Butterfly color="#F7D265" s={1.3} />
        </g>
      )}
      <g transform="translate(110 660) scale(0.85)">
        <Tree season="summer" />
      </g>
    </svg>
  );
}

export function LakeScene({ unlocked, timeOfDay, className }: RealmSceneProps) {
  const has = (id: string) => unlocked.has(id);
  const [s0, s1] = skyFor(timeOfDay);
  const night = timeOfDay === "night" || timeOfDay === "late";
  return (
    <svg viewBox="0 0 1600 1000" className={className} role="img" aria-label="The Lake and Orchard">
      <defs>
        <linearGradient id="lake-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s0} />
          <stop offset="1" stopColor={s1} />
        </linearGradient>
        <linearGradient id="lake-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ED3E0" />
          <stop offset="1" stopColor="#5FA6BC" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#lake-sky)" />
      <path d="M0 440c200-90 480-110 760-60s560 30 840-30v200H0z" fill="#9CC3A0" />
      <path d="M0 500c300-40 700-50 1000-20s400 10 600-10v100H0z" fill="#86B48D" />
      <path d="M0 560h1600v440H0z" fill="#A9CF8E" />
      <path d="M140 620c260-40 1060-50 1340 0 40 140-200 280-660 290-500 10-760-120-680-290z" fill="url(#lake-water)" />
      <g className="shimmer">
        {[[400, 700], [700, 760], [1000, 690], [1200, 760], [600, 830]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y}h${60 + (i % 3) * 20}`} stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity=".7" />
        ))}
      </g>
      {has("lilies") &&
        [[320, 760], [460, 820], [1100, 820], [1250, 720]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <ellipse rx="22" ry="9" fill="#7DB46E" />
            <circle cy="-4" r="6" fill="#F7C6D3" />
          </g>
        ))}
      {has("orchard") &&
        [100, 230, 1380, 1500].map((x, i) => (
          <g key={x} transform={`translate(${x} ${560 + (i % 2) * 30}) scale(0.62)`}>
            <path d="M-8 0v-110h16V0z" fill="#8A6242" />
            <g transform="translate(0 -150)">
              <Canopy r={70} colors={["#7DB46E", "#5F9A55", "#B9DE9E"]} />
              {[[-30, 0], [20, -20], [30, 20], [-10, 30]].map(([ax, ay], k) => (
                <circle key={k} cx={ax} cy={ay} r="8" fill={i % 2 ? "#F4C443" : "#D9575B"} />
              ))}
            </g>
          </g>
        ))}
      {has("willow") && (
        <g transform="translate(1440 640)">
          <path d="M-10 0c4-60 0-110-6-150h28c-6 40-8 90-4 150z" fill="#8A6242" />
          {Array.from({ length: 16 }).map((_, i) => (
            <path key={i} d={`M${-90 + i * 12} -170c${-6 + (i % 3) * 4} 60 ${-4 + (i % 2) * 8} 120 ${-10 + (i % 4) * 4} 160`} stroke={i % 2 ? "#8BBF6E" : "#A3D17F"} strokeWidth="9" fill="none" strokeLinecap="round" className="sway" style={{ transformOrigin: `${-90 + i * 12}px -170px` }} />
          ))}
          <ellipse cx="0" cy="-180" rx="110" ry="40" fill="#8BBF6E" />
        </g>
      )}
      {has("jetty") && (
        <g transform="translate(560 700)">
          <path d="M-120 20h200l-10-22h-180z" fill="#A87B52" />
          {[-100, -50, 0, 50].map((x) => (
            <path key={x} d={`M${x} 20v30`} stroke="#74513A" strokeWidth="7" />
          ))}
          <g className="bob" transform="translate(140 40)">
            <path d="M-70 0c20 30 120 30 140 0z" fill="#C76A58" />
            <path d="M-60 0h120" stroke="#8A4A3E" strokeWidth="6" />
            <path d="M-20-4l60-40" stroke="#C99A6B" strokeWidth="4" />
          </g>
        </g>
      )}
      {has("swans") &&
        [[880, 760], [960, 790]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${i ? 0.8 : 1})`} className="bob">
            <path d="M-30 0c0-20 40-20 50-4 6-20 2-40-8-46 14-2 20 4 18 14-4 20-10 30-10 36-10 10-40 10-50 0z" fill="#FFFFFF" />
            <path d="M30-36l10-2-8 6z" fill="#E3A04A" />
            <circle cx="26" cy="-38" r="2" fill="#2E2A26" />
          </g>
        ))}
      {has("fireworks") && night && (
        <g>
          {[[500, 200, "#F59FC6"], [800, 140, "#FFD36E"], [1100, 220, "#B79CF2"]].map(([x, y, c], i) => (
            <g key={i} className="twinkle" style={{ animationDelay: `${i * 0.7}s` }}>
              {Array.from({ length: 12 }).map((_, k) => (
                <path key={k} d={`M${x} ${y}l${Math.cos((k * Math.PI) / 6) * 60} ${Math.sin((k * Math.PI) / 6) * 60}`} stroke={String(c)} strokeWidth="4" strokeLinecap="round" />
              ))}
            </g>
          ))}
        </g>
      )}
      {has("lake-house") && (
        <g transform="translate(860 580) scale(0.8)">
          <Shadow rx={130} ry={14} />
          <path d="M-130 30h260v-14h-260z" fill="#8A6242" />
          {[-110, -40, 40, 110].map((x) => (
            <path key={x} d={`M${x} 30v40`} stroke="#74513A" strokeWidth="8" />
          ))}
          <rect x="-110" y="-110" width="220" height="126" rx="6" fill="#E9F1F4" />
          <path d="M-130-104L0-180l130 76z" fill="#5FA6BC" />
          <path d="M0-180l130 76H0z" fill={shade("#5FA6BC", -0.15)} />
          <rect x="-20" y="-50" width="40" height="66" rx="20" fill="#C76A58" />
          {[-80, 44].map((x) => (
            <rect key={x} x={x} y="-80" width="36" height="34" rx="5" fill={night ? "#FFD889" : "#BFE3EE"} />
          ))}
        </g>
      )}
      {has("sunset-dock") && (
        <g transform="translate(1240 860)">
          <path d="M-80 0h160l-12-20h-136z" fill="#A87B52" />
          <path d="M-60-20v-60" stroke="#74513A" strokeWidth="5" />
          <circle cx="-60" cy="-90" r="10" fill="#FFD36E" opacity=".9" />
        </g>
      )}
      <g transform="translate(180 900) scale(0.7)">
        <CherryTree season="spring" />
      </g>
    </svg>
  );
}
