import Image from "next/image";
import { Sprout } from "lucide-react";
import { ICON_SET } from "@/lib/icon-set";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/cn";
import { AuraOrb } from "./AuraOrb";
import { BeltIcon } from "./BeltIcon";
import { HurleyIcon } from "./HurleyIcon";

/**
 * Project icon in a soft rounded tile (white in light mode, raised in dark),
 * so any logo looks right (brief 6.2). Logos are served from public/brand.
 */
export function ProjectIcon({
  project,
  size = 40,
  belt,
  className,
  bare = false,
}: {
  project: Pick<Project, "icon" | "color" | "name">;
  size?: number;
  belt?: { color: string; stripes?: number };
  className?: string;
  bare?: boolean;
}) {
  const inner = Math.round(size * 0.68);
  const icon = project.icon;
  let content: React.ReactNode;
  switch (icon.kind) {
    case "brand":
      if (icon.brand === "setu") {
        content =
          size >= 48 ? (
            <Image src="/brand/setu-logo.png" alt="" width={370} height={156} style={{ width: size * 0.84, height: "auto" }} />
          ) : (
            <Image src="/brand/setu-mark.png" alt="" width={151} height={151} style={{ width: inner, height: inner }} />
          );
      } else {
        content = (
          <Image src="/brand/swapnserve-smiley.png" alt="" width={512} height={512} style={{ width: inner, height: inner }} />
        );
      }
      break;
    case "custom":
      content =
        icon.name === "hurley" ? (
          <HurleyIcon size={inner} />
        ) : icon.name === "belt" ? (
          <BeltIcon size={inner} color={belt?.color} stripes={belt?.stripes} />
        ) : icon.name === "orb" ? (
          <AuraOrb size={inner} glow={false} />
        ) : (
          <Sprout size={inner * 0.8} color={project.color} strokeWidth={1.75} />
        );
      break;
    case "emoji":
      content = (
        <span style={{ fontSize: inner * 0.82, lineHeight: 1 }} aria-hidden="true">
          {icon.emoji}
        </span>
      );
      break;
    case "lucide": {
      const Cmp = ICON_SET[icon.name] ?? Sprout;
      content = <Cmp size={inner * 0.78} color={project.color} strokeWidth={1.75} />;
      break;
    }
    case "image":
      // eslint-disable-next-line @next/next/no-img-element
      content = <img src={icon.dataUrl} alt="" className="h-full w-full object-cover" />;
      break;
  }
  if (bare) return <>{content}</>;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-white shadow-[0_1px_2px_rgba(46,42,38,0.08),0_2px_8px_rgba(79,122,90,0.08)] ring-1 ring-black/5",
        // Logos keep their white tile in the dark so the SETU slate stays legible.
        icon.kind !== "brand" && "dark:bg-surface-raised dark:ring-white/5",
        className,
      )}
      style={{ width: size, height: size, borderRadius: Math.max(10, size * 0.3) }}
      aria-hidden="true"
    >
      {content}
    </span>
  );
}
