import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { pageEnrich } from "../cap.ts";
import { interpretPageEnrichReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    url: "https://example.com/",
    finalUrl: "https://example.com/",
    queriedAt: "2026-01-01T00:00:00.000Z",
    status: 200,
    ok: true,
    title: "Example",
    meta: {
      description: null,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      twitterCard: null,
      canonical: null,
    },
    trackers: [{ vendor: "google-analytics", evidence: "gtag" }],
  };

  it("interpretPageEnrichReport proposes url Identifier + Claim", () => {
    const result = interpretPageEnrichReport(fixture, {
      input: { url: "https://example.com/", entityId },
    });
    expect(result.patch[0]?.resource).toBe("identifier");
    expect(result.patch[0]?.data.type).toBe("url");
    expect(claimText(result, 1)).toMatch(/Example/);
    expect(claimText(result, 1)).toMatch(/google-analytics/);
  });

  itRejectsIncompleteReport(
    pageEnrich,
    { url: "https://example.com/" },
    { url: "https://example.com/" }
  );
});
