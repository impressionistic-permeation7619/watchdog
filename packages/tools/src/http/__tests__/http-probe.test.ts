import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { http, HttpResponse, mockServer } from "@watchdog/test-kit/http";

import { fetchHttpProbe } from "../http-probe.ts";

describe("fetchHttpProbe", () => {
  beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: "bypass" });
  });
  afterEach(() => {
    mockServer.resetHandlers();
  });
  afterAll(() => {
    mockServer.close();
  });

  it("returns the final URL and status for a host", async () => {
    mockServer.use(
      http.head(
        "https://mailhost.test/",
        () =>
          new HttpResponse(null, {
            status: 200,
            headers: { "strict-transport-security": "max-age=1" },
          })
      ),
      http.get(
        "https://mailhost.test/.well-known/security.txt",
        () => new HttpResponse(null, { status: 404 })
      ),
      http.get(
        "https://mailhost.test/favicon.ico",
        () => new HttpResponse(null, { status: 404 })
      )
    );
    const snap = await fetchHttpProbe(
      "mailhost.test",
      new AbortController().signal,
      { userAgent: "watchdog-test" }
    );
    expect(snap.ok).toBe(true);
    expect(snap.status).toBe(200);
    expect(snap.finalUrl).toMatch(/mailhost\.test/);
  });
});
