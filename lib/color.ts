/** Ink that stays readable on a given background colour (WCAG AA for 12px+ bold text). */
export function readableOn(hex: string) {
  const h = hex.replace("#", "");
  if (h.length < 6) return "#FFFFFF";
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  // Contrast with white vs with our ink; pick whichever is higher.
  const withWhite = 1.05 / (L + 0.05);
  const withInk = (L + 0.05) / (0.0235 + 0.05);
  return withWhite >= withInk ? "#FFFFFF" : "#2E2A26";
}
