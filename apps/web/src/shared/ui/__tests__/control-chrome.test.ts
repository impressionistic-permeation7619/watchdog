import { describe, expect, it } from "vitest";

import {
  CONTROL_CELL,
  CONTROL_FIELD_TRIGGER,
  CONTROL_HEIGHT,
  CONTROL_TRIGGER,
  resolveSelectValue,
} from "@/shared/ui/control-chrome";

describe("control-chrome", () => {
  it("composes shared trigger tokens", () => {
    expect(CONTROL_TRIGGER).toContain(CONTROL_HEIGHT);
    expect(CONTROL_FIELD_TRIGGER).toContain("wd-field-trigger");
    expect(CONTROL_CELL).toContain("h-7");
  });

  it("normalizes Select onValueChange payloads", () => {
    expect(resolveSelectValue("foo")).toBe("foo");
    expect(resolveSelectValue(["bar"])).toBe("bar");
    expect(resolveSelectValue([])).toBe(null);
    expect(resolveSelectValue(123)).toBe(null);
  });
});
