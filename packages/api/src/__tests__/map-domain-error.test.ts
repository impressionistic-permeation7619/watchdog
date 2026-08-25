import { ORPCError } from "@orpc/server";
import { describe, expect, it } from "vitest";

import { DomainError } from "@watchdog/core";

import { mapDomainError } from "../map-domain-error";

async function expectMapped(
  code: DomainError["code"],
  orpcCode: string
): Promise<void> {
  await expect(
    mapDomainError(async () => {
      throw new DomainError(code, code);
    })
  ).rejects.toSatisfy(
    (error: unknown) => error instanceof ORPCError && error.code === orpcCode
  );
}

describe("mapDomainError", () => {
  it("maps not_found to NOT_FOUND", async () => {
    await expectMapped("not_found", "NOT_FOUND");
  });

  it("maps conflict to CONFLICT", async () => {
    await expectMapped("conflict", "CONFLICT");
  });

  it("maps invalid to BAD_REQUEST", async () => {
    await expectMapped("invalid", "BAD_REQUEST");
  });

  it("maps forbidden to FORBIDDEN", async () => {
    await expectMapped("forbidden", "FORBIDDEN");
  });

  it("propagates an unknown Error", async () => {
    const boom = new Error("boom");
    await expect(
      mapDomainError(async () => {
        throw boom;
      })
    ).rejects.toBe(boom);
  });
});
