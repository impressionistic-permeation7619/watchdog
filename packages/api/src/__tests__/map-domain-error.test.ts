import { ORPCError } from "@orpc/server";
import { describe, expect, it } from "vitest";

import { DomainError } from "@watchdog/core";

import { mapDomainError, withDomainError } from "../map-domain-error";

describe("mapDomainError", () => {
  it("returns handler result when no error is thrown", async () => {
    const result = await mapDomainError(async () => "ok");
    expect(result).toBe("ok");
  });

  it("maps not_found to NOT_FOUND with the domain message", async () => {
    await expect(
      mapDomainError(async () => {
        throw new DomainError("not_found", "missing case");
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "missing case",
    });
    await expect(
      mapDomainError(async () => {
        throw new DomainError("not_found", "missing case");
      })
    ).rejects.toBeInstanceOf(ORPCError);
  });

  it("maps conflict to CONFLICT with the domain message", async () => {
    await expect(
      mapDomainError(async () => {
        throw new DomainError("conflict", "duplicate slug");
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "duplicate slug",
    });
  });

  it("maps invalid to BAD_REQUEST with the domain message", async () => {
    await expect(
      mapDomainError(async () => {
        throw new DomainError("invalid", "bad input");
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "bad input",
    });
  });

  it("maps forbidden to FORBIDDEN with the domain message", async () => {
    await expect(
      mapDomainError(async () => {
        throw new DomainError("forbidden", "custody blocked");
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "custody blocked",
    });
  });

  it("propagates an unknown Error unchanged", async () => {
    const boom = new Error("boom");
    await expect(
      mapDomainError(async () => {
        throw boom;
      })
    ).rejects.toBe(boom);
  });
});

describe("withDomainError", () => {
  it("returns handler output on success", async () => {
    const wrapped = withDomainError(async (value: string) => value.toUpperCase());
    await expect(wrapped("case")).resolves.toBe("CASE");
  });

  it("maps domain errors from wrapped handlers", async () => {
    const wrapped = withDomainError(async () => {
      throw new DomainError("not_found", "missing entity");
    });
    await expect(wrapped()).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "missing entity",
    });
  });

  it("forwards handler arguments", async () => {
    const wrapped = withDomainError(
      async (left: number, right: number) => left + right
    );
    await expect(wrapped(2, 3)).resolves.toBe(5);
  });
});
