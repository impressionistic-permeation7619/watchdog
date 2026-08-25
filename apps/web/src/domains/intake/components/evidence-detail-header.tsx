import { Link } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { IntakeEvidenceActions } from "@/domains/intake/hooks/use-intake-actions";
import {
  evidenceTitle,
  type latestEnrichOutput,
} from "@/domains/intake/lib/evidence";
import type { EvidenceRecord } from "@/domains/intake/types";
import type { JobListRecord } from "@/domains/jobs/jobs.functions";
import { ComposerShell } from "@/shared/ui/composer-shell";
import { DetailStatusChip } from "@/shared/ui/detail-status-chip";
import { EntityCombobox, type EntityOption } from "@/shared/ui/entity-combobox";
import { IdChip } from "@/shared/ui/id-chip";
import { LocalDateTime } from "@/shared/ui/local-date-time";
import { MetaRow } from "@/shared/ui/meta-row";
import { RelativeTime } from "@/shared/ui/relative-time";
import { Button } from "@/shared/ui/shadcn/button";
import { TabsList, TabsTrigger } from "@/shared/ui/shadcn/tabs";
import { TabCount } from "@/shared/ui/tab-count";
import { WithTooltip } from "@/shared/ui/timestamp";
import { KindBadge, StatusBadge, capabilityLabel } from "@/shared/ui/vocab";

type EvidenceLifecycleStatus = "cancelled" | "succeeded" | "pending";

function evidenceLifecycle(
  isHidden: boolean,
  processed: boolean
): { status: EvidenceLifecycleStatus; label: string } {
  if (isHidden) return { status: "cancelled", label: "hidden" };
  if (processed) return { status: "succeeded", label: "processed" };
  return { status: "pending", label: "unprocessed" };
}

function entityLabel(entityName: string | null | undefined): string {
  return entityName !== null && entityName !== undefined && entityName !== ""
    ? entityName
    : "Unattached";
}

function EvidenceEntityEditor({
  attachedId,
  entities,
  attaching,
  onAttachEntity,
  onClose,
}: {
  attachedId: string;
  entities: readonly EntityOption[];
  attaching: boolean;
  onAttachEntity: (entityId: string) => void;
  onClose: () => void;
}) {
  const editorRef = useRef<HTMLSpanElement>(null);

  function handleEntityChange(next: string) {
    onClose();
    if (next === attachedId) return;
    onAttachEntity(next);
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (editorRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest("[data-slot=combobox-content]")
      ) {
        return;
      }
      onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <span ref={editorRef} className="inline-flex items-center">
      <EntityCombobox
        entities={entities}
        value={attachedId}
        onValueChange={handleEntityChange}
        emptyLabel="Unattached"
        aria-label="Attach to entity"
        disabled={attaching}
        autoFocus
        showClear={false}
        className="h-6 w-44 [&_[data-slot=input-group-addon]]:py-0 [&_[data-slot=input-group-control]]:h-6"
      />
    </span>
  );
}

