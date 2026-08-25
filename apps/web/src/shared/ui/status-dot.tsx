import { cn } from "@/lib/utils";
import { WithTooltip } from "@/shared/ui/timestamp";
import { STATUS_DOT, statusLabel, type DisplayStatus } from "@/shared/ui/vocab";

interface StatusDotProps {
  status: DisplayStatus;
  /** Pulse for live statuses (running). */
  pulse?: boolean;
  className?: string;
  /** Hide tooltip (parent already labels). */
  tooltip?: boolean;
}

/**
 * 6–8px lifecycle/status dot for dense Queue rows.
 * Prefer StatusBadge when there is room for a text label.
 */
export function StatusDot({
  status,
  pulse = false,
  className,
  tooltip = true,
}: StatusDotProps) {
  const dot = (
    <span
      data-slot="status-dot"
      data-status={status}
      aria-label={statusLabel(status)}
      className={cn(
        "inline-flex size-2 shrink-0 rounded-full",
        STATUS_DOT[status],
        pulse && status === "running" && "animate-pulse",
        className
      )}
    />
  );

  if (!tooltip) return dot;

  return (
    <WithTooltip content={statusLabel(status)} wrapSpan>
      <span className="inline-flex">{dot}</span>
    </WithTooltip>
  );
}
