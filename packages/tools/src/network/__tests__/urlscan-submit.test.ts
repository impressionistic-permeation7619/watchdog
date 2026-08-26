import { describe, expect, it, vi } from "vitest";

import {
  submitUrlscan,
  urlscanSubmitSnapshotSchema,
} from "../urlscan-submit";

describe("urlscan-submit", () => {
  it("submitUrlscan maps accepted scan submissions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            uuid: "scan-uuid",
            result: "https://urlscan.io/result/scan-uuid/",
            api: "https://urlscan.io/api/v1/result/scan-uuid/",
            message: "Submission successful",
          }),
          { status: 200 }
        )
      )
    );

    const snap = await submitUrlscan(
      "https://example.com",
      "test-key",
      "unlisted",
      AbortSignal.timeout(5000)
    );

    expect(urlscanSubmitSnapshotSchema.parse(snap).accepted).toBe(true);
    expect(snap.uuid).toBe("scan-uuid");
    vi.unstubAllGlobals();
  });
});
