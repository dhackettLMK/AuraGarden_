"use client";

import QRCode from "qrcode";
import { joinLink } from "@/lib/key";

export function gardenLink(key: string) {
  return joinLink(window.location.origin, key);
}

export async function qrDataUrl(text: string, size = 512) {
  return QRCode.toDataURL(text, { width: size, margin: 1, errorCorrectionLevel: "M", color: { dark: "#2E2A26", light: "#FFFFFF" } });
}

/** A pretty PNG card with the QR, for "Save QR to Photos" (brief 12.4). */
export async function downloadQrCard(link: string, name: string) {
  const W = 1080;
  const H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#FFF7EC");
  g.addColorStop(1, "#F6D3CE");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // card
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, 120, 300, W - 240, 820, 56);
  ctx.fill();
  const qr = new Image();
  qr.src = await qrDataUrl(link, 640);
  await qr.decode();
  ctx.drawImage(qr, (W - 600) / 2, 380, 600, 600);
  await document.fonts.ready;
  ctx.fillStyle = "#2E2A26";
  ctx.textAlign = "center";
  ctx.font = `600 68px ${getComputedStyle(document.body).getPropertyValue("--font-fraunces") || "Georgia"}, Georgia, serif`;
  ctx.fillText(`${name}'s AuraGarden`, W / 2, 200);
  ctx.font = `500 36px ${getComputedStyle(document.body).getPropertyValue("--font-jakarta") || "system-ui"}, system-ui, sans-serif`;
  ctx.fillStyle = "#6F665D";
  ctx.fillText("Your secret garden link. Keep it safe.", W / 2, 1050);
  ctx.fillText("Scan it to open your garden on another device.", W / 2, 1210);
  const a = document.createElement("a");
  a.download = "my-auragarden-link.png";
  a.href = c.toDataURL("image/png");
  a.click();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function mailtoLink(link: string, name: string) {
  const subject = encodeURIComponent(`${name}'s AuraGarden link`);
  const body = encodeURIComponent(`My secret AuraGarden link. Keep this safe, it's the only key to my garden:\n\n${link}\n`);
  return `mailto:?subject=${subject}&body=${body}`;
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}
