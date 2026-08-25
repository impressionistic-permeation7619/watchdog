import { evidenceTitle } from "@/domains/intake/lib/evidence";
import type { EvidenceRecord } from "@/domains/intake/types";

export interface IntakeQueueFilters {
  q: string;
  unprocessedOnly: boolean;
  unattachedOnly: boolean;
  /** Soft-deleted dumps — restore from Detail. */
  hiddenOnly: boolean;
}

export const EMPTY_INTAKE_FILTERS: IntakeQueueFilters = {
  q: "",
  unprocessedOnly: false,
  unattachedOnly: false,
  hiddenOnly: false,
};

export function intakeFiltersActive(filters: IntakeQueueFilters): boolean {
  return (
    filters.q.trim().length > 0 ||
    filters.unprocessedOnly ||
    filters.unattachedOnly ||
    filters.hiddenOnly
  );
}

export function filterIntakeQueue(
  rows: EvidenceRecord[],
  filters: IntakeQueueFilters
): EvidenceRecord[] {
  const q = filters.q.trim().toLowerCase();

  return rows.filter((row) => {
    if (filters.unprocessedOnly && row.processedAt !== null) return false;
    if (filters.unattachedOnly && row.entityId !== null && row.entityId !== "")
      return false;
    if (!q) return true;

    const haystack = [
      evidenceTitle(row),
      row.kind,
      row.mime,
      row.sourceUrl,
      row.id,
      row.sha256,
      row.label,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}
