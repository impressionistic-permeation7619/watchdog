import { describe, it, expect } from "vitest";

import {
  optionalTrimmedSchema,
  trimmedOrNull,
  trimmedOrUndefined,
} from "../primitives.ts";

describe("primitives-trim", () => {
  const absent: string | undefined = undefined;
  const absentNull: string | null = null;

  it("trimmedOrUndefined: undefined / empty / whitespace → undefined", () => {
    expect(trimmedOrUndefined(absent)).toBe(undefined);
    expect(trimmedOrUndefined(absentNull)).toBe(undefined);
    expect(trimmedOrUndefined("")).toBe(undefined);
    expect(trimmedOrUndefined("  ")).toBe(undefined);
  });

  it("trimmedOrUndefined: keeps non-empty trimmed string", () => {
    expect(trimmedOrUndefined("x")).toBe("x");
    expect(trimmedOrUndefined("  hello  ")).toBe("hello");
  });

  it("trimmedOrNull: undefined / empty / whitespace → null", () => {
    expect(trimmedOrNull(absent)).toBe(null);
    expect(trimmedOrNull(absentNull)).toBe(null);
    expect(trimmedOrNull("")).toBe(null);
    expect(trimmedOrNull("  ")).toBe(null);
  });

  it("trimmedOrNull: keeps non-empty trimmed string", () => {
    expect(trimmedOrNull("x")).toBe("x");
    expect(trimmedOrNull("  hello  ")).toBe("hello");
  });

  it("optionalTrimmedSchema: collapses blank to absent", () => {
    expect(optionalTrimmedSchema.parse(absent)).toBe(undefined);
    expect(optionalTrimmedSchema.parse("")).toBe(undefined);
    expect(optionalTrimmedSchema.parse("  ")).toBe(undefined);
    expect(optionalTrimmedSchema.parse("  hello  ")).toBe("hello");
  });
});
