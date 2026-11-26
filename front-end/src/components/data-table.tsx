"use client";

import { useState, type ReactNode } from "react";
import {
  type ColumnDef,
  type RowData,
  type SortingState,
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  flexRender,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    basic: sortFn_basic,
  },
});

export type AppFeatures = typeof features;
export type AppColumn<T extends RowData> = ColumnDef<AppFeatures, T>;

export function DataTable<T extends RowData & { id: string }>({
  data,
  columns,
  searchPlaceholder = "Search this list",
  toolbar,
  searchAlign = "start",
  hideSearch = false,
  filter,
  onRowClick,
  initialSorting = [],
  pageSize = 8,
}: {
  data: T[];
  columns: AppColumn<T>[];
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  searchAlign?: "start" | "end";
  hideSearch?: boolean;
  filter?: string;
  onRowClick?: (row: T) => void;
  initialSorting?: SortingState;
  pageSize?: number;
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const activeFilter = filter ?? globalFilter;
  const table = useTable(
    {
      features,
      data,
      columns,
      getRowId: (row) => row.id,
      globalFilterFn: "includesString",
      state: { globalFilter: activeFilter },
      onGlobalFilterChange: setGlobalFilter,
      initialState: {
        pagination: { pageIndex: 0, pageSize },
        sorting: initialSorting,
      },
    },
    (tableState) => ({
      pagination: tableState.pagination,
      sorting: tableState.sorting,
    }),
  );

  const rows = table.getRowModel().rows;
  const count = table.getPrePaginatedRowModel().rows.length;
  const { pageIndex, pageSize: size } = table.state.pagination;
  const start = count === 0 ? 0 : pageIndex * size + 1;
  const end = Math.min(count, (pageIndex + 1) * size);

  return (
    <div className="grid gap-3">
      {hideSearch && !toolbar ? null : (
      <div className="flex flex-wrap items-center gap-2">
        {toolbar}
        {hideSearch ? null : (
        <Input
          value={activeFilter}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className={cn(
            "min-w-48 bg-card",
            searchAlign === "end" ? "w-full sm:ml-auto sm:w-64" : "w-full flex-1 sm:max-w-sm",
          )}
        />
        )}
      </div>
      )}
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getCanSort()
                    ? header.column.getIsSorted()
                    : false;
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-left"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No records match.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                  aria-label={
                    onRowClick
                      ? `Open ${
                          row
                            .getAllCells()
                            .map((cell) => cell.getValue())
                            .filter(
                              (value): value is string =>
                                typeof value === "string" && value.trim().length > 0,
                            )
                            .slice(0, 3)
                            .join(", ") || "record"
                        }`
                      : undefined
                  }
                  className={onRowClick ? "cursor-pointer" : undefined}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={(event) => {
                    if (!onRowClick) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(row.original);
                    }
                  }}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {count === 0 ? "0 records" : `Showing ${start}–${end} of ${count}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