function EvidenceEntityMeta({
  entityName,
  attachedId,
  entities,
  attaching,
  isHidden,
  onAttachEntity,
}: {
  entityName?: string | null;
  attachedId: string;
  entities?: readonly EntityOption[];
  attaching: boolean;
  isHidden: boolean;
  onAttachEntity?: (entityId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const label = entityLabel(entityName);
  const canEdit =
    !isHidden && onAttachEntity !== undefined && entities !== undefined;

  function handleStartEdit() {
    setEditing(true);
  }

  const handleCloseEditor = useCallback(() => {
    setEditing(false);
  }, []);

  const slug =
    attachedId === ""
      ? undefined
      : entities?.find((ent) => ent.id === attachedId)?.slug;
  const nameClass =
    attachedId === "" ? "text-muted-foreground" : "text-foreground/80";
  const nameEl =
    slug !== undefined && slug !== "" ? (
      <Link
        to="/entities/$entitySlug"
        params={{ entitySlug: slug }}
        className="text-foreground/80 hover:text-foreground underline-offset-2 hover:underline"
      >
        {label}
      </Link>
    ) : (
      <span className={nameClass}>{label}</span>
    );

  if (!canEdit || entities === undefined || onAttachEntity === undefined) {
    return nameEl;
  }

  if (editing) {
    return (
      <EvidenceEntityEditor
        attachedId={attachedId}
        entities={entities}
        attaching={attaching}
        onAttachEntity={onAttachEntity}
        onClose={handleCloseEditor}
      />
    );
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-0.5">
      {nameEl}
      <WithTooltip content="Change entity" wrapSpan>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground size-5 [&_svg]:size-2.5"
          aria-label="Change entity"
          disabled={attaching}
          onClick={handleStartEdit}
        >
          <PencilIcon />
        </Button>
      </WithTooltip>
    </span>
  );
}

export function EvidenceHeaderActions({
  isHidden,
  actions,
  canEnrich,
  processed,
  allowThirdPartyEgress = false,
  onHideRequested,
}: {
  isHidden: boolean;
  actions: IntakeEvidenceActions;
  canEnrich: boolean;
  processed: boolean;
  allowThirdPartyEgress?: boolean;
  onHideRequested: () => void;
}) {
  const {
    busy,
    processing,
    aiProcessing,
    enriching,
    onProcess,
    onAiProcess,
    onEnrich,
    onRestore,
  } = actions;

  if (isHidden) {
    return (
      <Button
        type="button"
        size="sm"
        className="h-7"
        disabled={busy}
        onClick={onRestore}
      >
        Restore
      </Button>
    );
  }

  const aiDisabled = busy || processed || !allowThirdPartyEgress;

  return (
    <>
      {canEnrich ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7"
          loading={enriching}
          disabled={busy}
          onClick={onEnrich}
        >
          Enrich
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        className="h-7"
        loading={processing}
        disabled={busy || processed}
        onClick={onProcess}
      >
        Harvest
      </Button>
      <WithTooltip
        content={
          allowThirdPartyEgress
            ? "LLM extract → Inbox Proposal"
            : "Needs Case third-party egress (Cases → edit)."
        }
        wrapSpan={aiDisabled}
      >
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7"
          loading={aiProcessing}
          disabled={aiDisabled}
          onClick={onAiProcess}
        >
          Extract (AI)
        </Button>
      </WithTooltip>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7"
        disabled={busy}
        onClick={onHideRequested}
      >
        Hide
      </Button>
    </>
  );
}

export function EvidenceDetailHeader({
  evidence,
  isHidden,
  processed,
  producingCap,
  entityName,
  entities,
  canEnrich,
  enrichJobs,
  enrichOutput,
  relatedJobs,
  attaching = false,
  onAttachEntity,
}: {
  evidence: EvidenceRecord;
  isHidden: boolean;
  processed: boolean;
  producingCap: JobListRecord | null;
  entityName?: string | null;
  entities?: readonly EntityOption[];
  canEnrich: boolean;
  enrichJobs: JobListRecord[];
  enrichOutput: ReturnType<typeof latestEnrichOutput>;
  relatedJobs: JobListRecord[];
  attaching?: boolean;
  onAttachEntity?: (entityId: string) => void;
}) {
  const lifecycle = evidenceLifecycle(isHidden, processed);
  const attachedId = evidence.entityId ?? "";

  return (
    <header className="border-border flex shrink-0 flex-col border-b">
      <div className="flex flex-col gap-2 px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-3">
          <nav
            aria-label="Evidence path"
            className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs"
          >
            <KindBadge kind={evidence.kind} size="md" />
            <span aria-hidden>/</span>
            <span className="text-foreground font-medium">
              {evidenceTitle(evidence)}
            </span>
            <span aria-hidden>/</span>
            <IdChip value={evidence.id} copyable />
          </nav>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <StatusBadge status={lifecycle.status} size="md">
              {lifecycle.label}
            </StatusBadge>
            {producingCap === null ? null : (
              <DetailStatusChip>Cap output</DetailStatusChip>
            )}
          </div>
        </div>

        <MetaRow label="Captured">
          <span className="text-muted-foreground">
            <LocalDateTime value={evidence.capturedAt} />
            <span aria-hidden> · </span>
            <RelativeTime value={evidence.capturedAt} />
            {evidence.processedAt === null ? null : (
              <>
                <span aria-hidden> · </span>
                processed <LocalDateTime value={evidence.processedAt} />
              </>
            )}
            {evidence.deletedAt === null ? null : (
              <>
                <span aria-hidden> · </span>
                hidden <LocalDateTime value={evidence.deletedAt} />
              </>
            )}
          </span>
        </MetaRow>

        {producingCap === null ? null : (
          <MetaRow label="From">
            <Link
              to="/jobs"
              search={{ jobId: producingCap.id }}
              className="text-foreground/80 hover:text-foreground underline-offset-2 hover:underline"
            >
              {capabilityLabel(producingCap.capabilityId)}
            </Link>
          </MetaRow>
        )}

        <MetaRow label="Entity">
          <EvidenceEntityMeta
            entityName={entityName}
            attachedId={attachedId}
            entities={entities}
            attaching={attaching}
            isHidden={isHidden}
            onAttachEntity={onAttachEntity}
          />
        </MetaRow>

        {isHidden ? (
          <p className="text-muted-foreground text-xs">
            Soft-deleted from the active queue. Restore to Harvest, Extract, or
            Enrich again.
          </p>
        ) : null}

        {evidence.notes !== null && evidence.notes !== "" ? (
          <ComposerShell density="dense" className="gap-0 px-2.5 py-2">
            <p className="text-muted-foreground text-xs leading-snug">
              {evidence.notes}
            </p>
          </ComposerShell>
        ) : null}
      </div>

      <div className="px-2 pb-0">
        <TabsList variant="line" className="h-8">
          <TabsTrigger value="content">Content</TabsTrigger>
          {canEnrich || enrichJobs.length > 0 ? (
            <TabsTrigger value="output" className="gap-1">
              Output
              {enrichOutput ? <TabCount n={1} /> : null}
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="jobs" className="gap-1">
            Jobs
            <TabCount n={relatedJobs.length} />
          </TabsTrigger>
        </TabsList>
      </div>
    </header>
  );
}
