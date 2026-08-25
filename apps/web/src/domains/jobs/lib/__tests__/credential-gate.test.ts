import { describe, it, expect } from "vitest";

import {
  missingCredentialNames,
  missingCredentialReason,
} from "../credential-gate.ts";

describe("credential-gate", () => {
  it("missingCredentialNames skips optional and accepts anyOf", () => {
    const configured = new Set(["SHODAN_API_KEY"]);
    expect(
      missingCredentialNames(
        [{ name: "OPTIONAL_KEY", optional: true }, { name: "SHODAN_API_KEY" }],
        configured
      )
    ).toBe(undefined);
    expect(
      missingCredentialNames(
        [{ anyOf: ["ANTHROPIC_API_KEY", "AI_COMPAT_API_KEY"] }],
        configured
      )
    ).toEqual(["ANTHROPIC_API_KEY", "AI_COMPAT_API_KEY"]);
    expect(
      missingCredentialNames(
        [{ anyOf: ["ANTHROPIC_API_KEY", "AI_COMPAT_API_KEY"] }],
        new Set(["AI_COMPAT_API_KEY"])
      )
    ).toBe(undefined);
  });

  it("missingCredentialReason names Settings", () => {
    expect(missingCredentialReason(["SHODAN_API_KEY"], "Cap")).toBe(
      "Connect SHODAN_API_KEY in Settings before running this Cap"
    );
    expect(missingCredentialReason(["A", "B"], "playbook")).toBe(
      "Connect one of A | B in Settings before running this playbook"
    );
  });
});
