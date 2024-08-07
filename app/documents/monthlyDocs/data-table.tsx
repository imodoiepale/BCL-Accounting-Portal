//@ts-nocheck
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
}

export function DataTable<TData, TValue>({
  columns,
  data,
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
  });

  const statusCounts = React.useMemo(() => {
    const counts = {
      suppName: { completed: data.length, pending: 0 },
      suppStatus: { completed: 0, pending: 0 },
      verifiedByBCLAccManager: { completed: 0, pending: 0 },
      uploadStatus: { completed: 0, pending: 0 },
      verifyByBCL: { completed: 0, pending: 0 },
      closingBalanceVerify: { completed: 0, pending: 0 },
    };

    data.forEach((item: any) => {
      counts.suppStatus.completed += item.suppStatus === 'Active' ? 1 : 0;
      counts.suppStatus.pending += item.suppStatus === 'Inactive' ? 1 : 0;
      counts.verifiedByBCLAccManager.completed += item.verifiedByBCLAccManager ? 1 : 0;
      counts.verifiedByBCLAccManager.pending += item.verifiedByBCLAccManager ? 0 : 1;
      counts.uploadStatus.completed += item.uploadStatus === 'Uploaded' ? 1 : 0;
      counts.uploadStatus.pending += item.uploadStatus === 'Not Uploaded' ? 1 : 0;
      counts.verifyByBCL.completed += item.verifyByBCL ? 1 : 0;
      counts.verifyByBCL.pending += item.verifyByBCL ? 0 : 1;
      counts.closingBalanceVerify.completed += item.closingBalanceVerify === "true" ? 1 : 0;
      counts.closingBalanceVerify.pending += item.closingBalanceVerify === "false" ? 1 : 0;
    });

    return counts;
  }, [data]);

  const getColumnCount = React.useCallback((columnId: string) => {
    const count = statusCounts[columnId];
    if (!count) return '';
    const total = count.completed + count.pending;
    return `${count.completed}/${total}`;
  }, [statusCounts]);

  const renderHeaderRows = React.useCallback(() => (
    <>
      <TableRow>
        <TableCell className="bg-green-100 font-bold uppercase pl-4">COMPLETED</TableCell>
        {['suppName', 'suppStatus', '', 'verifiedByBCLAccManager', 'uploadStatus', '', '', '', 'verifyByBCL', '', 'closingBalanceVerify', ''].map((columnId, index) => (
          <TableCell key={index} className="text-center bg-green-100 font-bold">{getColumnCount(columnId)}</TableCell>
        ))}
      </TableRow>
      <TableRow>
        <TableCell className="bg-red-100 font-bold uppercase pl-4">PENDING</TableCell>
        {['suppName', 'suppStatus', '', 'verifiedByBCLAccManager', 'uploadStatus', '', '', '', 'verifyByBCL', '', 'closingBalanceVerify', ''].map((columnId, index) => (
          <TableCell key={index} className="text-center bg-red-100 font-bold">{statusCounts[columnId]?.pending || ''}</TableCell>
        ))}
      </TableRow>
    </>
  ), [statusCounts, getColumnCount]);

  return (
    <div className="space-y-4 w-full">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader className="text-wrap">
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
                    <TableCell
                      key={cell.id}
                      className="text-sm"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-20 text-center text-sm whitespace-nowrap">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}