import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/domains/activity/queries", () => ({
  recentActivityQuery: () => ({ queryKey: ["activity", "recent"] }),
}));

vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: () => ({
    data: [],
    isFetching: false,
  }),
  Suspense: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { RecentActivity } from "../recent-activity";

describe("RecentActivity", () => {
  it("renders activity section header", () => {
    render(<RecentActivity cases={[]} />);

    expect(screen.getByLabelText(/recent activity/i)).toBeInTheDocument();
    expect(screen.getByText("Activity")).toBeInTheDocument();
  });
});
