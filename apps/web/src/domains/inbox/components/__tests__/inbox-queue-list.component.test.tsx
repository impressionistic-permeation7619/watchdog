import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProposalRecord } from "@watchdog/core";
import { testId } from "@watchdog/test-kit";

import { InboxQueueList } from "@/domains/inbox/components/inbox-queue-list";

const PROPOSAL: ProposalRecord = {
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
      evidenceIds: [testId(40)],
    },
  ],
  summary: "dns lookup",
  suppressedCount: 0,
  evidenceIds: [testId(41)],
  rejectReason: null,
  decidedBy: null,
  decidedAt: null,
  createdAt: "2026-01-01T12:00:00.000Z",
  agentSourced: false,
  userOverridden: false,
  createdBy: null,
  identifierCollisions: [],
};

describe("InboxQueueList", () => {
  it("renders grouped proposal rows in the listbox", () => {
    render(
      <InboxQueueList
        proposals={[PROPOSAL]}
        selectedId={PROPOSAL.id}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole("listbox", { name: "Proposals" })).toBeInTheDocument();
    expect(screen.getByRole("option", { selected: true })).toBeInTheDocument();
    expect(screen.getByText(/1 claim · 1 ev/)).toBeInTheDocument();
  });
});
