import { scheduler } from "node:timers/promises";

import { createLogger } from "@watchdog/log";

import { bootWorker } from "./boot-worker";

export { bootWorker };

if (process.env.VITEST !== "true") {
  try {
    await bootWorker();
  } catch (error: unknown) {
    const log = createLogger({ scope: "worker.fatal" });
    log.error(error instanceof Error ? error : new Error(String(error)));
    log.emit();
    await scheduler.yield();
    process.exit(1);
  }
}
