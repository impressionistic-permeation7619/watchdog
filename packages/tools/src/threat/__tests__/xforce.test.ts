import { describe, expect, it, vi } from "vitest";

import { fetchXforceLookup, xforceLookupSnapshotSchema } from "../xforce";

describe("xforce", () => {
  it("fetchXforceLookup maps IP reputation reports", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/ipr/malware/")) {
          return Promise.resolve(
            new Response(JSON.stringify({ malware: [{ family: "Emotet" }] }), {
              status: 200,
            })
          );
        }
        return Promise.resolve(
          new Response(
            JSON.stringify({
              score: 1,
              cats: { AnonymisationServices: 50 },
            }),
            { status: 200 }
          )
        );
      })
    );

    const snap = await fetchXforceLookup(
      "8.8.8.8",
      "key",
      "pass",
      AbortSignal.timeout(5000)
    );

    expect(xforceLookupSnapshotSchema.parse(snap).found).toBe(true);
    expect(snap.score).toBe(1);
    vi.unstubAllGlobals();
  });
});
