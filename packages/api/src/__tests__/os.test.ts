import { createRouterClient, ORPCError } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { authed } from "../os";

const probe = authed
  .route({ method: "GET", path: "/probe", tags: ["test"] })
  .output(z.object({ ok: z.literal(true) }))
  .handler(async () => ({ ok: true as const }));

describe("os middleware", () => {
  it("rejects unauthenticated calls through authed", async () => {
    const caller = createRouterClient(probe, {
      context: {
        headers: new Headers(),
        actor: null,
        authMethod: "session",
      },
    });

    await expect(caller()).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof ORPCError && error.code === "UNAUTHORIZED"
    );
  });

  it("allows authenticated calls through authed", async () => {
    const caller = createRouterClient(probe, {
      context: {
        headers: new Headers(),
        actor: { userId: "u1", email: null, name: null },
        authMethod: "session",
      },
    });

    await expect(caller()).resolves.toEqual({ ok: true });
  });
});
