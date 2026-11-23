/** Original SVG: a hurley crossed with a sliotar (brief 6.2). */
export function HurleyIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hurley-ash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3D7A6" />
          <stop offset="1" stopColor="#D9A863" />
        </linearGradient>
      </defs>
      {/* handle */}
      <path d="M11 6.5c1.2-1 2.9-.8 3.9.4l15.2 19-3.4 2.8-15.2-19c-1-1.2-.8-2.9.4-3.9z" fill="url(#hurley-ash)" />
      {/* grip tape */}
      <path d="M10.8 7.2c1-.9 2.5-.7 3.4.3l2.3 2.9-3.7 3-2.3-2.9c-.8-1.1-.7-2.5.3-3.3z" fill="#2F2B27" opacity=".85" />
      {/* bas */}
      <path d="M26.2 26.5c2.6-2.2 6.8-2.6 9.9-.4 3.4 2.4 4.4 7 2.2 10.2-2.2 3.2-7 4-10.5 1.6-2.5-1.7-3.7-4.4-3.4-7l1.8-4.4z" fill="url(#hurley-ash)" />
      <path d="M28.4 31.2c1.4-1.4 4-1.6 5.8-.3" stroke="#B9874A" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".7" />
      {/* metal band */}
      <path d="M36.6 26.9c2.3 1.9 3.2 5.2 2.1 7.8" stroke="#9AA3A8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* sliotar */}
      <circle cx="35.5" cy="12.5" r="6.5" fill="#FBF7F0" />
      <circle cx="35.5" cy="12.5" r="6.5" fill="none" stroke="#E5DCCB" strokeWidth="1" />
      <path d="M30.6 9.2c2.5 1.6 4.2 4.4 4.5 7.6M40.4 15.8c-2.5-1.6-4.2-4.4-4.5-7.6" stroke="#C23B3B" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeDasharray="1.4 1.3" />
    </svg>
  );
}
