import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
      <a href={to}>{children}</a>
    ),
  };
});

vi.mock("@/shared/ui/split-view", () => ({
  SplitView: ({ list, detail }: { list: React.ReactNode; detail: React.ReactNode }) => (
    <div>
      <div>{list}</div>
      <div>{detail}</div>
    </div>
  ),
}));

vi.mock("@/shared/ui/rich-text", () => ({
  RichTextEditor: () => <div>Rich text editor</div>,
}));

vi.mock("@/shared/ui/entity-combobox", () => ({
  EntityCombobox: () => <div>Entity combobox</div>,
}));

import { AtomsSection } from "@/routes/_protected/ui/-section-atoms";

describe("AtomsSection", () => {
  it("renders the atom catalog and filters entries by name", () => {
    render(<AtomsSection />);

    expect(screen.getByRole("heading", { name: "Atoms" })).toBeInTheDocument();
    expect(screen.getByText("IdChip")).toBeInTheDocument();
    expect(screen.getByText("StatusDot")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filter atoms"), {
      target: { value: "IdChip" },
    });

    expect(screen.getByText("IdChip")).toBeInTheDocument();
    expect(screen.queryByText("StatusDot")).not.toBeInTheDocument();
  });

  it("shows an empty-state message when no atoms match the filter", () => {
    render(<AtomsSection />);

    fireEvent.change(screen.getByLabelText("Filter atoms"), {
      target: { value: "zzzz-no-match" },
    });

    expect(screen.getByText(/No atoms match/)).toBeInTheDocument();
  });
});
