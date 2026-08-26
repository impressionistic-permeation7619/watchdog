import { describe, expect, it } from "vitest";

import { hashCapInput } from "../cap-cache";

describe("cap-cache", () => {
  it("hashCapInput is stable for key order in plain objects", () => {
    const a = hashCapInput({ b: 2, a: 1 });
    const b = hashCapInput({ a: 1, b: 2 });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("hashCapInput stringifies non-record inputs", () => {
    expect(hashCapInput("plain")).toMatch(/^[a-f0-9]{64}$/);
  });
});
