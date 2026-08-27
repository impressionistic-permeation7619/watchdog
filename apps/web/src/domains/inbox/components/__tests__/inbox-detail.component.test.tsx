import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProposalRecord } from "@watchdog/core";
import { testId } from "@watchdog/test-kit";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

vi.mock("@/domains/inbox/components/inbox-decide-header", () => ({
  InboxDecideHeader: () => <div>Inbox decide header</div>,
}));

vi.mock("@/domains/inbox/components/inbox-patch-body", () => ({
  InboxPatchBody: () => <div>Inbox patch body</div>,
}));

vi.mock("@/domains/inbox/hooks/use-inbox-detail-forms", () => ({
  useInboxDetailForms: () => ({
    acceptForm: {},
    rejectForm: {},
    linkedIds: [],
    rejecting: false,
    setRejecting: vi.fn(),
  }),
}));

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: (...args: unknown[]) => useQueryMock(...args),
  };
});

import { InboxDetail } from "@/domains/inbox/components/inbox-detail";

const PROPOSAL: ProposalRecord = {
  id: testId(50),
  caseId: testId(10),
  jobId: null,
  capabilityId: "network.dns.lookup",
  status: "pending",
  patch: [],
  summary: "dns",
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
};

describe("InboxDetail", () => {
  it("shows empty detail copy when nothing is selected", () => {
    useQueryMock.mockReturnValue({ data: [], isError: false, isSuccess: true });
    render(
      <InboxDetail
        proposal={null}
        caseId={testId(10)}
        pending={false}
        error={null}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText("Select a proposal")).toBeInTheDocument();
    expect(useQueryMock).toHaveBeenCalled();
  });

  it("renders decide header and patch body for a selected proposal", () => {
    useQueryMock.mockReturnValue({ data: [], isError: false, isSuccess: true });
    render(
      <InboxDetail
        proposal={PROPOSAL}
        caseId={testId(10)}
        pending={false}
        error={null}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText("Inbox decide header")).toBeInTheDocument();
    expect(screen.getByText("Inbox patch body")).toBeInTheDocument();
    expect(screen.queryByText("Select a proposal")).not.toBeInTheDocument();
  });
});
