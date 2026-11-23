"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { createTask } from "@/lib/data/tasks";
import { parseQuickInput } from "@/lib/parse";
import { useProjects } from "@/lib/hooks";
import { cn } from "@/lib/cn";

/** A fast, paper-list style add row. Understands dates, #tags and !priority. */
export function InlineAdd({
  projectId,
  sectionId,
  placeholder = "Add task",
  className,
  today,
}: {
  projectId: string | null;
  sectionId: string | null;
  placeholder?: string;
  className?: string;
  today?: boolean;
}) {
  const [text, setText] = useState("");
  const projects = useProjects() ?? [];
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const value = text.trim();
        if (!value) return;
        setText("");
        const p = parseQuickInput(value, projectId ? [] : projects);
        await createTask({
          title: p.title || value,
          projectId: projectId ?? null,
          sectionId,
          dueDate: p.dueDate,
          dueTime: p.dueTime,
          priority: p.priority,
          tags: p.tags,
          today,
        });
      }}
      className={cn("flex items-center gap-2 rounded-[18px] border border-dashed border-line bg-surface/50 pl-3 pr-1.5 focus-within:border-primary/60 focus-within:bg-surface", className)}
    >
      <Plus size={18} className="shrink-0 text-ink-faint" />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-faint"
      />
      {text.trim() && (
        <button type="submit" className="h-9 rounded-full bg-primary px-4 text-sm font-semibold text-primary-ink">
          Add
        </button>
      )}
    </form>
  );
}
