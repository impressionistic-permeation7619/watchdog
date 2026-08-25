import { useAuthenticate } from "@better-auth-ui/react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authClient } from "@/auth/client";
import { ensureAppSession } from "@/auth/ensure-session";
import { AppShell } from "@/shared/layout/app-shell";

function ProtectedLayout() {
  // Mid-visit revocation / other-tab sign-out — beforeLoad only runs on enter.
  useAuthenticate(authClient);

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ context: { queryClient }, location }) => {
    const session = await ensureAppSession(queryClient);

    if (!session) {
      const returnTo = location.href;
      // oxlint-disable-next-line typescript/only-throw-error -- TanStack Router's redirect() throws a Response, per docs
      throw redirect({
        to: "/auth/$path",
        params: { path: "sign-in" },
        // BA UI AuthProvider reads `redirectTo` from the URL search string.
        search: { redirectTo: returnTo },
      });
    }

    return { session, user: session.user };
  },
  component: ProtectedLayout,
});
