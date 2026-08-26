import { describe, expect, it, vi } from "vitest";

const exportContract = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("../../src/export-contract.ts", () => ({
  exportContract,
}));

describe("export-contract script entry", () => {
  it("invokes exportContract for the client generated directory", async () => {
    await import("../export-contract.ts");
    expect(exportContract).toHaveBeenCalledTimes(1);
  });
});
