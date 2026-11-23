import { Skeleton } from "@/components/ui/Skeleton";

export function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh" aria-busy="true" aria-label="Loading your garden">
      <div className="hidden w-[268px] border-r border-line/70 md:block" />
      <div className="flex-1">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-3 px-4 md:px-8">
          <Skeleton className="h-7 w-48" />
          <div className="flex-1" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
        <div className="mx-auto max-w-[1180px] space-y-3 px-4 pt-4 md:px-8">
          <Skeleton className="h-36 w-full rounded-[20px]" />
          <Skeleton className="h-24 w-full rounded-[20px]" />
          <Skeleton className="h-24 w-full rounded-[20px]" />
        </div>
      </div>
    </div>
  );
}
