"use client";

import { useRef, useState } from "react";
import { Archive, ArchiveRestore, ImageUp, Trash2 } from "lucide-react";
import { Sheet, ConfirmSheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { ProjectIcon } from "@/components/icons/ProjectIcon";
import { ICON_SET } from "@/lib/icon-set";
import { resizeImage } from "@/lib/image";
import { PROJECT_COLORS, createProject, deleteProject, updateProject } from "@/lib/data/projects";
import { RANKS } from "@/config/ranks";
import { undoToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import type { Project, ProjectIcon as PIcon } from "@/lib/types";
import { formatAura } from "@/lib/format";

const EMOJI = ["🌱", "🌷", "🌻", "🍀", "🌿", "🌸", "📚", "✏️", "🎓", "🧠", "💡", "💼", "💸", "🛍️", "👕", "♻️", "🤝", "📣", "🎨", "🎵", "🎸", "📷", "🏃‍♀️", "🥋", "🏑", "⚽", "🏋️", "🧘", "🍿", "☕", "🍰", "🏠", "✈️", "🗺️", "🐶", "🐢", "⭐", "✨", "❤️", "🔥"];

const BUILT_IN: PIcon[] = [
  { kind: "brand", brand: "setu" },
  { kind: "brand", brand: "swapnserve" },
  { kind: "custom", name: "hurley" },
  { kind: "custom", name: "belt" },
  { kind: "custom", name: "orb" },
];

type Tab = "built" | "emoji" | "icons" | "upload";

export function ProjectEditor({
  project,
  open,
  onOpenChange,
  onDeleted,
}: {
  project: Project | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDeleted?: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={project ? "Edit project" : "New project"} size="lg">
      {open && <EditorBody key={project?.id ?? "new"} project={project} onDone={() => onOpenChange(false)} onDeleted={onDeleted} />}
    </Sheet>
  );
}

function EditorBody({ project, onDone, onDeleted }: { project: Project | null; onDone: () => void; onDeleted?: () => void }) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0]);
  const [icon, setIcon] = useState<PIcon>(project?.icon ?? { kind: "emoji", emoji: "🌱" });
  const [rankNames, setRankNames] = useState<Record<number, string>>(project?.rankNames ?? {});
  const [tab, setTab] = useState<Tab>(icon.kind === "brand" || icon.kind === "custom" ? "built" : icon.kind === "lucide" ? "icons" : icon.kind === "image" ? "upload" : "emoji");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = { name: name || "Project", color, icon };

  async function save() {
    if (!name.trim()) return;
    if (project) await updateProject(project.id, { name: name.trim(), description, color, icon, rankNames });
    else await createProject({ name, description, color, icon });
    onDone();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <ProjectIcon project={preview} size={64} />
        <div className="min-w-0 flex-1">
          <Label htmlFor="p-name">Name</Label>
          <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Driving lessons" maxLength={60} autoFocus={!project} />
        </div>
      </div>
      <div>
        <Label htmlFor="p-desc">Description</Label>
        <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this project about?" className="min-h-20" />
      </div>
      <div>
        <Label>Colour</Label>
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Colour">
          {PROJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color.toLowerCase() === c.toLowerCase()}
              aria-label={c}
              onClick={() => setColor(c)}
              className={cn("h-10 w-10 rounded-full ring-offset-2 ring-offset-surface transition-transform active:scale-90", color.toLowerCase() === c.toLowerCase() && "ring-2 ring-ink")}
              style={{ background: c }}
            />
          ))}
          <label className="relative inline-flex h-10 items-center gap-2 rounded-full bg-surface-sunk px-3 text-sm font-semibold text-ink-muted">
            <span className="h-5 w-5 rounded-full" style={{ background: color }} />
            Custom
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Custom colour" />
          </label>
        </div>
      </div>
      <div>
        <Label>Icon</Label>
        <Segmented<Tab>
          label="Icon type"
          value={tab}
          onChange={setTab}
          className="mb-3 w-full"
          size="sm"
          options={[
            { value: "built", label: "Built-in" },
            { value: "emoji", label: "Emoji" },
            { value: "icons", label: "Icons" },
            { value: "upload", label: "Upload" },
          ]}
        />
        {tab === "built" && (
          <div className="flex flex-wrap gap-2">
            {BUILT_IN.map((b, i) => (
              <IconOption key={i} selected={JSON.stringify(b) === JSON.stringify(icon)} onClick={() => setIcon(b)} label={b.kind === "brand" ? b.brand : b.kind === "custom" ? b.name : "icon"}>
                <ProjectIcon project={{ ...preview, icon: b }} size={44} />
              </IconOption>
            ))}
          </div>
        )}
        {tab === "emoji" && (
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
            {EMOJI.map((e) => (
              <IconOption key={e} selected={icon.kind === "emoji" && icon.emoji === e} onClick={() => setIcon({ kind: "emoji", emoji: e })} label={e}>
                <span className="text-[24px]">{e}</span>
              </IconOption>
            ))}
          </div>
        )}
        {tab === "icons" && (
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
            {Object.entries(ICON_SET).map(([n, Cmp]) => (
              <IconOption key={n} selected={icon.kind === "lucide" && icon.name === n} onClick={() => setIcon({ kind: "lucide", name: n })} label={n}>
                <Cmp size={22} color={color} strokeWidth={1.75} />
              </IconOption>
            ))}
          </div>
        )}
        {tab === "upload" && (
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <ImageUp size={18} /> {uploading ? "Resizing…" : "Choose an image"}
            </Button>
            <p className="text-sm text-ink-muted">Shrunk on your device to a small square.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setUploading(true);
                try {
                  setIcon({ kind: "image", dataUrl: await resizeImage(f) });
                } finally {
                  setUploading(false);
                }
              }}
            />
          </div>
        )}
      </div>

      {project && (
        <details className="rounded-2xl bg-surface-sunk px-4 py-3">
          <summary className="cursor-pointer font-semibold">Rank names</summary>
          <p className="mt-1 text-sm text-ink-muted">Rename any rank on this project&apos;s ladder.</p>
          <ul className="mt-3 space-y-2">
            {RANKS[project.kind].map((r, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-right text-sm tabular text-ink-muted">{formatAura(r.at)}</span>
                <Input value={rankNames[i] ?? ""} placeholder={r.name} aria-label={`Rank at ${r.at} aura`} onChange={(e) => setRankNames((n) => ({ ...n, [i]: e.target.value }))} className="py-2" />
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {project && (
          <>
            <Button variant="ghost" className="text-danger hover:text-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={18} /> Delete
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await updateProject(project.id, { archived: !project.archived });
                onDone();
              }}
            >
              {project.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
              {project.archived ? "Unarchive" : "Archive"}
            </Button>
          </>
        )}
        <div className="flex-1" />
        <Button onClick={save} disabled={!name.trim()}>
          {project ? "Save" : "Create project"}
        </Button>
      </div>
      {project && (
        <DeleteProjectSheet
          project={project}
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          onDeleted={() => {
            onDone();
            onDeleted?.();
          }}
        />
      )}
    </div>
  );
}

function IconOption({ children, selected, onClick, label }: { children: React.ReactNode; selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={cn("inline-flex aspect-square min-h-11 min-w-11 items-center justify-center rounded-2xl bg-surface-sunk transition-transform active:scale-90", selected && "bg-primary-soft ring-2 ring-primary")}
    >
      {children}
    </button>
  );
}

/** Deleting a project asks whether to move its tasks to My List or delete them too (brief 6). */
export function DeleteProjectSheet({ project, open, onOpenChange, onDeleted }: { project: Project; open: boolean; onOpenChange: (v: boolean) => void; onDeleted?: () => void }) {
  const [mode, setMode] = useState<"move" | "delete">("move");
  return (
    <ConfirmSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${project.name}?`}
      description="It goes to Trash for 30 days. The aura you earned stays yours."
      confirmLabel="Delete project"
      onConfirm={async () => {
        const undo = await deleteProject(project.id, mode);
        undoToast(`Deleted ${project.name}`, undo);
        onDeleted?.();
      }}
    >
      <div className="space-y-2" role="radiogroup" aria-label="Its tasks">
        {(
          [
            ["move", "Move its tasks to My List"],
            ["delete", "Delete its tasks too"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={mode === v}
            onClick={() => setMode(v)}
            className={cn("flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-left font-medium", mode === v ? "bg-primary-soft ring-2 ring-primary" : "bg-surface-sunk")}
          >
            <span className={cn("h-4 w-4 rounded-full border-2", mode === v ? "border-primary bg-primary" : "border-ink-faint")} />
            {label}
          </button>
        ))}
      </div>
    </ConfirmSheet>
  );
}
