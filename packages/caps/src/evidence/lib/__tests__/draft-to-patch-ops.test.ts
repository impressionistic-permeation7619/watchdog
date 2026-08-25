import { describe, it, expect } from "vitest";

import { draftToPatchOps } from "../draft-to-patch-ops.ts";

describe("draft-to-patch-ops", () => {
  const entityId = "11111111-1111-4111-8111-111111111111";
  const evidenceId = "22222222-2222-4222-8222-222222222222";

  it("draftToPatchOps maps platform and status onto identifier create", () => {
    const patch = draftToPatchOps(
      {
        identifiers: [
          {
            type: "handle",
            value: "@alice",
            platform: "discord",
            status: "former",
            notes: "bio",
            evidenceQuote: "discord: @alice (left 2024)",
          },
        ],
        claims: [],
        questions: [],
      },
      { evidenceId, entityId }
    );
    expect(patch.length).toBe(1);
    const op = patch[0];
    expect(op.resource).toBe("identifier");
    expect(op.data.type).toBe("handle");
    expect(op.data.value).toBe("@alice");
    expect(op.data.platform).toBe("discord");
    expect(op.data.status).toBe("former");
    expect(typeof op.data.notes === "string").toBeTruthy();
    expect(op.data.notes).toMatch(/bio/);
    expect(op.data.notes).toMatch(/quote:/);
  });

  it("draftToPatchOps defaults platform to empty string when omitted", () => {
    const patch = draftToPatchOps(
      {
        identifiers: [{ type: "email", value: "a@b.co" }],
        claims: [],
        questions: [],
      },
      { evidenceId, entityId }
    );
    expect(patch[0].data.platform).toBe("");
    expect(patch[0].data.status).toBe(undefined);
  });

  it("draftToPatchOps normalizes platform aliases and keeps customs", () => {
    const aliasPatch = draftToPatchOps(
      {
        identifiers: [{ type: "handle", value: "@a", platform: "X" }],
        claims: [],
        questions: [],
      },
      { evidenceId, entityId }
    );
    expect(aliasPatch[0].data.platform).toBe("twitter");

    const customPatch = draftToPatchOps(
      {
        identifiers: [{ type: "handle", value: "@b", platform: "Boy Moment" }],
        claims: [],
        questions: [],
      },
      { evidenceId, entityId }
    );
    expect(customPatch[0].data.platform).toBe("boy_moment");
  });
});
