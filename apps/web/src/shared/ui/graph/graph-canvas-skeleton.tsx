import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";

/** Hydration placeholder for React Flow canvases — bones only, no copy. */
export function GraphCanvasSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-muted/20 relative flex h-full min-h-64 w-full items-center justify-center",
        className
      )}
      aria-busy
      aria-live="polite"
    >
      <div className="flex items-center gap-6" aria-hidden>
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-0.5 w-12" />
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-0.5 w-12" />
        <Skeleton className="size-10 rounded-full" />
      </div>
    </div>
  );
}
