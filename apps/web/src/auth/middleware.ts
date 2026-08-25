import { createMiddleware } from "@tanstack/react-start";

/** Server-fn middleware — enforces a session before the handler runs. */
export const requireAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { requireSession } = await import("@/auth/session.server");
    const session = await requireSession();
    return next({ context: { session } });
  }
);
