import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { IdChip } from "@/shared/ui/id-chip";

/**
 * Shared Detail top chrome — identity + status + meta only.
 * CTAs belong in `DetailFooter` (bottom bar), not here.
 *
 * Layout (scan order):
 *   title …………………… status
 *   meta (time · duration · kind …)
 *   IdChip
 *   note (optional prose)
 *
 * Presentational only.
 */
export function DetailHeader({
  title,
  id,
  idCopyable = true,
  status,
  meta,
  note,
  className,
  titleClassName,
}: {
  title: ReactNode;
  id?: string;
  idCopyable?: boolean;
  /** Lifecycle / state badges — top-right. */
  status?: ReactNode;
  /** Instant / duration / kind line — directly under the title. */
  meta?: ReactNode;
  /** Optional prose under id (summary, notes, warnings). */
  note?: ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <header
      data-slot="detail-header"
      className={cn(
        "border-border flex shrink-0 flex-col gap-2 border-b px-4 py-3",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h2
            className={cn(
              "text-foreground text-sm leading-snug font-semibold text-balance",
              titleClassName
            )}
          >
            {title}
          </h2>
          {meta ? (
            <div
              data-slot="detail-header-meta"
              className="text-muted-foreground text-xs leading-snug [&_p]:m-0 [&_p+p]:mt-1.5"
            >
              {meta}
            </div>
          ) : null}
        </div>
        {status === undefined ? null : (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {status}
          </div>
        )}
      </div>

      {id ? <IdChip value={id} copyable={idCopyable} full /> : null}

      {note ? (
        <div
          data-slot="detail-header-note"
          className="space-y-2 text-xs [&_p]:m-0"
        >
          {note}
        </div>
      ) : null}
    </header>
  );
}
