// @ts-nocheck
//@ts-ignore
"use client"

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input";
import { yupResolver } from '@hookform/resolvers/yup';
import { createClient } from '@supabase/supabase-js';
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CalendarIcon, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import * as yup from 'yup';
import { useAuth } from '@clerk/clerk-react';
import { format } from "date-fns"

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Define the types for supplier and bank data
export type SupplierData = {
  id: string
  name: string
  status: string
  startDate: string
  verifiedByBCLAccManager: boolean
  uploadStatus: string
  uploadDate: string
  periodFrom: string
  periodTo: string
  verifyByBCL: boolean
  pin: string
  contactName: string
  contactMobile: string
  contactEmail: string
  closingBalance: string
  closingBalanceVerify: string
  filePath: string
}

export type BankData = {
  id: string
  name: string
  status: string
  startDate: string
  verified: boolean
  uploadStatus: string
  uploadDate: string
  periodFrom: string
  periodTo: string
  verifyByBCL: boolean
  closingBalance: string
  closingBalanceVerified: boolean
  currency: string
  accountNumber: string
  branchName: string
}

interface DatePickerDemoProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

function DatePickerDemo({ date, onDateChange }: DatePickerDemoProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

const schema = yup.object().shape({
  periodFrom: yup.date().required("Period From is required"),
  periodTo: yup.date()
    .required("Period To is required")
    .min(yup.ref('periodFrom'), "Period To must be later than Period From"),
  closingBalance: yup.number().required("Closing Balance is required"),
  file: yup.mixed().required("File is required")
});

const UploadCell = React.memo(({ row, selectedMonth, type }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(row.getValue("uploadStatus"));
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [itemData, setItemData] = useState(null);

  const { userId } = useAuth();

  const form = useForm({
    defaultValues: {
      periodFrom: '',
      periodTo: '',
      closingBalance: '',
      file: null
    },
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (selectedMonth) {
      const [monthName, year] = selectedMonth.split(' ');
      const currentDate = new Date(`${monthName} 1, ${year}`);
      
      // Calculate the previous month
      const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      
      // Start date: first day of the previous month
      const startDate = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
      
      // End date: last day of the previous month
      const endDate = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0);
  
      // console.log('start date ', startDate);
      // console.log('end  date ', endDate);
      // Set form values
      form.setValue('periodFrom', startDate);
      form.setValue('periodTo', endDate);
    }
  }, [selectedMonth, form]);

useEffect(() => {
  const fetchData = async () => {
    if (!userId || !selectedMonth || !row.original.id) return;

    const [monthName, year] = selectedMonth.split(' ');
    const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth();
    const startDate = new Date(parseInt(year), monthNumber, 1);
    const endDate = new Date(parseInt(year), monthNumber + 1, 0);

    try {
      // Fetch item data
      const { data: itemData, error: itemError } = await supabase
        .from(type === 'supplier' ? 'acc_portal_suppliers' : 'acc_portal_banks')
        .select('*' )
        .eq('id', row.original.id)
        .single();

      if (itemError) throw itemError;

      setItemData(itemData);

      // Fetch upload status
      const { data: uploadData, error: uploadError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .select('*')
        .eq('document_type', type === 'supplier' ? 'supplier statement' : 'bank statement')
        .eq('userid', userId)
        .eq(type === 'supplier' ? 'supplier_id' : 'bank_id', row.original.id)
        .gte('docs_date_range', startDate.toISOString())
        .lte('docs_date_range_end', endDate.toISOString())
        .order('upload_date', { ascending: false })
        .limit(1);

      if (uploadError) throw uploadError;

      if (uploadData && uploadData.length > 0) {
        setUploadStatus(uploadData[0].upload_status);
        row.original.filePath = uploadData[0].file_path;
      } else {
        setUploadStatus('Not Uploaded');
        row.original.filePath = null;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setUploadStatus('Error');
    }
  };

  fetchData();
}, [userId, selectedMonth, row.original.id, type]);


  useEffect(() => {
    if (itemData && userId && selectedMonth && itemData.id) {
      const fetchUploadStatus = async () => {
        try {
          const [monthName, year] = selectedMonth.split(' ');
          const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth();

          const startDate = new Date(parseInt(year), monthNumber, 1);
          const endDate = new Date(parseInt(year), monthNumber + 1, 0);

          console.log('Date range:', startDate.toISOString(), 'to', endDate.toISOString());

          const { data, error } = await supabase
            .from('acc_portal_monthly_files_upload')
            .select('*')     
            .eq('document_type', type === 'supplier' ? 'supplier statement' : 'bank statement')
            .eq('userid', userId)
            .eq(type === 'supplier' ? 'supplier_id' : 'bank_id', itemData.id)
            // .lte('docs_date_range', endDate.toISOString())
            // .gte('docs_date_range_end', startDate.toISOString())
            .order('upload_date', { ascending: false });

          if (error) {
            throw error;
          }

          if (data && data.length > 0) {
            console.log('Upload status found:', data[0].upload_status);
            setUploadStatus(data[0].upload_status);
            row.original.filePath = data[0].file_path;
          } else {
            console.log('No upload status found');
            setUploadStatus('Not Uploaded');
            row.original.filePath = null;
          }
        } catch (error) {
          console.error('Error fetching upload status:', error);
          setUploadStatus('Not Uploaded');
        }
      };

      fetchUploadStatus();
    }
  }, [itemData, userId, selectedMonth, row, type]);

  const handleButtonClick = useCallback(async () => {
    if (uploadStatus === 'Uploaded' && row.original.filePath) {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from(type === 'supplier' ? 'Accounting-Portal' : 'Bank-Statements')
          .createSignedUrl(row.original.filePath, 60);

        if (error) throw error;

        setPreviewUrl(data.signedUrl);
        setIsDialogOpen(true);
      } catch (error) {
        console.error('Error viewing file:', error);
        alert('Error viewing file. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsDialogOpen(true);
    }
  }, [uploadStatus, row.original.filePath, type]);

  const onSubmit = useCallback(async (data) => {
    setIsLoading(true);
    try {
      console.log('onSubmit - itemData:', itemData);
      console.log('onSubmit - selectedMonth:', selectedMonth);

      if (!itemData || !itemData.id) {
        throw new Error(`${type.charAt(0).toUpperCase() + type.slice(1)} data is not available. Please try again.`);
      }

      if (!selectedMonth) {
        throw new Error('Selected month is not available. Please try again.');
      }

      console.log(`Submitting for ${type}:`, itemData);

      const file = data.file[0];
      const [monthName, year] = selectedMonth.split(' ');

      const filePath = `Monthly-Documents/${type}s/${year}/${monthName}/${itemData.name}/${file.name}`;

      const { error: storageError } = await supabase.storage
        .from(type === 'supplier' ? 'Accounting-Portal' : 'Bank-Statements')
        .upload(filePath, file);

      if (storageError) throw new Error(`Error uploading file: ${storageError.message}`);

      const { error: insertError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .insert({
          [type === 'supplier' ? 'supplier_id' : 'bank_id']: itemData.id,
          document_type: type === 'supplier' ? 'supplier statement' : 'bank statement',
          upload_date: new Date().toISOString(),
          docs_date_range: data.periodFrom,
          docs_date_range_end: data.periodTo,
          closing_balance: parseFloat(data.closingBalance) || 0,
          balance_verification: false,
          file_path: filePath,
          upload_status: 'Uploaded',
          userid: userId
        });

      if (insertError) throw new Error(`Error inserting data: ${insertError.message}`);

      setUploadStatus('Uploaded');
      row.original.filePath = filePath;
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
      setUploadStatus('Failed');
    } finally {
      setIsLoading(false);
    }
  }, [itemData, selectedMonth, userId, row.original, type]);

  return (
    <div className="text-center">
      <Button
        variant="outline"
        onClick={handleButtonClick}
        disabled={isLoading}
      >
        {uploadStatus === 'Uploaded' ? '✅View Upload' :
          uploadStatus === 'Failed' ? '❌Retry Upload' : 'Upload'}
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {uploadStatus === 'Uploaded' ? 'File Preview' : `Upload Document for ${itemData?.name || type}`}
            </DialogTitle>
            <DialogDescription>
              {uploadStatus === 'Uploaded'
                ? 'Preview of the uploaded document'
                : `Upload a new document for ${selectedMonth}`}
            </DialogDescription>
          </DialogHeader>
          {uploadStatus === 'Uploaded' && previewUrl ? (
            <iframe
              src={previewUrl}
              style={{ width: '100%', height: '70vh', border: 'none' }}
              title="File Preview"
            />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="periodFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period From (Start Date)</FormLabel>
                        <FormControl>
                        <DatePickerDemo
                            date={field.value}
                            onDateChange={(date) => field.onChange(date)}
                          />
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
                        <FormLabel>Period To (End Date)</FormLabel>
                        <FormControl>
                        <DatePickerDemo
                            date={field.value}
                            onDateChange={(date) => field.onChange(date)}
                          />
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Uploading...' : 'Submit'}
                </Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

UploadCell.displayName = 'UploadCell';

const createCommonColumns = (type: 'supplier' | 'bank') => [
  {
    accessorKey: type === 'supplier' ? "suppSeq" : "bankSeq",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {type === 'supplier' ? 'Supp Seq' : 'Bank Acc Seq'}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{type === 'supplier' ? 'SUP' : 'BA'}-{row.getValue(type === 'supplier' ? "suppSeq" : "bankSeq")}</div>,
  },
  {
    accessorKey: type === 'supplier' ? "suppName" : "bankName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {type === 'supplier' ? 'Supp Name' : 'Bank Name'}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue(type === 'supplier' ? "suppName" : "bankName")}</div>,
  },
  {
    accessorKey: type === 'supplier' ? "suppStatus" : "bankStatus",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue(type === 'supplier' ? "suppStatus" : "bankStatus");
      const statusClass = status === 'Active' ? 'text-green-500' : 'text-red-500';
      return <div className={`text-center font-medium ${statusClass}`}>{status}</div>;
    },
  },
  {
    accessorKey: type === 'supplier' ? "suppStartDate" : "startDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Start date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue(type === 'supplier' ? "suppStartDate" : "startDate")}</div>,
  },
  {
    accessorKey: type === 'supplier' ? "verifiedByBCLAccManager" : "verified",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Verified by BCL
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue(type === 'supplier' ? "verifiedByBCLAccManager" : "verified") ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "uploadStatus",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Upload
      </Button>
    ),
    cell: ({ row, table }) => <UploadCell row={row} selectedMonth={table.options.meta?.selectedMonth} type={type} />,
  },
  {
    accessorKey: "uploadDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="whitespace-nowrap"
      >
        Upload Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("uploadDate") || 'N/A'}</div>,
  },
  {
    accessorKey: type === 'supplier' ? "supplierWefDate" : "periodFrom",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Period From
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue(type === 'supplier' ? "supplierWefDate" : "periodFrom") || 'N/A'}</div>,
  },
  {
    accessorKey: type === 'supplier' ? "supplierUntilDate" : "periodTo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Period To
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue(type === 'supplier' ? "supplierUntilDate" : "periodTo") || 'N/A'}</div>,
  },
  {
    accessorKey: "verifyByBCL",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Start Range Verification
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("verifyByBCL") ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "closingBalance",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Closing Balance
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("closingBalance") || 'N/A'}</div>,
  },
  {
    accessorKey: type === 'supplier' ? "closingBalanceVerify" : "closingBalanceVerified",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Closing Balance Verified
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue(type === 'supplier' ? "closingBalanceVerify" : "closingBalanceVerified") === true ? "✅" : "❌"}</div>,
  },
];

export const supplierColumns: ColumnDef<AllCompanies>[] = [
  ...createCommonColumns('supplier'),
  {
    id: "profile",
    header: "Profile",
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open profile</span>
              <Info className="h-4 w-4" />
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
        </Dialog>
      );
    },
  },
];

export const bankColumns: ColumnDef<AllBanks>[] = [
  ...createCommonColumns('bank'),
  {
    accessorKey: "currency",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Currency
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("currency")}</div>,
  },
  {
    accessorKey: "accountNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Account Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("accountNumber")}</div>,
  },
  {
    id: "profile",
    header: "Profile",
    cell: ({ row }) => {
      const bank = row.original;
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open profile</span>
              <Info className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{bank.bankName} Profile</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold">Account Number:</span>
                <span className="col-span-3">{bank.accountNumber}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold">Currency:</span>
                <span className="col-span-3">{bank.currency}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold">Branch Name:</span>
                <span className="col-span-3">{bank.branchName}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold">Start Date:</span>
                <span className="col-span-3">{bank.startDate}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold">Status:</span>
                <span className="col-span-3">{bank.bankStatus}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    },
  },
];

