import { Cloud, CloudRain, CloudSun, Sun, SunMedium } from "lucide-react";
import type { Mood } from "@/lib/types";

/** Five weather moods, cloudy to sunny (brief 6.5). */
export const MOODS: { value: Mood; label: string; icon: typeof Sun; color: string }[] = [
  { value: 1, label: "Rainy", icon: CloudRain, color: "#7D93A6" },
  { value: 2, label: "Cloudy", icon: Cloud, color: "#A3AEB8" },
  { value: 3, label: "Bits of sun", icon: CloudSun, color: "#C9A25A" },
  { value: 4, label: "Bright", icon: SunMedium, color: "#E3A04A" },
  { value: 5, label: "Sunny", icon: Sun, color: "#E7B53C" },
];

export function MoodIcon({ mood, size = 18 }: { mood: Mood; size?: number }) {
  const m = MOODS[mood - 1];
  const Icon = m.icon;
  return <Icon size={size} color={m.color} strokeWidth={2} aria-label={m.label} />;
}
