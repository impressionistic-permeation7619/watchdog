import { describe, expect, it } from "vitest";

import {
  HANDLE_REQUIRES_PLATFORM,
  isHandleWithoutPlatform,
} from "@/domains/dossier/components/identifiers-section.cells";

describe("identifiers-section.cells re-export", () => {
  it("flags handle identifiers missing a platform", () => {
    expect(isHandleWithoutPlatform("handle", "")).toBe(true);
    expect(isHandleWithoutPlatform("handle", "twitter")).toBe(false);
    expect(isHandleWithoutPlatform("email", "")).toBe(false);
    expect(HANDLE_REQUIRES_PLATFORM.length).toBeGreaterThan(10);
  });
});
