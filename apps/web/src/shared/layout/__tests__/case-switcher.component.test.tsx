import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

const useSuspenseQueryMock = vi.hoisted(() => vi.fn());
const useSelectActiveCaseMock = vi.hoisted(() =>
  vi.fn(() => ({ mutate: vi.fn() }))
);

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
      <a href={to}>{children}</a>
    ),
    useNavigate: () => vi.fn(),
    useRouterState: ({ select }: { select: (state: { location: { pathname: string; search: Record<string, unknown> } }) => unknown }) =>
      select({ location: { pathname: "/tasks", search: {} } }),
  };
});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useSuspenseQuery: (...args: unknown[]) => useSuspenseQueryMock(...args),
  };
});

vi.mock("@/shared/lib/use-select-active-case", () => ({
  useSelectActiveCase: () => useSelectActiveCaseMock(),
}));

vi.mock("@/shared/lib/query-invalidation", () => ({
  bindCasesChangedInvalidation: vi.fn(),
}));

vi.mock("@/shared/ui/shadcn/sidebar", () => ({
  SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({
    children,
    render,
  }: {
    children: React.ReactNode;
    render?: React.ReactElement;
  }) => (
    <div>
      {render}
      {children}
    </div>
  ),
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSidebar: () => ({ state: "expanded", isMobile: false }),
}));

vi.mock("@/shared/ui/shadcn/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { CaseSwitcher } from "@/shared/layout/case-switcher";

const ACTIVE = {
  id: testId(10),
  slug: "alpha",
  name: "Alpha Case",
  description: null,
  allowThirdPartyEgress: false,
};

function renderCaseSwitcher() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <Suspense fallback={<div>Loading case switcher</div>}>
        <CaseSwitcher />
      </Suspense>
    </QueryClientProvider>
  );
}

describe("CaseSwitcher", () => {
  it("prompts to create a case when none exist", () => {
    useSuspenseQueryMock.mockReturnValue({
      data: { active: null, cases: [] },
    });

    renderCaseSwitcher();
    expect(screen.getByText("Create a case…")).toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(useSuspenseQueryMock).toHaveBeenCalled();
  });

  it("shows the active case name when cases exist", () => {
    useSuspenseQueryMock.mockReturnValue({
      data: { active: ACTIVE, cases: [ACTIVE] },
    });

    renderCaseSwitcher();
    expect(screen.getAllByText("Alpha Case").length).toBeGreaterThan(0);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Entities")).toBeInTheDocument();
    expect(useSelectActiveCaseMock).toHaveBeenCalled();
  });
});
