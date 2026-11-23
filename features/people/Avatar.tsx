/* eslint-disable @next/next/no-img-element */
import { initials } from "@/lib/data/contacts";
import type { Contact } from "@/lib/types";

/** Photo, or a coloured initials avatar (brief 6.6). */
export function Avatar({ contact, size = 44 }: { contact: Pick<Contact, "name" | "photo" | "color">; size?: number }) {
  if (contact.photo) return <img src={contact.photo} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-[#2E2A26]" style={{ width: size, height: size, background: contact.color, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(contact.name)}
    </span>
  );
}
