import { describe, expect, it, vi } from "vitest";

import { fetchWhoxyWhois, whoxyLookupSnapshotSchema } from "../whoxy";

describe("whoxy", () => {
  it("fetchWhoxyWhois maps WHOIS payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 1,
            domain_name: "example.com",
            create_date: "2000-01-01",
            domain_registrar: { registrar_name: "Example Registrar" },
            name_servers: ["ns1.example.com"],
          }),
          { status: 200 }
        )
      )
    );

    const snap = await fetchWhoxyWhois(
      "example.com",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(whoxyLookupSnapshotSchema.parse(snap).ok).toBe(true);
    expect(snap.registrarName).toBe("Example Registrar");
    vi.unstubAllGlobals();
  });
});
