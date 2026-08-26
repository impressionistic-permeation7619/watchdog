import { createRouterClient } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

const { listEntitiesForCase } = vi.hoisted(() => ({
  listEntitiesForCase: vi.fn(),
}));

vi.mock("@watchdog/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@watchdog/core")>();
  return {
    ...actual,
    listEntitiesForCase,
    getEntityByCaseSlug: vi.fn(),
    createEntity: vi.fn(),
    updateEntityFields: vi.fn(),
  };
});

import { list } from "../entities";

const actor = { userId: "u1", email: "a@test.local", name: "Agent" };
const caseId = "00000000-0000-4000-8000-000000000001";

describe("entities procedures", () => {
  it("lists entities for a case", async () => {
    listEntitiesForCase.mockResolvedValueOnce([
      {
        id: "00000000-0000-4000-8000-000000000010",
        caseId,
        kind: "person",
        name: "Alice",
        slug: "alice",
        summary: null,
        notes: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
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

    await expect(client.list({ caseId })).resolves.toHaveLength(1);
  });
});
