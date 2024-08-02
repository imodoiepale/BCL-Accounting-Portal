//@ts-nocheck
"use client"

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Mail, Phone, PlusCircle, Upload } from "lucide-react";
import React, { useEffect, useMemo, useState } from 'react';

import { Resend } from 'resend';

const resend = new Resend('re_S4gVFB4Z_7oybM2W1XLtKLjdyZpp9hJ8v');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DataRow {
  id: string;
  name: string;
  email: string; 
  phoneNumber: string;
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
  addButtonText: string;
}

const ReportTable: React.FC<ReportTableProps> = ({ data, title, fetchData, addButtonText }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [fromDate, setFromDate] = useState<Date>(new Date("2024-01-01"));
  const [toDate, setToDate] = useState<Date>(new Date("2024-12-31"));
  const [selectedSupplier, setSelectedSupplier] = useState<DataRow | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<{ month: number, year: number } | null>(null);
  const [emailSending, setEmailSending] = useState(false);

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

  const getMissingDocuments = (supplier: DataRow) => {
    const startDate = new Date(supplier.startDate);
    const currentDate = new Date();
    const missingDocs = [];

    for (let d = new Date(startDate); d <= currentDate; d.setMonth(d.getMonth() + 1)) {
      const month = d.getMonth();
      const year = d.getFullYear();
      if (!supplier.months[month] || supplier.months[month].status !== 'uploaded') {
        missingDocs.push({ month, year });
      }
    }

    return missingDocs;
  };

  const sendWhatsAppMessage = (phoneNumber: string) => {
    const message = encodeURIComponent(`Hello, you have missing documents. Please upload them as soon as possible.`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const sendEmailRequest = async (supplier: DataRow) => {
    setEmailSending(true);
    const missingDocs = getMissingDocuments(supplier);
    const missingDocsText = missingDocs.map(doc => `${MONTHS[doc.month]} ${doc.year}`).join(', ');
  
    try {
      const emailData = {
        from: 'onboarding@resend.dev', // Use a verified sender email
        to: supplier.contact_email,
        subject: `Missing Documents Request for ${supplier.name}`,
        html: `<p>Dear ${supplier.name},</p><p>We noticed that you have missing documents for the following months: ${missingDocsText}.</p><p>Please upload these documents as soon as possible.</p><p>Best regards,<br>Your Company Name</p>`,
      };
      console.log('Recipient email:', supplier);

      console.log('Sending email with data:', emailData);

      const response = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('Email sent successfully:', result);
        alert('Email sent successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to send email:', errorData);
        alert(`Failed to send email: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(`Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEmailSending(false);
    }
  };

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
          <ArrowUpDown className="h-4 w-4" />
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
          <ArrowUpDown className="h-4 w-4" />
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
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-center">{row.getValue("startDate")}</div>,
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
          <ArrowUpDown className="h-4 w-4" />
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
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <div className="text-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open missing documents</span>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">{supplier.suppContactEmail} {supplier.name} - Missing Documents</DialogTitle>
                </DialogHeader>
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-4">Missing Monthly Documents</h3>
                  <ScrollArea className="h-[300px] rounded-md border p-4">
                    <ul className="grid grid-cols-2 gap-4">
                      {getMissingDocuments(supplier).map((doc) => (
                        <li key={`${doc.month}-${doc.year}`} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                          <span className="font-medium">{MONTHS[doc.month]} {doc.year}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setSelectedMonth({ month: doc.month, year: doc.year });
                              setUploadDialogOpen(true);
                            }}
                            className="transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
                <div className="mt-6 flex justify-between items-center">
                  <Button
                    onClick={() => sendEmailRequest(supplier)}
                    className="flex-1 mr-2"
                    disabled={emailSending}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {emailSending ? 'Sending...' : 'Request via Email'}
                  </Button>
                  <Button
                    onClick={() => sendWhatsAppMessage(supplier.phoneNumber)}
                    className="flex-1 ml-2 bg-green-500 hover:bg-green-600"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Request via WhatsApp
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document for {selectedMonth ? `${MONTHS[selectedMonth.month]} ${selectedMonth.year}` : ''}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // Here you would implement the logic to submit the form
                  console.log("Submitting document upload form");
                  setUploadDialogOpen(false);
                }}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="startDate">Start Date:</label>
                      <Input id="startDate" value={selectedMonth ? `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01` : ''} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="endDate">End Date:</label>
                      <Input id="endDate" value={selectedMonth ? new Date(selectedMonth.year, selectedMonth.month + 1, 0).toISOString().split('T')[0] : ''} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="closingBalance">Closing Balance:</label>
                      <Input id="closingBalance" type="number" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="document">Document:</label>
                      <Input id="document" type="file" className="col-span-3" />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button type="submit">Submit</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        );
      }
    },
  ], [visibleMonths, uploadDialogOpen, selectedMonth, emailSending]);

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
        <div className="w-[250px] px-4">
          <Button
            className="max-w-sm"
          >{addButtonText}</Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
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