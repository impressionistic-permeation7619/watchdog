import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { testId } from "@watchdog/test-kit";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

const useSearchMock = vi.hoisted(() =>
  vi.fn(() => ({ evidenceId: undefined }))
);
const useNavigateMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
    getRouteApi: () => ({
      useSearch: useSearchMock,
      useNavigate: () => useNavigateMock,
    }),
  };
});

vi.mock("@/domains/intake/components/intake", () => ({
  Intake: ({ evidenceId }: { evidenceId?: string }) => (
    <div>Intake {evidenceId ?? "none"}</div>
  ),
}));

vi.mock("@/shared/layout/page", () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { Route } from "@/routes/_protected/intake/index";

const ACTIVE = {
  id: testId(10),
  slug: "alpha",
  name: "Alpha",
  description: null,
  allowThirdPartyEgress: false,
};

describe("intake index route", () => {
  it("loads evidence and prefetches entities and jobs for the active case", async () => {
    const ensureQueryData = vi
      .fn()
      .mockResolvedValueOnce({ active: ACTIVE, cases: [ACTIVE] })
      .mockResolvedValue([]);
    const prefetchQuery = vi.fn().mockResolvedValue(undefined);
    const loader = Route.options.loader as (ctx: never) => Promise<unknown>;

    await loader({
      context: { queryClient: { ensureQueryData, prefetchQuery } },
    } as never);

    expect(ensureQueryData).toHaveBeenCalledTimes(2);
    expect(prefetchQuery).toHaveBeenCalledTimes(2);
  });

  it("renders the intake page with the selected evidence id", () => {
    useSearchMock.mockReturnValue({ evidenceId: testId(30) } as never);
    const Page = Route.options.component!;
    render(<Page />);
    expect(screen.getByText(`Intake ${testId(30)}`)).toBeInTheDocument();
  });
});
