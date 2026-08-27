import { useForm } from "@tanstack/react-form";
import { useCallback, useState } from "react";

import { errMessage } from "@/lib/utils";
import { tableComposerKeyDown } from "@/shared/ui/data-table";
import type { EntityKind } from "@watchdog/schemas";

type CreateEntityFn = (name: string, kind: EntityKind) => Promise<void>;

export function useEntityTableComposer(createEntity: CreateEntityFn) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const createForm = useForm({
    defaultValues: { name: "", kind: "person" as EntityKind },
    onSubmit: async ({ value }) => {
      const nextName = value.name.trim();
      if (!nextName) return;
      setSubmitError(null);
      try {
        await createEntity(nextName, value.kind);
        createForm.reset();
        setComposing(false);
      } catch (error) {
        setSubmitError(errMessage(error, "Create failed"));
      }
    },
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
        canSubmit: Boolean(createForm.getFieldValue("name").trim()),
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
