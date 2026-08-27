import { useForm } from "@tanstack/react-form";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useRef, useState } from "react";

import { errMessage } from "@/lib/utils";
import { tableComposerKeyDown } from "@/shared/ui/data-table";
import type { EntityKind } from "@watchdog/schemas";

type CreateEntityFn = (name: string, kind: EntityKind) => Promise<void>;

type EntityCreateValues = { name: string; kind: EntityKind };

type EntityComposerSubmitContext = {
  createEntity: CreateEntityFn;
  resetFormRef: MutableRefObject<(() => void) | null>;
  setComposing: Dispatch<SetStateAction<boolean>>;
  setSubmitError: Dispatch<SetStateAction<string | null>>;
};

async function submitEntityCreate(
  ctx: EntityComposerSubmitContext,
  value: EntityCreateValues
): Promise<void> {
  const nextName = value.name.trim();
  if (!nextName) return;
  ctx.setSubmitError(null);
  try {
    await ctx.createEntity(nextName, value.kind);
    ctx.resetFormRef.current?.();
    ctx.setComposing(false);
  } catch (error) {
    ctx.setSubmitError(errMessage(error, "Create failed"));
  }
}

function entityCreateOnSubmit(ctx: EntityComposerSubmitContext) {
  return ({ value }: { value: EntityCreateValues }) =>
    submitEntityCreate(ctx, value);
}

function buildEntityComposerControls(
  createForm: {
    reset: () => void;
    handleSubmit: () => Promise<void> | void;
    state: { isSubmitting: boolean };
    getFieldValue: (field: "name") => string;
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
      canSubmit: Boolean(createForm.getFieldValue("name").trim()),
      onSubmit: submitCreate,
      onCancel: closeComposer,
    })(e);
  };

  return { closeComposer, openComposer, submitCreate, onComposerKey };
}

export function useEntityTableComposer(createEntity: CreateEntityFn) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const resetFormRef = useRef<(() => void) | null>(null);

  const submitContext: EntityComposerSubmitContext = {
    createEntity,
    resetFormRef,
    setComposing,
    setSubmitError,
  };

  const createForm = useForm({
    defaultValues: { name: "", kind: "person" as EntityKind },
    onSubmit: entityCreateOnSubmit(submitContext),
  });

  resetFormRef.current = () => createForm.reset();

  const controls = buildEntityComposerControls(
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
