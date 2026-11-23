"use client";

import { X } from "lucide-react";
import { useState } from "react";

export function TagInput({ value, onChange, suggestions = [], label = "Tags" }: { value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; label?: string }) {
  const [draft, setDraft] = useState("");
  const add = (t: string) => {
    const tag = t.trim().replace(/^#/, "").toLowerCase();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  };
  const open = suggestions.filter((s) => !value.includes(s) && (!draft || s.startsWith(draft.toLowerCase()))).slice(0, 6);
  return (
    <div>
      <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-[14px] bg-surface-sunk px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/60">
        {value.map((t) => (
          <span key={t} className="inline-flex h-8 items-center gap-1 rounded-full bg-surface pl-3 pr-1 text-sm font-medium text-primary shadow-[0_1px_2px_var(--shadow-tint)]">
            #{t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove tag ${t}`} className="inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunk">
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "," || e.key === " ") {
              if (draft.trim()) {
                e.preventDefault();
                add(draft);
              }
            } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? "" : "Add a tag"}
          aria-label={label}
          className="min-w-24 flex-1 bg-transparent px-2 py-1.5 outline-none placeholder:text-ink-faint"
        />
      </div>
      {open.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {open.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="h-8 rounded-full bg-surface-sunk px-3 text-sm text-ink-muted hover:text-ink">
              #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
