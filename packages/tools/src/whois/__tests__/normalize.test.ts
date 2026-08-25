import { describe, expect, it } from "vitest";

import { normalizeHost } from "../normalize.ts";

describe("normalizeHost", () => {
  it("strips scheme, path, and trailing dot", () => {
    expect(normalizeHost("https://MailHost.test./path")).toBe("mailhost.test");
  });
});
