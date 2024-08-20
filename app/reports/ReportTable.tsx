//@ts-nocheck
"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';
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
import toast, { Toaster } from 'react-hot-toast';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DataRow {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  startDate: string;
  months: {
    upload_status: string;
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
  const [selectedEntity, setSelectedEntity] = useState<DataRow | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<{ month: number, year: number } | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { user } = useUser();

  const currentMonthIndex = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchData(fromDate.toISOString().split('T')[0], toDate.toISOString().split('T')[0]);
  }, [fromDate, toDate, fetchData]);

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

  const parseDate = (dateString: string): Date | null => {
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
    // Try DD.MM.YYYY format
    const [day, month, year] = dateString.split('.');
    if (day && month && year) {
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return null;
  };

  const getMissingDocuments = (entity: DataRow) => {
    const startDate = parseDate(entity.startDate);
    if (!startDate) {
      console.error(`Invalid start date for ${entity.name}: ${entity.startDate}`);
      return [];
    }
    const currentDate = new Date();
    const missingDocs = [];

    for (let d = new Date(startDate); d <= currentDate; d.setMonth(d.getMonth() + 1)) {
      const month = d.getMonth();
      const year = d.getFullYear();
      if (!entity.months[month] || entity.months[month].upload_status !== 'uploaded') {
        missingDocs.push({ month, year });
      }
    }

    return missingDocs;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const sendWhatsAppMessage = (phoneNumber: string) => {
    const message = encodeURIComponent(`Hello, you have missing documents. Please upload them as soon as possible.`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const sendEmailRequest = async (entity: DataRow) => {
    setEmailSending(true);
    const missingDocs = getMissingDocuments(entity);
    const missingDocsText = missingDocs.map(doc => `${MONTHS[doc.month]} ${doc.year}`).join(', ');
    
    const username = user?.username || 'User';
    const userEmail = user?.email || process.env.EMAIL_FROM_ADDRESS;
  
    try {
      const emailData = {
        to: entity.email,
        subject: `Missing Documents Request for ${entity.name}`,
        html: `<p>Dear ${entity.name},</p><p>We noticed that you have missing documents for the following months:</p> ${missingDocsText}.</p><p>Please upload these documents as soon as possible.</p>
        <p>Best regards,<br>${username}<br></p>`,
        fromName: username,
        fromEmail: userEmail,
      };
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('Email sent successfully:', result);
        toast.success('Email sent successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(`Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEmailSending(false);
    }
  };

  const uploadDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    if (!selectedEntity || !selectedMonth || !uploadFile) {
        toast.error("Missing required information");
        setIsUploading(false);
        return;
    }

    const closingBalance = (e.currentTarget.elements.namedItem('closingBalance') as HTMLInputElement).value;
    const startDate = new Date(selectedMonth.year, selectedMonth.month, 1);
    const endDate = new Date(selectedMonth.year, selectedMonth.month + 1, 0);

    const uploadPromise = new Promise(async (resolve, reject) => {
        try {
            console.log('Selected entity:', selectedEntity);

            // Extract numeric part of entity ID
            const entityIdMatch = selectedEntity.id.match(/\d+/);
            if (!entityIdMatch) {
                throw new Error('Invalid entity ID: ' + selectedEntity.id);
            }
            const entityId = parseInt(entityIdMatch[0]);
            console.log('Parsed entity ID:', entityId);

            if (isNaN(entityId)) {
                throw new Error('Invalid entity ID: ' + selectedEntity.id);
            }

            const year = selectedMonth.year.toString();
            const monthName = MONTHS[selectedMonth.month];
            const isSupplier = selectedEntity.id.startsWith('S-');
            const directoryPath = `Monthly-Documents/${isSupplier ? 'suppliers' : 'banks'}/${year}/${monthName}/${selectedEntity.name}/`;

            const bucketName = 'Accounting-Portal';
            const filePath = `${directoryPath}${uploadFile.name}`;

            const { data: fileData, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, uploadFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw new Error(uploadError.message || 'Error uploading file');
            }

            if (!fileData) {
                throw new Error('No file data returned from upload');
            }

            const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            const publicUrl = publicUrlData?.publicUrl;

            if (!publicUrl) {
                throw new Error('Failed to get public URL for the uploaded file');
            }

            const tableName = 'acc_portal_monthly_files_upload';

            const insertData = {
                [isSupplier ? 'supplier_id' : 'bank_id']: entityId,
                document_type: isSupplier ? 'supplier statement' : 'bank statement',
                upload_date: new Date().toISOString(),
                is_verified: false,
                docs_date_range: startDate.toISOString().split('T')[0],
                closing_balance: parseFloat(closingBalance),
                balance_verification: false,
                docs_date_range_end: endDate.toISOString().split('T')[0],
                file_path: publicUrl,
                upload_status: 'Uploaded',
                userid: user?.id,
            };

            console.log('Data to be inserted:', insertData);

            const { error: insertError } = await supabase
                .from(tableName)
                .insert(insertData);

            if (insertError) {
                console.error('Insert error:', insertError);
                throw new Error(insertError.message || 'Error inserting file metadata');
            }

            resolve('File uploaded successfully');
        } catch (error) {
            console.error('Error in upload process:', error);
            reject(error instanceof Error ? error.message : 'Unknown error');
        }
    });

    toast.promise(uploadPromise, {
        loading: 'Uploading file...',
        success: 'File uploaded successfully',
        error: (err) => `Error uploading file: ${err}`
    }).then(() => {
        setUploadDialogOpen(false);
        setUploadFile(null);
        setSelectedMonth(null);
        fetchData(fromDate.toISOString().split('T')[0], toDate.toISOString().split('T')[0]);
    }).finally(() => {
        setIsUploading(false);
    });
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
      cell: ({ row }) => <div className="text-center">{row.getValue("id") ?? 'N/A'}</div>,
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
      id: `${monthData.year}`,
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
        const startDateString = row.original.startDate;
        const cellDate = new Date(visibleMonths[index].date);
        const currentDate = new Date();
        
        let startDate: Date | null = null;
        if (startDateString) {
          // Try to parse the date, accounting for different formats
          const parsedDate = new Date(startDateString);
          if (!isNaN(parsedDate.getTime())) {
            startDate = parsedDate;
          } else {
            // If standard parsing fails, try DD.MM.YYYY format
            const [day, month, year] = startDateString.split('.');
            if (day && month && year) {
              startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
          }
        }
        
        let cellContent;
        let bgColor;
        let tooltipContent;
      
        if (!startDate) {
          cellContent = '❓';
          bgColor = 'bg-gray-300';
          tooltipContent = <p>Invalid start date</p>;
        } else if (cellDate < new Date(startDate.getFullYear(), startDate.getMonth(), 1)) {
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
          tooltipContent = <p>Missing document</p>;
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
        const entity = row.original;
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
                  <DialogTitle className="text-2xl font-bold">{entity.name} - Missing Documents</DialogTitle>
                </DialogHeader>
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-4">Missing Monthly Documents</h3>
                  <ScrollArea className="h-[300px] rounded-md border p-4">
                    <ul className="grid grid-cols-2 gap-4">
                    {getMissingDocuments(entity).map((doc) => (
                        <li key={`${doc.month}-${doc.year}`} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                          <span className="font-medium">{MONTHS[doc.month]} {doc.year}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEntity(entity);
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
                {entity.email && (
                  <div className="mt-6 flex justify-between items-center">
                    <Button
                      onClick={() => sendEmailRequest(entity)}
                      className="flex-1 mr-2"
                      disabled={emailSending}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {emailSending ? 'Sending...' : 'Request via Email'}
                    </Button>
                    {entity.phoneNumber && (
                      <Button
                        onClick={() => sendWhatsAppMessage(entity.phoneNumber)}
                        className="flex-1 ml-2 bg-green-500 hover:bg-green-600"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Request via WhatsApp
                      </Button>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        );
      }
    },
  ], [visibleMonths, currentMonthIndex, currentYear, emailSending, sendEmailRequest, sendWhatsAppMessage]);

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
      <Toaster position="top-right" />
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

  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Upload Document for {selectedMonth ? `${MONTHS[selectedMonth.month]} ${selectedMonth.year}` : ''}</DialogTitle>
      </DialogHeader>
      <form onSubmit={uploadDocument}>
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
            <Input id="closingBalance" type="number" className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="document">Document:</label>
            <Input 
              id="document" 
              type="file" 
              className="col-span-3" 
              onChange={handleFileChange}
              required 
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button type="submit" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Submit'}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</div>
);
}

export default ReportTable;