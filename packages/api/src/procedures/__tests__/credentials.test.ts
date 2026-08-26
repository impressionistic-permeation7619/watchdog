import { createRouterClient } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

const { listCredentialSlots } = vi.hoisted(() => ({
  listCredentialSlots: vi.fn(),
}));

vi.mock("@watchdog/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@watchdog/core")>();
  return {
    ...actual,
    listCredentialSlots,
    putCredentialSlot: vi.fn(),
    deleteCredential: vi.fn(),
  };
});

import { list } from "../credentials";

const actor = { userId: "u1", email: "a@test.local", name: "Agent" };

describe("credentials procedures", () => {
  it("lists credential slots for the actor", async () => {
    listCredentialSlots.mockResolvedValueOnce([
      {
        name: "AI_COMPAT_API_KEY",
        label: "AI",
        description: "Compat key",
        configured: true,
        updatedAt: null,
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

    await expect(client.list()).resolves.toHaveLength(1);
    expect(listCredentialSlots).toHaveBeenCalledWith("u1");
  });
});
