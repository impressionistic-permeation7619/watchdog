import { describe, expect, it, vi } from "vitest";

const fsMocks = vi.hoisted(() => ({
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock("node:fs", () => fsMocks);

vi.mock("@orpc/contract", () => ({
  minifyContractRouter: vi.fn(() => ({ routes: [] })),
}));

vi.mock("../openapi", () => ({
  generateOpenAPISpec: vi.fn(async () => ({ openapi: "3.1.0", paths: {} })),
}));

vi.mock("../router", () => ({
  router: { health: {} },
}));

import { exportContract } from "../export-contract";

describe("exportContract", () => {
  it("writes contract and openapi artifacts", async () => {
    await exportContract("/tmp/out");

    expect(fsMocks.mkdirSync).toHaveBeenCalledWith("/tmp/out", {
      recursive: true,
    });
    expect(fsMocks.writeFileSync).toHaveBeenCalledTimes(2);
    expect(fsMocks.writeFileSync.mock.calls[0]?.[0]).toContain("contract.json");
    expect(fsMocks.writeFileSync.mock.calls[1]?.[0]).toContain("openapi.json");
  });
});
