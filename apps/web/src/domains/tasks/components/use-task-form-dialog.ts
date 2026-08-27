import { useForm } from "@tanstack/react-form";
import { useEffect, type SubmitEvent } from "react";

import {
  EMPTY_TASK_FORM,
  defaultsFromTask,
  normalizeTaskForm,
  taskFormIssues,
  type TaskFormValues,
} from "@/domains/tasks/lib/task-form";
import type { TaskDialogForm } from "@/domains/tasks/components/task-form-dialog-form";
import type { TaskRecord } from "@/domains/tasks/types";
import type { TaskStatus } from "@watchdog/schemas";

interface TaskFormDialogCoreProps {
  open: boolean;
  mode: "create" | "edit";
  task: TaskRecord | null;
  defaultStatus: TaskStatus;
  defaultEntityId: string | null | undefined;
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
}

function createDefaults(
  defaultStatus: TaskStatus,
  defaultEntityId: string | null | undefined
): TaskFormValues {
  return {
    ...EMPTY_TASK_FORM,
    status: defaultStatus,
    entityId: defaultEntityId ?? "",
  };
}

function resetTaskFormValues(
  form: TaskDialogForm,
  props: TaskFormDialogCoreProps
): void {
  if (props.mode === "edit") {
    if (!props.task) return;
    form.reset(defaultsFromTask(props.task));
    return;
  }
  form.reset(createDefaults(props.defaultStatus, props.defaultEntityId));
}

export function useTaskFormDialog(props: TaskFormDialogCoreProps) {
  const { open, mode, task, defaultStatus, defaultEntityId, onSubmit } = props;

  const form = useForm({
    defaultValues:
      mode === "edit" && task
        ? defaultsFromTask(task)
        : createDefaults(defaultStatus, defaultEntityId),
    onSubmit: async ({ value }) => {
      if (taskFormIssues(value).length > 0) return;
      await onSubmit(normalizeTaskForm(value));
    },
  });

  useEffect(() => {
    if (!open) return;
    resetTaskFormValues(form as TaskDialogForm, {
      open,
      mode,
      task,
      defaultStatus,
      defaultEntityId,
      onSubmit,
    });
  }, [open, mode, task, defaultEntityId, defaultStatus, form, onSubmit]);

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  }

  return { form: form as TaskDialogForm, handleSubmit };
}
