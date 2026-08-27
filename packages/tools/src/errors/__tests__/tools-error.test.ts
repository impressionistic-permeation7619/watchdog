import { describe, expect, it } from "vitest";

import {
  ToolsError,
  abortedToolsError,
  errorMessage,
  httpToolsError,
  isToolsError,
  missingApiKey,
  rateLimitedToolsError,
  validationToolsError,
} from "../tools-error";

describe("tools-error", () => {
  it("ToolsError carries status and code", () => {
    const err = httpToolsError("Example API", 502);
    expect(isToolsError(err)).toBe(true);
    expect(err.status).toBe(502);
    expect(err.code).toBe("http_error");
  });

  it("factory helpers set expected codes", () => {
    expect(missingApiKey("TEST_KEY").code).toBe("missing_api_key");
    expect(rateLimitedToolsError("Svc", "x").status).toBe(429);
    expect(validationToolsError("bad").code).toBe("validation_error");
    expect(abortedToolsError("stop").code).toBe("aborted");
  });

  it("errorMessage stringifies unknown values", () => {
    expect(errorMessage(new ToolsError("boom"))).toBe("boom");
    expect(errorMessage("plain")).toBe("plain");
  });
});
