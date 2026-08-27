import type { QueryClient } from "@tanstack/react-query";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useRef, useState } from "react";
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

type IdentifierCreateValues = Parameters<
  Parameters<typeof useIdentifierCreateForm>[0]
>[0]["value"];

type IdentifierComposerSubmitContext = {
  caseId: string;
  queryClient: QueryClient;
  resetFormRef: MutableRefObject<(() => void) | null>;
  setComposing: Dispatch<SetStateAction<boolean>>;
  setSubmitError: Dispatch<SetStateAction<string | null>>;
};

async function submitIdentifierCreate(
  ctx: IdentifierComposerSubmitContext,
  value: IdentifierCreateValues
): Promise<void> {
  const platform = normalizeIdentifierPlatform(value.platform);
  await createIdentifierFn({
    data: {
      caseId: ctx.caseId,
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
  await invalidateAfterEntityChanged(ctx.queryClient, ctx.caseId, {
    entityId: value.entityId,
  });
}

async function handleIdentifierCreateSubmit(
  ctx: IdentifierComposerSubmitContext,
  value: IdentifierCreateValues,
  reset: () => void
): Promise<void> {
  if (!identifierCreateCanSubmit(value, { requireEntity: true })) {
    if (isHandleWithoutPlatform(value.type, value.platform)) {
      ctx.setSubmitError(HANDLE_REQUIRES_PLATFORM);
    }
    return;
  }
  ctx.setSubmitError(null);
  try {
    await submitIdentifierCreate(ctx, value);
    reset();
    ctx.setComposing(false);
  } catch (error) {
    ctx.setSubmitError(errMessage(error, "Failed to add"));
  }
}

function identifierCreateOnSubmit(ctx: IdentifierComposerSubmitContext) {
  return ({
    value,
    reset,
  }: {
    value: IdentifierCreateValues;
    reset: () => void;
  }) => handleIdentifierCreateSubmit(ctx, value, reset);
}

function buildIdentifierComposerControls(
  createForm: {
    reset: () => void;
    handleSubmit: () => Promise<void> | void;
    state: { isSubmitting: boolean; values: IdentifierCreateValues };
  },
  setSubmitError: Dispatch<SetStateAction<string | null>>,
  setComposing: Dispatch<SetStateAction<boolean>>
) {
  const closeComposer = () => {
    createForm.reset();
    setComposing(false);
  };

  const openComposer = () => {
    createForm.reset();
    setSubmitError(null);
    setComposing(true);
  };

  const submitCreate = () => {
    void createForm.handleSubmit();
  };

  const onComposerKey = (e: React.KeyboardEvent) => {
    tableComposerKeyDown({
      busy: createForm.state.isSubmitting,
      canSubmit: identifierCreateCanSubmit(createForm.state.values, {
        requireEntity: true,
      }),
      onSubmit: submitCreate,
      onCancel: closeComposer,
    })(e);
  };

  return { closeComposer, openComposer, submitCreate, onComposerKey };
}

export function useIdentifiersTableComposer(
  caseId: string,
  queryClient: QueryClient
) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const resetFormRef = useRef<(() => void) | null>(null);

  const submitContext: IdentifierComposerSubmitContext = {
    caseId,
    queryClient,
    resetFormRef,
    setComposing,
    setSubmitError,
  };

  const createForm = useIdentifierCreateForm(
    identifierCreateOnSubmit(submitContext)
  );

  resetFormRef.current = () => createForm.reset();

  const controls = buildIdentifierComposerControls(
    createForm,
    setSubmitError,
    setComposing
  );

  return {
    createForm,
    submitError,
    composing,
    ...controls,
  };
}
