/**
 * GET /api/v1/cases/:caseId/entities/:slug/export.md
 *
 * Returns the entity as an Obsidian-style markdown note.
 * Auth: session cookie or API key.
 */
import { createFileRoute } from "@tanstack/react-router";

import { createApiContext } from "@/auth/api-context.server";
import { getEntityByCaseSlug, renderEntityMarkdown } from "@watchdog/core";

export const Route = createFileRoute(
  "/api/v1/cases/$caseId/entities/$slug/export.md"
)({
  server: {
    handlers: {
      GET: async ({
        request,
        params,
      }: {
        request: Request;
        params: { caseId: string; slug: string };
      }) => {
        const ctx = await createApiContext(request);
        if (!ctx.actor) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { caseId, slug } = params;

        const entity = await getEntityByCaseSlug(caseId, slug);
        if (!entity) {
          return new Response("Not Found", { status: 404 });
        }

        const exported = await renderEntityMarkdown(entity.id);
        if (!exported) {
          return new Response("Not Found", { status: 404 });
        }

        return new Response(exported.markdown, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="${slug}-${new Date().toISOString().slice(0, 16).replaceAll(/[-T:]/g, "")}.md"`,
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
