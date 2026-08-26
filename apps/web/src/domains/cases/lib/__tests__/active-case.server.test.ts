import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server", () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
}));

import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";

import { ACTIVE_CASE_COOKIE } from "@/domains/cases/lib/active-case";
import {
  readActiveCaseId,
  writeActiveCaseId,
} from "@/domains/cases/lib/active-case.server";

describe("active case cookie helpers", () => {
  it("reads the active case id from the request cookie", () => {
    vi.mocked(getCookie).mockReturnValue("case-1");
    expect(readActiveCaseId()).toBe("case-1");
    expect(getCookie).toHaveBeenCalledWith(ACTIVE_CASE_COOKIE);
  });

  it("writes the active case cookie when an id is provided", () => {
    writeActiveCaseId("case-1");
    expect(setCookie).toHaveBeenCalledWith(
      ACTIVE_CASE_COOKIE,
      "case-1",
      expect.objectContaining({ httpOnly: true, sameSite: "lax" })
    );
  });

  it("clears the active case cookie when id is null", () => {
    writeActiveCaseId(null);
    expect(deleteCookie).toHaveBeenCalledWith(ACTIVE_CASE_COOKIE, {
      path: "/",
    });
  });
});
