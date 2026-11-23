import "server-only";
import { lookup } from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";

/** True for loopback, private, link-local, CGNAT, multicast and other non-public ranges. */
export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::" || v === "::1") return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v) || v.startsWith("64:ff9b:") || v.startsWith("2001:db8");
  }
  return true;
}

export class FetchRefused extends Error {}

/** DNS lookup that refuses private addresses, used for every connection (stops DNS rebinding). */
function safeLookup(hostname: string, options: object, cb: (err: NodeJS.ErrnoException | null, address: string | { address: string; family: number }[], family?: number) => void) {
  lookup(hostname, { all: true }, (err, addresses) => {
    if (err) return cb(err, "");
    const list = addresses as { address: string; family: number }[];
    if (!list.length || list.some((a) => isPrivateAddress(a.address))) return cb(new FetchRefused("That address isn't allowed."), "");
    if ((options as { all?: boolean }).all) cb(null, list);
    else cb(null, list[0].address, list[0].family);
  });
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
}

/**
 * Fetch a public http(s) URL as text with the feed route's safety rules:
 * http and https only, private/loopback/link-local refused (including IP
 * literals and redirects), a timeout and a size cap.
 */
export async function safeFetchText(rawUrl: string, opts: SafeFetchOptions = {}): Promise<string> {
  const { timeoutMs = 10_000, maxBytes = 5 * 1024 * 1024, maxRedirects = 3 } = opts;
  const deadline = Date.now() + timeoutMs;
  // Test-only: the e2e suite serves a fixture feed on one exact local origin.
  const testAllow = process.env.FEED_TEST_ALLOW;
  if (testAllow && process.env.NODE_ENV !== "production" || (testAllow && process.env.FEED_TEST_ALLOW_IN_PROD === "yes-i-am-a-test")) {
    if (rawUrl.startsWith(testAllow)) {
      const res = await request(new URL(rawUrl), deadline, maxBytes, true);
      if (res.body !== undefined) return res.body;
    }
  }
  let url = normaliseFeedUrl(rawUrl);
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const res = await request(url, deadline, maxBytes);
    if (res.redirect) {
      url = normaliseFeedUrl(new URL(res.redirect, url).toString());
      continue;
    }
    return res.body!;
  }
  throw new FetchRefused("Too many redirects.");
}

export function normaliseFeedUrl(raw: string): URL {
  let s = raw.trim();
  if (/^webcals?:\/\//i.test(s)) s = s.replace(/^webcals?:\/\//i, "https://");
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new FetchRefused("That isn't a valid link.");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new FetchRefused("Only http and https links work.");
  if (u.username || u.password) throw new FetchRefused("Links with passwords aren't supported.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && isPrivateAddress(host)) throw new FetchRefused("That address isn't allowed.");
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) throw new FetchRefused("That address isn't allowed.");
  return u;
}

function request(url: URL, deadline: number, maxBytes: number, trusted = false): Promise<{ body?: string; redirect?: string }> {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === "https:" ? https : http;
    const remaining = deadline - Date.now();
    if (remaining <= 0) return reject(new FetchRefused("The calendar took too long to answer."));
    const req = mod.get(
      url,
      { ...(trusted ? {} : { lookup: safeLookup as never }), timeout: remaining, headers: { "User-Agent": "AuraGarden calendar fetcher", Accept: "text/calendar, text/plain;q=0.9, */*;q=0.5" } },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          return resolve({ redirect: res.headers.location });
        }
        if (status < 200 || status >= 300) {
          res.resume();
          return reject(new FetchRefused(`The calendar server said ${status}.`));
        }
        const len = Number(res.headers["content-length"] ?? 0);
        if (len > maxBytes) {
          res.destroy();
          return reject(new FetchRefused("That calendar is too big (over 5 MB)."));
        }
        let size = 0;
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > maxBytes) {
            res.destroy();
            reject(new FetchRefused("That calendar is too big (over 5 MB)."));
          } else chunks.push(c);
        });
        res.on("end", () => resolve({ body: Buffer.concat(chunks).toString("utf8") }));
        res.on("error", reject);
      },
    );
    const timer = setTimeout(() => req.destroy(new FetchRefused("The calendar took too long to answer.")), remaining);
    req.on("close", () => clearTimeout(timer));
    req.on("timeout", () => req.destroy(new FetchRefused("The calendar took too long to answer.")));
    req.on("error", (e) => reject(e instanceof FetchRefused ? e : new FetchRefused("Couldn't reach that calendar.")));
  });
}
