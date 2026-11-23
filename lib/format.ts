/**
 * Big-number formatting (brief 7.6). Below 1,000,000 show the full number with
 * commas; from there, short form with up to two decimals: 1.23M, 45.6M, 1.20B.
 */
const UNITS: [number, string][] = [
  [1e15, "Q"],
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
];

const full = new Intl.NumberFormat("en-IE", { maximumFractionDigits: 0 });

export function formatFull(n: number) {
  return full.format(Math.round(n));
}

export function formatAura(n: number, style: "short" | "full" = "short"): string {
  const v = Math.round(n);
  if (style === "full" || Math.abs(v) < 1e6) return full.format(v);
  for (const [size, unit] of UNITS) {
    if (Math.abs(v) >= size) {
      const x = v / size;
      // Three significant figures: 1.23M, 45.6M, 812M; floor so we never overstate.
      const digits = x >= 100 ? 0 : x >= 10 ? 1 : 2;
      const f = Math.floor(x * 10 ** digits) / 10 ** digits;
      return `${f.toFixed(digits)}${unit}`;
    }
  }
  return full.format(v);
}

/** Multiplier like ×3.4 or ×128. */
export function formatMultiplier(m: number) {
  if (m >= 100) return `×${Math.round(m).toLocaleString("en-IE")}`;
  if (m >= 10) return `×${(Math.round(m * 10) / 10).toString()}`;
  return `×${(Math.round(m * 100) / 100).toString()}`;
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${formatFull(n)} ${n === 1 ? one : many}`;
}
