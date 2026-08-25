import {
  evidenceHint,
  evidenceTitle,
  producingCapJob,
} from "@/domains/intake/lib/evidence";
import type { EvidenceRecord } from "@/domains/intake/types";
import type { JobListRecord } from "@/domains/jobs/jobs.functions";
import { DetailStatusChip } from "@/shared/ui/detail-status-chip";
import { groupItemsByDay } from "@/shared/ui/group-by-day";
import { QueueDayGroup } from "@/shared/ui/queue-day-group";
import {
  QueueRow,
  QueueRowInstantMeta,
  QueueRowTitle,
} from "@/shared/ui/queue-row";
import { StatusDot } from "@/shared/ui/status-dot";

function evidenceQueueStatus(showHiddenBadge: boolean, processed: boolean) {
  if (showHiddenBadge) return "cancelled";
  return processed ? "succeeded" : "pending";
}

export interface EvidenceQueueListProps {
  rows: EvidenceRecord[];
  jobs: JobListRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showHiddenBadge?: boolean;
}

export function EvidenceQueueList({
  rows,
  jobs,
  selectedId,
  onSelect,
  showHiddenBadge = false,
}: EvidenceQueueListProps) {
  const days = groupItemsByDay(rows, (r) => r.capturedAt);

  return (
    <div role="listbox" aria-label="Evidence queue">
      {days.map((day) => (
        <QueueDayGroup key={day.key} label={day.label} count={day.items.length}>
          {day.items.map((row) => {
            const processed = Boolean(row.processedAt);
            const producingCap = producingCapJob(jobs, row.id);
            const hint = evidenceHint(row, producingCap);

            return (
              <li key={row.id}>
                <QueueRow
                  role="option"
                  aria-selected={row.id === selectedId}
                  selected={row.id === selectedId}
                  onClick={() => {
                    onSelect(row.id);
                  }}
                  className="py-2"
                  trailing={
                    <StatusDot
                      status={evidenceQueueStatus(showHiddenBadge, processed)}
                    />
                  }
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <QueueRowTitle>{evidenceTitle(row)}</QueueRowTitle>
                    {showHiddenBadge ? (
                      <DetailStatusChip className="shrink-0">
                        hidden
                      </DetailStatusChip>
                    ) : null}
                    {producingCap === null ? null : (
                      <DetailStatusChip className="shrink-0">
                        Cap output
                      </DetailStatusChip>
                    )}
                    {row.entityId !== null && row.entityId !== "" ? null : (
                      <DetailStatusChip className="shrink-0">
                        unattached
                      </DetailStatusChip>
                    )}
                  </div>
                  {hint !== null && hint !== "" ? (
                    <span className="text-foreground/70 truncate font-mono text-xs">
                      {hint}
                    </span>
                  ) : null}
                  <QueueRowInstantMeta value={row.capturedAt} id={row.id}>
                    <span aria-hidden>·</span>
                    <span>{producingCap === null ? row.kind : "cap"}</span>
                  </QueueRowInstantMeta>
                </QueueRow>
              </li>
            );
          })}
        </QueueDayGroup>
      ))}
    </div>
  );
}
