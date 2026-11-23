import {
  CalendarCheck, CalendarDays, CheckCircle2, Flame, Flower2, FolderHeart, KeyRound, Layers, Lightbulb, ListChecks, Medal,
  PartyPopper, Sparkles, Sun, Sunrise, Target, TrendingUp, Users, Weight, Zap, Lock, type LucideIcon,
} from "lucide-react";
import { useId } from "react";
import type { Family } from "@/config/achievements";
import type { Tier } from "@/config/tiers";

export const FAMILY_ICONS: Record<Family, LucideIcon> = {
  aura: Sparkles, tasks: CheckCircle2, big: Weight, subtasks: ListChecks, streak: Sun, goals: Target, decks: Layers,
  combos: Zap, thoughts: Lightbulb, people: Users, calendar: CalendarDays, garden: Flower2, levels: TrendingUp,
  early: Sunrise, weekend: PartyPopper, ranks: Medal, days: CalendarCheck, bestDay: Flame, projects: FolderHeart, secret: KeyRound,
};

const TIER_STOPS: Record<Tier, [string, string, string]> = {
  bronze: ["#E2B184", "#C08552", "#8E5A30"],
  silver: ["#E6EBF0", "#A8B2BD", "#78838F"],
  gold: ["#FBE29A", "#E7B53C", "#B8861A"],
  platinum: ["#D8F3F2", "#8FD3D1", "#5AA6A4"],
  diamond: ["#E1EEFF", "#9CC9FF", "#5E95D8"],
  mythic: ["#E8D6FD", "#C59BF5", "#8E62C9"],
  celestial: ["#B79CF2", "#F59FC6", "#FFD36E"],
};

/** An original medal badge in its tier colour (brief 10.5, 11.4). */
export function Badge({ tier, family, earned, secret, size = 72 }: { tier: Tier; family: Family; earned: boolean; secret?: boolean; size?: number }) {
  const id = useId().replace(/:/g, "");
  const [a, b, c] = TIER_STOPS[tier];
  const Icon = FAMILY_ICONS[family];
  return (
    <span className={`relative inline-flex shrink-0 ${earned && tier === "celestial" ? "celestial-badge" : ""}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 72 72" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id={`b-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={earned ? a : "#E9E3D8"} />
            <stop offset="0.55" stopColor={earned ? b : "#D6CFC3"} />
            <stop offset="1" stopColor={earned ? c : "#BFB7AA"} />
          </linearGradient>
        </defs>
        {/* ribbon tails */}
        <path d="M24 46l-8 22 9-5 5 8 6-20z" fill={earned ? c : "#CFC7BA"} opacity=".9" />
        <path d="M48 46l8 22-9-5-5 8-6-20z" fill={earned ? b : "#D9D2C6"} opacity=".9" />
        {/* scalloped medal */}
        <g transform="translate(36 32)">
          {Array.from({ length: 12 }).map((_, i) => (
            <circle key={i} cx={Math.cos((i * Math.PI) / 6) * 24} cy={Math.sin((i * Math.PI) / 6) * 24} r="7" fill={`url(#b-${id})`} />
          ))}
          <circle r="25" fill={`url(#b-${id})`} />
          <circle r="19" fill="none" stroke="#FFFFFF" strokeOpacity={earned ? 0.55 : 0.4} strokeWidth="2" />
          <path d="M-16-10c6-10 18-13 28-8" stroke="#FFFFFF" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      </svg>
      <span className="absolute inset-x-0 top-0 flex items-center justify-center" style={{ height: size * 0.89 }}>
        {secret ? (
          <span className="font-display font-bold text-white/90" style={{ fontSize: size * 0.3 }}>?</span>
        ) : earned ? (
          <Icon size={size * 0.3} color="#FFFFFF" strokeWidth={2.2} />
        ) : (
          <Lock size={size * 0.22} color="#FFFFFF" strokeWidth={2.2} />
        )}
      </span>
    </span>
  );
}
