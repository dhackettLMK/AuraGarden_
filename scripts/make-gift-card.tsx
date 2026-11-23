/**
 * The printable gift card (brief 15): A6 at 300 dpi with 3 mm bleed.
 * Front: Oscar peeking out of the gift box, the AuraGarden wordmark, "For Laura".
 * Back: a QR code to <site>/laura, the tag line in Caveat, "David" in the
 * signature script with a small heart, and "Scan to unwrap".
 *
 *   SITE_URL=https://your-site.vercel.app npx tsx scripts/make-gift-card.tsx
 *
 * Needs the app running on :3100 (for its fonts). Writes gift/auragarden-card.pdf
 * (front then back) and gift/auragarden-card.png (both sides), plus one PNG per side.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import QRCode from "qrcode";
import { Oscar } from "../components/oscar/Oscar";
import { GIFTS } from "../config/gifts";

const SITE = (process.env.SITE_URL ?? "https://auragarden-nexeire.vercel.app").replace(/\/$/, "");
const BASE = process.env.BASE ?? "http://localhost:3100";
const gift = GIFTS.laura;
// A6 is 105 × 148 mm; with 3 mm bleed each side, 111 × 154 mm. At 300 dpi: 1311 × 1819 px.
const W_MM = 111;
const H_MM = 154;
const PX_PER_MM = 300 / 25.4;
const W = Math.round(W_MM * PX_PER_MM);
const H = Math.round(H_MM * PX_PER_MM);

const css = `
  .gc-card { width: ${W_MM}mm; height: ${H_MM}mm; position: relative; overflow: hidden; box-sizing: border-box; }
  .front { background: linear-gradient(180deg, #FFF7EC 0%, #FCE9E2 58%, #F6D3CE 100%); }
  .back { background: #FFFBF2; }
  .safe { position: absolute; inset: 8mm; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .display { font-family: var(--font-fraunces), Georgia, serif; font-variation-settings: "SOFT" 100; color: #2E2A26; }
  .hand { font-family: var(--font-caveat), cursive; color: #4A3F35; }
  .sig { font-family: var(--font-vibes), cursive; color: #3F5D47; }
  .ui { font-family: var(--font-jakarta), sans-serif; color: #6F665D; }
  .speck { position: absolute; border-radius: 50%; background: white; opacity: .7; }
`;

function giftBoxWithOscar() {
  // Oscar peeks over the rim of the open box: eyes and sprout above, body inside.
  const oscar = renderToStaticMarkup(<Oscar size={600} pose="peek" alive={false} />);
  return `
  <div style="position:relative;width:80mm;height:68mm;margin-top:2mm">
    <div style="position:absolute;left:50%;top:2mm;width:50mm;transform:translateX(-46%)">${oscar.replace(/width="600"/, 'width="100%"').replace(/height="[\d.]+"/, 'height="100%"')}</div>
    <svg viewBox="0 0 100 70" style="position:absolute;left:8mm;bottom:0;width:64mm;height:40mm">
      <defs>
        <pattern id="leaf" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
          <path d="M4 9c0-3 2.5-5 5-5 0 3-2.5 5-5 5z" fill="#fff" opacity=".18"/>
          <circle cx="14" cy="4" r=".8" fill="#fff" opacity=".2"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100" height="6" rx="2" fill="#6E8F6A"/>
      <rect x="0" y="3" width="100" height="67" rx="4" fill="#9DBE98"/>
      <rect x="0" y="3" width="100" height="67" rx="4" fill="url(#leaf)"/>
      <rect x="70" y="3" width="30" height="67" fill="#000" opacity=".06"/>
      <rect x="43" y="3" width="14" height="67" fill="#F2C4C0"/>
      <rect x="54" y="3" width="3" height="67" fill="#E3A9A4"/>
    </svg>
    <svg viewBox="0 0 100 24" style="position:absolute;right:-4mm;top:14mm;width:34mm;transform:rotate(28deg)">
      <rect width="100" height="24" rx="4" fill="#9DBE98"/><rect width="100" height="24" rx="4" fill="url(#leaf)"/>
      <rect x="0" y="18" width="100" height="6" fill="#86AC82"/><rect x="43" y="0" width="14" height="24" fill="#F2C4C0"/>
    </svg>
  </div>`;
}

function wordmark() {
  return `<div style="display:flex;align-items:center;gap:3mm">
    <svg viewBox="0 0 40 40" width="40" height="40" style="width:9mm;height:9mm">
      <defs><linearGradient id="lm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B79CF2"/><stop offset=".55" stop-color="#F59FC6"/><stop offset="1" stop-color="#FFD36E"/></linearGradient></defs>
      <rect width="40" height="40" rx="12" fill="#4F7A5A"/><circle cx="20" cy="17" r="8.5" fill="url(#lm)"/>
      <path d="M20 34c0-6 0-9 .5-12" stroke="#DCEBDD" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M20.5 27c-5-4.5-10-3.5-11.5-1.5 3 3.5 8 4 11.5 1.5zM20.5 25c3.5-5 9-5.5 11-3.5-2.5 4-7.5 5.2-11 3.5z" fill="#A6CFA1"/>
    </svg>
    <span class="display" style="font-size:9mm;font-weight:600;letter-spacing:-0.01em">AuraGarden</span>
  </div>`;
}

function specks() {
  return Array.from({ length: 14 }, (_, i) => `<span class="speck" style="left:${(i * 37) % 100}%;top:${(i * 53) % 100}%;width:${1 + (i % 3)}mm;height:${1 + (i % 3)}mm"></span>`).join("");
}

async function front() {
  return `<div class="gc-card front">${specks()}
    <div class="safe" style="justify-content:space-between;padding-top:4mm;padding-bottom:16mm;z-index:1">
      ${wordmark()}
      ${giftBoxWithOscar()}
      <div class="display" style="font-size:15mm;font-weight:600;line-height:1">For ${gift.recipient}</div>
    </div>
    <svg viewBox="0 0 400 120" preserveAspectRatio="none" style="position:absolute;left:0;right:0;bottom:0;width:100%;height:18mm">
      <path d="M0 50C80 20 160 30 220 42s120 4 180-20V120H0z" fill="#A9D18E" opacity=".55"/>
    </svg>
  </div>`;
}

async function back() {
  const qr = await QRCode.toString(`${SITE}/${gift.slug}`, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#2E2A26", light: "#0000" } });
  return `<div class="gc-card back">
    <div style="position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 0%, #FCE9E2 0%, #FFFBF2 55%)"></div>
    <div class="safe" style="justify-content:center;gap:6mm">
      <div style="width:52mm;height:52mm;padding:4mm;background:white;border-radius:6mm;box-shadow:0 2mm 6mm rgba(79,122,90,.18)">${qr.replace("<svg", '<svg style="width:100%;height:100%"')}</div>
      <div class="ui" style="font-size:4.2mm;font-weight:700;letter-spacing:.18em;text-transform:uppercase">Scan to unwrap</div>
      <div class="hand" style="font-size:9mm;line-height:1.05;max-width:80mm">${gift.tagLine}</div>
      <div style="display:flex;align-items:center;gap:2mm">
        <span class="sig" style="font-size:15mm;line-height:1.1;padding:0 2mm">${gift.signature}</span>
        <svg viewBox="0 0 26 24" style="width:7mm;height:6.5mm;margin-top:3mm"><path d="M13 21C5 15 2 11 2 7.2 2 4.3 4.3 2 7.1 2c2.4 0 4.4 1.5 5.9 3.7C14.5 3.5 16.5 2 18.9 2 21.7 2 24 4.3 24 7.2 24 11 21 15 13 21z" fill="#E78A9B" stroke="#D8667C" stroke-width="1.6" stroke-linejoin="round"/></svg>
      </div>
    </div>
  </div>`;
}

(async () => {
  mkdirSync("gift", { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  // Load the app once so its fonts (Fraunces, Caveat, Great Vibes, Plus Jakarta Sans) are available.
  await page.goto(`${BASE}/laura?skip=1`);
  const sides = [await front(), await back()];
  const render = async (html: string) => {
    await page.evaluate(
      ([c, h]) => {
        document.body.innerHTML = `<style>${c} body{margin:0;background:#fff} @page{size:${111}mm ${154}mm;margin:0}</style>${h}`;
        document.body.className = "";
      },
      [css, html],
    );
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
  };
  // PDF: front then back.
  await render(sides.map((s, i) => `<div style="${i ? "page-break-before:always" : ""}">${s}</div>`).join(""));
  await page.pdf({ path: "gift/auragarden-card.pdf", width: `${W_MM}mm`, height: `${H_MM}mm`, printBackground: true, pageRanges: "1-2" });
  // PNGs at 300 dpi.
  const ctx = await browser.newContext({ viewport: { width: Math.round(W_MM * 3.7795), height: Math.round(H_MM * 3.7795) }, deviceScaleFactor: W / (W_MM * 3.7795) });
  const p2 = await ctx.newPage();
  await p2.goto(`${BASE}/laura?skip=1`);
  for (const [i, name] of ["front", "back"].entries()) {
    await p2.evaluate(([c, h]) => (document.body.innerHTML = `<style>${c} body{margin:0}</style>${h}`), [css, sides[i]]);
    await p2.evaluate(() => document.fonts.ready);
    await p2.waitForTimeout(300);
    await p2.locator(".gc-card").screenshot({ path: `gift/auragarden-card-${name}.png` });
  }
  const p3 = await (await browser.newContext({ viewport: { width: 900, height: 600 }, deviceScaleFactor: W / (W_MM * 3.7795) })).newPage();
  await p3.goto(`${BASE}/laura?skip=1`);
  await p3.evaluate(([c, a, b]) => (document.body.innerHTML = `<style>${c} body{margin:0} .pair{display:flex;gap:6mm;padding:6mm;background:#EDE6DA;width:max-content}</style><div class="pair">${a}${b}</div>`), [css, sides[0], sides[1]]);
  await p3.evaluate(() => document.fonts.ready);
  await p3.waitForTimeout(300);
  await p3.locator(".pair").screenshot({ path: "gift/auragarden-card.png" });
  console.log(`Gift card written to gift/ (QR points at ${SITE}/${gift.slug}, ${W}×${H}px per side)`);
  await browser.close();
})();
