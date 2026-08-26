import { describe, expect, it } from "vitest";

import {
  isUnauthorizedError,
  UnauthorizedError,
} from "@/auth/unauthorized-error";

describe("UnauthorizedError", () => {
  it("uses a stable name and default message", () => {
    const error = new UnauthorizedError();
    expect(error.name).toBe("UnauthorizedError");
    expect(error.message).toBe("Unauthorized");
  });

  it("detects unauthorized errors without string matching", () => {
    expect(isUnauthorizedError(new UnauthorizedError("nope"))).toBe(true);
    expect(isUnauthorizedError(new Error("Unauthorized"))).toBe(false);
  });
});
