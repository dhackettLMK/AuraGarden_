import { useId } from "react";

/** Original SVG: the glowing aura orb. */
export function AuraOrb({ size = 18, className, glow = true }: { size?: number; className?: string; glow?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`orb-${id}`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#FFF6DA" />
          <stop offset="0.35" stopColor="#FFD36E" />
          <stop offset="0.7" stopColor="#F59FC6" />
          <stop offset="1" stopColor="#B79CF2" />
        </radialGradient>
        <radialGradient id={`glow-${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stopColor="#F59FC6" stopOpacity="0.45" />
          <stop offset="1" stopColor="#F59FC6" stopOpacity="0" />
        </radialGradient>
      </defs>
      {glow && <circle cx="16" cy="16" r="16" fill={`url(#glow-${id})`} />}
      <circle cx="16" cy="16" r="10" fill={`url(#orb-${id})`} />
      <ellipse cx="12.6" cy="12" rx="3.2" ry="2.2" fill="#fff" opacity=".75" transform="rotate(-30 12.6 12)" />
      <circle cx="19.5" cy="20" r="1" fill="#fff" opacity=".5" />
    </svg>
  );
}
