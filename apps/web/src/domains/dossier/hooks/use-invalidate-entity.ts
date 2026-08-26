import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { DossierSectionProps } from "@/domains/dossier/types";
import { invalidateAfterEntityChanged } from "@/shared/lib/query-invalidation";

/** Invalidate entity-scoped Query caches after a dossier mutation. */
export function useInvalidateEntity({
  caseId,
  entityId,
  entitySlug,
}: DossierSectionProps) {
  const queryClient = useQueryClient();
  return useCallback(
    async () =>
      invalidateAfterEntityChanged(queryClient, caseId, {
        entityId,
        slug: entitySlug,
      }),
    [queryClient, caseId, entityId, entitySlug]
  );
}
