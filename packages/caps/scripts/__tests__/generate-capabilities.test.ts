import { describe, expect, it, vi } from "vitest";

const writeCapabilitiesGenFile = vi.hoisted(() => vi.fn(() => 3));

vi.mock("../../src/write-capabilities-gen.ts", () => ({
  writeCapabilitiesGenFile,
}));

describe("generate-capabilities script entry", () => {
  it("writes capabilities.gen.json via shared helper", async () => {
    await import("../generate-capabilities.ts");
    expect(writeCapabilitiesGenFile).toHaveBeenCalledTimes(1);
  });
});
