/** Garden keys (brief 12.1): 32 random bytes, base64url. Works in browser and Node. */
export function base64url(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateGardenKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

/** A well-formed key is 43 base64url characters. */
export function isValidKeyShape(key: string | null | undefined): key is string {
  return !!key && /^[A-Za-z0-9_-]{43}$/.test(key);
}

export async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function joinLink(origin: string, key: string) {
  return `${origin}/join#k=${key}`;
}

/** Pull a key out of a pasted link, a bare key, or a scanned QR payload. */
export function extractKey(input: string): string | null {
  const text = input.trim();
  const m = text.match(/[#&?]k=([A-Za-z0-9_-]{43})/);
  if (m) return m[1];
  if (isValidKeyShape(text)) return text;
  return null;
}
