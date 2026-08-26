import { fireEvent, render, screen } from "@testing-library/react";
import type { Table } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";

import { DataTablePagination } from "@/shared/ui/data-table/data-table-pagination";

function mockTable(overrides: Partial<Table<unknown>> = {}): Table<unknown> {
  return {
    getPageCount: () => 3,
    getState: () => ({ pagination: { pageIndex: 0 } }),
    getFilteredRowModel: () => ({ rows: [{}, {}, {}] }),
    getCanPreviousPage: () => false,
    getCanNextPage: () => true,
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    ...overrides,
  } as unknown as Table<unknown>;
}

describe("DataTablePagination", () => {
  it("returns null for a single page", () => {
    const { container } = render(
      <DataTablePagination table={mockTable({ getPageCount: () => 1 })} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("navigates pages and shows counts", () => {
    const nextPage = vi.fn();
    render(<DataTablePagination table={mockTable({ nextPage })} />);

    expect(screen.getByText(/Page 1 of 3 · 3 total/)).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]!);
    expect(nextPage).toHaveBeenCalled();
  });
});
