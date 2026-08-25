import type { ProposalRecord } from "@/domains/inbox/inbox.functions";
import { opLabel, proposalTitle } from "@/domains/inbox/lib/filters";
import { groupItemsByDay } from "@/shared/ui/group-by-day";
import { QueueDayGroup } from "@/shared/ui/queue-day-group";
import {
  QueueRow,
  QueueRowInstantMeta,
  QueueRowTitle,
} from "@/shared/ui/queue-row";
import { StatusDot } from "@/shared/ui/status-dot";

interface InboxQueueListProps {
  proposals: ProposalRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function InboxQueueList({
  proposals,
  selectedId,
  onSelect,
}: InboxQueueListProps) {
  const days = groupItemsByDay(proposals, (p) => p.createdAt);

  return (
    <div role="listbox" aria-label="Proposals">
      {days.map((day) => (
        <QueueDayGroup key={day.key} label={day.label} count={day.items.length}>
          {day.items.map((row) => {
            const isSelected = selectedId === row.id;
            return (
              <li key={row.id}>
                <QueueRow
                  role="option"
                  aria-selected={isSelected}
                  selected={isSelected}
                  onClick={() => {
                    onSelect(row.id);
                  }}
                  className="py-2"
                  trailing={<StatusDot status={row.status} />}
                >
                  <QueueRowTitle className="font-sans">
                    {proposalTitle(row)}
                  </QueueRowTitle>
                  <span className="text-foreground/70 truncate font-mono text-xs">
                    {opLabel(row.patch)}
                    {row.evidenceIds.length > 0
                      ? ` · ${row.evidenceIds.length} ev`
                      : ""}
                  </span>
                  <QueueRowInstantMeta value={row.createdAt} id={row.id} />
                </QueueRow>
              </li>
            );
          })}
        </QueueDayGroup>
      ))}
    </div>
  );
}
