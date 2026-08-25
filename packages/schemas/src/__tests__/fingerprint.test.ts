import { describe, expect, it } from "vitest";

import {
  buildClaimCreateOp,
  buildEventCreateOp,
  buildIdentifierCreateOp,
  testId,
} from "@watchdog/test-kit";

import { fingerprintPatchOp } from "../fingerprint.ts";

describe("fingerprintPatchOp", () => {
  it("is stable for the same claim op", () => {
    const op = buildClaimCreateOp(testId(20), "Ada observed a host");
    expect(fingerprintPatchOp(op)).toBe(fingerprintPatchOp(op));
  });

  it("case-folds claim text", () => {
    const entityId = testId(20);
    expect(
      fingerprintPatchOp(buildClaimCreateOp(entityId, "Ada Observed"))
    ).toBe(fingerprintPatchOp(buildClaimCreateOp(entityId, "ada observed")));
  });

  it("uses the normalized identifier value and platform", () => {
    const entityId = testId(21);
    const mixed = buildIdentifierCreateOp(
      entityId,
      "email",
      "Ada@MailHost.TEST"
    );
    const folded = buildIdentifierCreateOp(
      entityId,
      "email",
      "ada@mailhost.test"
    );
    expect(fingerprintPatchOp(mixed)).toBe(fingerprintPatchOp(folded));
  });

  it("fingerprints an event by entity, when, and what", () => {
    const op = buildEventCreateOp(testId(22), "1815-12-10", "Born");
    expect(fingerprintPatchOp(op)).toBe(`event|${testId(22)}|1815-12-10|born`);
  });
});
