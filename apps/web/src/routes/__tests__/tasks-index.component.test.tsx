import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

const useSearchMock = vi.hoisted(() => vi.fn(() => ({ entityId: undefined })));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
    getRouteApi: () => ({
      useSearch: useSearchMock,
    }),
  };
});

vi.mock("@/domains/tasks/components/tasks-page", () => ({
  TasksPage: ({ entityId }: { entityId?: string }) => (
    <div>Tasks page {entityId ?? "all"}</div>
  ),
}));

import { Route } from "@/routes/_protected/tasks/index";

const ACTIVE = {
  id: testId(10),
  slug: "alpha",
  name: "Alpha",
  description: null,
  allowThirdPartyEgress: false,
};

describe("tasks index route", () => {
  it("loads tasks for the active case and prefetches entities", async () => {
    const entityId = testId(50);
    const ensureQueryData = vi
      .fn()
      .mockResolvedValueOnce({ active: ACTIVE, cases: [ACTIVE] })
      .mockResolvedValue([]);
    const prefetchQuery = vi.fn().mockResolvedValue(undefined);
    const loader = Route.options.loader as (ctx: never) => Promise<unknown>;

    await loader({
      context: { queryClient: { ensureQueryData, prefetchQuery } },
      deps: { entityId },
    } as never);

    expect(ensureQueryData).toHaveBeenCalledTimes(2);
    expect(prefetchQuery).toHaveBeenCalledTimes(1);
  });

  it("renders the tasks page with the entity filter", () => {
    useSearchMock.mockReturnValue({ entityId: testId(50) } as never);
    const Page = Route.options.component!;
    render(<Page />);
    expect(screen.getByText(`Tasks page ${testId(50)}`)).toBeInTheDocument();
  });
});
