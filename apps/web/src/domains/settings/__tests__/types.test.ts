import { describe, expect, it } from "vitest";

import {
  deleteCredentialInputSchema,
  putCredentialInputSchema,
} from "@/domains/settings/types";

describe("settings credential schemas", () => {
  it("parses put credential input", () => {
    const parsed = putCredentialInputSchema.parse({
      name: "shodan",
      secret: "abc123",
      label: "  Primary  ",
    });
    expect(parsed.name).toBe("shodan");
    expect(parsed.secret).toBe("abc123");
    expect(parsed.label).toBe("Primary");
  });

  it("parses delete credential input", () => {
    const parsed = deleteCredentialInputSchema.parse({ name: "shodan" });
    expect(parsed.name).toBe("shodan");
  });

  it("rejects empty credential names", () => {
    expect(
      deleteCredentialInputSchema.safeParse({ name: "   " }).success
    ).toBe(false);
  });
});
