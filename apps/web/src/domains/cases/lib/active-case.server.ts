import "@tanstack/react-start/server-only";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";

import { ACTIVE_CASE_COOKIE } from "@/domains/cases/lib/active-case";

const COOKIE_OPTS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
  httpOnly: true,
};

/** Read active Case id from the request cookie (null if unset). */
export function readActiveCaseId(): string | null {
  return getCookie(ACTIVE_CASE_COOKIE) ?? null;
}

/** Persist or clear the active Case cookie on the response. */
export function writeActiveCaseId(caseId: string | null): void {
  if (caseId) {
    setCookie(ACTIVE_CASE_COOKIE, caseId, COOKIE_OPTS);
    return;
  }
  deleteCookie(ACTIVE_CASE_COOKIE, { path: "/" });
}
