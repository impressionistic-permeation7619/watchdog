import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { hibpLookup } from "../cap.ts";
import { interpretHibpLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    email: "bob@example.com",
    queriedAt: "2026-01-01T00:00:00.000Z",
    found: true,
    breachCount: 2,
    breaches: [
      {
        name: "Adobe",
        title: "Adobe",
        domain: "adobe.com",
        breachDate: "2013-10-04",
        pwnCount: 1,
        dataClasses: ["Email addresses", "Passwords"],
      },
      {
        name: "LinkedIn",
        title: "LinkedIn",
        domain: "linkedin.com",
        breachDate: "2012-05-05",
        pwnCount: 1,
        dataClasses: ["Email addresses"],
      },
    ],
    status: 200,
  };

  it("interpretHibpLookupReport proposes Claim only", () => {
    const result = interpretHibpLookupReport(fixture, {
      input: { email: "bob@example.com", entityId },
    });
    expect(result.patch.length).toBe(1);
    expect(result.patch[0]?.resource).toBe("claim");
    expect(claimText(result, 0)).toMatch(/Adobe/);
    expect(claimText(result, 0)).toMatch(/LinkedIn/);
  });

  itRejectsIncompleteReport(
    hibpLookup,
    { email: "a@b.com" },
    { email: "a@b.com" }
  );
});
