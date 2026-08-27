import { describe, expect, it } from "vitest";

import { hostFootprint, urlCapture, urlHistory } from "../definitions";

describe("playbook definitions", () => {
  it("hostFootprint chains passive DNS through CT lookups", () => {
    expect(hostFootprint.id).toBe("host-footprint");
    expect(hostFootprint.steps[0]).toBe("network.dns.lookup");
    expect(hostFootprint.steps).toContain("network.ct.lookup");
  });

  it("urlHistory pins wayback limit in step input", () => {
    const first = urlHistory.steps[0];
    expect(typeof first).toBe("object");
    if (typeof first === "string") return;
    expect(first.capabilityId).toBe("archive.wayback.lookup");
    expect(first.input).toEqual({ limit: 25 });
  });

  it("urlCapture requires url and evidence seeds", () => {
    expect(urlCapture.seedKinds).toEqual(["url", "evidence"]);
    expect(urlCapture.steps[1]).toBe("evidence.harvest");
  });
});
