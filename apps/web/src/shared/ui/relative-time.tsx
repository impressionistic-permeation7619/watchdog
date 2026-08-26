import { cn } from "@/lib/utils";
import { Timestamp } from "@/shared/ui/timestamp";

export function formatRelativeTime(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";

  const diffMs = Date.now() - d.getTime();
  const diffM = Math.floor(diffMs / 60_000);
  if (diffM < 1) return "just now";
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface RelativeTimeProps {
  /** ISO-8601 instant. */
  value: string | null | undefined;
  className?: string;
  /** Fallback when value missing/invalid. */
  empty?: string;
}

/** Compact relative label with full local tooltip via Timestamp. */
export function RelativeTime({
  value,
  className,
  empty = "—",
}: RelativeTimeProps) {
  if (!value) {
    return (
      <span className={cn("text-muted-foreground", className)}>{empty}</span>
    );
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return (
      <span className={cn("text-muted-foreground", className)}>{empty}</span>
    );
  }

  return (
    <Timestamp value={value} className={cn("text-muted-foreground", className)}>
      <span suppressHydrationWarning>{formatRelativeTime(d)}</span>
    </Timestamp>
  );
}
