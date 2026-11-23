/** Original SVG: a tied martial-arts belt knot, coloured by rank (brief 6.2, 10.3). */
export function BeltIcon({
  size = 24,
  color = "#F4F1EA",
  stripes = 0,
  className,
}: {
  size?: number;
  color?: string;
  stripes?: number;
  className?: string;
}) {
  const light = isLight(color);
  const edge = light ? "rgba(46,42,38,0.55)" : "rgba(255,255,255,0.22)";
  const shade = light ? "rgba(46,42,38,0.12)" : "rgba(0,0,0,0.28)";
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
      {/* belt band behind the knot */}
      <path d="M3 18.5c7-2.2 14-3 21-3s14 .8 21 3v6.5c-7-2.2-14-3-21-3s-14 .8-21 3z" fill={color} stroke={edge} strokeWidth={light ? 1.3 : 0.8} />
      <path d="M3 22.5c7-2.2 14-3 21-3s14 .8 21 3v2.5c-7-2.2-14-3-21-3s-14 .8-21 3z" fill={shade} />
      {/* hanging tails */}
      <path d="M20.5 25.5l-7.5 17 5.6 1.8 6.4-17.6z" fill={color} stroke={edge} strokeWidth={light ? 1.3 : 0.8} />
      <path d="M27.5 25.5l7.5 17-5.6 1.8-6.4-17.6z" fill={color} stroke={edge} strokeWidth={light ? 1.3 : 0.8} />
      {/* Dan stripes on the tail */}
      {Array.from({ length: Math.min(stripes, 10) }).map((_, i) => (
        <path key={i} d={`M${31.2 + i * 0.32} ${36.2 + i * 0.75}l4.2-1.3`} stroke="#E7B53C" strokeWidth=".55" />
      ))}
      {stripes > 0 && <path d="M30.6 35.4l4.9-1.6 1.4 3.2-4.9 1.6z" fill="#E7B53C" opacity=".9" />}
      {/* the knot */}
      <path d="M17.5 16.5c0-1.4 1.1-2.5 2.5-2.5h8c1.4 0 2.5 1.1 2.5 2.5v9c0 1.4-1.1 2.5-2.5 2.5h-8c-1.4 0-2.5-1.1-2.5-2.5z" fill={color} stroke={edge} strokeWidth={light ? 1.3 : 0.8} />
      <path d="M18 20.5c3.5 1.6 8.5 1.6 12 0" stroke={shade} strokeWidth="2" fill="none" />
      <path d="M20 14.5c1.4 2.6 1.4 10.4 0 13" stroke={edge} strokeWidth=".7" fill="none" />
    </svg>
  );
}

function isLight(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
