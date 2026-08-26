import { describe, expect, it, vi } from "vitest";

import {
  abuseIpdbLookupSnapshotSchema,
  fetchAbuseIpdbCheck,
} from "../abuseipdb";

describe("abuseipdb", () => {
  it("fetchAbuseIpdbCheck maps check responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              ipAddress: "8.8.8.8",
              abuseConfidenceScore: 0,
              totalReports: 0,
              numDistinctUsers: 0,
              lastReportedAt: null,
              isPublic: true,
              isWhitelisted: true,
              isp: "Google",
              domain: "google.com",
              usageType: "Content Delivery Network",
              countryCode: "US",
            },
          }),
          { status: 200 }
        )
      )
    );

    const snap = await fetchAbuseIpdbCheck(
      "8.8.8.8",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(abuseIpdbLookupSnapshotSchema.parse(snap).found).toBe(true);
    expect(snap.isWhitelisted).toBe(true);
    vi.unstubAllGlobals();
  });
});
