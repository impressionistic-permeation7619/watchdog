import { createRouterClient } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

const { listEventsForEntity } = vi.hoisted(() => ({
  listEventsForEntity: vi.fn(),
}));

vi.mock("@watchdog/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@watchdog/core")>();
  return {
    ...actual,
    listEventsForEntity,
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
  };
});

import { list } from "../events";

const actor = { userId: "u1", email: "a@test.local", name: "Agent" };

describe("events procedures", () => {
  it("lists events for an entity", async () => {
    listEventsForEntity.mockResolvedValueOnce([
      {
        id: "00000000-0000-4000-8000-000000000030",
        entityId: "00000000-0000-4000-8000-000000000010",
        when: "2026-01-01T12:00:00.000Z",
        what: "Seen online",
        where: null,
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
