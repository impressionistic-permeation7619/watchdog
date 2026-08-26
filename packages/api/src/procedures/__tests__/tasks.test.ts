import { createRouterClient } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

const { listTasksForCase } = vi.hoisted(() => ({
  listTasksForCase: vi.fn(),
}));

vi.mock("@watchdog/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@watchdog/core")>();
  return {
    ...actual,
    listTasksForCase,
    getTaskInCase: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    reorderTasks: vi.fn(),
  };
});

import { list } from "../tasks";

const actor = { userId: "u1", email: "a@test.local", name: "Agent" };

describe("tasks procedures", () => {
  it("lists tasks for a case", async () => {
    listTasksForCase.mockResolvedValueOnce([
      {
        id: "00000000-0000-4000-8000-000000000060",
        caseId: "00000000-0000-4000-8000-000000000001",
        entityId: null,
        title: "Follow up DNS",
        description: null,
        status: "backlog",
        priority: "medium",
        dueDate: null,
        position: 0,
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

    await expect(
      client.list({ caseId: "00000000-0000-4000-8000-000000000001" })
    ).resolves.toHaveLength(1);
  });
});
