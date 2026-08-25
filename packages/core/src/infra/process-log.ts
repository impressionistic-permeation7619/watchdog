import { createLogger } from "@watchdog/log";

export function logSwallowed(
  scope: string,
  error: unknown,
  fields?: Record<string, unknown>
): void {
  const log = createLogger({ scope, ...fields });
  log.error(error instanceof Error ? error : new Error(String(error)));
  void log.emit();
}

export function logProcess(
  scope: string,
  message: string,
  fields?: Record<string, unknown>
): void {
  const log = createLogger({ scope, ...fields });
  log.set({ message });
  void log.emit();
}
