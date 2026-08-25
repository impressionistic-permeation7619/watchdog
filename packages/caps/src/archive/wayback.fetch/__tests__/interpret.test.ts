import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { waybackFetch } from "../cap.ts";
import { interpretWaybackFetchReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    url: "https://example.com/",
    timestamp: "20260101000000",
    archiveUrl:
      "https://web.archive.org/web/20260101000000/https://example.com/",
    queriedAt: "2026-01-01T00:00:00.000Z",
    status: 200,
    ok: true,
    contentType: "text/html",
    bodyPreview: "<html></html>",
    byteLength: 13,
  };

  it("interpretWaybackFetchReport proposes Claim", () => {
    const result = interpretWaybackFetchReport(fixture, {
      input: {
        url: "https://example.com/",
        timestamp: "20260101000000",
        entityId,
      },
    });
    expect(result.patch.length).toBe(1);
    expect(claimText(result, 0)).toMatch(/status=200/);
    expect(claimText(result, 0)).toMatch(/bytes=13/);
  });

  itRejectsIncompleteReport(
    waybackFetch,
    { url: "https://example.com/" },
    {
      url: "https://example.com/",
      timestamp: "20260101000000",
    }
  );
});
