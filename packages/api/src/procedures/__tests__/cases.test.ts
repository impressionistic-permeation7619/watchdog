import { createRouterClient, ORPCError } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

const { listCases, getCaseById, createCase } = vi.hoisted(() => ({
  listCases: vi.fn(),
  getCaseById: vi.fn(),
  createCase: vi.fn(),
}));

vi.mock("@watchdog/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@watchdog/core")>();
  return {
    ...actual,
    listCases,
    getCaseById,
    createCase,
    updateCase: vi.fn(),
    deleteCase: vi.fn(),
  };
});

import { create, get, list } from "../cases";

const actor = { userId: "u1", email: "a@test.local", name: "Agent" };

describe("cases procedures", () => {
  it("lists cases for authenticated callers", async () => {
    listCases.mockResolvedValueOnce([
      {
        id: "00000000-0000-4000-8000-000000000001",
        name: "Alpha",
        slug: "alpha",
        description: null,
        allowThirdPartyEgress: false,
      },
    ]);

    const client = createRouterClient(
      { list, get, create },
      {
        context: {
          headers: new Headers(),
          actor,
          authMethod: "session",
        },
      }
    );

    await expect(client.list()).resolves.toHaveLength(1);
  });

  it("maps missing cases to NOT_FOUND", async () => {
    getCaseById.mockResolvedValueOnce(null);

    const client = createRouterClient(
      { get },
      {
        context: {
          headers: new Headers(),
          actor,
          authMethod: "session",
        },
      }
    );

    await expect(
      client.get({ caseId: "00000000-0000-4000-8000-000000000001" })
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof ORPCError && error.code === "NOT_FOUND"
    );
  });

  it("creates a case from validated input", async () => {
    createCase.mockResolvedValueOnce({
      id: "00000000-0000-4000-8000-000000000002",
      name: "Beta",
      slug: "beta",
      description: null,
      allowThirdPartyEgress: false,
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

    await expect(client.create({ name: "Beta" })).resolves.toMatchObject({
      slug: "beta",
    });
  });
});
