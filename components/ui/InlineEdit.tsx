"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Tap any text to edit it in place (brief 6, editing rules). */
export function InlineEdit({
  value,
  onSave,
  className,
  inputClassName,
  placeholder = "Untitled",
  label,
  multiline = false,
  as: Tag = "span",
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  label: string;
  multiline?: boolean;
  as?: "span" | "h1" | "h2" | "h3" | "p";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const v = draft.trim();
    if (v !== value && (v || !multiline)) onSave(v || value);
  };

  if (editing) {
    const common = {
      ref,
      value: draft,
      "aria-label": label,
      onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      },
      className: cn(
        "w-full rounded-lg bg-surface-sunk px-1.5 -mx-1.5 outline-none ring-2 ring-primary/50",
        className,
        inputClassName,
      ),
    };
    return multiline ? <textarea rows={3} {...common} /> : <input {...common} />;
  }
  return (
    <Tag
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${value || placeholder}. Tap to edit`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setDraft(value);
          setEditing(true);
        }
      }}
      className={cn(
        "-mx-1.5 cursor-text rounded-lg px-1.5 transition-colors hover:bg-surface-sunk/70",
        !value && "text-ink-faint",
        className,
      )}
    >
      {value || placeholder}
    </Tag>
  );
}
