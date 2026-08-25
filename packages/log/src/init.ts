import { auditRedactPreset, initLogger } from "evlog";
import { createFsDrain } from "evlog/fs";

export interface InitWatchdogLoggerOptions {
  service: string;
  drainDir: string;
  pretty?: boolean;
}

const EXTRA_REDACT_PATHS = [
  "password",
  "*_token",
  "x-api-key",
  "authorization",
  "cookie",
  "set-cookie",
] as const;

let initialized = false;

/** Init process logger once (FS NDJSON + stdout). Safe to call again (HMR). */
export function initWatchdogLogger(options: InitWatchdogLoggerOptions): void {
  if (initialized) return;
  initialized = true;

  const isProd = process.env.NODE_ENV === "production";
  const pretty = options.pretty ?? !isProd;

  initLogger({
    env: { service: options.service },
    pretty,
    redact: {
      paths: [...(auditRedactPreset.paths ?? []), ...EXTRA_REDACT_PATHS],
    },
    drain: createFsDrain({
      dir: options.drainDir,
      pretty,
      maxFiles: 14,
    }),
  });
}
