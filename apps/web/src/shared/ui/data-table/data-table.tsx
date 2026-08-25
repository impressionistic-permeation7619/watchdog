import { flexRender } from "@tanstack/react-table";
import type { Table as TanstackTable } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/shadcn/table";

/**
 * Portaled menus unmount before click — arm on pointerdown so leftover
 * clicks on the row do not navigate.
 */
const ROW_CLICK_IGNORE_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "[role='option']",
  "[role='listbox']",
  "[role='combobox']",
  "[data-slot='combobox-item']",
  "[data-slot='select-item']",
].join(", ");

function shouldIgnoreRowClick(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest(ROW_CLICK_IGNORE_SELECTOR) !== null
  );
}

interface Props<TData> {
  table: TanstackTable<TData>;
  emptyText?: string;
  className?: string;
  onRowClick?: (row: TData) => void;
  /** Extra row(s) appended after data rows — used for inline add composers. */
  appendRow?: ReactNode;
}

export function DataTable<TData>({
  table,
  emptyText = "No results.",
  className,
  onRowClick,
  appendRow,
}: Props<TData>) {
  const leafColumns = table.getVisibleLeafColumns();
  const hasRows = table.getRowModel().rows.length > 0;
  const totalSize = Math.max(
    leafColumns.reduce((sum, col) => sum + col.getSize(), 0),
    1
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border text-xs",
        "[&_tbody_tr]:h-10 [&_td]:py-1 [&_th]:h-8",
        className
      )}
    >
      <Table className="w-full table-fixed">
        <colgroup>
          {leafColumns.map((col) => (
            <col
              key={col.id}
              style={{ width: `${(col.getSize() / totalSize) * 100}%` }}
            />
          ))}
        </colgroup>
        <TableHeader className="bg-muted/80 sticky top-0 z-10 backdrop-blur">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="overflow-hidden">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {hasRows ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={onRowClick ? "cursor-pointer" : undefined}
                onPointerDown={
                  onRowClick
                    ? (e) => {
                        if (e.button !== 0) return;
                        e.currentTarget.dataset.wdRowClickArmed =
                          shouldIgnoreRowClick(e.target) ? "0" : "1";
                      }
                    : undefined
                }
                onClick={
                  onRowClick
                    ? (e) => {
                        const armed =
                          e.currentTarget.dataset.wdRowClickArmed === "1";
                        e.currentTarget.dataset.wdRowClickArmed = "";
                        if (!armed) return;
                        if (shouldIgnoreRowClick(e.target)) return;
                        onRowClick(row.original);
                      }
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="overflow-hidden">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={leafColumns.length}
                className="text-muted-foreground h-16 text-center"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          )}
          {appendRow}
        </TableBody>
      </Table>
    </div>
  );
}
