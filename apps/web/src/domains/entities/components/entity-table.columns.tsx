/* oxlint-disable react/only-export-components -- column factory for EntityTable */
import type { CellContext, ColumnDef, FilterFn } from "@tanstack/react-table";

import { EntityConnectionsCell } from "@/domains/entities/components/entity-connections-cell";
import type { EntityConnectionPeer } from "@/domains/entities/lib/connection-peers";
import type {
  CreateEntityConnectionInput,
  UpdateEntityConnectionInput,
} from "@/domains/entities/lib/edge-write";
import type { EntityRecord } from "@/domains/entities/types";
import {
  DataTableColumnHeader,
  EditableSelectCell,
  EditableTextCell,
} from "@/shared/ui/data-table";
import type { EntityOption } from "@/shared/ui/entity-combobox";
import { RelativeTime } from "@/shared/ui/relative-time";
import { ENTITY_KIND_OPTIONS } from "@/shared/ui/vocab";
import { entityKindSchema, type EntityKind } from "@watchdog/schemas";

export const entityGlobalFilterFn: FilterFn<EntityRecord> = (
  row,
  _id,
  filterValue
) => {
  const q = String(filterValue ?? "")
    .toLowerCase()
    .trim();
  if (!q) return true;
  const e = row.original;
  return (
    e.name.toLowerCase().includes(q) ||
    e.slug.toLowerCase().includes(q) ||
    e.kind.toLowerCase().includes(q) ||
    (e.summary ?? "").toLowerCase().includes(q)
  );
};

export interface EntityTableMeta {
  updateKind: (entityId: string, kind: EntityKind) => void;
  updateSummary: (entityId: string, summary: string) => void;
  peersByEntityId: ReadonlyMap<string, readonly EntityConnectionPeer[]>;
  entityOptions: readonly EntityOption[];
  createConnection: (
    centerId: string,
    input: CreateEntityConnectionInput
  ) => Promise<void>;
  updateConnection: (
    centerId: string,
    input: UpdateEntityConnectionInput
  ) => Promise<void>;
}

function renderNameCell(ctx: CellContext<EntityRecord, unknown>) {
  return (
    <span className="block truncate text-sm font-medium">
      {ctx.row.original.name}
    </span>
  );
}

export function createEntityColumns(
  meta: EntityTableMeta
): ColumnDef<EntityRecord>[] {
  function renderKindCell(ctx: CellContext<EntityRecord, unknown>) {
    const row = ctx.row.original;
    return (
      <EditableSelectCell
        value={row.kind}
        options={ENTITY_KIND_OPTIONS}
        aria-label="Entity kind"
        onCommit={(next) => {
          const kind = entityKindSchema.parse(next);
          if (kind === row.kind) return;
          meta.updateKind(row.id, kind);
        }}
      />
    );
  }

  function renderConnectionsCell(ctx: CellContext<EntityRecord, unknown>) {
    const row = ctx.row.original;
    return (
      <EntityConnectionsCell
        entity={row}
        peers={meta.peersByEntityId.get(row.id) ?? []}
        entityOptions={meta.entityOptions}
        onCreate={async (input) => meta.createConnection(row.id, input)}
        onUpdate={async (input) => meta.updateConnection(row.id, input)}
      />
    );
  }

  function renderSummaryCell(ctx: CellContext<EntityRecord, unknown>) {
    const row = ctx.row.original;
    return (
      <EditableTextCell
        value={row.summary ?? ""}
        placeholder="Summary…"
        aria-label="Summary"
        onCommit={(next) => {
          const trimmed = next.trim();
          if (trimmed === (row.summary ?? "")) return;
          meta.updateSummary(row.id, trimmed);
        }}
      />
    );
  }

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: renderNameCell,
      meta: { label: "Name" },
      enableHiding: false,
      size: 150,
      minSize: 100,
    },
    {
      accessorKey: "kind",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Kind" />
      ),
      cell: renderKindCell,
      filterFn: (row, _id, value) => {
        if (!Array.isArray(value) || value.length === 0) return true;
        return value.includes(row.original.kind);
      },
      meta: { label: "Kind" },
      size: 120,
      minSize: 110,
    },
    {
      accessorKey: "summary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Summary" />
      ),
      cell: renderSummaryCell,
      meta: { label: "Summary" },
      size: 280,
    },
    {
      id: "connections",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Connections" />
      ),
      cell: renderConnectionsCell,
      enableSorting: false,
      meta: { label: "Connections" },
      size: 260,
      minSize: 180,
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Updated" />
      ),
      cell: ({ row }) => (
        <RelativeTime
          value={row.original.updatedAt}
          className="text-label-mono-sm whitespace-nowrap"
        />
      ),
      meta: { label: "Updated" },
      size: 110,
      minSize: 90,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <RelativeTime
          value={row.original.createdAt}
          className="text-label-mono-sm whitespace-nowrap"
        />
      ),
      meta: { label: "Created" },
      size: 110,
      minSize: 90,
    },
  ];
}
