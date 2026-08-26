import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({
      location: { pathname: "/tasks" },
      matches: [{ params: {} }],
    }),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: (...args: unknown[]) => useQueryMock(...args),
  };
});

import { usePageTrail } from "@/shared/layout/use-page-trail";

describe("usePageTrail", () => {
  it("builds trail items from pathname and case context", () => {
    useQueryMock.mockImplementation((query: { queryKey?: readonly unknown[] }) => {
      if (query.queryKey?.[0] === "cases") {
        return {
          data: {
            active: { id: "1", slug: "alpha", name: "Alpha" },
            cases: [{ id: "1", slug: "alpha", name: "Alpha" }],
          },
        };
      }
      return { data: null, isPending: false };
    });

    const { result } = renderHook(() => usePageTrail());

    expect(result.current.items.at(-1)?.label).toBe("Tasks");
    expect(result.current.items[0]?.label).toBe("Alpha");
    expect(result.current.pendingLast).toBe(false);
  });
});
