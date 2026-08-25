import type { CellContext, ColumnDef, FilterFn } from "@tanstack/react-table";

import { isTaskDueOverdue } from "@/domains/tasks/lib/due-date";
import type { TaskEntityLabel, TaskRecord } from "@/domains/tasks/types";
import { cn } from "@/lib/utils";
import {
  DataTable,
  DataTableAddRow,
  DataTableColumnHeader,
  DataTablePagination,
  useDataTable,
} from "@/shared/ui/data-table";
import { LocalDateTime } from "@/shared/ui/local-date-time";
import { SearchField } from "@/shared/ui/search-field";
import { TaskPriorityBadge, TaskStatusBadge } from "@/shared/ui/vocab";

const taskGlobalFilterFn: FilterFn<TaskRecord> = (row, _id, filterValue) => {
  const q = String(filterValue ?? "")
    .toLowerCase()
    .trim();
  if (!q) return true;
  const t = row.original;
  return (
    t.title.toLowerCase().includes(q) ||
    (t.description ?? "").toLowerCase().includes(q) ||
    t.status.toLowerCase().includes(q) ||
    (t.priority ?? "").toLowerCase().includes(q)
  );
};

function renderTitle(ctx: CellContext<TaskRecord, unknown>) {
  return (
    <span className="block truncate text-sm font-medium">
      {ctx.row.original.title}
    </span>
  );
}

function renderStatus(ctx: CellContext<TaskRecord, unknown>) {
  return <TaskStatusBadge status={ctx.row.original.status} />;
}

function renderPriority(ctx: CellContext<TaskRecord, unknown>) {
  const p = ctx.row.original.priority;
  return p ? <TaskPriorityBadge priority={p} /> : <span>—</span>;
}

function renderDue(ctx: CellContext<TaskRecord, unknown>) {
  const task = ctx.row.original;
  return (
    <span
      className={cn(
        isTaskDueOverdue(task.dueDate, task.status) && "text-destructive"
      )}
    >
      <LocalDateTime value={task.dueDate} dateOnly />
    </span>
  );
}

function createTaskColumns(
  compact: boolean,
  entityById?: Map<string, TaskEntityLabel>
): ColumnDef<TaskRecord>[] {
  function renderEntity(ctx: CellContext<TaskRecord, unknown>) {
    const id = ctx.row.original.entityId;
    if (!id) return <span className="text-muted-foreground">—</span>;
    const name = entityById?.get(id)?.name;
    return <span className="truncate">{name ?? "Linked entity"}</span>;
  }

  const columns: ColumnDef<TaskRecord>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: renderTitle,
      size: 280,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: renderStatus,
      size: 140,
      minSize: 120,
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: renderPriority,
      size: 110,
      minSize: 90,
    },
  ];

  if (!compact) {
    columns.push({
      id: "entity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Entity" />
      ),
      cell: renderEntity,
      size: 180,
      minSize: 140,
    });
  }

  columns.push({
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due" />
    ),
    cell: renderDue,
    size: 110,
    minSize: 90,
  });

  return columns;
}

function asFilterString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

interface Props {
  tasks: TaskRecord[];
  entityById?: Map<string, TaskEntityLabel>;
  onSelect: (task: TaskRecord) => void;
  onAdd?: () => void;
  selectedId?: string | null;
  compact?: boolean;
}

export function TaskTable({
  tasks,
  entityById,
  onSelect,
  onAdd,
  selectedId,
  compact = false,
}: Props) {
  const columns = createTaskColumns(compact, entityById);

  const { table } = useDataTable({
    data: tasks,
    columns,
    globalFilterFn: taskGlobalFilterFn,
    getRowId: (row) => row.id,
  });

  const filterValue = asFilterString(table.getState().globalFilter);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {compact ? null : (
        <SearchField
          value={filterValue}
          onValueChange={(v) => {
            table.setGlobalFilter(v);
          }}
          placeholder="Filter tasks…"
          aria-label="Filter tasks"
          className="w-full max-w-sm flex-none shrink-0"
        />
      )}
      <div className="min-h-0 flex-1 overflow-auto">
        <DataTable
          table={table}
          emptyText={onAdd ? "No tasks yet" : "No tasks."}
          onRowClick={(row) => {
            onSelect(row);
          }}
          className={
            selectedId
              ? "[&_tbody_tr[data-selected=true]]:bg-muted/40"
              : undefined
          }
          appendRow={
            onAdd && !compact ? (
              <DataTableAddRow
                colSpan={columns.length}
                label="Add task"
                onClick={onAdd}
              />
            ) : undefined
          }
        />
      </div>
      {compact ? null : <DataTablePagination table={table} />}
    </div>
  );
}
