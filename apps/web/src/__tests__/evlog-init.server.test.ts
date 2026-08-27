import { describe, expect, it, vi } from "vitest";

const initWatchdogLoggerMock = vi.hoisted(() => vi.fn());

vi.mock("@watchdog/log", () => ({
  initWatchdogLogger: initWatchdogLoggerMock,
}));

describe("evlog-init.server", () => {
  it("initializes the web service logger drain on import", async () => {
    await import("../evlog-init.server.ts");

    expect(initWatchdogLoggerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        service: "watchdog-web",
        drainDir: expect.stringContaining(".evlog/logs"),
      })
    );
  });
});
