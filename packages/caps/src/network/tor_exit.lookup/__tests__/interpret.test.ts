import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { torExitLookup } from "../cap.ts";
import { interpretTorExitLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const exitFixture = {
    ip: "1.2.3.4",
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "check.torproject.org" as const,
    isExit: true,
  };

  const nonExitFixture = { ...exitFixture, isExit: false };

  it("interpretTorExitLookupReport flags a current Tor exit node", () => {
    const result = interpretTorExitLookupReport(exitFixture, {
      input: { ip: exitFixture.ip, entityId },
    });
    expect(result.patch.length).toBe(1);
    expect(claimText(result, 0)).toMatch(/is a current Tor exit node/);
  });

  it("interpretTorExitLookupReport reports non-membership", () => {
    const result = interpretTorExitLookupReport(nonExitFixture, {
      input: { ip: nonExitFixture.ip, entityId },
    });
    expect(claimText(result, 0)).toMatch(/is not a current Tor exit node/);
  });

  itRejectsIncompleteReport(
    torExitLookup,
    { ip: "1.2.3.4" },
    { ip: "1.2.3.4" }
  );
});
