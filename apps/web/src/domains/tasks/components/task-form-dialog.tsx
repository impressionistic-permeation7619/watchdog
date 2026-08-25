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
import type { TaskRecord } from "@/domains/tasks/types";
import { EntityCombobox } from "@/shared/ui/entity-combobox";
import { FieldSelect } from "@/shared/ui/field-select";
import { FormInlineError } from "@/shared/ui/form-inline-message";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/shadcn/field";
import { Input } from "@/shared/ui/shadcn/input";
import { Textarea } from "@/shared/ui/shadcn/textarea";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from "@/shared/ui/vocab";
import {
  taskPrioritySchema,
  taskStatusSchema,
  type TaskStatus,
} from "@watchdog/schemas";

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

          <FieldGroup className="gap-3">
            <form.Field name="title">
              {(field) => (
                <Field>
                  <FieldLabel>Title</FieldLabel>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                    }}
                    disabled={busy}
                    aria-label="Task title"
                    autoFocus
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                    }}
                    disabled={busy}
                    aria-label="Task description"
                    className="min-h-20"
                  />
                </Field>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-3">
              <form.Field name="status">
                {(field) => (
                  <Field>
                    <FieldLabel>Status</FieldLabel>
                    <FieldSelect
                      value={field.state.value}
                      options={TASK_STATUS_OPTIONS}
                      onValueChange={(next) => {
                        field.handleChange(taskStatusSchema.parse(next));
                      }}
                      disabled={busy}
                      aria-label="Task status"
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="priority">
                {(field) => (
                  <Field>
                    <FieldLabel>Priority</FieldLabel>
                    <FieldSelect
                      value={field.state.value}
                      options={[
                        { value: "", label: "None" },
                        ...TASK_PRIORITY_OPTIONS,
                      ]}
                      onValueChange={(next) => {
                        field.handleChange(
                          next === "" ? "" : taskPrioritySchema.parse(next)
                        );
                      }}
                      disabled={busy}
                      aria-label="Task priority"
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            <form.Field name="dueDate">
              {(field) => (
                <Field>
                  <FieldLabel>Due date</FieldLabel>
                  <Input
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                    }}
                    disabled={busy}
                    aria-label="Due date"
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="entityId">
              {(field) => (
                <Field>
                  <FieldLabel>Entity</FieldLabel>
                  <EntityCombobox
                    entities={entities}
                    value={field.state.value}
                    onValueChange={(id) => {
                      field.handleChange(id);
                    }}
                    disabled={busy}
                    emptyLabel="No entity"
                    aria-label="Linked entity"
                  />
                </Field>
              )}
            </form.Field>
          </FieldGroup>

          {error ? <FormInlineError>{error}</FormInlineError> : null}

          {mode === "edit" ? (
            <DialogFooter className="sm:justify-between">
              {onDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => {
                    void onDelete();
                  }}
                >
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    onOpenChange(false);
                  }}
                >
                  Cancel
                </Button>
                <form.Subscribe
                  selector={(state) =>
                    [state.canSubmit, state.isSubmitting] as const
                  }
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      disabled={busy || !canSubmit || isSubmitting}
                    >
                      {busy || isSubmitting ? "Saving…" : "Save"}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <form.Subscribe
                selector={(state) =>
                  [state.canSubmit, state.isSubmitting] as const
                }
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={busy || !canSubmit || isSubmitting}
                  >
                    {busy || isSubmitting ? "Creating…" : "Create"}
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
