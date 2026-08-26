/* oxlint-disable react/only-export-components -- column factory for IdentifiersPage */
import type { CellContext, ColumnDef, FilterFn } from "@tanstack/react-table";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";

import { IdentifierEvidenceCell } from "@/shared/ui/identifiers/identifier-evidence-cell";
import {
  PLATFORM_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  type IdentifierFieldUpdate,
} from "@/shared/ui/identifiers/identifier-cells";
import {
  CONFIRMED_REQUIRES_EVIDENCE_HINT,
  isConfirmedBlocked,
} from "@/shared/lib/confirmed-evidence";
import type { EvidenceOption } from "@/shared/ui/intake/evidence-option";
import type { CaseIdentifierRecord } from "@/domains/entities/identifiers/types";
import {
  tryCommitIdentifierPlatform,
  tryCommitIdentifierType,
  tryCommitIdentifierValue,
} from "@/domains/entities/lib/commit-identifier-field";
import {
  DataTableColumnHeader,
  EditableSelectCell,
  EditableSuggestCell,
  EditableTextCell,
} from "@/shared/ui/data-table";
import { Button } from "@/shared/ui/shadcn/button";
import { CONFIDENCE_OPTIONS, KindBadge } from "@/shared/ui/vocab";
import {
  confidenceTierSchema,
  identifierStatusSchema,
  identifierTypeSchema,
} from "@watchdog/schemas";

export const identifiersGlobalFilterFn: FilterFn<CaseIdentifierRecord> = (
  row,
  _id,
  filterValue
) => {
  const q = String(filterValue ?? "")
    .toLowerCase()
    .trim();
  if (!q) return true;
  const r = row.original;
  return (
    r.value.toLowerCase().includes(q) ||
    r.entityName.toLowerCase().includes(q) ||
    r.entitySlug.toLowerCase().includes(q) ||
    r.platform.toLowerCase().includes(q) ||
    (r.notes ?? "").toLowerCase().includes(q) ||
    r.type.toLowerCase().includes(q) ||
    r.status.toLowerCase().includes(q) ||
    r.confidence.toLowerCase().includes(q)
  );
};

export interface IdentifiersTableMeta {
  evidenceOptions: EvidenceOption[];
  updateField: (identifierId: string, patch: IdentifierFieldUpdate) => void;
  saveEvidence: (
    identifierId: string,
    evidenceIds: string[]
  ) => void | Promise<void>;
}

function arrayIncludesFilter(value: unknown, cell: string): boolean {
  if (!Array.isArray(value) || value.length === 0) return true;
  return value.includes(cell);
}

function renderEntityCell(ctx: CellContext<CaseIdentifierRecord, unknown>) {
  const row = ctx.row.original;
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="truncate text-xs font-medium">{row.entityName}</span>
      <KindBadge kind={row.entityKind} className="text-chip shrink-0" />
    </div>
  );
}

