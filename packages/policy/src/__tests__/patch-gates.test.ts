import { describe, it, expect } from "vitest";

import type { PatchOp } from "@watchdog/schemas";

import { assertPatchGates, assertPatchShape } from "../patch-gates.ts";

describe("patch-gates", () => {
  const entityId = "11111111-1111-4111-8111-111111111111";
  const evidenceId = "22222222-2222-4222-8222-222222222222";
  const opId = "33333333-3333-4333-8333-333333333333";

  function claimOp(overrides: Partial<PatchOp> = {}): PatchOp {
    return {
      op: "create",
      resource: "claim",
      id: opId,
      data: {
        entityId,
        text: "observed host",
        class: "observation",
      },
      ...overrides,
    };
  }

  function edgeOp(predicate: string, notes?: string): PatchOp {
    return {
      op: "create",
      resource: "edge",
      id: opId,
      data: {
        fromId: entityId,
        toId: "44444444-4444-4444-8444-444444444444",
        predicate,
        ...(notes === undefined ? {} : { notes }),
      },
    };
  }

  it("assertPatchGates rejects confidence-gated patch without confidence", () => {
    expect(() => {
      assertPatchGates([claimOp()]);
    }).toThrow(/confidence is required/);
  });

  it("assertPatchGates accepts unverified with claim ops", () => {
    expect(() => {
      assertPatchGates([claimOp()], { confidence: "unverified" });
    }).not.toThrow();
  });

  it("assertPatchGates rejects confirmed with zero evidence", () => {
    expect(() => {
      assertPatchGates([claimOp()], {
        confidence: "confirmed",
      });
    }).toThrow(/confirmed requires at least one Evidence/);
  });

  it("assertPatchGates accepts confirmed via op evidenceIds", () => {
    expect(() => {
      assertPatchGates([claimOp({ evidenceIds: [evidenceId] })], {
        confidence: "confirmed",
      });
    }).not.toThrow();
  });

  it("assertPatchGates accepts confirmed via sharedEvidenceIds", () => {
    expect(() => {
      assertPatchGates([claimOp()], {
        confidence: "confirmed",
        sharedEvidenceIds: [evidenceId],
      });
    }).not.toThrow();
  });

  it("assertPatchGates rejects unknown claim class", () => {
    expect(() => {
      assertPatchGates(
        [
          claimOp({
            data: {
              entityId,
              text: "x",
              class: "not-a-class",
            },
          }),
        ],
        { confidence: "unverified" }
      );
    }).toThrow(/Invalid claim class/);
  });

  it("assertPatchGates rejects unknown edge predicate", () => {
    expect(() => {
      assertPatchGates([edgeOp("owns_everything")], {
        confidence: "unverified",
      });
    }).toThrow(/Invalid edge predicate/);
  });

  it("assertPatchGates rejects related_to without notes", () => {
    expect(() => {
      assertPatchGates([edgeOp("related_to")], {
        confidence: "unverified",
      });
    }).toThrow(/related_to requires notes/);
  });

  it("assertPatchGates accepts related_to with notes", () => {
    expect(() => {
      assertPatchGates([edgeOp("related_to", "same household hypothesised")], {
        confidence: "unverified",
      });
    }).not.toThrow();
  });

  it("assertPatchShape accepts claim without confidence", () => {
    expect(() => {
      assertPatchShape([claimOp()]);
    }).not.toThrow();
  });

  it("assertPatchShape rejects related_to without notes", () => {
    expect(() => {
      assertPatchShape([edgeOp("related_to")]);
    }).toThrow(/related_to/);
  });
});
