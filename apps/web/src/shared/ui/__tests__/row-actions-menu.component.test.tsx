import { cloneElement, type ReactElement, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/ui/shadcn/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({
    children,
    render,
  }: {
    children: ReactNode;
    render?: ReactElement;
  }) => (
    <div>{render ? cloneElement(render, {}, children) : children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { RowActionsMenu } from "@/shared/ui/row-actions-menu";

describe("RowActionsMenu", () => {
  it("renders the row actions trigger and menu content", () => {
    render(
      <RowActionsMenu label="Row actions">
        <button type="button">Delete</button>
      </RowActionsMenu>
    );

    expect(screen.getByRole("button", { name: "Row actions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});
