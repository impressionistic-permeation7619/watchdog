import { ORPCError } from "@orpc/server";

import { DomainError } from "@watchdog/core";
import { peekRequestLogger } from "@watchdog/log";

/** Map DomainError → ORPC/HTTP. Unknown errors propagate (→ 500). */
export async function mapDomainError<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!DomainError.is(error)) throw error;
    peekRequestLogger()?.set({ error: { domainCode: error.code } });
    switch (error.code) {
      case "not_found": {
        throw new ORPCError("NOT_FOUND", { message: error.message });
      }
      case "conflict": {
        throw new ORPCError("CONFLICT", { message: error.message });
      }
      case "invalid": {
        throw new ORPCError("BAD_REQUEST", { message: error.message });
      }
      case "forbidden": {
        throw new ORPCError("FORBIDDEN", { message: error.message });
      }
      default: {
        const _exhaustive: never = error.code;
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Unhandled domain error: ${JSON.stringify(_exhaustive)}`,
        });
      }
    }
  }
}
