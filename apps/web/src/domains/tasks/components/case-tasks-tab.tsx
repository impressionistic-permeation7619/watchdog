import { Link } from "@tanstack/react-router";

import { TaskFormDialog } from "@/domains/tasks/components/task-form-dialog";
import { TaskTable } from "@/domains/tasks/components/task-table";
import { useTaskWorkspace } from "@/domains/tasks/hooks/use-task-workspace";
import { EmptyState } from "@/shared/ui/empty-state";
import { Button } from "@/shared/ui/shadcn/button";

export function CaseTasksTab({ caseId }: { caseId: string }) {
  const ws = useTaskWorkspace(caseId);

  if (ws.tasks.length === 0) {
    return (
      <EmptyState
        intent="blank-slate"
        items="tasks"
        description="Create tasks on the Tasks board for this case."
        action={
          <Button size="sm" nativeButton={false} render={<Link to="/tasks" />}>
            Open Tasks
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link to="/tasks" />}
        >
          Open board
        </Button>
      </div>
      <TaskTable
        tasks={ws.tasks}
        entityById={ws.entityById}
        selectedId={ws.selected?.id}
        onSelect={ws.handleSelect}
      />
      <TaskFormDialog
        mode="edit"
        open={ws.selected !== null}
        onOpenChange={(open) => {
          if (!open) ws.closeSelected();
        }}
        task={ws.selected}
        entities={ws.entities}
        busy={ws.updateBusy}
        error={ws.formError}
        onSubmit={ws.handleUpdate}
        onDelete={ws.handleDelete}
      />
    </div>
  );
}
