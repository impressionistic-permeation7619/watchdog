import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { InboxDecideHeader } from "@/domains/inbox/components/inbox-decide-header";
import { InboxPatchBody } from "@/domains/inbox/components/inbox-patch-body";
import { useInboxDetailForms } from "@/domains/inbox/hooks/use-inbox-detail-forms";
import type { ProposalRecord } from "@/domains/inbox/inbox.functions";
import type { AcceptFormValues } from "@/domains/inbox/types";
import { evidenceListQuery } from "@/domains/intake/queries";
import type { EvidenceRecord } from "@/domains/intake/types";
import { errMessage } from "@/lib/utils";
import { DetailEmpty } from "@/shared/ui/detail-empty";

interface InboxDetailProps {
  proposal: ProposalRecord | null;
  caseId: string;
  pending: boolean;
  error: string | null;
  onAccept: (values: AcceptFormValues) => void;
  onReject: (reason: string) => void;
}

// Stable reference so `useMemo`s keyed on it don't invalidate every render
// while the query is still loading.
const EMPTY_EVIDENCE: EvidenceRecord[] = [];

/**
 * Inbox Detail — decide-band header (identity · confidence) + patch body +
 * DetailFooter Accept/Reject. Decided proposals use audit chrome (no footer).
 */
export function InboxDetail({
  proposal,
  caseId,
  pending,
  error,
  onAccept,
  onReject,
}: InboxDetailProps) {
  const [previewEvidence, setPreviewEvidence] = useState<EvidenceRecord | null>(
    null
  );

  const { acceptForm, rejectForm, linkedIds, rejecting, setRejecting } =
    useInboxDetailForms(proposal, onAccept, onReject);

  const evidenceQuery = useQuery({
    ...evidenceListQuery(caseId),
    // Always load Case evidence when Detail is open — picker needs the full list.
    enabled: Boolean(caseId),
    meta: { silentError: true },
  });
  const caseEvidence = evidenceQuery.data ?? EMPTY_EVIDENCE;
  const evidenceLoadError = evidenceQuery.isError
    ? errMessage(evidenceQuery.error, "Failed to load evidence")
    : null;

  const evidenceById = useMemo(() => {
    const map = new Map<string, EvidenceRecord>();
    for (const row of caseEvidence) map.set(row.id, row);
    return map;
  }, [caseEvidence]);

  const jobEvidence = useMemo(
    () =>
      linkedIds
        .map((id) => evidenceById.get(id))
        .filter((row): row is EvidenceRecord => Boolean(row)),
    [linkedIds, evidenceById]
  );
  const missingJobEvidenceCount = linkedIds.length - jobEvidence.length;

  if (!proposal) {
    return (
      <DetailEmpty
        title="Select a proposal"
        description="Choose a row from the queue to review the patch."
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <InboxDecideHeader
        proposal={proposal}
        acceptForm={acceptForm}
        rejectForm={rejectForm}
        linkedIds={linkedIds}
        caseEvidence={caseEvidence}
        missingJobEvidenceCount={missingJobEvidenceCount}
        pending={pending}
        error={error}
        rejecting={rejecting}
        onRejectingChange={setRejecting}
      />

      <InboxPatchBody
        proposal={proposal}
        caseId={caseId}
        acceptForm={acceptForm}
        linkedIds={linkedIds}
        evidenceById={evidenceById}
        evidenceLoadError={evidenceLoadError}
        pending={pending}
        rejecting={rejecting}
        onRejectingChange={setRejecting}
        previewEvidence={previewEvidence}
        onPreviewEvidenceChange={setPreviewEvidence}
      />
    </div>
  );
}
