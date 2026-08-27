import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

import type { CaseRecord } from "@/domains/cases/types";
import {
  entityGlobalFilterFn,
  entityTableColumns,
  type EntityTableMeta,
} from "@/domains/entities/components/entity-table.columns";
import { edgesForCaseQuery } from "@/domains/entities/edges/queries";
import { connectionPeersByEntityId } from "@/domains/entities/lib/connection-peers";
import { entitiesListQuery } from "@/domains/entities/queries";
import type { PageFilterChip } from "@/shared/layout/page-filter-menu";
import { useDataTable } from "@/shared/ui/data-table";

import { useEntityTableComposer } from "./use-entity-table-composer";
import { useEntityTableMutations } from "./use-entity-table-mutations";

export function useEntityTable(active: CaseRecord) {
  const navigate = useNavigate();
  const { data: rows } = useSuspenseQuery(entitiesListQuery(active.id));
  const { data: caseEdges } = useSuspenseQuery(edgesForCaseQuery(active.id));

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string[]>([]);

  const peersByEntityId = useMemo(
    () => connectionPeersByEntityId(caseEdges),
    [caseEdges]
  );

  const entityOptions = useMemo(
    () => rows.map((e) => ({ id: e.id, name: e.name, kind: e.kind })),
    [rows]
  );

  const {
    updateKind,
    updateSummary,
    createConnection,
    updateConnection,
    createEntity,
  } = useEntityTableMutations(active.id);

  const composer = useEntityTableComposer(createEntity);

  const columnFilters = useMemo(() => {
    if (kindFilter.length === 0) return [];
    return [{ id: "kind", value: kindFilter }];
  }, [kindFilter]);

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

  const onRowClick = useCallback(
    (row: { slug: string }) => {
      void navigate({
        to: "/entities/$entitySlug",
        params: { entitySlug: row.slug },
      });
    },
    [navigate]
  );

  return {
    rows,
    table,
    columns: entityTableColumns,
    ...composer,
    search,
    setSearch,
    kindFilter,
    setKindFilter,
    filterChips,
    emptyText,
    onRowClick,
  };
}
