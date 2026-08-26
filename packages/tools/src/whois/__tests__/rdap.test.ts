import { describe, expect, it, vi } from "vitest";

import { fetchRdapWhois } from "../rdap";

describe("rdap whois", () => {
  it("fetchRdapWhois maps registrar and nameservers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ldhName: "EXAMPLE.COM",
            status: ["client transfer prohibited"],
            entities: [
              {
                roles: ["registrar"],
                vcardArray: ["vcard", [["fn", {}, "text", "Example Registrar"]]],
              },
            ],
            nameservers: [{ ldhName: "ns1.example.com" }],
            events: [
              { eventAction: "registration", eventDate: "2000-01-01T00:00:00Z" },
            ],
          }),
          { status: 200 }
        )
      )
    );

    const snap = await fetchRdapWhois("example.com", AbortSignal.timeout(5000));

    expect(snap.source).toBe("rdap");
    expect(snap.registrar).toBe("Example Registrar");
    expect(snap.nameservers).toContain("ns1.example.com");
    vi.unstubAllGlobals();
  });
});
