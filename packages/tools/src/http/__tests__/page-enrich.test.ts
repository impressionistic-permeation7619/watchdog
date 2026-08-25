import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { http, HttpResponse, mockServer } from "@watchdog/test-kit/http";

import { fetchPageEnrich } from "../page-enrich.ts";

describe("fetchPageEnrich", () => {
  beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: "error" });
  });
  afterEach(() => {
    mockServer.resetHandlers();
  });
  afterAll(() => {
    mockServer.close();
  });

  it("extracts the title from live HTML", async () => {
    mockServer.use(
      http.get("https://mailhost.test/page", () =>
        HttpResponse.text("<html><title>Ada</title></html>", {
          headers: { "content-type": "text/html" },
        })
      )
    );
    const snap = await fetchPageEnrich(
      "https://mailhost.test/page",
      new AbortController().signal,
      { userAgent: "watchdog-test" }
    );
    expect(snap.title).toBe("Ada");
    expect(snap.ok).toBe(true);
  });
});
