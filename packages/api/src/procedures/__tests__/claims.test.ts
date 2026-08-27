import { createRouterClient } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

const { listClaimsForEntity, createClaim } = vi.hoisted(() => ({
  listClaimsForEntity: vi.fn(),
  createClaim: vi.fn(),
}));

vi.mock("@watchdog/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@watchdog/core")>();
  return {
    ...actual,
    listClaimsForEntity,
    createClaim,
    updateClaim: vi.fn(),
    retractClaim: vi.fn(),
  };
});

import { create, list } from "../claims";

const actor = { userId: "u1", email: "a@test.local", name: "Agent" };

const claimRow = {
  id: "00000000-0000-4000-8000-000000000010",
  entityId: "00000000-0000-4000-8000-000000000002",
  class: "observation" as const,
  text: "Observed handle",
  confidence: "unverified" as const,
  retracted: false,
  retractKind: null,
  retractedReason: null,
  retractedBy: null,
  retractedAt: null,
  evidenceIds: [],
};

describe("claims procedures", () => {
  it("lists claims for an entity", async () => {
    listClaimsForEntity.mockResolvedValueOnce([claimRow]);

    const client = createRouterClient(
      { list },
      {
        context: {
          headers: new Headers(),
          actor,
          authMethod: "session",
        },
      }
    );

    await expect(
      client.list({
        caseId: "00000000-0000-4000-8000-000000000001",
        entityId: "00000000-0000-4000-8000-000000000002",
      })
    ).resolves.toHaveLength(1);
  });

  it("creates claims through graph child write custody", async () => {
    createClaim.mockResolvedValueOnce({
      ...claimRow,
      id: "00000000-0000-4000-8000-000000000011",
      text: "New claim",
    });

    const client = createRouterClient(
      { create },
      {
        context: {
          headers: new Headers(),
          actor,
          authMethod: "session",
        },
      }
    );

    await expect(
      client.create({
        caseId: "00000000-0000-4000-8000-000000000001",
        entityId: "00000000-0000-4000-8000-000000000002",
        text: "New claim",
        confidence: "unverified",
        userOverride: true,
      })
    ).resolves.toMatchObject({ text: "New claim" });
  });
});
