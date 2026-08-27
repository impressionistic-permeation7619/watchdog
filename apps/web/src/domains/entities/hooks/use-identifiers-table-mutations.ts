import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

import type { CaseIdentifierRecord } from "@/domains/entities/identifiers/types";
import { updateIdentifierFn } from "@/domains/entities/identifiers/identifiers.functions";
import type { IdentifierFieldUpdate } from "@/shared/ui/identifiers/identifier-cells";
import { errMessage } from "@/lib/utils";
import { invalidateAfterEntityChanged } from "@/shared/lib/query-invalidation";
import type {
  ConfidenceTier,
  IdentifierStatus,
  IdentifierType,
} from "@watchdog/schemas";

export function useIdentifiersTableMutations(
  caseId: string,
  rows: CaseIdentifierRecord[]
) {
  const queryClient = useQueryClient();

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
    }) => updateIdentifierFn({ data: { caseId, ...input } }),
    onSuccess: async (_data, vars) => {
      toast.success("Updated");
      const row = rows.find((r) => r.id === vars.identifierId);
      await invalidateAfterEntityChanged(queryClient, caseId, {
        entityId: row?.entityId,
      });
    },
    onError: (e) => {
      toast.error(errMessage(e, "Update failed"));
    },
  });

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

  return { updateField, saveEvidence };
}
