/**
 * Skeleton loading states for each major surface.
 *
 * Each component mirrors the layout of the real content so the
 * transition is smooth and there's no layout shift.
 */
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";

/** Queue-row skeleton for data-slot loading (RoutePending body, queue columns). */
export function QueueSkeleton({
  rows = 8,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1 border-b px-3 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-2.5 w-36" />
            <Skeleton className="h-2 w-10" />
          </div>
          <Skeleton className="h-2 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * Stack / tab data-slot bones (Case, Dossier, Dashboard regions).
 * No “Loading…” copy — bones only.
 */
export function StackBodySkeleton({
  sections = 3,
  className,
}: {
  sections?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      aria-busy
      aria-live="polite"
    >
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3" aria-hidden>
          <Skeleton className="h-3 w-24" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
