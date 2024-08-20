//@ts-nocheck
"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  selectedMonth: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  selectedMonth
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      selectedMonth,
    },
  })

  const statusCounts = React.useMemo(() => {
    const counts = {};
    columns.forEach(column => {
      if (column.accessorKey) {
        counts[column.accessorKey] = { completed: 0, pending: 0 };
      }
    });

    data.forEach((item: any) => {
      columns.forEach(column => {
        if (column.accessorKey) {
          const value = item[column.accessorKey];
          if (column.accessorKey === "suppStatus" || column.accessorKey === "bankStatus") {
            counts[column.accessorKey].completed += value === 'Active' ? 1 : 0;
            counts[column.accessorKey].pending += value === 'Inactive' ? 1 : 0;
          } else if (column.accessorKey === "uploadStatus") {
            counts[column.accessorKey].completed += value === 'Uploaded' ? 1 : 0;
            counts[column.accessorKey].pending += value === 'Not Uploaded' ? 1 : 0;
          } else if (typeof value === 'boolean') {
            counts[column.accessorKey].completed += value ? 1 : 0;
            counts[column.accessorKey].pending += value ? 0 : 1;
          } else if (value === "true" || value === "false") {
            counts[column.accessorKey].completed += value === "true" ? 1 : 0;
            counts[column.accessorKey].pending += value === "false" ? 1 : 0;
          } else if (value && value !== "") {
            counts[column.accessorKey].completed += 1;
          } else {
            counts[column.accessorKey].pending += 1;
          }
        }
      });
    });

    return counts;
  }, [data, columns]);

  const getColumnCount = React.useCallback((columnId: string) => {
    const count = statusCounts[columnId];
    if (!count) return '';
    const total = count.completed + count.pending;
    return `${count.completed}/${total}`;
  }, [statusCounts]);

  const renderHeaderRows = React.useCallback(() => (
    <>
      <TableRow>
        <TableCell className="bg-green-100 font-bold uppercase pl-2">COMPLETED</TableCell>
        {columns.map((column, index) => (
          <TableCell key={index} className="text-center bg-green-100 font-bold">
            {column.accessorKey ? getColumnCount(column.accessorKey) : ''}
          </TableCell>
        ))}
      </TableRow>
      <TableRow>
        <TableCell className="bg-red-100 font-bold uppercase pl-2">PENDING</TableCell>
        {columns.map((column, index) => (
          <TableCell key={index} className="text-center bg-red-100 font-bold">
            {column.accessorKey ? statusCounts[column.accessorKey]?.pending || '' : ''}
          </TableCell>
        ))}
      </TableRow>
    </>
  ), [statusCounts, getColumnCount, columns]);

  return (
    <div className="space-y-4 w-full">
      <DataTableToolbar table={table} />
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-y-auto max-h-[calc(100vh-300px)]"> {/* Adjust 300px as needed */}
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white dark:bg-gray-800">
              {renderHeaderRows()}
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs font-extrabold">
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}