import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import type { CaseRecord } from "@/domains/cases/types";
import { identifiersTableColumns } from "@/domains/entities/components/identifiers-table.columns";
import { identifiersForCaseQuery } from "@/domains/entities/identifiers/queries";

import { useIdentifiersTableComposer } from "./use-identifiers-table-composer";
import { useIdentifiersTableMutations } from "./use-identifiers-table-mutations";
import { useIdentifiersTableState } from "./use-identifiers-table-state";

export function useIdentifiersTable(active: CaseRecord) {
  const queryClient = useQueryClient();
  const { data: rows } = useSuspenseQuery(identifiersForCaseQuery(active.id));
  const mutations = useIdentifiersTableMutations(active.id, rows);
  const tableState = useIdentifiersTableState(active, rows, mutations);
  const composer = useIdentifiersTableComposer(active.id, queryClient);

  return {
    ...tableState,
    ...composer,
    columns: identifiersTableColumns,
  };
}
