import type { CaseRecord } from "@/domains/cases/types";
import { entityTableColumns } from "@/domains/entities/components/entity-table.columns";

import { useEntityTableComposer } from "./use-entity-table-composer";
import { useEntityTableMutations } from "./use-entity-table-mutations";
import { useEntityTableState } from "./use-entity-table-state";

export function useEntityTable(active: CaseRecord) {
  const mutations = useEntityTableMutations(active.id);
  const tableState = useEntityTableState(active, mutations);
  const composer = useEntityTableComposer(mutations.createEntity);

  return {
    ...tableState,
    ...composer,
    columns: entityTableColumns,
  };
}
