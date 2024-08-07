//@ts-nocheck
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supplierColumns, UploadCell } from './monthlyDocs/columns';
import { createClient } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PreviousMonths = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [supplierData, setSupplierData] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const schema = yup.object().shape({
    periodFrom: yup.date().required("Period From is required"),
    periodTo: yup.date()
      .required("Period To is required")
      .min(yup.ref('periodFrom'), "Period To must be later than Period From"),
    closingBalance: yup.number().required("Closing Balance is required"),
    file: yup.mixed().required("File is required")
  });

  const form = useForm({
    defaultValues: {
      periodFrom: '',
      periodTo: '',
      closingBalance: '',
      file: null
    },
    resolver: yupResolver(schema),
  });

  const generateMonths = useCallback(() => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      currentDate.setMonth(currentDate.getMonth() - 1);
      months.push(currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    return months;
  }, []);

  const months = useMemo(() => generateMonths(), [generateMonths]);

  const fetchSupplierData = useCallback(async (month) => {
    // Here you would typically fetch data from your Supabase database
    // For this example, we'll use dummy data
    const dummyData = [
      {
        CompanyId: 1,
        suppSeq: 1,
        suppName: "Supplier A",
        suppStatus: "Active",
        suppStartDate: "2023-01-01",
        verifiedByBCLAccManager: true,
        uploadStatus: 'Pending',
        uploadDate: null,
        supplierWefDate: null,
        supplierUntilDate: null,
        verifyByBCL: false,
        closingBalance: null,
        closingBalanceVerify: "false",
        suppPIN: "PIN123",
        suppContactName: "John Doe",
        suppContactMobile: "1234567890",
        suppContactEmail: "john@example.com",
        filePath: null
      },
      // Add more dummy data as needed
    ];
    setSupplierData(dummyData);
  }, []);

  const handleMonthSelect = useCallback((month) => {
    setSelectedMonth(month);
    fetchSupplierData(month);
  }, [fetchSupplierData]);

  const handleUpload = useCallback((supplier) => {
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  }, []);

  const onSubmit = useCallback(async (data) => {
    // Here you would typically handle the file upload and data submission
    console.log('Form submitted:', data);
    console.log('For supplier:', selectedSupplier);

    // Update the supplier data after successful upload
    setSupplierData(prevData => 
      prevData.map(supplier => 
        supplier.CompanyId === selectedSupplier.CompanyId
          ? { 
              ...supplier, 
              uploadStatus: 'Uploaded',
              uploadDate: new Date().toISOString(),
              supplierWefDate: data.periodFrom,
              supplierUntilDate: data.periodTo,
              closingBalance: data.closingBalance
            }
          : supplier
      )
    );

    setIsDialogOpen(false);
    form.reset();
  }, [selectedSupplier, form]);

  const table = useReactTable({
    data: supplierData,
    columns: supplierColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const handleSearch = useCallback((event) => {
    setGlobalFilter(event.target.value);
  }, []);

  const handleStatusFilter = useCallback((value) => {
    table.getColumn('suppStatus')?.setFilterValue(value === "all" ? "" : value);
  }, [table]);
  

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {months.map((month) => (
          <Button
            key={month}
            variant={selectedMonth === month ? "default" : "outline"}
            onClick={() => handleMonthSelect(month)}
          >
            {month}
          </Button>
        ))}
      </div>
      {selectedMonth && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Documents for {selectedMonth}</h2>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ''}
              onChange={handleSearch}
              className="max-w-sm"
            />
            <Select onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem> {/* Changed value from "" to "all" */}
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

          </div>
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
                  <TableCell colSpan={supplierColumns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end space-x-2 py-4">
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
      )}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="periodFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period From (SWEF Date)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="periodTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period To</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="closingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Balance</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload File</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        onChange={(e) => field.onChange(e.target.files)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PreviousMonths;