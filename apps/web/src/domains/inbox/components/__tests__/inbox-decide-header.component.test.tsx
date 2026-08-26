import { useForm } from "@tanstack/react-form";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProposalRecord } from "@watchdog/core";
import { testId } from "@watchdog/test-kit";

import { InboxDecideHeader } from "@/domains/inbox/components/inbox-decide-header";
import type {
  InboxAcceptForm,
  InboxRejectForm,
} from "@/domains/inbox/hooks/use-inbox-detail-forms";

vi.mock("@/domains/dossier/components/evidence-picker", () => ({
  EvidencePicker: () => <div>Evidence picker</div>,
  EvidenceCiteChips: () => <div>Evidence cites</div>,
}));

function pendingProposal(
  overrides: Partial<ProposalRecord> = {}
): ProposalRecord {
  return {
    id: testId(50),
    caseId: testId(10),
    jobId: null,
    capabilityId: "network.dns.lookup",
    status: "pending",
    patch: [
      {
        op: "create",
        resource: "claim",
        id: testId(30),
        data: {
          entityId: testId(20),
          text: "Ada observed a host",
          class: "observation",
        },
        evidenceIds: [],
      },
    ],
    summary: "dns lookup",
    suppressedCount: 0,
    evidenceIds: [],
    rejectReason: null,
    decidedBy: null,
    decidedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    agentSourced: false,
    userOverridden: false,
    createdBy: null,
    identifierCollisions: [],
    entityNames: { [testId(20)]: "Alpha" },
    ...overrides,
  };
}

function HeaderHarness({
  proposal,
  rejecting = false,
}: {
  proposal: ProposalRecord;
  rejecting?: boolean;
}) {
  const acceptForm = useForm({
    defaultValues: {
      confidence: "unverified" as const,
      evidenceIds: [] as string[],
      attestationText: "",
    },
    onSubmit: () => {},
  });
  const rejectForm = useForm({
    defaultValues: { rejectReason: "" },
    onSubmit: () => {},
  });

  return (
    <InboxDecideHeader
      proposal={proposal}
      acceptForm={acceptForm as unknown as InboxAcceptForm}
      rejectForm={rejectForm as unknown as InboxRejectForm}
      linkedIds={[]}
      caseEvidence={[]}
      missingJobEvidenceCount={0}
      pending={false}
      error={null}
      rejecting={rejecting}
      onRejectingChange={vi.fn()}
    />
  );
}

describe("InboxDecideHeader", () => {
  it("renders pending proposal identity and accept controls", () => {
    render(<HeaderHarness proposal={pendingProposal()} />);

    expect(screen.getByRole("navigation", { name: "Proposal path" })).toHaveTextContent(
      "Alpha"
    );
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Evidence picker")).toBeInTheDocument();
    expect(
      screen.getByText(/No evidence selected — Accept will still apply/)
    ).toBeInTheDocument();
  });

  it("shows reject composer and reason for decided proposals", () => {
    const { rerender } = render(
      <HeaderHarness proposal={pendingProposal()} rejecting />
    );
    expect(
      screen.getByPlaceholderText("Reject reason (optional)")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm Reject" })).toBeInTheDocument();

    rerender(
      <HeaderHarness
        proposal={pendingProposal({
          status: "rejected",
          rejectReason: "Duplicate finding",
          decidedAt: "2026-01-02T00:00:00.000Z",
        })}
      />
    );
    expect(screen.getByText("Duplicate finding")).toBeInTheDocument();
  });
});
