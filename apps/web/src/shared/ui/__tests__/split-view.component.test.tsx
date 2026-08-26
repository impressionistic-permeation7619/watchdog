import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/hooks/use-hydrated", () => ({
  useHydrated: () => true,
}));

vi.mock("@/shared/ui/shadcn/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="split-group">{children}</div>
  ),
  ResizablePanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

import { SplitView } from "@/shared/ui/split-view";

describe("SplitView", () => {
  it("renders list and detail columns when hydrated", () => {
    render(<SplitView list={<div>Queue</div>} detail={<div>Detail</div>} />);

    expect(screen.getByTestId("split-group")).toBeInTheDocument();
    expect(screen.getByText("Queue")).toBeInTheDocument();
    expect(screen.getByText("Detail")).toBeInTheDocument();
  });
});
