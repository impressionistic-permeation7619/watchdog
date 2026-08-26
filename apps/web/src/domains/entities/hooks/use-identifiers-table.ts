import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import type { CaseRecord } from "@/domains/cases/types";
import {
  HANDLE_REQUIRES_PLATFORM,
  isHandleWithoutPlatform,
  type IdentifierFieldUpdate,
} from "@/shared/ui/identifiers/identifier-cells";
import {
  identifierCreateCanSubmit,
  useIdentifierCreateForm,
} from "@/shared/ui/identifiers/identifier-composer";
import type { EvidenceOption } from "@/shared/ui/intake/evidence-option";
import {
  createIdentifiersTableColumns,
  identifiersGlobalFilterFn,
} from "@/domains/entities/components/identifiers-table.columns";
import {
  createIdentifierFn,
  updateIdentifierFn,
} from "@/domains/entities/identifiers/identifiers.functions";
import { identifiersForCaseQuery } from "@/domains/entities/identifiers/queries";
import { entitiesListQuery } from "@/domains/entities/queries";
import { evidenceListQuery } from "@/domains/intake/queries";
import { errMessage } from "@/lib/utils";
import type { PageFilterChip } from "@/shared/layout/page-filter-menu";
import { invalidateAfterEntityChanged } from "@/shared/lib/query-invalidation";
import { tableComposerKeyDown, useDataTable } from "@/shared/ui/data-table";
import type { EntityOption } from "@/shared/ui/entity-combobox";
import {
  confidenceLabel,
  IDENTIFIER_TYPE_LABELS,
  statusLabel,
} from "@/shared/ui/vocab";
import {
  normalizeIdentifierPlatform,
  type ConfidenceTier,
  type IdentifierStatus,
  type IdentifierType,
} from "@watchdog/schemas";

