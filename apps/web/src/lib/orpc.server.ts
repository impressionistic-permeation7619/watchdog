import "@tanstack/react-start/server-only";
import { createRouterClient, type RouterClient } from "@orpc/server";

import { router, type ApiActor, type AppRouter } from "@watchdog/api";
import { peekRequestLogger } from "@watchdog/log";

export { orpcNullIfNotFound } from "@/lib/orpc-null-if-not-found";

export function orpcForActor(actor: ApiActor): RouterClient<AppRouter> {
  return createRouterClient(router, {
    context: {
      headers: new Headers(),
      actor,
      log: peekRequestLogger(),
    },
  });
}

export { actorFromSession } from "@/auth/api-context.server";
