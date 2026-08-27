import type { QueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { createIdentifierFn } from "@/domains/entities/identifiers/identifiers.functions";
import { errMessage } from "@/lib/utils";
import {
  HANDLE_REQUIRES_PLATFORM,
  isHandleWithoutPlatform,
} from "@/shared/ui/identifiers/identifier-cells";
import {
  identifierCreateCanSubmit,
  useIdentifierCreateForm,
} from "@/shared/ui/identifiers/identifier-composer";
import { invalidateAfterEntityChanged } from "@/shared/lib/query-invalidation";
import { tableComposerKeyDown } from "@/shared/ui/data-table";
import { normalizeIdentifierPlatform } from "@watchdog/schemas";

async function submitIdentifierCreate(
  caseId: string,
  queryClient: QueryClient,
  value: Parameters<
    Parameters<typeof useIdentifierCreateForm>[0]
  >[0]["value"]
): Promise<void> {
  const platform = normalizeIdentifierPlatform(value.platform);
  await createIdentifierFn({
    data: {
      caseId,
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
  await invalidateAfterEntityChanged(queryClient, caseId, {
    entityId: value.entityId,
  });
}

export function useIdentifiersTableComposer(
  caseId: string,
  queryClient: QueryClient
) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const createForm = useIdentifierCreateForm(async ({ value, reset }) => {
    if (!identifierCreateCanSubmit(value, { requireEntity: true })) {
      if (isHandleWithoutPlatform(value.type, value.platform)) {
        setSubmitError(HANDLE_REQUIRES_PLATFORM);
      }
      return;
    }
    setSubmitError(null);
    try {
      await submitIdentifierCreate(caseId, queryClient, value);
      reset();
      setComposing(false);
    } catch (error) {
      setSubmitError(errMessage(error, "Failed to add"));
    }
  });

  const closeComposer = useCallback(() => {
    createForm.reset();
    setComposing(false);
  }, [createForm]);

  const openComposer = useCallback(() => {
    createForm.reset();
    setSubmitError(null);
    setComposing(true);
  }, [createForm]);

  const submitCreate = useCallback(() => {
    void createForm.handleSubmit();
  }, [createForm]);

  const onComposerKey = useCallback(
    (e: React.KeyboardEvent) => {
      tableComposerKeyDown({
        busy: createForm.state.isSubmitting,
        canSubmit: identifierCreateCanSubmit(createForm.state.values, {
          requireEntity: true,
        }),
        onSubmit: submitCreate,
        onCancel: closeComposer,
      })(e);
    },
    [closeComposer, createForm, submitCreate]
  );

  return {
    createForm,
    submitError,
    composing,
    openComposer,
    closeComposer,
    submitCreate,
    onComposerKey,
  };
}
