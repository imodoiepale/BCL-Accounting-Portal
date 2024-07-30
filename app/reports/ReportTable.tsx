//@ts-nocheck
"use client"

import React, { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DataRow {
  id: string;
  name: string;
  startDate: string;
  months: {
    status: string;
    isVerified: boolean;
    startDate?: string;
    endDate?: string;
  }[];
}

interface ReportTableProps {
  data: DataRow[];
  title: string;
  fetchData: () => Promise<void>;
}

const ReportTable: React.FC<ReportTableProps> = ({ data, title, fetchData }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [fromDate, setFromDate] = useState<string>("2024-01-01");
  const [toDate, setToDate] = useState<string>("2024-12-31");

  const currentMonthIndex = new Date().getMonth();

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const columns: ColumnDef<DataRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("id")}</div>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Start Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("startDate")}</div>,
    },
    ...MONTHS.map((month, index) => ({
      accessorKey: `months.${index}`,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={index === currentMonthIndex ? "bg-yellow-100" : ""}
        >
          {month}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const monthData = row.original.months[index];
        const startDate = new Date(row.original.startDate);
        const cellDate = new Date(startDate.getFullYear(), index, 1);
        const currentDate = new Date();
        
        let cellContent;
        let bgColor;
        let tooltipContent;

        if (cellDate < startDate) {
          cellContent = 'N/A';
          bgColor = 'bg-gray-200';
          tooltipContent = <p>Before start date</p>;
        } else if (cellDate > currentDate) {
          cellContent = '-';
          bgColor = 'bg-gray-100';
          tooltipContent = <p>Future month</p>;
        } else if (monthData) {
          if (monthData.status === 'uploaded') {
            cellContent = monthData.isVerified ? '✅' : '⏳';
            bgColor = monthData.isVerified ? 'bg-green-200' : 'bg-yellow-200';
          } else {
            cellContent = '❌';
            bgColor = 'bg-red-200';
          }
          tooltipContent = (
            <>
              <p>Status: {monthData.status}</p>
              <p>Verified: {monthData.isVerified ? 'Yes' : 'No'}</p>
              {monthData.startDate && <p>Start: {monthData.startDate}</p>}
              {monthData.endDate && <p>End: {monthData.endDate}</p>}
            </>
          );
        } else {
          cellContent = '❌';
          bgColor = 'bg-red-200';
          tooltipContent = <p>No data available</p>;
        }

        return (
          <div className={index === currentMonthIndex ? "flex justify-center" : ""}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${bgColor}`}
                  >
                    {cellContent}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {tooltipContent}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    })),
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <Card className="p-2 mb-4">
        <CardContent>
          <p className="flex text-lg font-bold pb-2">Choose Period to View Reports</p>
          <div className="flex justify-between space-y-4 mb-4">
            <div className="flex space-x-4">
              <div>
                <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700">From</label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="toDate" className="block text-sm font-medium text-gray-700">To</label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
            <div className="w-[250px]">
              <Input
                placeholder="Filter names..."
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
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
                    <TableCell key={cell.id}>
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
};

export default ReportTable;