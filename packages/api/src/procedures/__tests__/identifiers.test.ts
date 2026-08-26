import { createRouterClient } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

const { listIdentifiersForEntity } = vi.hoisted(() => ({
  listIdentifiersForEntity: vi.fn(),
}));

vi.mock("@watchdog/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@watchdog/core")>();
  return {
    ...actual,
    listIdentifiersForEntity,
    listIdentifiersForCase: vi.fn(),
    createIdentifier: vi.fn(),
    updateIdentifier: vi.fn(),
  };
});

import { list } from "../identifiers";

const actor = { userId: "u1", email: "a@test.local", name: "Agent" };

describe("identifiers procedures", () => {
  it("lists identifiers for an entity", async () => {
    listIdentifiersForEntity.mockResolvedValueOnce([
      {
        id: "00000000-0000-4000-8000-000000000050",
        entityId: "00000000-0000-4000-8000-000000000010",
        type: "email",
        platform: "generic",
        value: "alice@example.com",
        confidence: "unverified",
        status: "current",
        notes: null,
        evidenceIds: [],
      },
    ]);

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
        entityId: "00000000-0000-4000-8000-000000000010",
      })
    ).resolves.toHaveLength(1);
  });
});
