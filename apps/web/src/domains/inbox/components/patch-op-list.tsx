import { Link } from "@tanstack/react-router";
import { ChevronDownIcon } from "lucide-react";
import type { ReactNode } from "react";

import { evidenceIdsForOp, evidenceLabel } from "@/domains/inbox/lib/evidence";
import type { EvidenceRecord } from "@/domains/intake/types";
import { DetailStatusChip } from "@/shared/ui/detail-status-chip";
import { IdChip } from "@/shared/ui/id-chip";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/shadcn/collapsible";
import { PATCH_RESOURCE_META, PatchOpBadge } from "@/shared/ui/vocab";
import type { JsonObject, PatchOp } from "@watchdog/schemas";

type Resource = PatchOp["resource"];

const EMPTY_IDS: string[] = [];

/** Safely stringify an unknown patch-data field without `[object Object]` noise. */
function stringifyField(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function summarizeData(resource: Resource, data: JsonObject): string {
  switch (resource) {
    case "claim": {
      return stringifyField(data.text, JSON.stringify(data));
    }
    case "identifier": {
      const type = stringifyField(data.type);
      const value = stringifyField(data.value);
      const platform = data.platform
        ? ` (${stringifyField(data.platform)})`
        : "";
      return `${type}${platform}: ${value}`;
    }
    case "edge": {
      return stringifyField(data.predicate, "related_to");
    }
    case "event": {
      return `${stringifyField(data.when)} — ${stringifyField(data.what)}`.trim();
    }
    case "question": {
      return stringifyField(data.text, JSON.stringify(data));
    }
    case "entity": {
      return `${stringifyField(data.kind)}: ${stringifyField(data.name)}`;
    }
    default: {
      const _exhaustive: never = resource;
      return JSON.stringify(_exhaustive);
    }
  }
}

/**
 * Evidence shared by the whole patch (proposal shared ids, or the intersection
 * of every op that cites anything). Used to de-dupe per-op chips.
 */
function sharedPatchEvidenceIds(
  patch: PatchOp[],
  sharedEvidenceIds: string[]
): string[] {
  if (sharedEvidenceIds.length > 0) return sharedEvidenceIds;

  const perOp = patch
    .map((op) => evidenceIdsForOp(op, EMPTY_IDS))
    .filter((ids) => ids.length > 0);
  if (perOp.length === 0) return EMPTY_IDS;
  if (perOp.length === 1) return perOp[0] ?? EMPTY_IDS;

  const first = perOp[0] ?? EMPTY_IDS;
  return first.filter((id) => perOp.every((ids) => ids.includes(id)));
}

function EvidenceChips({
  ids,
  evidenceById,
  onEvidenceClick,
}: {
  ids: string[];
  evidenceById?: Map<string, EvidenceRecord>;
  onEvidenceClick?: (evidence: EvidenceRecord) => void;
}) {
  if (ids.length === 0) return null;

  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1">
      {ids.map((id) => {
        const row = evidenceById?.get(id);
        if (!row) {
          return <IdChip key={id} value={id} className="opacity-70" />;
        }
        const label = evidenceLabel(row);
        const chip = (
          <DetailStatusChip
            size="sm"
            className="max-w-[14rem] truncate"
            title={label}
          >
            {label}
          </DetailStatusChip>
        );
        if (!onEvidenceClick) return <span key={id}>{chip}</span>;
        return (
          <button
            key={id}
            type="button"
            className="max-w-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEvidenceClick(row);
            }}
          >
            {chip}
          </button>
        );
      })}
    </span>
  );
}

