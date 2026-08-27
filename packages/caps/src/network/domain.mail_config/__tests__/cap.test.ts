import { describe, expect, it } from "vitest";

import { mailConfig } from "../cap";

describe("domain.mail_config cap", () => {
  it("registers collect metadata and mail config report label", () => {
    expect(mailConfig.id).toBe("network.domain.mail_config");
    expect(mailConfig.kind).toBe("collect");
    expect(mailConfig.consumes).toEqual([{ kind: "host" }]);
  });
});
