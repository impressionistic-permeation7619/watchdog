import { describe, expect, it } from "vitest";

import { router } from "../router";

describe("router", () => {
  it("wires public health and authed domain procedure groups", () => {
    expect(router.health).toBeDefined();
    expect(router.tasks.list).toBeDefined();
    expect(router.cases.create).toBeDefined();
    expect(router.evidence.process).toBeDefined();
    expect(router.graph.write).toBeDefined();
  });
});
