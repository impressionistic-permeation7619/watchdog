import { useForm } from "@tanstack/react-form";
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
  entityGlobalFilterFn,
  entityTableColumns,
  type EntityTableMeta,
} from "@/domains/entities/components/entity-table.columns";
import {
  createEdgeFn,
  updateEdgeFn,
} from "@/domains/entities/edges/edges.functions";
import { edgesForCaseQuery } from "@/domains/entities/edges/queries";
import {
  createEntityFn,
  updateEntityFieldsFn,
} from "@/domains/entities/entities.functions";
import { connectionPeersByEntityId } from "@/domains/entities/lib/connection-peers";
import {
  buildCreateEdgeData,
  buildUpdateEdgeData,
  type CreateEntityConnectionInput,
  type UpdateEntityConnectionInput,
} from "@/domains/entities/lib/edge-write";
import { entitiesListQuery } from "@/domains/entities/queries";
import { errMessage, slugifyName } from "@/lib/utils";
import type { PageFilterChip } from "@/shared/layout/page-filter-menu";
import { invalidateAfterEntityChanged } from "@/shared/lib/query-invalidation";
import { tableComposerKeyDown, useDataTable } from "@/shared/ui/data-table";
import type { EntityKind } from "@watchdog/schemas";

export function useEntityTable(active: CaseRecord) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: rows } = useSuspenseQuery(entitiesListQuery(active.id));
  const { data: caseEdges } = useSuspenseQuery(edgesForCaseQuery(active.id));

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const peersByEntityId = useMemo(
    () => connectionPeersByEntityId(caseEdges),
    [caseEdges]
  );

  const entityOptions = useMemo(
    () => rows.map((e) => ({ id: e.id, name: e.name, kind: e.kind })),
    [rows]
  );

  const createForm = useForm({
    defaultValues: { name: "", kind: "person" as EntityKind },
    onSubmit: async ({ value }) => {
      const nextName = value.name.trim();
      if (!nextName) return;
      setSubmitError(null);
      try {
        await createEntityFn({
          data: {
            caseId: active.id,
            kind: value.kind,
            name: nextName,
            slug: slugifyName(nextName),
          },
        });
        createForm.reset();
        setComposing(false);
        toast.success("Entity created");
        await invalidateAfterEntityChanged(queryClient, active.id);
      } catch (error) {
        setSubmitError(errMessage(error, "Create failed"));
      }
    },
  });

  const columnFilters = useMemo(() => {
    if (kindFilter.length === 0) return [];
    return [{ id: "kind", value: kindFilter }];
  }, [kindFilter]);

  const updateMutation = useMutation({
    mutationFn: async (vars: {
      entityId: string;
      kind?: EntityKind;
      summary?: string;
    }) =>
      updateEntityFieldsFn({
        data: {
          caseId: active.id,
          entityId: vars.entityId,
          ...(vars.kind === undefined ? {} : { kind: vars.kind }),
          ...(vars.summary === undefined ? {} : { summary: vars.summary }),
        },
      }),
    onSuccess: async () => {
      toast.success("Updated");
      await invalidateAfterEntityChanged(queryClient, active.id);
    },
    onError: (e) => {
      toast.error(errMessage(e, "Update failed"));
    },
  });

  const connectionMutation = useMutation({
    mutationFn: async (vars: {
      centerId: string;
      input: CreateEntityConnectionInput;
    }) =>
      createEdgeFn({
        data: buildCreateEdgeData({
          caseId: active.id,
          centerId: vars.centerId,
          core: vars.input,
        }),
      }),
    onSuccess: async (_data, vars) => {
      toast.success("Connection added");
      await invalidateAfterEntityChanged(queryClient, active.id, {
        entityId: vars.centerId,
      });
    },
  });

  const connectionUpdateMutation = useMutation({
    mutationFn: async (vars: {
      centerId: string;
      input: UpdateEntityConnectionInput;
    }) =>
      updateEdgeFn({
        data: buildUpdateEdgeData({
          caseId: active.id,
          centerId: vars.centerId,
          edgeId: vars.input.edgeId,
          core: vars.input,
          existing: {
            fromId: vars.input.existingFromId,
            toId: vars.input.existingToId,
            peerId: vars.input.existingPeerId,
          },
        }),
      }),
    onSuccess: async (_data, vars) => {
      toast.success("Connection updated");
      await invalidateAfterEntityChanged(queryClient, active.id, {
        entityId: vars.centerId,
      });
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
      canSubmit: Boolean(createForm.getFieldValue("name").trim()),
      onSubmit: submitCreate,
      onCancel: closeComposer,
    })(e);
  }

  const updateKind = useCallback(
    (entityId: string, kind: EntityKind) => {
      updateMutation.mutate({ entityId, kind });
    },
    [updateMutation]
  );

  const updateSummary = useCallback(
    (entityId: string, summary: string) => {
      updateMutation.mutate({ entityId, summary });
    },
    [updateMutation]
  );

  const createConnection = useCallback(
    async (centerId: string, input: CreateEntityConnectionInput) => {
      await connectionMutation.mutateAsync({ centerId, input });
    },
    [connectionMutation]
  );

  const updateConnection = useCallback(
    async (centerId: string, input: UpdateEntityConnectionInput) => {
      await connectionUpdateMutation.mutateAsync({ centerId, input });
    },
    [connectionUpdateMutation]
  );

  const tableMeta = useMemo<EntityTableMeta>(
    () => ({
      updateKind,
      updateSummary,
      peersByEntityId,
      entityOptions,
      createConnection,
      updateConnection,
    }),
    [
      updateKind,
      updateSummary,
      peersByEntityId,
      entityOptions,
      createConnection,
      updateConnection,
    ]
  );

  const { table } = useDataTable({
    data: rows,
    columns: entityTableColumns,
    meta: tableMeta,
    getRowId: (row) => row.id,
    globalFilter: search,
    onGlobalFilterChange: setSearch,
    columnFilters,
    globalFilterFn: entityGlobalFilterFn,
    initialSorting: [{ id: "name", desc: false }],
    pageSize: 50,
  });

  const filterChips: PageFilterChip[] = kindFilter.map((k) => ({
    id: `kind:${k}`,
    label: k,
    onClear: () => {
      setKindFilter(kindFilter.filter((x) => x !== k));
    },
  }));

  const emptyText =
    rows.length === 0
      ? "No entities yet — add one below."
      : "No entities match your filters.";

  function onRowClick(row: { slug: string }) {
    void navigate({
      to: "/entities/$entitySlug",
      params: { entitySlug: row.slug },
    });
  }

  return {
    rows,
    table,
    columns: entityTableColumns,
    createForm,
    search,
    setSearch,
    kindFilter,
    setKindFilter,
    submitError,
    composing,
    openComposer,
    closeComposer,
    submitCreate,
    onComposerKey,
    filterChips,
    emptyText,
    onRowClick,
  };
}
