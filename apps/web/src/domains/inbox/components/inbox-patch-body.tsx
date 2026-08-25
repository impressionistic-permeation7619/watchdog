import { CheckIcon, XIcon } from "lucide-react";

import { EvidencePreviewDrawer } from "@/domains/dossier/components/evidence-preview-drawer";
import { CONFIRMED_REQUIRES_EVIDENCE } from "@/domains/dossier/lib/confirmed-evidence";
import { PatchOpList } from "@/domains/inbox/components/patch-op-list";
import type { InboxAcceptForm } from "@/domains/inbox/hooks/use-inbox-detail-forms";
import type { ProposalRecord } from "@/domains/inbox/inbox.functions";
import { isConfirmedWithoutBundle } from "@/domains/inbox/lib/accept-validation";
import { buildDecideHeaderView } from "@/domains/inbox/lib/decide-header-view";
import type { EvidenceRecord } from "@/domains/intake/types";
import { DetailFooter } from "@/shared/ui/detail-footer";
import { EntityMention } from "@/shared/ui/entity-mention";
import { FetchErrorAlert } from "@/shared/ui/fetch-error-alert";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/shadcn/alert";
import { Button } from "@/shared/ui/shadcn/button";
import { patchNeedsConfidence } from "@watchdog/policy";
import { listInvalidIdentifierOps, patchOpText } from "@watchdog/schemas";

function summaryIsRedundant(proposal: ProposalRecord): boolean {
  const summary = proposal.summary?.trim();
  if (!summary) return true;
  return proposal.patch.some((op) => {
    if (op.resource !== "claim" && op.resource !== "question") return false;
    const text = patchOpText(op);
    return text !== undefined && text.trim() === summary;
  });
}

interface InboxPatchBodyProps {
  proposal: ProposalRecord;
  caseId: string;
  acceptForm: InboxAcceptForm;
  linkedIds: string[];
  evidenceById: Map<string, EvidenceRecord>;
  evidenceLoadError: string | null;
  pending: boolean;
  rejecting: boolean;
  onRejectingChange: (rejecting: boolean) => void;
  previewEvidence: EvidenceRecord | null;
  onPreviewEvidenceChange: (evidence: EvidenceRecord | null) => void;
}

export function InboxPatchBody({
  proposal,
  caseId,
  acceptForm,
  linkedIds,
  evidenceById,
  evidenceLoadError,
  pending,
  rejecting,
  onRejectingChange,
  previewEvidence,
  onPreviewEvidenceChange,
}: InboxPatchBodyProps) {
  const view = buildDecideHeaderView({ proposal, linkedIds, rejecting });
  const showSummary = !summaryIsRedundant(proposal);
  const needsConfidence = patchNeedsConfidence(proposal.patch);
  const acceptBusy = pending && view.decideMode === "accepting";
  const collisions = proposal.identifierCollisions ?? [];
  const invalidIdentifierOps = listInvalidIdentifierOps(proposal.patch);
  const hasInvalidIdentifierOps = invalidIdentifierOps.length > 0;

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-3">
          {showSummary &&
          proposal.summary !== null &&
          proposal.summary !== "" ? (
            <div className="bg-muted/30 rounded-md border px-3 py-2">
              <p className="text-muted-foreground text-xs font-medium">
                Summary
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-pretty">
                {proposal.summary}
              </p>
            </div>
          ) : null}

          {evidenceLoadError ? (
            <FetchErrorAlert error={evidenceLoadError} />
          ) : null}

          {hasInvalidIdentifierOps ? (
            <Alert>
              <AlertTitle>Invalid Identifier values</AlertTitle>
              <AlertDescription>
                <ul className="mt-1 flex flex-col gap-1">
                  {invalidIdentifierOps.map((hit) => (
                    <li key={hit.opId}>
                      <span className="text-foreground font-medium">
                        {hit.type}: {hit.value || "(empty)"}
                      </span>
                      {" — "}
                      {hit.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {collisions.length > 0 ? (
            <Alert>
              <AlertTitle>Already on another Entity</AlertTitle>
              <AlertDescription>
                <ul className="mt-1 flex flex-col gap-1">
                  {collisions.map((hit) => (
                    <li key={`${hit.opId}-${hit.entityId}`}>
                      <span className="text-foreground font-medium">
                        {hit.type}: {hit.value}
                      </span>
                      {" on "}
                      <EntityMention
                        name={hit.entityName}
                        slug={hit.entitySlug}
                        size="sm"
                      />
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <acceptForm.Subscribe selector={(state) => state.values.evidenceIds}>
            {(evidenceIds) => (
              <PatchOpList
                patch={proposal.patch}
                collidingOpIds={collisions.map((hit) => hit.opId)}
                invalidOpIds={invalidIdentifierOps.map((hit) => hit.opId)}
                sharedEvidenceIds={
                  evidenceIds.length > 0
                    ? [...new Set([...proposal.evidenceIds, ...evidenceIds])]
                    : proposal.evidenceIds
                }
                evidenceById={evidenceById}
                onEvidenceClick={onPreviewEvidenceChange}
                jobId={proposal.jobId}
              />
            )}
          </acceptForm.Subscribe>
        </div>
      </div>

      {view.showFooterActions ? (
        <DetailFooter>
          <acceptForm.Subscribe
            selector={(state) => ({
              confidence: state.values.confidence,
              evidenceIds: state.values.evidenceIds,
              attestationText: state.values.attestationText,
            })}
          >
            {({ confidence, evidenceIds, attestationText }) => {
              const confirmedWithoutBundle =
                needsConfidence &&
                isConfirmedWithoutBundle(
                  confidence,
                  evidenceIds,
                  linkedIds,
                  attestationText
                );

              return (
                <Button
                  type="button"
                  size="sm"
                  loading={acceptBusy}
                  disabled={confirmedWithoutBundle || hasInvalidIdentifierOps}
                  onClick={() => {
                    void acceptForm.handleSubmit();
                  }}
                  className="h-7"
                  title={
                    confirmedWithoutBundle
                      ? CONFIRMED_REQUIRES_EVIDENCE
                      : undefined
                  }
                >
                  {acceptBusy ? null : (
                    <CheckIcon className="size-3" data-icon="inline-start" />
                  )}
                  Accept
                </Button>
              );
            }}
          </acceptForm.Subscribe>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              onRejectingChange(true);
            }}
            className="h-7"
          >
            <XIcon className="size-3" data-icon="inline-start" />
            Reject
          </Button>
        </DetailFooter>
      ) : null}

      <EvidencePreviewDrawer
        evidence={previewEvidence}
        caseId={caseId}
        onClose={() => {
          onPreviewEvidenceChange(null);
        }}
      />
    </>
  );
}