export function useIdentifiersTable(active: CaseRecord) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: rows } = useSuspenseQuery(identifiersForCaseQuery(active.id));
  const { data: entities } = useSuspenseQuery(entitiesListQuery(active.id));
  const { data: evidence } = useSuspenseQuery(evidenceListQuery(active.id));

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<IdentifierType[]>([]);
  const [statusFilter, setStatusFilter] = useState<IdentifierStatus[]>([]);
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceTier[]>(
    []
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const evidenceOptions: EvidenceOption[] = useMemo(
    () =>
      evidence.map((e) => ({
        id: e.id,
        kind: e.kind,
        label: e.label,
        sourceUrl: e.sourceUrl,
        sha256: e.sha256,
      })),
    [evidence]
  );

  const entityOptions: EntityOption[] = useMemo(
    () =>
      entities.map((e) => ({
        id: e.id,
        name: e.name,
        kind: e.kind,
        slug: e.slug,
      })),
    [entities]
  );

  const createForm = useIdentifierCreateForm(async ({ value, reset }) => {
    if (!identifierCreateCanSubmit(value, { requireEntity: true })) {
      if (isHandleWithoutPlatform(value.type, value.platform)) {
        setSubmitError(HANDLE_REQUIRES_PLATFORM);
      }
      return;
    }
    setSubmitError(null);
    try {
      const platform = normalizeIdentifierPlatform(value.platform);
      await createIdentifierFn({
        data: {
          caseId: active.id,
          entityId: value.entityId,
          type: value.type,
          value: value.value.trim(),
          platform: platform || undefined,
          status: value.status,
          confidence: value.confidence,
          evidenceIds: value.evidenceIds,
        },
      });
      toast.success("Identifier added");
      reset();
      setComposing(false);
      await invalidateAfterEntityChanged(queryClient, active.id, {
        entityId: value.entityId,
      });
    } catch (error) {
      setSubmitError(errMessage(error, "Failed to add"));
    }
  });

  const columnFilters = useMemo(() => {
    const next: { id: string; value: string[] }[] = [];
    if (typeFilter.length > 0) next.push({ id: "type", value: typeFilter });
    if (statusFilter.length > 0) {
      next.push({ id: "status", value: statusFilter });
    }
    if (confidenceFilter.length > 0) {
      next.push({ id: "confidence", value: confidenceFilter });
    }
    return next;
  }, [typeFilter, statusFilter, confidenceFilter]);

  const { mutate, mutateAsync } = useMutation({
    mutationFn: async (input: {
      identifierId: string;
      value?: string;
      platform?: string;
      type?: IdentifierType;
      status?: IdentifierStatus;
      confidence?: ConfidenceTier;
      notes?: string;
      evidenceIds?: string[];
    }) => updateIdentifierFn({ data: { caseId: active.id, ...input } }),
    onSuccess: async (_data, vars) => {
      toast.success("Updated");
      const row = rows.find((r) => r.id === vars.identifierId);
      await invalidateAfterEntityChanged(queryClient, active.id, {
        entityId: row?.entityId,
      });
    },
    onError: (e) => {
      toast.error(errMessage(e, "Update failed"));
    },
  });

  function closeComposer() {
    createForm.reset();
    setComposing(false);
  }

  function openComposer() {
    createForm.reset();
    setSubmitError(null);
    setComposing(true);
  }

  function submitCreate() {
    void createForm.handleSubmit();
  }

  function onComposerKey(e: React.KeyboardEvent) {
    tableComposerKeyDown({
      busy: createForm.state.isSubmitting,
      canSubmit: identifierCreateCanSubmit(createForm.state.values, {
        requireEntity: true,
      }),
      onSubmit: submitCreate,
      onCancel: closeComposer,
    })(e);
  }

  const updateField = useCallback(
    (identifierId: string, field: IdentifierFieldUpdate) => {
      mutate({ identifierId, ...field });
    },
    [mutate]
  );

  const saveEvidence = useCallback(
    async (identifierId: string, evidenceIds: string[]) => {
      await mutateAsync({ identifierId, evidenceIds });
    },
    [mutateAsync]
  );

  const columns = useMemo(
    () =>
      createIdentifiersTableColumns({
        evidenceOptions,
        updateField,
        saveEvidence,
      }),
    [evidenceOptions, updateField, saveEvidence]
  );

  const { table } = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    globalFilter: search,
    onGlobalFilterChange: setSearch,
    columnFilters,
    globalFilterFn: identifiersGlobalFilterFn,
    initialSorting: [{ id: "entity", desc: false }],
    pageSize: 50,
  });

  const filterChips: PageFilterChip[] = [
    ...typeFilter.map((t) => ({
      id: `type:${t}`,
      label: IDENTIFIER_TYPE_LABELS[t],
      onClear: () => {
        setTypeFilter(typeFilter.filter((x) => x !== t));
      },
    })),
    ...statusFilter.map((s) => ({
      id: `status:${s}`,
      label: statusLabel(s),
      onClear: () => {
        setStatusFilter(statusFilter.filter((x) => x !== s));
      },
    })),
    ...confidenceFilter.map((c) => ({
      id: `confidence:${c}`,
      label: confidenceLabel(c),
      onClear: () => {
        setConfidenceFilter(confidenceFilter.filter((x) => x !== c));
      },
    })),
  ];

  const emptyText =
    rows.length === 0
      ? "No identifiers yet — add one below."
      : "No identifiers match your filters.";

  function onRowClick(row: { entitySlug: string }) {
    void navigate({
      to: "/entities/$entitySlug",
      params: { entitySlug: row.entitySlug },
      search: { tab: "identifiers" },
    });
  }

  return {
    rows,
    table,
    columns,
    createForm,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    confidenceFilter,
    setConfidenceFilter,
    submitError,
    composing,
    openComposer,
    closeComposer,
    submitCreate,
    onComposerKey,
    filterChips,
    emptyText,
    onRowClick,
    entityOptions,
    evidenceOptions,
  };
}
