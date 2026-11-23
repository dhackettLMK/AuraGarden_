/**
 * .vcf import and export (brief 6.6). Supports vCard 2.1, 3.0 and 4.0 basics:
 * name, phone, email, org, title, birthday, note, URLs (Instagram, LinkedIn)
 * and inline photos.
 */
import type { Contact } from "./types";

export type ParsedContact = Partial<Contact> & { name: string };

function unfold(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function unescape(v: string) {
  return v.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\;/g, ";").replace(/\\\\/g, "\\").trim();
}

function escape(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");
}

export function parseVCF(text: string): ParsedContact[] {
  const out: ParsedContact[] = [];
  const cards = unfold(text).split(/BEGIN:VCARD/i).slice(1);
  for (const card of cards) {
    const c: ParsedContact = { name: "" };
    let n = "";
    for (const raw of card.split("\n")) {
      const line = raw.trim();
      if (!line || /^END:VCARD/i.test(line)) continue;
      const idx = line.indexOf(":");
      if (idx < 0) continue;
      const head = line.slice(0, idx);
      const value = line.slice(idx + 1);
      const key = head.split(";")[0].replace(/^item\d+\./i, "").toUpperCase();
      const params = head.toUpperCase();
      switch (key) {
        case "FN":
          c.name = unescape(value);
          break;
        case "N": {
          const [last, first] = value.split(";").map(unescape);
          n = [first, last].filter(Boolean).join(" ");
          break;
        }
        case "TEL":
          if (!c.phone) c.phone = value.replace(/^tel:/i, "").trim();
          break;
        case "EMAIL":
          if (!c.email) c.email = value.replace(/^mailto:/i, "").trim();
          break;
        case "ORG":
          c.organisation = unescape(value.split(";")[0]);
          break;
        case "TITLE":
        case "ROLE":
          if (!c.role) c.role = unescape(value);
          break;
        case "NOTE":
          c.notes = unescape(value);
          break;
        case "BDAY": {
          const m = value.match(/(\d{4}|--)-?(\d{2})-?(\d{2})/);
          if (m) c.birthday = m[1] === "--" || m[1] === "1604" ? `--${m[2]}-${m[3]}` : `${m[1]}-${m[2]}-${m[3]}`;
          break;
        }
        case "URL":
        case "X-SOCIALPROFILE": {
          const v = unescape(value);
          if (/instagram\.com\/([\w.]+)/i.test(v) || params.includes("INSTAGRAM")) c.instagram = v.match(/instagram\.com\/([\w.]+)/i)?.[1] ?? v.replace(/^@/, "");
          else if (/linkedin\.com/i.test(v) || params.includes("LINKEDIN")) c.linkedin = v;
          break;
        }
        case "PHOTO": {
          const enc = params.match(/ENCODING=(B|BASE64)/);
          const type = params.match(/TYPE=(\w+)/)?.[1]?.toLowerCase() ?? "jpeg";
          if (value.startsWith("data:")) c.photo = value;
          else if (enc) c.photo = `data:image/${type};base64,${value.replace(/\s/g, "")}`;
          break;
        }
      }
    }
    if (!c.name) c.name = n;
    if (c.name) out.push(c);
  }
  return out;
}

export function toVCF(contacts: Contact[]): string {
  return contacts
    .filter((c) => !c.deletedAt)
    .map((c) => {
      const parts = c.name.trim().split(/\s+/);
      const last = parts.length > 1 ? parts.pop()! : "";
      const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${escape(c.name)}`, `N:${escape(last)};${escape(parts.join(" "))};;;`];
      if (c.phone) lines.push(`TEL;TYPE=CELL:${c.phone}`);
      if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${c.email}`);
      if (c.organisation) lines.push(`ORG:${escape(c.organisation)}`);
      if (c.role) lines.push(`TITLE:${escape(c.role)}`);
      if (c.birthday) lines.push(`BDAY:${c.birthday.startsWith("--") ? c.birthday : c.birthday}`);
      if (c.instagram) lines.push(`URL;TYPE=Instagram:https://instagram.com/${c.instagram.replace(/^@/, "")}`);
      if (c.linkedin) lines.push(`URL;TYPE=LinkedIn:${c.linkedin}`);
      if (c.notes) lines.push(`NOTE:${escape(c.notes)}`);
      if (c.photo?.startsWith("data:image/")) {
        const [, type, b64] = c.photo.match(/^data:image\/(\w+);base64,(.*)$/) ?? [];
        if (b64) lines.push(`PHOTO;ENCODING=b;TYPE=${type.toUpperCase()}:${b64}`);
      }
      lines.push("END:VCARD");
      return lines.join("\r\n");
    })
    .join("\r\n");
}
