import { useForm } from "@tanstack/react-form";
import { useMemo, useState } from "react";

import type { ProposalRecord } from "@/domains/inbox/inbox.functions";
import { collectProposalEvidenceIds } from "@/domains/inbox/lib/evidence";
import type { AcceptFormValues } from "@/domains/inbox/types";
import type { ConfidenceTier } from "@watchdog/schemas";

const DEFAULT_CONFIDENCE: ConfidenceTier = "unverified";

export function useInboxDetailForms(
  proposal: ProposalRecord | null,
  onAccept: (values: AcceptFormValues) => void,
  onReject: (reason: string) => void
) {
  const [rejecting, setRejecting] = useState(false);

  const acceptForm = useForm({
    defaultValues: {
      confidence: DEFAULT_CONFIDENCE,
      evidenceIds: [] as string[],
      attestationText: "",
    } satisfies AcceptFormValues,
    onSubmit: ({ value }) => {
      onAccept(value);
    },
  });

  const rejectForm = useForm({
    defaultValues: { rejectReason: "" },
    onSubmit: ({ value }) => {
      onReject(value.rejectReason);
    },
  });

  const [prevProposalId, setPrevProposalId] = useState(proposal?.id ?? null);
  if ((proposal?.id ?? null) !== prevProposalId) {
    setPrevProposalId(proposal?.id ?? null);
    acceptForm.reset();
    rejectForm.reset();
    setRejecting(false);
  }

  const linkedIds = useMemo(
    () => (proposal ? collectProposalEvidenceIds(proposal) : []),
    [proposal]
  );

  return {
    acceptForm,
    rejectForm,
    linkedIds,
    rejecting,
    setRejecting,
  };
}

export type InboxAcceptForm = ReturnType<
  typeof useInboxDetailForms
>["acceptForm"];
export type InboxRejectForm = ReturnType<
  typeof useInboxDetailForms
>["rejectForm"];