function PatchOpRow({
  op,
  localIds,
  evidenceById,
  onEvidenceClick,
  colliding,
  invalid,
}: {
  op: PatchOp;
  localIds: string[];
  evidenceById?: Map<string, EvidenceRecord>;
  onEvidenceClick?: (evidence: EvidenceRecord) => void;
  colliding?: boolean;
  invalid?: boolean;
}) {
  const meta = PATCH_RESOURCE_META[op.resource];
  const summary = summarizeData(op.resource, op.data);

  return (
    <div className="border-border flex flex-col gap-1.5 rounded-md border px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <PatchOpBadge op={op.op} />
        <span className="text-foreground text-xs font-medium">
          {meta.label}
        </span>
        {colliding ? (
          <DetailStatusChip size="sm">On another Entity</DetailStatusChip>
        ) : null}
        {invalid ? (
          <DetailStatusChip size="sm">Invalid value</DetailStatusChip>
        ) : null}
      </div>
      <p className="text-muted-foreground text-xs leading-snug break-words whitespace-pre-wrap">
        {summary}
      </p>
      {localIds.length > 0 ? (
        <EvidenceChips
          ids={localIds}
          evidenceById={evidenceById}
          onEvidenceClick={onEvidenceClick}
        />
      ) : null}
    </div>
  );
}

function ChangesCard({
  title,
  headerEnd,
  children,
}: {
  title: ReactNode;
  /** Interactive chrome (e.g. copyable IdChip) — never inside the trigger. */
  headerEnd?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Collapsible
      defaultOpen
      className="border-border overflow-hidden rounded-md border"
    >
      <div className="flex w-full items-start">
        <CollapsibleTrigger className="group/run-trigger hover:bg-muted/40 focus-visible:ring-ring/50 flex min-w-0 flex-1 items-start gap-2 px-3 py-2.5 text-left outline-none focus-visible:ring-2">
          <ChevronDownIcon
            className="text-muted-foreground mt-0.5 size-3.5 shrink-0 transition-transform group-aria-expanded/run-trigger:rotate-180"
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {title}
          </div>
        </CollapsibleTrigger>
        {headerEnd === undefined ? null : (
          <div className="flex shrink-0 items-center py-2.5 pr-3">
            {headerEnd}
          </div>
        )}
      </div>
      <CollapsibleContent className="border-border space-y-3 border-t px-3 py-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Patch ledger — one Changes collapsible nesting Job id, ops, and Open in Jobs.
 * Matches Intake Jobs run-card chrome (single toggle).
 */
export function PatchOpList({
  patch,
  sharedEvidenceIds = EMPTY_IDS,
  evidenceById,
  onEvidenceClick,
  jobId,
  collidingOpIds = EMPTY_IDS,
  invalidOpIds = EMPTY_IDS,
}: {
  patch: PatchOp[];
  sharedEvidenceIds?: string[];
  evidenceById?: Map<string, EvidenceRecord>;
  onEvidenceClick?: (evidence: EvidenceRecord) => void;
  /** Producing Job — IdChip in the Changes card header. */
  jobId?: string | null;
  collidingOpIds?: string[];
  invalidOpIds?: string[];
}) {
  if (patch.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Empty patch (no ops).</p>
    );
  }

  const bundleIds = sharedPatchEvidenceIds(patch, sharedEvidenceIds);
  const bundleSet = new Set(bundleIds);
  const collidingSet = new Set(collidingOpIds);
  const invalidSet = new Set(invalidOpIds);
  const hasJob = jobId !== null && jobId !== undefined && jobId !== "";

  return (
    <ChangesCard
      title={
        <>
          <p className="text-foreground text-xs font-medium">Changes</p>
          <DetailStatusChip size="sm">{patch.length}</DetailStatusChip>
        </>
      }
      headerEnd={hasJob ? <IdChip value={jobId} copyable /> : undefined}
    >
      <div className="flex flex-col gap-2">
        {patch.map((op) => {
          const allIds = evidenceIdsForOp(op, sharedEvidenceIds);
          const localIds = allIds.filter((id) => !bundleSet.has(id));
          return (
            <PatchOpRow
              key={op.id}
              op={op}
              localIds={localIds}
              evidenceById={evidenceById}
              onEvidenceClick={onEvidenceClick}
              colliding={collidingSet.has(op.id)}
              invalid={invalidSet.has(op.id)}
            />
          );
        })}
      </div>

      {hasJob ? (
        <Button
          nativeButton={false}
          variant="outline"
          size="sm"
          className="h-7 self-start text-xs"
          render={<Link to="/jobs" search={{ jobId }} />}
        >
          Open in Jobs
        </Button>
      ) : null}
    </ChangesCard>
  );
}
