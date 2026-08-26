import type { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

const fetchQuery = vi.fn();

vi.mock("@tanstack/react-start", () => ({
  createIsomorphicFn: () => ({
    server: (_handler: () => unknown) => ({
      client: (clientHandler: () => Promise<unknown>) => () =>
        clientHandler(),
    }),
  }),
}));

vi.mock("@better-auth-ui/react", () => ({
  sessionOptions: vi.fn(() => ({ queryKey: ["session"] })),
}));

vi.mock("@/auth/client", () => ({
  authClient: {},
}));

import { sessionOptions } from "@better-auth-ui/react";

import { ensureAppSession } from "@/auth/ensure-session";

describe("ensureAppSession", () => {
  it("client path fetches the session query with staleTime 0", async () => {
    fetchQuery.mockResolvedValue({ user: { id: "user-1" } });
    const queryClient = { fetchQuery } as unknown as QueryClient;

    await ensureAppSession(queryClient);

    expect(sessionOptions).toHaveBeenCalled();
    expect(fetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({ staleTime: 0 })
    );
  });
});
