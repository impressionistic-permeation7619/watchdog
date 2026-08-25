import { describe, it, expect } from "vitest";

import { fc } from "@watchdog/test-kit/fc";
import { testId } from "@watchdog/test-kit/fixtures";

import { parseAgentPatch } from "../parse-agent-patch.ts";

const GATED_RESOURCES = ["claim", "identifier", "edge"] as const;
const CONFIDENCE_TIERS = ["unverified", "possible", "confirmed"] as const;

describe("parseAgentPatch", () => {
  it("refuses patches that smuggle confidence on gated resources", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...GATED_RESOURCES),
        fc.constantFrom(...CONFIDENCE_TIERS),
        (resource, confidence) => {
          const result = parseAgentPatch({
            patch: [
              {
                op: "create",
                resource,
                id: testId(30),
                data: {
                  entityId: testId(31),
                  text: "observed",
                  type: "email",
                  value: "ada@example.com",
                  fromId: testId(32),
                  toId: testId(33),
                  predicate: "operates",
                  confidence,
                },
              },
            ],
          });
          expect(result.ok).toBe(false);
        }
      )
    );
  });
});
