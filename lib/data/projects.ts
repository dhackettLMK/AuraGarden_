import { CUSTOM_PROJECT_SUGGESTIONS, STARTER_PROJECTS } from "@/config/gifts";
import { getDB } from "../db";
import type { Project, ProjectIcon } from "../types";
import { alive, baseRecord, nextOrder, patch, put, softDelete } from "./core";

export const PROJECT_COLORS = [
  "#4F7A5A", "#445463", "#F6C828", "#E3A04A", "#C23B3B", "#B07AA1",
  "#6C8EBF", "#5AA9A3", "#D9822B", "#8C6E54", "#7A6FD0", "#D46A8C",
];

export async function createProject(input: { name: string; color?: string; icon?: ProjectIcon; description?: string }) {
  const rows = alive(await getDB().projects.toArray());
  const project: Project = {
    ...baseRecord(),
    name: input.name.trim() || "New project",
    description: input.description ?? "",
    color: input.color ?? PROJECT_COLORS[rows.length % PROJECT_COLORS.length],
    icon: input.icon ?? { kind: "emoji", emoji: "🌱" },
    kind: "custom",
    order: nextOrder(rows),
    archived: false,
  };
  return put("projects", project);
}

export function updateProject(id: string, changes: Partial<Project>) {
  return patch("projects", id, changes);
}

/**
 * Delete a project. Its tasks either move to My List or go to Trash with it.
 * Returns an undo function.
 */
export async function deleteProject(id: string, tasks: "move" | "delete") {
  const db = getDB();
  const projectTasks = alive(await db.tasks.where("projectId").equals(id).toArray());
  const sections = alive(await db.sections.where("projectId").equals(id).toArray());
  const moved: string[] = [];
  if (tasks === "move") {
    for (const t of projectTasks) {
      await patch("tasks", t.id, { projectId: null, sectionId: "sec_mylist_someday" });
      moved.push(t.id);
    }
  } else if (projectTasks.length) {
    await softDelete("tasks", projectTasks.map((t) => t.id));
  }
  const undoProject = await softDelete("projects", id);
  if (sections.length) await softDelete("sections", sections.map((s) => s.id));
  return async () => {
    await undoProject();
    if (sections.length) await patch("sections", sections[0].id, { deletedAt: null });
    for (const s of sections.slice(1)) await patch("sections", s.id, { deletedAt: null });
    for (const t of projectTasks) {
      await patch("tasks", t.id, { projectId: id, sectionId: t.sectionId, deletedAt: null });
    }
  };
}

export function suggestionsFor(project: Project) {
  return STARTER_PROJECTS.find((p) => p.kind === project.kind)?.suggestions ?? CUSTOM_PROJECT_SUGGESTIONS;
}
