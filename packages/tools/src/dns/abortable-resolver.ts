import { Resolver } from "node:dns/promises";

import { abortedToolsError } from "../errors/tools-error";

export function assertNotAborted(
  signal: AbortSignal,
  abortMessage: string
): void {
  if (signal.aborted) throw abortedToolsError(abortMessage);
}

export function withAbortableResolver(
  signal: AbortSignal,
  abortMessage: string
): { resolver: Resolver; cleanup: () => void } {
  const resolver = new Resolver();
  const onAbort = () => {
    try {
      resolver.cancel();
    } catch {
      // already cancelled / idle
    }
  };
  if (signal.aborted) {
    onAbort();
    throw abortedToolsError(abortMessage);
  }
  signal.addEventListener("abort", onAbort, { once: true });
  return {
    resolver,
    cleanup: () => {
      signal.removeEventListener("abort", onAbort);
    },
  };
}
