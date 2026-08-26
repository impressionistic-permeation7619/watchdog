import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

const useSearchMock = vi.hoisted(() => vi.fn(() => ({ jobId: undefined })));
const useNavigateMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
    getRouteApi: () => ({
      useSearch: useSearchMock,
      useNavigate: () => useNavigateMock,
    }),
  };
});

vi.mock("@/domains/jobs/components/jobs", () => ({
  Jobs: ({ jobId }: { jobId?: string }) => <div>Jobs {jobId ?? "none"}</div>,
}));

vi.mock("@/shared/layout/page", () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { Route } from "@/routes/_protected/jobs/index";

const ACTIVE = {
  id: testId(10),
  slug: "alpha",
  name: "Alpha",
  description: null,
  allowThirdPartyEgress: false,
};

describe("jobs index route", () => {
  it("ensures queue data and prefetches secondary lists when a case is active", async () => {
    const ensureQueryData = vi.fn().mockResolvedValue([]);
    const prefetchQuery = vi.fn().mockResolvedValue(undefined);
    ensureQueryData.mockResolvedValueOnce({ active: ACTIVE, cases: [ACTIVE] });
    const loader = Route.options.loader as (ctx: never) => Promise<unknown>;

    await loader({
      context: { queryClient: { ensureQueryData, prefetchQuery } },
    } as never);

    expect(ensureQueryData).toHaveBeenCalledTimes(5);
    expect(prefetchQuery).toHaveBeenCalledTimes(2);
  });

  it("renders the jobs page with the selected job id", () => {
    useSearchMock.mockReturnValue({ jobId: testId(40) } as never);
    const Page = Route.options.component!;
    render(<Page />);
    expect(screen.getByText(`Jobs ${testId(40)}`)).toBeInTheDocument();
  });
});
