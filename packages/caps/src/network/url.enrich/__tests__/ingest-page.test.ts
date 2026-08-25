import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { http, HttpResponse, mockServer } from "@watchdog/test-kit/http";

import { ingestRemotePage } from "../ingest-page.ts";

describe("ingestRemotePage", () => {
  beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: "error" });
  });
  afterEach(() => {
    mockServer.resetHandlers();
  });
  afterAll(() => {
    mockServer.close();
  });

  it("converts live HTML into markdownish text", async () => {
    mockServer.use(
      http.get("https://mailhost.test/live", () =>
        HttpResponse.text("<html><title>Ada</title><p>Hello</p></html>", {
          headers: { "content-type": "text/html" },
        })
      )
    );
    const uploaded: string[] = [];
    const result = await ingestRemotePage({
      fetchUrl: "https://mailhost.test/live",
      linkBaseUrl: "https://mailhost.test/live",
      signal: new AbortController().signal,
      label: "live",
      uploadArtifact: async ({ name }) => {
        const artName = name ?? "blob";
        uploaded.push(artName);
        return {
          name: artName,
          mime: "text/plain",
          uri: `s3://${artName}`,
          sha256: "ab".repeat(32),
        };
      },
      log: () => {},
      allowPlainBinary: true,
    });
    expect(result.step.ok).toBe(true);
    expect(result.title).toBe("Ada");
    expect(result.text).toMatch(/Hello/);
    expect(uploaded.length).toBeGreaterThan(0);
  });
});
