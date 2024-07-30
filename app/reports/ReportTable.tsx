//@ts-nocheck
"use client"

import React, { useState, useEffect, useMemo } from "react";
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
import { ArrowUpDown, ChevronDown, InfoIcon, PlusCircle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { PlusCircledIcon } from "@radix-ui/react-icons";

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
  fetchData: (fromDate: string, toDate: string) => Promise<void>;
}

const ReportTable: React.FC<ReportTableProps> = ({ data, title, fetchData }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [fromDate, setFromDate] = useState<Date>(new Date("2024-01-01"));
  const [toDate, setToDate] = useState<Date>(new Date("2024-12-31"));

  const currentMonthIndex = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchData(fromDate.toISOString().split('T')[0], toDate.toISOString().split('T')[0]);
  }, [fromDate, toDate]);

  const visibleMonths = useMemo(() => {
    const months = [];
    let currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      months.push({
        month: MONTHS[currentDate.getMonth()],
        year: currentDate.getFullYear(),
        date: new Date(currentDate)
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return months;
  }, [fromDate, toDate]);

  const columns: ColumnDef<DataRow>[] = useMemo(() => [
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
          <ArrowUpDown className=" h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-center">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className=" h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-left">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-wrap"
        >
          Start Date
          <ArrowUpDown className=" h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-center">{row.getValue("startDate")}</div>,
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-wrap"
        >
          End Date
          <ArrowUpDown className=" h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-center">{row.getValue("endDate")}</div>,
    },
    ...visibleMonths.map((monthData, index) => ({
      id: `${monthData.month}-${monthData.year}`,
      accessorKey: `months.${index}`,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={monthData.date.getMonth() === currentMonthIndex && monthData.date.getFullYear() === currentYear ? "bg-yellow-100 text-wrap" : "text-wrap"}
        >
          {`${monthData.month} ${monthData.year}`}
          <ArrowUpDown className=" h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const monthData = row.original.months[index];
        const startDate = new Date(row.original.startDate);
        const cellDate = new Date(visibleMonths[index].date);
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
              <p>Verified: {monthData.isVerified ? '✅' : '❌'}</p>
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
          <div className={cellDate.getMonth() === currentMonthIndex && cellDate.getFullYear() === new Date().getFullYear() ? "flex justify-center text-center" : ""}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-center ${bgColor}`}
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
    {
      accessorKey: "missingDocs",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-wrap"
        >
         Missing Docs
          <ArrowUpDown className=" h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <div className="text-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open profile</span>
                <PlusCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{supplier.suppName} Profile</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="font-bold">Supplier PIN:</span>
                  <span className="col-span-3">{supplier.suppPIN}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="font-bold">Contact Name:</span>
                  <span className="col-span-3">{supplier.suppContactName}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="font-bold">Contact Mobile:</span>
                  <span className="col-span-3">{supplier.suppContactMobile}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="font-bold">Contact Email:</span>
                  <span className="col-span-3">{supplier.suppContactEmail}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="font-bold">Start Date:</span>
                  <span className="col-span-3">{supplier.suppStartDate}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="font-bold">Status:</span>
                  <span className="col-span-3">{supplier.suppStatus}</span>
                </div>
              </div>
            </DialogContent>
          </Dialog></div>
        );
      }
    },
  ], [visibleMonths]);

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

  useEffect(() => {
    fetchData(fromDate.toISOString().split('T')[0], toDate.toISOString().split('T')[0]);
  }, [fromDate, toDate]);

  return (
    <div className="w-[2000px]">
      <div className="flex items-start py-4">
        <div className="flex gap-4 items-center flex-grow">
        <DateRangePicker
          onUpdate={({ range }) => {
            if (range.from && range.to) {
              setFromDate(range.from);
              setToDate(range.to);
            }
          }}
          initialDateFrom={fromDate}
          initialDateTo={toDate}
          align="start"
          locale="en-GB"
          showCompare={false}
        />
        </div>
        <div className="w-[250px] px-4">
          <Input
            placeholder="Filter names..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto h-full">
              Columns <ChevronDown className=" h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                // Check if the column is a month column
                const isMonthColumn = column.id.includes('-');
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {isMonthColumn ? column.id : column.id.replace(/([A-Z])/g, ' $1').trim()}
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
}

export default ReportTable;