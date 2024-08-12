// @ts-nocheck
"use client";

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const bankNameColumn = table.getColumn("bankName");
  const filterValue = bankNameColumn?.getFilterValue() as string ?? "";

  const calculateColumnStatus = React.useMemo(() => {
    const totalItems = data.length;
    const status = {};

    const columnsToCalculate = [
      "bankName",
      "bankStatus",
      "verifiedByBCL",
      "uploadStatus",
      "startRangeVerification",
      "startDateVerification",
      "closingBalanceVerified"
    ];

    columnsToCalculate.forEach((columnKey) => {
      let pendingCount = 0;
      let completedCount = 0;

      data.forEach((item: any) => {
        const value = item[columnKey];
        if (columnKey === "bankStatus") {
          if (value === "Active") {
            completedCount++;
          } else {
            pendingCount++;
          }
        } else if (columnKey === "verifiedByBCL" || columnKey === "closingBalanceVerified") {
          if (value === true) {
            completedCount++;
          } else {
            pendingCount++;
          }
        } else if (columnKey === "uploadStatus") {
          if (value === "Completed") {
            completedCount++;
          } else {
            pendingCount++;
          }
        } else if (columnKey === "startRangeVerification" || columnKey === "startDateVerification") {
          if (value === "Verified") {
            completedCount++;
          } else {
            pendingCount++;
          }
        } else {
          if (value && value !== "") {
            completedCount++;
          } else {
            pendingCount++;
          }
        }
      });

      status[columnKey] = {
        pending: `${pendingCount}/${totalItems}`,
        completed: `${completedCount}/${totalItems}`,
      };
    });

    return status;
  }, [data]);

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter bank names..."
          value={filterValue}
          onChange={(event) => 
            bankNameColumn?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="text-center font-bold">Status</TableCell>
              {columns.map((column) => (
                <TableCell key={column.id} className="text-center font-bold">
                  {column.header}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="text-center bg-green-100 font-bold">Completed</TableCell>
              {columns.map((column) => (
                <TableCell key={column.id} className="text-center bg-green-100 font-bold">
                  {column.accessorKey && calculateColumnStatus[column.accessorKey]?.completed || ''}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="text-center bg-red-100 font-bold">Pending</TableCell>
              {columns.map((column) => (
                <TableCell key={column.id} className="text-center bg-red-100 font-bold">
                  {column.accessorKey && calculateColumnStatus[column.accessorKey]?.pending || ''}
                </TableCell>
              ))}
            </TableRow>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}