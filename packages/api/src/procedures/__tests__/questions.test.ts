import { createRouterClient } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

const { listQuestionsForEntity } = vi.hoisted(() => ({
  listQuestionsForEntity: vi.fn(),
}));

vi.mock("@watchdog/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@watchdog/core")>();
  return {
    ...actual,
    listQuestionsForEntity,
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    resolveQuestion: vi.fn(),
    reopenQuestion: vi.fn(),
  };
});

import { list } from "../questions";

const actor = { userId: "u1", email: "a@test.local", name: "Agent" };

describe("questions procedures", () => {
  it("lists questions for an entity", async () => {
    listQuestionsForEntity.mockResolvedValueOnce([
      {
        id: "00000000-0000-4000-8000-000000000080",
        entityId: "00000000-0000-4000-8000-000000000010",
        text: "Same person?",
        status: "open",
        resolvedNote: null,
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
