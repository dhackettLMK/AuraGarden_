"use client";

import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Pin, Trash2 } from "lucide-react";
import Link from "next/link";
import { getDB } from "@/lib/db";
import { softDelete } from "@/lib/data/core";
import { updateThought } from "@/lib/data/thoughts";
import { useProjects } from "@/lib/hooks";
import { RichText } from "@/components/editor/RichText";
import { TagInput } from "@/components/ui/TagInput";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Label } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { undoToast } from "@/components/ui/toast-store";
import { onThoughtWritten } from "@/lib/game/actions";
import { cn } from "@/lib/cn";
import type { Mood } from "@/lib/types";
import { MOODS } from "./mood";

export function ThoughtDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const thought = useLiveQuery(async () => (await getDB().thoughts.get(id)) ?? null, [id]);
  const tags = useLiveQuery(async () => [...new Set((await getDB().thoughts.toArray()).flatMap((t) => t.tags))], []) ?? [];
  const projects = useProjects() ?? [];
  const [title, setTitle] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awarded = useRef(false);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (thought === undefined) return <Skeleton className="h-96 w-full rounded-[24px]" />;
  if (!thought || thought.deletedAt)
    return (
      <EmptyState title="That thought has gone" line="It might be in Trash." pose="thinking">
        <Button onClick={() => router.push("/thoughts")}>All thoughts</Button>
      </EmptyState>
    );

  const save = (changes: Parameters<typeof updateThought>[1]) => updateThought(thought.id, changes);

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/thoughts" className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-muted hover:bg-surface-sunk">
          <ArrowLeft size={16} /> Thoughts
        </Link>
        <div className="flex-1" />
        <Button variant={thought.pinned ? "soft" : "ghost"} size="sm" onClick={() => save({ pinned: !thought.pinned })} aria-pressed={thought.pinned}>
          <Pin size={16} fill={thought.pinned ? "currentColor" : "none"} /> {thought.pinned ? "Pinned" : "Pin"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:text-danger"
          onClick={async () => {
            const undo = await softDelete("thoughts", thought.id);
            undoToast("Thought deleted", undo);
            router.push("/thoughts");
          }}
        >
          <Trash2 size={16} /> Delete
        </Button>
      </div>

      {thought.prompt && <p className="text-sm font-semibold text-primary">Oscar asked: {thought.prompt}</p>}
      <input
        value={title ?? thought.title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title !== null && save({ title: title.trim() })}
        placeholder="Title (optional)"
        aria-label="Title"
        className="w-full bg-transparent font-display text-[28px] font-semibold leading-tight outline-none placeholder:text-ink-faint"
      />

      <RichText
        value={thought.body}
        autofocus={!thought.text}
        placeholder="Write it all down…"
        label="Thought"
        className="min-h-[40vh]"
        onChange={(html, text) => {
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(async () => {
            await save({ body: html, text });
            // +5 aura for writing a thought (first 3 a day), once it has words.
            if (!awarded.current && text.trim().length >= 3) {
              awarded.current = true;
              await onThoughtWritten(thought.id);
            }
          }, 500);
        }}
      />

      <div>
        <Label>Mood</Label>
        <div className="flex gap-2" role="radiogroup" aria-label="Mood">
          {MOODS.map((m) => (
            <button
              key={m.value}
              role="radio"
              aria-checked={thought.mood === m.value}
              aria-label={m.label}
              onClick={() => save({ mood: thought.mood === m.value ? null : (m.value as Mood) })}
              className={cn("inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-sunk transition", thought.mood === m.value && "bg-primary-soft ring-2 ring-primary")}
            >
              <m.icon size={22} color={m.color} strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Tags</Label>
        <TagInput value={thought.tags} onChange={(t) => save({ tags: t })} suggestions={tags} />
      </div>
      {projects.length > 0 && (
        <div>
          <Label>Projects</Label>
          <div className="flex flex-wrap gap-1.5">
            {projects.map((p) => {
              const on = thought.projectIds.includes(p.id);
              return (
                <Chip key={p.id} active={on} color={p.color} onClick={() => save({ projectIds: on ? thought.projectIds.filter((x) => x !== p.id) : [...thought.projectIds, p.id] })}>
                  {p.name}
                </Chip>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
