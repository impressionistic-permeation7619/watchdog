import { describe, expect, it } from "vitest";

import { testId } from "@watchdog/test-kit";

import {
  removeCaseExportDir,
  renameCaseExportDir,
  safeFilename,
  scheduleCaseExport,
} from "../export-sync.ts";

describe("safeFilename", () => {
  it("strips path separators and control characters", () => {
    expect(safeFilename('evil/../etc\u0001pass')).toBe("evil_.._etc_pass");
    expect(safeFilename("a/b:c*d?")).not.toMatch(/[/\\:]/);
  });
});

describe("export path guards", () => {
  it("ignores path-traversal slugs for remove and rename", async () => {
    await expect(removeCaseExportDir("../outside")).resolves.toBeUndefined();
    await expect(
      renameCaseExportDir("../outside", "safe-slug")
    ).resolves.toBeUndefined();
  });
});

describe("scheduleCaseExport", () => {
  it("coalesces concurrent schedules into one in-flight write then a follow-up", async () => {
    let calls = 0;
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const writeExport = async () => {
      calls += 1;
      if (calls === 1) {
        await firstGate;
      }
    };

    const caseId = testId(99);
    const run = scheduleCaseExport(caseId, writeExport);
    void scheduleCaseExport(caseId, writeExport);
    await Promise.resolve();
    expect(calls).toBe(1);

    releaseFirst();
    await run;
    expect(calls).toBe(2);
  });
});
