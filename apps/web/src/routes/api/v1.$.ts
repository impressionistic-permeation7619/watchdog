import { createFileRoute } from "@tanstack/react-router";

import { handleOpenApiRequest } from "@/lib/openapi-handler.server";

/** `/api/v1/*` — procedures, /spec.json, Scalar assets. */
export const Route = createFileRoute("/api/v1/$")({
  server: {
    handlers: {
      ANY: async ({ request }: { request: Request }) =>
        handleOpenApiRequest(request),
    },
  },
});
