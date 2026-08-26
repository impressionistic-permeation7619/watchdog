/* oxlint-disable react/only-export-components, react-doctor/only-export-components -- column factory + shared options for IdentifiersSection */
import type { CellContext, ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { IdentifierEvidenceCell } from "@/shared/ui/identifiers/identifier-evidence-cell";
import {
  CONFIRMED_REQUIRES_EVIDENCE_HINT,
  isConfirmedBlocked,
} from "@/shared/lib/confirmed-evidence";
import type { EvidenceOption } from "@/shared/ui/intake/evidence-option";
import type { IdentifierRecord } from "@/domains/entities/identifiers/identifiers.functions";
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
  type EditableSelectOption,
} from "@/shared/ui/data-table";
import {
  CONFIDENCE_OPTIONS,
  IDENTIFIER_PLATFORM_OPTIONS,
  IDENTIFIER_STATUS_OPTIONS,
  IDENTIFIER_TYPE_OPTIONS,
} from "@/shared/ui/vocab";
import {
  confidenceTierSchema,
  identifierStatusSchema,
  identifierTypeSchema,
  identifierPlatformMeta,
  normalizeIdentifierPlatform,
  type ConfidenceTier,
  type IdentifierStatus,
  type IdentifierType,
} from "@watchdog/schemas";

export {
  HANDLE_REQUIRES_PLATFORM,
  isHandleWithoutPlatform,
} from "@/domains/entities/lib/commit-identifier-field";

export const PLATFORM_OPTIONS: EditableSelectOption[] =
  IDENTIFIER_PLATFORM_OPTIONS;

export const TYPE_OPTIONS: EditableSelectOption[] = IDENTIFIER_TYPE_OPTIONS;
export const STATUS_OPTIONS: EditableSelectOption[] = IDENTIFIER_STATUS_OPTIONS;

