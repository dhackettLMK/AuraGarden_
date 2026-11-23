"use client";

import { useProjects, useSections, useTasks } from "@/lib/hooks";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { SectionedTasks } from "@/features/tasks/SectionedTasks";
import { EmptyState } from "@/components/ui/EmptyState";

/** My List: her personal to-do list, as fast as a paper list (brief 6.4). */
export function MyListView() {
  const sections = useSections(null);
  const tasks = useTasks();
  const projects = useProjects() ?? [];
  if (!sections || !tasks) return <ListSkeleton />;
  const mine = tasks.filter((t) => t.projectId === null);
  return (
    <div className="mx-auto max-w-2xl">
      {mine.length === 0 && (
        <EmptyState className="pb-4 pt-2" size={84} title="A blank page" line="Nothing here yet. Want to plant something? Type below and hit Enter." pose="thinking" />
      )}
      <SectionedTasks projectId={null} sections={sections} tasks={mine} projects={projects} />
    </div>
  );
}
