
//@ts-nocheck
import * as React from "react";
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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const bankNameColumn = table.getColumn("bankName");
  const filterValue = bankNameColumn?.getFilterValue() as string ?? "";

  const statusCounts = React.useMemo(() => {
    const counts = {
      bankName: { completed: data.length, pending: 0 },
      bankStatus: { completed: 0, pending: 0 },
      verified: { completed: 0, pending: 0 },
      uploadStatus: { completed: 0, pending: 0 },
      verifyByBCL: { completed: 0, pending: 0 },
      closingBalanceVerified: { completed: 0, pending: 0 },
    };

    data.forEach((item: any) => {
      counts.bankStatus.completed += item.bankStatus === 'Active' ? 1 : 0;
      counts.bankStatus.pending += item.bankStatus === 'Inactive' ? 1 : 0;
      counts.verified.completed += item.verified ? 1 : 0;
      counts.verified.pending += item.verified ? 0 : 1;
      counts.uploadStatus.completed += item.uploadStatus === 'Uploaded' ? 1 : 0;
      counts.uploadStatus.pending += item.uploadStatus !== 'Uploaded' ? 1 : 0;
      counts.verifyByBCL.completed += item.verifyByBCL ? 1 : 0;
      counts.verifyByBCL.pending += item.verifyByBCL ? 0 : 1;
      counts.closingBalanceVerified.completed += item.closingBalanceVerified ? 1 : 0;
      counts.closingBalanceVerified.pending += item.closingBalanceVerified ? 0 : 1;
    });

    return counts;
  }, [data]);

  const getColumnCount = (columnId: string) => {
    const count = statusCounts[columnId];
    if (!count) return '';
    const total = count.completed + count.pending;
    return `${count.completed}/${total}`;
  };

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
              <TableCell className="bg-green-100 font-bold uppercase pl-4">COMPLETED</TableCell>
              <TableCell className="text-center bg-green-100 font-bold">{getColumnCount('bankName')}</TableCell>
              <TableCell className="text-center bg-green-100 font-bold">{getColumnCount('bankStatus')}</TableCell>
              <TableCell className="text-center bg-green-100 font-bold"></TableCell>
              <TableCell className="text-center bg-green-100 font-bold">{getColumnCount('verified')}</TableCell>
              <TableCell className="text-center bg-green-100 font-bold">{getColumnCount('uploadStatus')}</TableCell>
              <TableCell className="text-center bg-green-100 font-bold"></TableCell>
              <TableCell className="text-center bg-green-100 font-bold"></TableCell>
              <TableCell className="text-center bg-green-100 font-bold"></TableCell>
              <TableCell className="text-center bg-green-100 font-bold">{getColumnCount('verifyByBCL')}</TableCell>
              <TableCell className="text-center bg-green-100 font-bold"></TableCell>
              <TableCell className="text-center bg-green-100 font-bold">{getColumnCount('closingBalanceVerified')}</TableCell>
              <TableCell className="text-center bg-green-100 font-bold"></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="bg-red-100 font-bold uppercase pl-4">PENDING</TableCell>
              <TableCell className="text-center bg-red-100 font-bold">{statusCounts.bankName?.pending || ''}</TableCell>
              <TableCell className="text-center bg-red-100 font-bold">{statusCounts.bankStatus?.pending || ''}</TableCell>
              <TableCell className="text-center bg-red-100 font-bold"></TableCell>
              <TableCell className="text-center bg-red-100 font-bold">{statusCounts.verified?.pending || ''}</TableCell>
              <TableCell className="text-center bg-red-100 font-bold">{statusCounts.uploadStatus?.pending || ''}</TableCell>
              <TableCell className="text-center bg-red-100 font-bold"></TableCell>
              <TableCell className="text-center bg-red-100 font-bold"></TableCell>
              <TableCell className="text-center bg-red-100 font-bold"></TableCell>
              <TableCell className="text-center bg-red-100 font-bold">{statusCounts.verifyByBCL?.pending || ''}</TableCell>
              <TableCell className="text-center bg-red-100 font-bold"></TableCell>
              <TableCell className="text-center bg-red-100 font-bold">{statusCounts.closingBalanceVerified?.pending || ''}</TableCell>
              <TableCell className="text-center bg-red-100 font-bold"></TableCell>
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
              ))) : (
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