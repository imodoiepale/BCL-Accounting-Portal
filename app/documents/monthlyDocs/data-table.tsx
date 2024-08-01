//@ts-nocheck
import * as React from "react";
import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
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

  const calculateColumnStatus = React.useMemo(() => {
    const totalItems = data.length;
    const status = {};

    columns.forEach((column) => {
      if (typeof column.accessorKey === 'string' && column.accessorKey !== 'suppSeq' && column.accessorKey !== 'suppName' && column.accessorKey !== 'suppStartDate') {
        let pendingCount = 0;
        let completedCount = 0;

        data.forEach((item: any) => {
          const value = item[column.accessorKey as string];
          if (value === undefined || value === null || value === '' || value === false) {
            pendingCount++;
          } else {
            completedCount++;
          }
        });

        status[column.accessorKey] = {
          pending: `${pendingCount}/${totalItems}`,
          completed: `${completedCount}/${totalItems}`,
        };
      }
    });

    return status;
  }, [data, columns]);

  React.useEffect(() => {
    const fetchDataFromDatabase = async () => {
      const { data: dbData, error } = await supabase
        .from('your_table_name')
        .select('*');

      if (error) {
        console.error('Error fetching data:', error);
      } else {
        // process dbData and update the component state if needed
      }
    };

    fetchDataFromDatabase();
  }, []);

  return (
    <div className="space-y-4 w-full">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader className="text-wrap">
            <TableRow>
              <TableCell className="bg-green-100 font-bold uppercase pl-4">Completed</TableCell>
              {columns.map((column) => (
                column.accessorKey && calculateColumnStatus[column.accessorKey] ? (
                  <TableCell key={column.id} className="text-center bg-green-100 font-bold">
                    {calculateColumnStatus[column.accessorKey].completed}
                  </TableCell>
                ) : (
                  <TableCell key={column.id} className="bg-green-100"></TableCell>
                )
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="bg-red-100 font-bold uppercase pl-4">Pending</TableCell>
              {columns.map((column) => (
                column.accessorKey && calculateColumnStatus[column.accessorKey] ? (
                  <TableCell key={column.id} className="text-center bg-red-100 font-bold">
                    {calculateColumnStatus[column.accessorKey].pending}
                  </TableCell>
                ) : (
                  <TableCell key={column.id} className="bg-red-100"></TableCell>
                )
              ))}
            </TableRow>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`text-xs font-extrabold`}
                  >
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
                      className={`text-sm`}
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
