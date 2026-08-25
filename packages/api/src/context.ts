import type { AuditableLogger } from "@watchdog/log";

export interface ApiActor {
  userId: string;
  email: string | null;
  name: string | null;
}

export interface ApiContext {
  headers: Headers;
  actor: ApiActor | null;
  /** Present when Start ALS has bound a request/ServerFn logger. */
  log?: AuditableLogger;
}
