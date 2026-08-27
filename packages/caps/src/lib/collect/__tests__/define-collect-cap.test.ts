import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const { uploadJsonReportPairMock } = vi.hoisted(() => ({
  uploadJsonReportPairMock: vi.fn(
    async (_upload: unknown, _snap: unknown, name: string) => ({
      report: { id: "report", mime: "application/json", name: "report.json" },
      artifact: { id: "artifact", mime: "application/json", name },
    })
  ),
}));

vi.mock("@watchdog/cap-sdk", () => ({
  defineCapability: <T>(def: T) => def,
}));

vi.mock("../upload-json-report-pair", () => ({
  uploadJsonReportPair: uploadJsonReportPairMock,
}));

import { defineCollectCap } from "../define-collect-cap";

const baseDef = {
  id: "test.collect",
  version: "1",
  title: "Test collect",
  description: "unit test cap",
  dataSource: "test",
  input: z.object({}),
  schema: z.object({ ok: z.boolean() }),
  reportLabel: "test",
};

describe("defineCollectCap", () => {
  it("run fetches snap and uploads report pair", async () => {
    const interpretSnap = vi
      .fn()
      .mockResolvedValue({ patch: [], summary: "done" });
    const fetch = vi
      .fn()
      .mockResolvedValue({ snap: { ok: true }, artifactName: "data.json" });
    const uploadArtifact = vi.fn(async (input: { name?: string }) => ({
      id: "upload-1",
      ...input,
    }));

    const cap = defineCollectCap({
      ...baseDef,
      fetch,
      interpretSnap,
    });

    const runResult = await cap.run({
      input: {},
      uploadArtifact,
      log: () => {},
      signal: AbortSignal.timeout(1000),
      getCredential: async () => {
        throw new Error("unused");
      },
    } as never);

    expect(fetch).toHaveBeenCalled();
    expect(uploadJsonReportPairMock).toHaveBeenCalled();
    expect(runResult.artifacts).toHaveLength(2);
  });

  it("interpret parses report via schema and delegates to interpretSnap", async () => {
    const interpretSnap = vi
      .fn()
      .mockResolvedValue({ patch: [], summary: "interpreted" });

    const cap = defineCollectCap({
      ...baseDef,
      fetch: vi.fn(),
      interpretSnap,
    });

    const result = await cap.interpret!({ ok: true }, { input: {} });
    expect(interpretSnap).toHaveBeenCalledWith({ ok: true }, expect.anything());
    expect(result.summary).toBe("interpreted");
  });

  it("interpret throws on invalid report shape", async () => {
    const cap = defineCollectCap({
      ...baseDef,
      fetch: vi.fn(),
      interpretSnap: vi.fn(),
    });

    await expect(cap.interpret!({ bad: true }, {} as never)).rejects.toThrow(
      /Invalid test report/
    );
  });
});