function buildHref(
  type: IdentifierType,
  value: string,
  platform: string
): string | null {
  const v = value.trim();
  if (!v) return null;
  switch (type) {
    case "email": {
      return `mailto:${v}`;
    }
    case "phone": {
      return `tel:${v.replaceAll(/\s/g, "")}`;
    }
    case "url": {
      return v.startsWith("http") ? v : `https://${v}`;
    }
    case "domain": {
      return `https://${v.replace(/^\*\./, "")}`;
    }
    case "handle": {
      const meta = identifierPlatformMeta(
        normalizeIdentifierPlatform(platform)
      );
      if (meta?.urlTemplate === undefined || meta.urlTemplate === "")
        return null;
      let handle = v;
      if (
        meta.stripSigil !== undefined &&
        meta.stripSigil !== "" &&
        handle.startsWith(meta.stripSigil)
      ) {
        handle = handle.slice(meta.stripSigil.length);
      }
      handle = handle.replace(/^@+/, "").replace(/^u\//, "");
      return meta.urlTemplate.replaceAll("{value}", handle);
    }
    case "credential":
    case "crypto":
    case "pgp":
    case "ip":
    case "other": {
      return null;
    }
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export interface IdentifierFieldUpdate {
  value?: string;
  platform?: string;
  type?: IdentifierType;
  status?: IdentifierStatus;
  confidence?: ConfidenceTier;
  notes?: string;
}

export interface IdentifierTableMeta {
  updateField: (identifierId: string, field: IdentifierFieldUpdate) => void;
  evidenceOptions: EvidenceOption[];
  onEvidenceClick?: (evidenceId: string) => void;
  saveEvidence: (
    identifierId: string,
    evidenceIds: string[]
  ) => void | Promise<void>;
}

export function createIdentifierColumns(
  meta: IdentifierTableMeta
): ColumnDef<IdentifierRecord>[] {
  const { updateField } = meta;

  function renderIdentifierValueCell(
    ctx: CellContext<IdentifierRecord, unknown>
  ) {
    const row = ctx.row.original;
    const href = buildHref(row.type, row.value, row.platform);
    return (
      <EditableTextCell
        value={row.value}
        placeholder="Value…"
        aria-label="Identifier value"
        suffix={
          href !== null && href !== "" ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground ml-1"
              onClick={(e) => {
                e.stopPropagation();
              }}
              title="Open"
            >
              ↗
            </a>
          ) : undefined
        }
        onCommit={(next) => {
          const value = tryCommitIdentifierValue(row.type, next, row.platform);
          if (value === false) return false;
          updateField(row.id, { value });
          // oxlint-disable-next-line unicorn/no-useless-undefined -- consistent-return requires an explicit value alongside the `false` return above
          return undefined;
        }}
      />
    );
  }

  function renderIdentifierTypeCell(
    ctx: CellContext<IdentifierRecord, unknown>
  ) {
    const row = ctx.row.original;
    return (
      <EditableSelectCell
        value={row.type}
        options={TYPE_OPTIONS}
        aria-label="Type"
        onCommit={(next) => {
          const type = identifierTypeSchema.parse(next);
          const committed = tryCommitIdentifierType(
            type,
            row.value,
            row.platform
          );
          if (committed === false) return;
          updateField(row.id, committed);
        }}
      />
    );
  }

  function renderIdentifierPlatformCell(
    ctx: CellContext<IdentifierRecord, unknown>
  ) {
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
          updateField(row.id, { platform });
        }}
      />
    );
  }

  function renderIdentifierStatusCell(
    ctx: CellContext<IdentifierRecord, unknown>
  ) {
    const row = ctx.row.original;
    return (
      <EditableSelectCell
        value={row.status}
        options={STATUS_OPTIONS}
        aria-label="Status"
        onCommit={(next) => {
          updateField(row.id, { status: identifierStatusSchema.parse(next) });
        }}
      />
    );
  }

  function renderIdentifierConfidenceCell(
    ctx: CellContext<IdentifierRecord, unknown>
  ) {
    const row = ctx.row.original;
    return (
      <EditableSelectCell
        value={row.confidence}
        options={CONFIDENCE_OPTIONS}
        aria-label="Confidence"
        onCommit={(next) => {
          const confidence = confidenceTierSchema.parse(next);
          if (isConfirmedBlocked(confidence, row.evidenceIds)) {
            toast.error(CONFIRMED_REQUIRES_EVIDENCE_HINT);
            return;
          }
          updateField(row.id, { confidence });
        }}
      />
    );
  }

  function renderIdentifierEvidenceCell(
    ctx: CellContext<IdentifierRecord, unknown>
  ) {
    const row = ctx.row.original;
    function handleEvidenceClick(id: string) {
      meta.onEvidenceClick?.(id);
    }
    return (
      <IdentifierEvidenceCell
        row={row}
        evidenceOptions={meta.evidenceOptions}
        onEvidenceClick={handleEvidenceClick}
        saveEvidence={meta.saveEvidence}
      />
    );
  }

  function renderIdentifierNotesCell(
    ctx: CellContext<IdentifierRecord, unknown>
  ) {
    const row = ctx.row.original;
    return (
      <EditableTextCell
        value={row.notes ?? ""}
        placeholder="Notes…"
        aria-label="Notes"
        onCommit={(next) => {
          updateField(row.id, { notes: next });
        }}
      />
    );
  }

  return [
    {
      accessorKey: "value",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Value" />
      ),
      cell: renderIdentifierValueCell,
      size: 180,
      meta: { label: "Value" },
      enableHiding: false,
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: renderIdentifierTypeCell,
      size: 140,
      minSize: 120,
      meta: { label: "Type" },
    },
    {
      accessorKey: "platform",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Platform" />
      ),
      cell: renderIdentifierPlatformCell,
      size: 140,
      minSize: 120,
      meta: { label: "Platform" },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: renderIdentifierStatusCell,
      size: 140,
      minSize: 120,
      meta: { label: "Status" },
    },
    {
      accessorKey: "confidence",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Confidence" />
      ),
      cell: renderIdentifierConfidenceCell,
      size: 140,
      minSize: 120,
      meta: { label: "Confidence" },
    },
    {
      id: "evidence",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Evidence" />
      ),
      cell: renderIdentifierEvidenceCell,
      enableSorting: false,
      size: 120,
      meta: { label: "Evidence" },
    },
    {
      accessorKey: "notes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Notes" />
      ),
      cell: renderIdentifierNotesCell,
      enableSorting: false,
      size: 140,
      meta: { label: "Notes" },
    },
  ];
}
