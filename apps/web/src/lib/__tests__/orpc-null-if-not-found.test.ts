import { ORPCError } from "@orpc/server";
import { describe, it, expect } from "vitest";

import { orpcNullIfNotFound } from "../orpc-null-if-not-found";

describe("orpcNullIfNotFound", () => {
  it("returns null for ORPC NOT_FOUND", async () => {
    const result = await orpcNullIfNotFound(
      Promise.reject(
        new ORPCError("NOT_FOUND", { message: "Entity not found" })
      )
    );
    expect(result).toBe(null);
  });

  it("returns the resolved value on success", async () => {
    const result = await orpcNullIfNotFound(Promise.resolve({ id: "e1" }));
    expect(result).toEqual({ id: "e1" });
  });

  it("rethrows non-NOT_FOUND ORPC errors", async () => {
    await expect(
      orpcNullIfNotFound(
        Promise.reject(new ORPCError("BAD_REQUEST", { message: "nope" }))
      )
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof ORPCError && error.code === "BAD_REQUEST"
    );
  });
});
