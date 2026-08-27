import { createRouterClient } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

const { listProposalsForCase } = vi.hoisted(() => ({
  listProposalsForCase: vi.fn(),
}));

vi.mock("@watchdog/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@watchdog/core")>();
  return {
    ...actual,
    listProposalsForCase,
    createAgentProposal: vi.fn(),
    acceptProposal: vi.fn(),
    rejectProposal: vi.fn(),
  };
});

import { listForCase } from "../proposals";

const actor = { userId: "u1", email: "a@test.local", name: "Agent" };

describe("proposals procedures", () => {
  it("lists proposals for a case", async () => {
    listProposalsForCase.mockResolvedValueOnce([
      {
        id: "00000000-0000-4000-8000-000000000070",
        caseId: "00000000-0000-4000-8000-000000000001",
        jobId: null,
        capabilityId: null,
        status: "pending",
        patch: [],
        summary: "Add identifier",
        suppressedCount: 0,
        evidenceIds: [],
        rejectReason: null,
        decidedBy: null,
        decidedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        agentSourced: true,
        userOverridden: false,
        createdBy: "u1",
      },
    ]);

    const client = createRouterClient(
      { listForCase },
      {
        context: {
          headers: new Headers(),
          actor,
          authMethod: "session",
        },
      }
    );

    await expect(
      client.listForCase({
        caseId: "00000000-0000-4000-8000-000000000001",
      })
    ).resolves.toHaveLength(1);
    expect(listProposalsForCase).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      undefined
    );
  });

  it("filters by status when provided", async () => {
    listProposalsForCase.mockResolvedValueOnce([]);

    const client = createRouterClient(
      { listForCase },
      {
        context: {
          headers: new Headers(),
          actor,
          authMethod: "session",
        },
      }
    );

    await client.listForCase({
      caseId: "00000000-0000-4000-8000-000000000001",
      status: "pending",
    });

    expect(listProposalsForCase).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      { status: "pending" }
    );
  });
});
