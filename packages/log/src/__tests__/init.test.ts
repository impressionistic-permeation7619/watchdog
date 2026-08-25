import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createLogger } from "@watchdog/log";

import { initWatchdogLogger } from "../init.ts";

describe("initWatchdogLogger", () => {
  it("redacts password-like fields from drained output", () => {
    const drainDir = mkdtempSync(path.join(tmpdir(), "wd-log-"));
    initWatchdogLogger({
      service: "test-log",
      drainDir,
      pretty: false,
    });
    const log = createLogger("test-log");
    log.info("auth", {
      password: "super-secret-password",
      authorization: "Bearer super-secret-token",
    });

    const files = readdirSync(drainDir);
    const body = files
      .map((name) => readFileSync(path.join(drainDir, name), "utf-8"))
      .join("\n");
    expect(body).not.toMatch(/super-secret-password/);
    expect(body).not.toMatch(/super-secret-token/);
  });
});
