import { RPCHandler } from "@orpc/server/fetch";
import { createFileRoute } from "@tanstack/react-router";

import { createApiContext } from "@/auth/api-context.server";
import { watchdogCorsPlugin } from "@/lib/api-cors.server";
import { router } from "@watchdog/api";

const handler = new RPCHandler(router, {
  plugins: [watchdogCorsPlugin],
});

export const Route = createFileRoute("/api/rpc/$")({
  server: {
    handlers: {
      ANY: async ({ request }: { request: Request }) => {
        const { response } = await handler.handle(request, {
          prefix: "/api/rpc",
          context: await createApiContext(request),
        });

        return response ?? new Response("Not Found", { status: 404 });
      },
    },
  },
});
