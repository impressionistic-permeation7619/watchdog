import { render, screen } from "@testing-library/react";
import type { Column, Table } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/ui/shadcn/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuCheckboxItem: ({
    children,
    checked,
  }: {
    children: React.ReactNode;
    checked?: boolean;
  }) => <div aria-checked={checked}>{children}</div>,
}));

import { DataTableViewOptions } from "@/shared/ui/data-table/data-table-view-options";

function mockColumn(id: string, visible: boolean): Column<unknown, unknown> {
  return {
    id,
    getCanHide: () => true,
    getIsVisible: () => visible,
    toggleVisibility: vi.fn(),
    columnDef: { meta: { label: id } },
  } as unknown as Column<unknown, unknown>;
}

describe("DataTableViewOptions", () => {
  it("shows visible column count in the trigger label", () => {
    const table = {
      getAllColumns: () => [mockColumn("name", true), mockColumn("status", false)],
      resetColumnVisibility: vi.fn(),
    } as unknown as Table<unknown>;

    render(<DataTableViewOptions table={table} />);

    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("name")).toHaveAttribute("aria-checked", "true");
  });
});
