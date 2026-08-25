import { useForm } from "@tanstack/react-form";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InboxPatchBody } from "@/domains/inbox/components/inbox-patch-body";
import type { InboxAcceptForm } from "@/domains/inbox/hooks/use-inbox-detail-forms";
import type { ProposalRecord } from "@watchdog/core";
import { testId } from "@watchdog/test-kit";

vi.mock("@/domains/dossier/components/evidence-preview-drawer", () => ({
  EvidencePreviewDrawer: () => null,
}));

function proposal(patch: ProposalRecord["patch"]): ProposalRecord {
  return {
    id: testId(50),
    caseId: testId(10),
    jobId: null,
    capabilityId: "network.dns.lookup",
    status: "pending",
    patch,
    summary: null,
    suppressedCount: 0,
    evidenceIds: [],
    rejectReason: null,
    decidedBy: null,
    decidedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    agentSourced: false,
    userOverridden: false,
    createdBy: null,
  };
}

function Harness({
  row,
  confidence,
}: {
  row: ProposalRecord;
  confidence: "unverified" | "confirmed";
}) {
  const acceptForm = useForm({
    defaultValues: {
      confidence,
      evidenceIds: [] as string[],
      attestationText: "",
    },
    onSubmit: () => {},
  });
  return (
    <InboxPatchBody
      proposal={row}
      caseId={row.caseId}
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- TanStack Form vs InboxAcceptForm
      acceptForm={acceptForm as unknown as InboxAcceptForm}
      linkedIds={[]}
      evidenceById={new Map()}
      evidenceLoadError={null}
      pending={false}
      rejecting={false}
      onRejectingChange={() => {}}
      previewEvidence={null}
      onPreviewEvidenceChange={() => {}}
    />
  );
}

describe("InboxPatchBody", () => {
  it("disables Accept when confirmed has no evidence bundle", () => {
    render(
      <Harness
        confidence="confirmed"
        row={proposal([
          {
            op: "create",
            resource: "claim",
            id: testId(30),
            data: {
              entityId: testId(20),
              text: "Ada observed a host",
              class: "observation",
            },
          },
        ])}
      />
    );
    expect(screen.getByRole("button", { name: "Accept" })).toBeDisabled();
  });

  it("disables Accept when an identifier op is invalid", () => {
    render(
      <Harness
        confidence="unverified"
        row={proposal([
          {
            op: "create",
            resource: "identifier",
            id: testId(31),
            data: {
              entityId: testId(20),
              type: "email",
              value: "not-an-email",
            },
          },
        ])}
      />
    );
    expect(screen.getByRole("button", { name: "Accept" })).toBeDisabled();
    expect(screen.getByText(/Invalid Identifier values/)).toBeInTheDocument();
  });

  it("enables Accept for unverified with a valid claim", () => {
    render(
      <Harness
        confidence="unverified"
        row={proposal([
          {
            op: "create",
            resource: "claim",
            id: testId(32),
            data: {
              entityId: testId(20),
              text: "Ada observed a host",
              class: "observation",
            },
          },
        ])}
      />
    );
    expect(screen.getByRole("button", { name: "Accept" })).toBeEnabled();
  });
});
