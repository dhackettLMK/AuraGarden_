"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { DEFAULT_SIDEBAR, moduleLabel } from "@/lib/data/settings";
import { useMediaQuery, useProjects, useSettings } from "@/lib/hooks";
import { useUI } from "@/lib/ui-store";
import { cn } from "@/lib/cn";
import { ProjectIcon } from "@/components/icons/ProjectIcon";
import { RankBadge } from "@/features/projects/RankBadge";
import { useProjectBelt } from "@/features/projects/useProjectRank";
import { Oscar } from "@/components/oscar/Oscar";
import { useGame } from "@/lib/game/GameProvider";
import { NAV, SETTINGS_NAV, isActive } from "./nav";
import type { Project } from "@/lib/types";

/** Desktop sidebar (brief 5); an icon rail on tablets or when collapsed. */
export function Sidebar() {
  const pathname = usePathname();
  const settings = useSettings();
  const projects = useProjects();
  const collapsedPref = useUI((s) => s.sidebarCollapsed);
  const toggle = useUI((s) => s.toggleSidebar);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const rail = !isDesktop || collapsedPref;
  const order = settings?.sidebarOrder?.length ? settings.sidebarOrder : DEFAULT_SIDEBAR;
  const game = useGame();

  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        "sticky top-0 z-30 hidden h-dvh shrink-0 flex-col border-r border-line/70 bg-surface-sunk/40 pt-safe md:flex",
        rail ? "w-[84px]" : "w-[268px]",
      )}
    >
      <div className={cn("flex h-16 items-center gap-2.5", rail ? "justify-center px-2" : "px-5")}>
        <Link href="/" className="flex items-center gap-2.5" aria-label="AuraGarden home">
          <LogoMark />
          {!rail && <span className="font-display text-[20px] font-semibold tracking-tight">AuraGarden</span>}
        </Link>
      </div>
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-28" aria-label="Main">
        <ul className="space-y-0.5">
          {order.map((key) => {
            const item = NAV[key];
            if (!item) return null;
            return (
              <li key={key}>
                <NavItem href={item.href} label={moduleLabel(settings, key)} icon={item.icon} active={isActive(pathname, item.href)} rail={rail} />
              </li>
            );
          })}
        </ul>
        <div className={cn("mt-6", rail && "mt-4 border-t border-line pt-4")}>
          {!rail && (
            <div className="mb-1.5 flex items-center justify-between px-3">
              <Link href="/projects" className="text-xs font-bold uppercase tracking-[0.08em] text-ink-faint hover:text-ink">
                {moduleLabel(settings, "projects")}
              </Link>
            </div>
          )}
          <ul className="space-y-0.5">
            {projects?.map((p) => (
              <li key={p.id}>
                <ProjectNavItem project={p} active={isActive(pathname, `/projects/${p.id}`)} rail={rail} aura={game.projectAura[p.id] ?? 0} />
              </li>
            ))}
            <li>
              <Link
                href="/projects?new=1"
                className={cn(
                  "flex h-11 items-center gap-3 rounded-2xl px-3 text-[15px] font-medium text-ink-muted hover:bg-surface hover:text-ink",
                  rail && "justify-center px-0",
                )}
                aria-label="New project"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] border border-dashed border-ink-faint/60">
                  <Plus size={16} />
                </span>
                {!rail && "New project"}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <div className="relative border-t border-line/70 px-3 py-3">
        {!rail && settings?.showOscar !== false && (
          <div className="pointer-events-none absolute -top-[46px] right-5" aria-hidden="true">
            <Oscar size={62} pose="peek" level={game.level} outfit={settings?.oscarOutfit} />
          </div>
        )}
        <div className={cn("flex items-center gap-1", rail && "flex-col")}>
          <div className="flex-1">
            <NavItem href={SETTINGS_NAV.href} label="Settings" icon={SETTINGS_NAV.icon} active={isActive(pathname, "/settings")} rail={rail} />
          </div>
          {isDesktop && (
            <button
              onClick={toggle}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-ink-muted hover:bg-surface"
              aria-label={collapsedPref ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsedPref ? <PanelLeftOpen size={20} strokeWidth={1.75} /> : <PanelLeftClose size={20} strokeWidth={1.75} />}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  rail,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active: boolean;
  rail: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={rail ? label : undefined}
      aria-label={rail ? label : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-2xl px-3 text-[15px] font-medium transition-colors",
        active ? "bg-surface text-primary shadow-[var(--shadow-soft)] dark:text-primary" : "text-ink-muted hover:bg-surface/70 hover:text-ink",
        rail && "justify-center px-0",
      )}
    >
      <Icon size={20} strokeWidth={active ? 2.1 : 1.75} />
      {!rail && <span className="truncate">{label}</span>}
    </Link>
  );
}

function ProjectNavItem({ project, active, rail, aura }: { project: Project; active: boolean; rail: boolean; aura: number }) {
  const belt = useProjectBelt(project, aura);
  return (
    <Link
      href={`/projects/${project.id}`}
      aria-current={active ? "page" : undefined}
      title={rail ? project.name : undefined}
      aria-label={rail ? project.name : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-2xl px-2.5 text-[15px] font-medium transition-colors",
        active ? "bg-surface text-ink shadow-[var(--shadow-soft)]" : "text-ink-muted hover:bg-surface/70 hover:text-ink",
        rail && "justify-center px-0",
      )}
    >
      <ProjectIcon project={project} size={30} belt={belt} />
      {!rail && (
        <>
          <span className="min-w-0 flex-1 truncate">{project.name}</span>
          <RankBadge project={project} aura={aura} compact />
        </>
      )}
    </Link>
  );
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B79CF2" />
          <stop offset=".55" stopColor="#F59FC6" />
          <stop offset="1" stopColor="#FFD36E" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="#4F7A5A" />
      <circle cx="20" cy="17" r="8.5" fill="url(#lm-g)" />
      <path d="M20 34c0-6 0-9 .5-12" stroke="#DCEBDD" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20.5 27c-5-4.5-10-3.5-11.5-1.5 3 3.5 8 4 11.5 1.5zM20.5 25c3.5-5 9-5.5 11-3.5-2.5 4-7.5 5.2-11 3.5z" fill="#A6CFA1" />
    </svg>
  );
}
