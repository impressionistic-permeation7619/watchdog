import { z } from "zod";

import { pub } from "../os";

export const health = pub
  .route({
    method: "GET",
    path: "/health",
    summary: "Health check",
    tags: ["system"],
  })
  .output(
    z.object({
      ok: z.literal(true),
      service: z.literal("watchdog"),
    })
  )
  .handler(async () => ({ ok: true as const, service: "watchdog" as const }));
