import { describe, expect, it } from "vitest";

import {
  applyWatchdogCors,
  corsPreflightResponse,
} from "../api-cors.server";

describe("api-cors.server", () => {
  it("applyWatchdogCors reflects Origin on responses", () => {
    const request = new Request("https://app.example/api", {
      headers: { Origin: "https://app.example" },
    });
    const response = new Response("ok", { status: 200 });

    const corsed = applyWatchdogCors(request, response);

    expect(corsed.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://app.example"
    );
    expect(corsed.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("corsPreflightResponse returns 204 for OPTIONS with Origin", () => {
    const request = new Request("https://app.example/api", {
      method: "OPTIONS",
      headers: {
        Origin: "https://app.example",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    const res = corsPreflightResponse(request);

    expect(res?.status).toBe(204);
    expect(res?.headers.get("Access-Control-Allow-Headers")).toBe("content-type");
  });
});