export function createIdentifiersTableColumns(
  meta: IdentifiersTableMeta
): ColumnDef<CaseIdentifierRecord>[] {
  function renderTypeCell(ctx: CellContext<CaseIdentifierRecord, unknown>) {
    const row = ctx.row.original;
    return (
      <EditableSelectCell
        value={row.type}
        options={TYPE_OPTIONS}
        aria-label="Type"
        onCommit={(next) => {
          const type = identifierTypeSchema.parse(next);
          if (type === row.type) return;
          const committed = tryCommitIdentifierType(
            type,
            row.value,
            row.platform
          );
          if (committed === false) return;
          meta.updateField(row.id, committed);
        }}
      />
    );
  }

  function renderValueCell(ctx: CellContext<CaseIdentifierRecord, unknown>) {
    const row = ctx.row.original;
    return (
      <div className="flex min-w-0 items-center gap-1">
        <EditableTextCell
          value={row.value}
          placeholder="Value…"
          aria-label="Identifier value"
          onCommit={(next) => {
            const value = tryCommitIdentifierValue(
              row.type,
              next,
              row.platform
            );
            if (value === false) return false;
            meta.updateField(row.id, { value });
            // oxlint-disable-next-line unicorn/no-useless-undefined -- consistent-return with the `false` reject above
            return undefined;
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-6 shrink-0 p-0"
          aria-label="Copy value"
          onClick={(e) => {
            e.stopPropagation();
            void (async () => {
              try {
                await navigator.clipboard.writeText(row.value);
                toast.success("Copied");
              } catch {
                toast.error("Couldn't copy");
              }
            })();
          }}
        >
          <CopyIcon className="size-3" />
        </Button>
      </div>
    );
  }

  function renderPlatformCell(ctx: CellContext<CaseIdentifierRecord, unknown>) {
    const row = ctx.row.original;
    return (
      <EditableSuggestCell
        value={row.platform}
        options={PLATFORM_OPTIONS}
        placeholder="Platform"
        aria-label="Platform"
        onCommit={(next) => {
          const platform = tryCommitIdentifierPlatform(
            row.type,
            row.value,
            next
          );
          if (platform === false) return;
          if (platform === row.platform) return;
          meta.updateField(row.id, { platform });
        }}
      />
    );
  }

  function renderStatusCell(ctx: CellContext<CaseIdentifierRecord, unknown>) {
    const row = ctx.row.original;
    return (
      <EditableSelectCell
        value={row.status}
        options={STATUS_OPTIONS}
        aria-label="Status"
        onCommit={(next) => {
          const status = identifierStatusSchema.parse(next);
          if (status === row.status) return;
          meta.updateField(row.id, { status });
        }}
      />
    );
  }

  function renderConfidenceCell(
    ctx: CellContext<CaseIdentifierRecord, unknown>
  ) {
    const row = ctx.row.original;
    return (
      <EditableSelectCell
        value={row.confidence}
        options={CONFIDENCE_OPTIONS}
        aria-label="Confidence"
        onCommit={(next) => {
          const confidence = confidenceTierSchema.parse(next);
          if (confidence === row.confidence) return;
          if (isConfirmedBlocked(confidence, row.evidenceIds)) {
            toast.error(CONFIRMED_REQUIRES_EVIDENCE_HINT);
            return;
          }
          meta.updateField(row.id, { confidence });
        }}
      />
    );
  }

  function renderEvidenceCell(ctx: CellContext<CaseIdentifierRecord, unknown>) {
    const row = ctx.row.original;
    return (
      <IdentifierEvidenceCell
        row={row}
        evidenceOptions={meta.evidenceOptions}
        saveEvidence={meta.saveEvidence}
      />
    );
  }

  function renderNotesCell(ctx: CellContext<CaseIdentifierRecord, unknown>) {
    const row = ctx.row.original;
    return (
      <EditableTextCell
        value={row.notes ?? ""}
        placeholder="Notes…"
        aria-label="Notes"
        onCommit={(next) => {
          if (next === (row.notes ?? "")) return;
          meta.updateField(row.id, { notes: next });
        }}
      />
    );
  }

  return [
    {
      id: "entity",
      accessorFn: (row) => row.entityName,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Entity" />
      ),
      cell: renderEntityCell,
      meta: { label: "Entity" },
      enableHiding: false,
      size: 180,
    },
    {
      accessorKey: "value",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Value" />
      ),
      cell: renderValueCell,
      meta: { label: "Value" },
      enableHiding: false,
      size: 220,
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: renderTypeCell,
      filterFn: (row, _id, value) =>
        arrayIncludesFilter(value, row.original.type),
      meta: { label: "Type" },
      size: 140,
      minSize: 120,
    },
    {
      accessorKey: "platform",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Platform" />
      ),
      cell: renderPlatformCell,
      meta: { label: "Platform" },
      size: 140,
      minSize: 120,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: renderStatusCell,
      filterFn: (row, _id, value) =>
        arrayIncludesFilter(value, row.original.status),
      meta: { label: "Status" },
      size: 140,
      minSize: 120,
    },
    {
      accessorKey: "confidence",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Confidence" />
      ),
      cell: renderConfidenceCell,
      filterFn: (row, _id, value) =>
        arrayIncludesFilter(value, row.original.confidence),
      meta: { label: "Confidence" },
      size: 140,
      minSize: 120,
    },
    {
      id: "evidence",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Evidence" />
      ),
      cell: renderEvidenceCell,
      meta: { label: "Evidence" },
      size: 140,
      enableSorting: false,
    },
    {
      accessorKey: "notes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Notes" />
      ),
      cell: renderNotesCell,
      meta: { label: "Notes" },
      size: 180,
    },
  ];
}
