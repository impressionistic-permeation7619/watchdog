import { describe, expect, it, vi } from "vitest";

import { fetchWhoisXml } from "../whoisxml";

describe("whoisxml", () => {
  it("fetchWhoisXml maps WhoisXML JSON payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            WhoisRecord: {
              registrarName: "Example Registrar",
              createdDate: "2000-01-01",
              nameServers: { hostNames: ["ns1.example.com"] },
              status: "ok",
            },
          }),
          { status: 200 }
        )
      )
    );

    const snap = await fetchWhoisXml(
      "example.com",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(snap.source).toBe("whoisxml");
    expect(snap.registrar).toBe("Example Registrar");
    vi.unstubAllGlobals();
  });
});
