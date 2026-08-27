import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

vi.mock("@/shared/layout/app-breadcrumbs", () => ({
  AppBreadcrumbs: () => null,
}));

vi.mock("@/shared/ui/shadcn/sidebar", () => ({
  SidebarTrigger: () => <button type="button">Menu</button>,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useSuspenseQuery: vi.fn(),
  };
});

vi.mock("@/domains/cases/components/case-graph/case-graph-canvas", () => ({
  CaseGraphCanvas: () => <div>Graph canvas</div>,
}));

import { useSuspenseQuery } from "@tanstack/react-query";

import { GraphPage } from "@/domains/cases/components/graph-page";
import type { CaseRecord } from "@/domains/cases/types";

const CASE: CaseRecord = {
  id: "case-1",
  slug: "alpha",
  name: "Alpha",
  description: null,
  allowThirdPartyEgress: false,
};

describe("GraphPage", () => {
  it("prompts users to go to Cases when no active case is selected", () => {
    vi.mocked(useSuspenseQuery).mockReturnValue({
      data: { cases: [], active: null },
    } as ReturnType<typeof useSuspenseQuery>);

    render(<GraphPage />);
    expect(screen.getByRole("link", { name: "Go to Cases" })).toHaveAttribute(
      "href",
      "/cases"
    );
    expect(screen.queryByText("Graph canvas")).not.toBeInTheDocument();
    expect(vi.mocked(useSuspenseQuery)).toHaveBeenCalled();
  });

  it("renders the graph canvas when an active case exists", () => {
    vi.mocked(useSuspenseQuery)
      .mockReturnValueOnce({
        data: { cases: [CASE], active: CASE },
      } as ReturnType<typeof useSuspenseQuery>)
      .mockReturnValueOnce({
        data: [],
      } as ReturnType<typeof useSuspenseQuery>);

    render(<GraphPage />);
    expect(screen.getByText("Graph canvas")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Go to Cases" })
    ).not.toBeInTheDocument();
    expect(vi.mocked(useSuspenseQuery)).toHaveBeenCalled();
  });
});
