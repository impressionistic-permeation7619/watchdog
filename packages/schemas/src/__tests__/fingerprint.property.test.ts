import { describe, expect, it } from "vitest";

import { buildClaimCreateOp, testId } from "@watchdog/test-kit";
import { fc } from "@watchdog/test-kit/fc";

import { fingerprintPatchOp } from "../fingerprint.ts";

describe("fingerprintPatchOp properties", () => {
  it("is deterministic for arbitrary claim text", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (text) => {
        const op = buildClaimCreateOp(testId(20), text);
        expect(fingerprintPatchOp(op)).toBe(fingerprintPatchOp({ ...op }));
      })
    );
  });
});
