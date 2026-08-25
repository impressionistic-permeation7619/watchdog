import {
  EvidenceCiteChips,
  EvidencePicker,
} from "@/domains/dossier/components/evidence-picker";
import { CONFIRMED_REQUIRES_EVIDENCE } from "@/domains/dossier/lib/confirmed-evidence";
import { AcceptGateMessage } from "@/domains/inbox/components/accept-gate-message";
import type {
  InboxAcceptForm,
  InboxRejectForm,
} from "@/domains/inbox/hooks/use-inbox-detail-forms";
import type { ProposalRecord } from "@/domains/inbox/inbox.functions";
import {
  isConfirmedWithoutBundle,
  totalEvidenceCount,
} from "@/domains/inbox/lib/accept-validation";
import {
  buildDecideHeaderView,
  decidedEdgeClass,
  type DecideEvidenceMode,
  type DecideHeaderView,
} from "@/domains/inbox/lib/decide-header-view";
import type { EvidenceRecord } from "@/domains/intake/types";
import { cn } from "@/lib/utils";
import { ComposerShell } from "@/shared/ui/composer-shell";
import { ConfidenceSelect } from "@/shared/ui/confidence-select";
import { DetailStatusChip } from "@/shared/ui/detail-status-chip";
import { FormInlineError } from "@/shared/ui/form-inline-message";
import { IdChip } from "@/shared/ui/id-chip";
import { LocalDateTime } from "@/shared/ui/local-date-time";
import { MetaRow } from "@/shared/ui/meta-row";
import { RelativeTime } from "@/shared/ui/relative-time";
import { Button } from "@/shared/ui/shadcn/button";
import { Textarea } from "@/shared/ui/shadcn/textarea";
import { StatusBadge } from "@/shared/ui/vocab";

interface InboxDecideHeaderProps {
  proposal: ProposalRecord;
  acceptForm: InboxAcceptForm;
  rejectForm: InboxRejectForm;
  linkedIds: string[];
  caseEvidence: EvidenceRecord[];
  missingJobEvidenceCount: number;
  pending: boolean;
  error: string | null;
  rejecting: boolean;
  onRejectingChange: (rejecting: boolean) => void;
}

function JobEvidenceMissingHint({ missingCount }: { missingCount: number }) {
  if (missingCount < 1) return null;
  return (
    <p className="text-muted-foreground text-xs">
      {missingCount} Job evidence id
      {missingCount === 1 ? "" : "s"} linked on Accept but not in this Case list
      (hidden or other Case).
    </p>
  );
}

function AcceptWarnings({
  acceptForm,
  linkedIds,
}: {
  acceptForm: InboxAcceptForm;
  linkedIds: string[];
}) {
  return (
    <acceptForm.Subscribe
      selector={(state) => ({
        confidence: state.values.confidence,
        evidenceIds: state.values.evidenceIds,
        attestationText: state.values.attestationText,
      })}
    >
      {({ confidence, evidenceIds, attestationText }) => {
        const totalEvidence = totalEvidenceCount(
          evidenceIds,
          linkedIds,
          attestationText
        );
        const confirmedWithoutBundle = isConfirmedWithoutBundle(
          confidence,
          evidenceIds,
          linkedIds,
          attestationText
        );
        const zeroEvidenceWarn =
          confidence !== "confirmed" && totalEvidence === 0;

        return (
          <AcceptGateMessage
            confirmedWithoutBundle={confirmedWithoutBundle}
            zeroEvidenceWarn={zeroEvidenceWarn}
          />
        );
      }}
    </acceptForm.Subscribe>
  );
}

function RejectComposer({
  rejectForm,
  pending,
  rejecting,
  onRejectingChange,
}: {
  rejectForm: InboxRejectForm;
  pending: boolean;
  rejecting: boolean;
  onRejectingChange: (rejecting: boolean) => void;
}) {
  return (
    <ComposerShell density="dense" className="gap-1.5">
      <rejectForm.Field name="rejectReason">
        {(field) => (
          <Textarea
            placeholder="Reject reason (optional)"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => {
              field.handleChange(e.target.value);
            }}
            className="min-h-10 text-xs"
            autoFocus
          />
        )}
      </rejectForm.Field>
      <p className="text-muted-foreground text-xs leading-snug">
        Rejected findings are remembered — Cap re-runs will skip them instead of
        re-proposing.
      </p>
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-6 text-xs"
          disabled={pending}
          onClick={() => {
            onRejectingChange(false);
            rejectForm.reset();
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="h-6 text-xs"
          loading={pending && rejecting}
          onClick={() => {
            void rejectForm.handleSubmit();
          }}
        >
          Confirm Reject
        </Button>
      </div>
    </ComposerShell>
  );
}

function PendingAcceptBand({
  acceptForm,
  linkedIds,
  caseEvidence,
  missingJobEvidenceCount,
  evidenceMode,
  showAttestation,
}: {
  acceptForm: InboxAcceptForm;
  linkedIds: string[];
  caseEvidence: EvidenceRecord[];
  missingJobEvidenceCount: number;
  evidenceMode: DecideEvidenceMode;
  showAttestation: boolean;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <MetaRow label="Confidence" className="w-auto flex-none">
            <acceptForm.Field name="confidence">
              {(field) => (
                <ConfidenceSelect
                  value={field.state.value}
                  onChange={(next) => {
                    field.handleChange(next);
                  }}
                />
              )}
            </acceptForm.Field>
          </MetaRow>
          {evidenceMode === "cite" ? (
            <EvidenceCiteChips options={caseEvidence} ids={linkedIds} />
          ) : (
            <acceptForm.Field
              name="evidenceIds"
              validators={{
                onChangeListenTo: ["confidence"],
                onChange: ({ value, fieldApi }) => {
                  const confidence = fieldApi.form.getFieldValue("confidence");
                  if (isConfirmedWithoutBundle(confidence, value, [], "")) {
                    return CONFIRMED_REQUIRES_EVIDENCE;
                  }
                  // oxlint-disable-next-line unicorn/no-useless-undefined -- TanStack Form: undefined = valid
                  return undefined;
                },
              }}
            >
              {(field) => (
                <EvidencePicker
                  options={caseEvidence}
                  selectedIds={field.state.value}
                  onChange={(ids) => {
                    field.handleChange(ids);
                  }}
                />
              )}
            </acceptForm.Field>
          )}
        </div>
        <JobEvidenceMissingHint missingCount={missingJobEvidenceCount} />
        {showAttestation ? (
          <acceptForm.Field name="attestationText">
            {(field) => (
              <Textarea
                placeholder="Optional attestation note (creates Evidence on Accept)"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                }}
                className="min-h-10 text-xs"
              />
            )}
          </acceptForm.Field>
        ) : null}
      </div>

      <AcceptWarnings acceptForm={acceptForm} linkedIds={linkedIds} />
    </>
  );
}

