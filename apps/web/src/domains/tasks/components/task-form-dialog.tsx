/* oxlint-disable react/only-export-components -- dialog + form helpers re-export */
import { useForm } from "@tanstack/react-form";
import { useEffect, type SubmitEvent } from "react";

import {
  EMPTY_TASK_FORM,
  defaultsFromTask,
  normalizeTaskForm,
  taskFormIssues,
  type TaskFormValues,
} from "@/domains/tasks/lib/task-form";
import { TaskFormDialogFooter } from "@/domains/tasks/components/task-form-dialog-footer";
import { TaskFormFields } from "@/domains/tasks/components/task-form-dialog-fields";
import type { TaskDialogForm } from "@/domains/tasks/components/task-form-dialog-form";
import type { TaskRecord } from "@/domains/tasks/types";
import { FormInlineError } from "@/shared/ui/form-inline-message";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import type { TaskStatus } from "@watchdog/schemas";

export type { TaskFormValues } from "@/domains/tasks/lib/task-form";

interface EntityOption {
  id: string;
  name: string;
  kind?: "person" | "infra" | "org";
}

interface BaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entities: EntityOption[];
  busy?: boolean;
  error?: string | null;
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
}

type CreateProps = BaseProps & {
  mode: "create";
  task?: never;
  defaultEntityId?: string | null;
  defaultStatus?: TaskStatus;
  onDelete?: never;
};

type EditProps = BaseProps & {
  mode: "edit";
  task: TaskRecord | null;
  defaultEntityId?: never;
  defaultStatus?: never;
  onDelete?: () => void | Promise<void>;
};

type Props = CreateProps | EditProps;

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

export function TaskFormDialog(props: Props) {
  const {
    open,
    onOpenChange,
    entities,
    busy = false,
    error = null,
    onSubmit,
    mode,
  } = props;

  const defaultStatus =
    mode === "create" ? (props.defaultStatus ?? "backlog") : "backlog";
  const defaultEntityId = mode === "create" ? props.defaultEntityId : null;
  const task = mode === "edit" ? props.task : null;
  const onDelete = mode === "edit" ? props.onDelete : undefined;

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
    if (mode === "edit") {
      if (!task) return;
      form.reset(defaultsFromTask(task));
      return;
    }
    form.reset(createDefaults(defaultStatus, defaultEntityId));
  }, [open, mode, task, defaultEntityId, defaultStatus, form]);

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? "Edit task" : "New task"}
            </DialogTitle>
          </DialogHeader>

          <TaskFormFields
            form={form as TaskDialogForm}
            entities={entities}
            busy={busy}
          />

          {error ? <FormInlineError>{error}</FormInlineError> : null}

          <TaskFormDialogFooter
            form={form as TaskDialogForm}
            mode={mode}
            busy={busy}
            onOpenChange={onOpenChange}
            onDelete={onDelete}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
