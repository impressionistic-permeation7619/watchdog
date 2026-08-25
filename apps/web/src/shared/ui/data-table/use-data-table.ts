import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  OnChangeFn,
  SortingState,
  Table,
  TableMeta,
  VisibilityState,
} from "@tanstack/react-table";
import { useState } from "react";

export interface UseDataTableOptions<TData, TMeta = Record<string, unknown>> {
  data: TData[];
  columns: ColumnDef<TData>[];
  meta?: TMeta;
  getRowId?: (row: TData) => string;
  initialSorting?: SortingState;
  globalFilter?: string;
  onGlobalFilterChange?: OnChangeFn<string>;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  globalFilterFn?: FilterFn<TData>;
  pageSize?: number;
}

export function useDataTable<TData, TMeta = Record<string, unknown>>(
  options: UseDataTableOptions<TData, TMeta>
): {
  table: Table<TData>;
} {
  const {
    data,
    columns,
    meta,
    getRowId,
    initialSorting = [],
    globalFilter: controlledGlobalFilter,
    onGlobalFilterChange: controlledOnGlobalFilterChange,
    columnFilters: controlledColumnFilters,
    onColumnFiltersChange: controlledOnColumnFiltersChange,
    globalFilterFn,
    pageSize = 25,
  } = options;

  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [internalFilters, setInternalFilters] = useState<ColumnFiltersState>(
    []
  );
  const [internalGlobalFilter, setInternalGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columnFilters = controlledColumnFilters ?? internalFilters;
  const onColumnFiltersChange =
    controlledOnColumnFiltersChange ?? setInternalFilters;
  const globalFilter = controlledGlobalFilter ?? internalGlobalFilter;
  const onGlobalFilterChange =
    controlledOnGlobalFilterChange ?? setInternalGlobalFilter;

  const table = useReactTable({
    columns,
    data,
    // Call-site TMeta is checked by UseDataTableOptions; TanStack's TableMeta is module-aug only.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- bridge generic TMeta into TanStack's empty TableMeta slot
    meta: meta as TableMeta<TData> | undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
    globalFilterFn,
    initialState: { pagination: { pageSize } },
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange,
    onSortingChange: setSorting,
    state: { columnFilters, columnVisibility, globalFilter, sorting },
  });

  return { table };
}
