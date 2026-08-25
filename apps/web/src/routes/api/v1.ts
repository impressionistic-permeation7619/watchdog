import { createFileRoute } from "@tanstack/react-router";

import { handleOpenApiRequest } from "@/lib/openapi-handler.server";

/** Exact `/api/v1` (Scalar root + trailing-slash-less hits). */
export const Route = createFileRoute("/api/v1")({
  server: {
    handlers: {
      ANY: async ({ request }: { request: Request }) =>
        handleOpenApiRequest(request),
    },
  },
});
