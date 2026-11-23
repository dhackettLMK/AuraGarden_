import {
  CalendarDays, CheckSquare, Flower2, Home, Lightbulb, ListTodo, Settings, Trophy, Users, FolderHeart,
  type LucideIcon,
} from "lucide-react";
import type { TabKey } from "@/lib/types";

export const NAV: Record<TabKey, { href: string; icon: LucideIcon }> = {
  home: { href: "/", icon: Home },
  projects: { href: "/projects", icon: FolderHeart },
  calendar: { href: "/calendar", icon: CalendarDays },
  garden: { href: "/garden", icon: Flower2 },
  "my-list": { href: "/my-list", icon: ListTodo },
  tasks: { href: "/tasks", icon: CheckSquare },
  thoughts: { href: "/thoughts", icon: Lightbulb },
  people: { href: "/people", icon: Users },
  trophies: { href: "/trophies", icon: Trophy },
};

export const SETTINGS_NAV = { href: "/settings", icon: Settings };

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function routeKey(pathname: string): TabKey | "settings" | null {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/settings")) return "settings";
  for (const [k, v] of Object.entries(NAV)) if (v.href !== "/" && isActive(pathname, v.href)) return k as TabKey;
  return null;
}
