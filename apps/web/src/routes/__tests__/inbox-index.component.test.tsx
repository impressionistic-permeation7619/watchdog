import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

const useSearchMock = vi.hoisted(() =>
  vi.fn(() => ({ proposalId: undefined, status: undefined }))
);
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

vi.mock("@/domains/inbox/components/inbox", () => ({
  Inbox: ({
    proposalId,
    initialStatus,
  }: {
    proposalId?: string;
    initialStatus?: string;
  }) => (
    <div>
      Inbox {proposalId ?? "none"} {initialStatus ?? "all"}
    </div>
  ),
}));

vi.mock("@/shared/layout/page", () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { Route } from "@/routes/_protected/inbox/index";

const ACTIVE = {
  id: testId(10),
  slug: "alpha",
  name: "Alpha",
  description: null,
  allowThirdPartyEgress: false,
};

describe("inbox index route", () => {
  it("prefetches proposals and evidence when a case is active", async () => {
    const ensureQueryData = vi
      .fn()
      .mockResolvedValueOnce({ active: ACTIVE, cases: [ACTIVE] })
      .mockResolvedValue([]);
    const loader = Route.options.loader as (ctx: never) => Promise<unknown>;

    await loader({
      context: { queryClient: { ensureQueryData } },
    } as never);

    expect(ensureQueryData).toHaveBeenCalledTimes(3);
  });

  it("renders the inbox page with search params", () => {
    useSearchMock.mockReturnValue({
      proposalId: testId(20),
      status: "pending",
    } as never);
    const Page = Route.options.component!;
    render(<Page />);
    expect(screen.getByText(`Inbox ${testId(20)} pending`)).toBeInTheDocument();
  });
});
