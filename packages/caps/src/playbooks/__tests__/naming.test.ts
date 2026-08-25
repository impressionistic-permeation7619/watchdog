import { describe, it, expect } from "vitest";

import "../../registry.ts";
import { listPlaybooks } from "../index.ts";

describe("naming", () => {
  it("playbook id first token matches seedKinds[0]", () => {
    for (const pb of listPlaybooks()) {
      const prefix = pb.id.split("-")[0];
      expect(
        prefix,
        `${pb.id}: id prefix "${prefix}" must equal seedKinds[0] "${pb.seedKinds[0]}"`
      ).toBe(pb.seedKinds[0]);
    }
  });

  it("every playbook has at least two Caps", () => {
    for (const pb of listPlaybooks()) {
      expect(pb.steps.length, pb.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("playbook ids are kebab-case without dots or underscores", () => {
    for (const pb of listPlaybooks()) {
      expect(pb.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(!pb.id.includes("."), pb.id).toBeTruthy();
      expect(!pb.id.includes("_"), pb.id).toBeTruthy();
      expect(pb.id.split("-").length <= 3, pb.id).toBeTruthy();
    }
  });
});
