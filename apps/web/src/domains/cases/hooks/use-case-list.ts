import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { casesContextQuery } from "@/domains/cases/queries";
import type { CaseRecord } from "@/domains/cases/types";

import { useCaseListActions } from "./use-case-list-actions";

function caseMatchesSearch(c: CaseRecord, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return (
    c.name.toLowerCase().includes(q) ||
    c.slug.toLowerCase().includes(q) ||
    (c.description ?? "").toLowerCase().includes(q)
  );
}

function caseGridGhostCount(occupied: number, minRows = 4, cols = 3): number {
  const minSlots = minRows * cols;
  if (occupied >= minSlots) {
    const rem = occupied % cols;
    return rem === 0 ? cols : cols - rem;
  }
  return minSlots - occupied;
}

function filterCases(cases: CaseRecord[], search: string): CaseRecord[] {
  return [...cases]
    .filter((c) => caseMatchesSearch(c, search))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function caseListGhostCount(
  cases: CaseRecord[],
  filtered: CaseRecord[]
): number {
  const occupiedSlots = filtered.length + 1;
  return cases.length > 0 && filtered.length === 0
    ? 0
    : caseGridGhostCount(occupiedSlots);
}

export function useCaseList() {
  const { data: casesCtx } = useSuspenseQuery(casesContextQuery());
  const cases = casesCtx.cases;
  const activeId = casesCtx.active?.id ?? "";

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CaseRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const filtered = useMemo(() => filterCases(cases, search), [cases, search]);

  const actions = useCaseListActions(
    activeId,
    setSubmitError,
    setCreateOpen,
    setDeleteTarget,
    setSearch
  );

  const ghostCount = caseListGhostCount(cases, filtered);

  return {
    activeId,
    cases,
    search,
    setSearch,
    filtered,
    ghostCount,
    submitError,
    createOpen,
    setCreateOpen,
    deleteTarget,
    ...actions,
  };
}
