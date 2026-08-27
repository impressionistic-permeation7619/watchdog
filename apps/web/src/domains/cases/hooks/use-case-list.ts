import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { setActiveCaseIdFn } from "@/domains/cases/cases.functions";
import { notifyCasesChanged } from "@/domains/cases/lib/active-case";
import { casesContextQuery } from "@/domains/cases/queries";
import type { CaseRecord } from "@/domains/cases/types";
import { errMessage } from "@/lib/utils";
import { invalidateAfterCaseSwitch } from "@/shared/lib/query-invalidation";

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

export function useCaseList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: casesCtx } = useSuspenseQuery(casesContextQuery());
  const cases = casesCtx.cases;
  const activeId = casesCtx.active?.id ?? "";

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CaseRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      [...cases]
        .filter((c) => caseMatchesSearch(c, search))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [cases, search]
  );

  const selectMutation = useMutation({
    mutationFn: async (id: string) =>
      setActiveCaseIdFn({ data: { caseId: id } }),
    onSuccess: async () => {
      await invalidateAfterCaseSwitch(queryClient);
      notifyCasesChanged();
    },
    onError: (err) => {
      setSubmitError(errMessage(err, "Failed to switch case"));
    },
  });

  const selectCase = useCallback((id: string) => {
    setSubmitError(null);
    selectMutation.mutate(id);
  }, [selectMutation]);

  const openCase = useCallback(
    async (caseRow: CaseRecord) => {
      setSubmitError(null);
      try {
        if (caseRow.id !== activeId) {
          await selectMutation.mutateAsync(caseRow.id);
        }
        await navigate({
          to: "/cases/$caseSlug",
          params: { caseSlug: caseRow.slug },
        });
      } catch (error) {
        setSubmitError(errMessage(error, "Failed to open case"));
      }
    },
    [activeId, navigate, selectMutation]
  );

  const openCreate = useCallback(() => {
    setSubmitError(null);
    setCreateOpen(true);
  }, []);

  const clearSearch = useCallback(() => {
    setSearch("");
  }, []);

  const beginDeleteCase = useCallback((caseRow: CaseRecord) => {
    setSubmitError(null);
    setDeleteTarget(caseRow);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    void (async () => {
      setSubmitError(null);
      toast.success("Case created");
      await invalidateAfterCaseSwitch(queryClient);
      notifyCasesChanged();
    })();
  }, [queryClient]);

  const handleCreateError = useCallback((message: string) => {
    setSubmitError(message);
  }, []);

  const closeDeleteDialog = useCallback((open: boolean) => {
    if (!open) setDeleteTarget(null);
  }, []);

  const handleCaseDeleted = useCallback(() => {
    toast.success("Case deleted");
  }, []);

  const occupiedSlots = filtered.length + 1;
  const ghostCount =
    cases.length > 0 && filtered.length === 0
      ? 0
      : caseGridGhostCount(occupiedSlots);

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
    selecting: selectMutation.isPending,
    selectCase,
    openCase,
    openCreate,
    clearSearch,
    beginDeleteCase,
    handleCreateSuccess,
    handleCreateError,
    closeDeleteDialog,
    handleCaseDeleted,
  };
}