function DecideIdentity({
  proposal,
  view,
}: {
  proposal: ProposalRecord;
  view: DecideHeaderView;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <nav
        aria-label="Proposal path"
        className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs"
      >
        <span className="text-foreground font-medium">{view.crumbLead}</span>
        {view.showCapCrumb ? (
          <>
            <span aria-hidden>/</span>
            <span>{view.capLabel}</span>
          </>
        ) : null}
        <span aria-hidden>/</span>
        <IdChip value={proposal.id} copyable />
      </nav>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        <StatusBadge status={proposal.status} size="md" />
        {proposal.agentSourced ? (
          <DetailStatusChip>agent</DetailStatusChip>
        ) : null}
        {proposal.suppressedCount > 0 ? (
          <DetailStatusChip>
            {proposal.suppressedCount} suppressed
          </DetailStatusChip>
        ) : null}
      </div>
    </div>
  );
}

function DecideTimeMeta({
  proposal,
  view,
}: {
  proposal: ProposalRecord;
  view: DecideHeaderView;
}) {
  if (view.isPending) {
    return (
      <MetaRow label={view.timeLabel}>
        <span className="text-muted-foreground">
          <LocalDateTime value={proposal.createdAt} />
          <span aria-hidden> · </span>
          <RelativeTime value={proposal.createdAt} />
        </span>
      </MetaRow>
    );
  }

  return (
    <MetaRow label={view.timeLabel}>
      <span className="text-muted-foreground">
        {proposal.decidedAt ? (
          <LocalDateTime value={proposal.decidedAt} />
        ) : (
          <LocalDateTime value={proposal.createdAt} />
        )}
        {view.capLabel === null ? null : (
          <>
            <span aria-hidden> · </span>
            via {view.capLabel}
          </>
        )}
        <span aria-hidden> · </span>
        created <LocalDateTime value={proposal.createdAt} />
      </span>
    </MetaRow>
  );
}

function DecidedDecideBand({
  proposal,
  view,
}: {
  proposal: ProposalRecord;
  view: DecideHeaderView;
}) {
  if (!view.showRejectReason || !proposal.rejectReason) return null;
  return (
    <ComposerShell density="dense" className="gap-0 px-2.5 py-2">
      <p className="text-xs leading-snug">
        <span className="text-muted-foreground">Reason · </span>
        {proposal.rejectReason}
      </p>
    </ComposerShell>
  );
}

function PendingDecideBand({
  acceptForm,
  rejectForm,
  linkedIds,
  caseEvidence,
  missingJobEvidenceCount,
  pending,
  error,
  rejecting,
  onRejectingChange,
  view,
}: InboxDecideHeaderProps & { view: DecideHeaderView }) {
  return (
    <>
      {view.showAcceptBand ? (
        <PendingAcceptBand
          acceptForm={acceptForm}
          linkedIds={linkedIds}
          caseEvidence={caseEvidence}
          missingJobEvidenceCount={missingJobEvidenceCount}
          evidenceMode={view.evidenceMode}
          showAttestation={view.showAttestation}
        />
      ) : null}
      {view.showRejectComposer ? (
        <RejectComposer
          rejectForm={rejectForm}
          pending={pending}
          rejecting={rejecting}
          onRejectingChange={onRejectingChange}
        />
      ) : null}
      <FormInlineError>{error}</FormInlineError>
    </>
  );
}

export function InboxDecideHeader(props: InboxDecideHeaderProps) {
  const view = buildDecideHeaderView({
    proposal: props.proposal,
    linkedIds: props.linkedIds,
    rejecting: props.rejecting,
  });

  return (
    <header
      className={cn(
        "border-border shrink-0 border-b",
        decidedEdgeClass(props.proposal.status)
      )}
    >
      <div className="flex flex-col gap-2.5 px-4 py-3">
        <DecideIdentity proposal={props.proposal} view={view} />
        <DecideTimeMeta proposal={props.proposal} view={view} />
        {view.isPending ? (
          <PendingDecideBand {...props} view={view} />
        ) : (
          <DecidedDecideBand proposal={props.proposal} view={view} />
        )}
      </div>
    </header>
  );
}
