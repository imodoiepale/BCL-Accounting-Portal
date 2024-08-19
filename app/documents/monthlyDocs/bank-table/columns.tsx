/* eslint-disable react-hooks/rules-of-hooks */
//@ts-nocheck

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
import { AllCompanies } from './page';
import { useAuth } from '@clerk/clerk-react';
import { format } from "date-fns"

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  periodFrom: yup.date().required('Period From is required'),
  periodTo: yup.date().required('Period To is required')
    .min(
      yup.ref('periodFrom'),
      'Period To must be later than Period From'
    ),
  closingBalance: yup.number().required('Closing Balance is required'),
  file: yup.mixed().required('File is required')
});

const UploadCell = React.memo(({ row, selectedMonth }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(row.getValue("uploadStatus"));
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [bankData, setBankData] = useState(null);

  const { userId } = useAuth();

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
  
      console.log('start date ', startDate);
      console.log('end  date ', endDate);
      // Set form values
      form.setValue('periodFrom', startDate);
      form.setValue('periodTo', endDate);
    }
  }, [selectedMonth, form]);

  useEffect(() => {
    if (row.original) {
      // console.log('Setting bankData:', row.original);
      setBankData({
        bankSeq: row.original.bankSeq,
        bankName: row.original.bankName
      });
    }
  }, [row.original]);

  useEffect(() => {
    if (!bankData) {
      console.error('Bank data is not available');
      setUploadStatus('Error: No bank data');
      return;
    }
  
    if (!userId) {
      console.error('User ID is not available');
      setUploadStatus('Error: No user ID');
      return;
    }
  
    if (!selectedMonth) {
      console.error('Selected month is not available');
      setUploadStatus('Error: No month selected');
      return;
    }
  
    const fetchUploadStatus = async () => {
      try {
        const [monthName, year] = selectedMonth.split(' ');
        const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
        const startDate = `${year}-${monthNumber.toString().padStart(2, '0')}-01`;
        const endDate = new Date(parseInt(year), monthNumber, 0);
  
        console.log('Fetching upload status for:', {
          bankId: bankData.bankSeq,
          userId,
          startDate,
          endDate: endDate.toISOString()
        });
  
        const { data, error } = await supabase
          .from('acc_portal_monthly_files_upload')
          .select('*')
          .eq('bank_id', bankData.bankSeq)
          .eq('document_type', 'bank statement')
          .eq('userid', userId)
          .order('upload_date', { ascending: false })
          .limit(1);
  
        if (error) throw error;
  
        if (data && data.length > 0) {
          setUploadStatus(data[0].upload_status);
        } else {
          setUploadStatus('Not Uploaded');
        }
      } catch (error) {
        console.error('Error fetching upload status:', error);
        setUploadStatus('Error: Failed to fetch');
      }
    };
  
    fetchUploadStatus();
  }, [bankData, userId, selectedMonth, row]);

  const handleButtonClick = useCallback(async () => {
    if (uploadStatus === 'Uploaded' && row.original.filePath) {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from('Bank-Statements')
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
  }, [uploadStatus, row.original.filePath]);

  const onSubmit = useCallback(async (data) => {
    setIsLoading(true);
    try {

      console.log('onSubmit - supplierData:', bankData);
      console.log('onSubmit - selectedMonth:', selectedMonth);
      if (!bankData || !bankData.bankSeq) {
        throw new Error('Bank data is not available. Please try again.');
      }

      if (!selectedMonth) {
        throw new Error('Selected month is not available. Please try again.');
      }3

      const file = data.file[0];
      const [monthName, year] = selectedMonth.split(' ');

      const filePath = `Accounting-Portal/banks/${year}/${monthName}/${bankData.bankName}/${file.name}`;

      const { error: storageError } = await supabase.storage
        .from('Bank-Statements')
        .upload(filePath, file);

      if (storageError) throw new Error(`Error uploading file: ${storageError.message}`);

      const { error: insertError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .insert({
          bank_id: bankData.bankSeq,
          document_type: 'bank statement',
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
  }, [bankData, selectedMonth, userId, row.original]);

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
              {uploadStatus === 'Uploaded' ? 'File Preview' : `Upload Document for ${bankData?.bankName || 'Bank'}`}
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
              style={{width: '100%', height: '70vh', border: 'none'}}
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
                        <FormLabel>Period From</FormLabel>
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
                        <FormLabel>Period To</FormLabel>
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


export const bankColumns: ColumnDef<AllBanks>[] = [
  {
    accessorKey: "bankSeq",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Bank Acc Seq
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center font-medium">BA-{row.getValue("bankSeq")}</div>,
  },
  {
    accessorKey: "bankName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Bank Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("bankName")}</div>,
  },
  {
    accessorKey: "bankStatus",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("bankStatus")}</div>,
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Start date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("startDate")}</div>,
  },
  {
    accessorKey: "verified",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Verified by BCL
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("verified") ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "uploadStatus",
    header: "Upload",
    cell: ({ row, table }) => <UploadCell row={row} selectedMonth={table.options.meta?.selectedMonth} />,
  },
  {
    accessorKey: "uploadDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Upload Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("uploadDate") || 'N/A'}</div>,
  },
  {
    accessorKey: "periodFrom",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Period From
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("periodFrom") || 'N/A'}</div>,
  },
  {
    accessorKey: "periodTo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Period To
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("periodTo") || 'N/A'}</div>,
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
    cell: ({ row }) => <div>{row.getValue("verifyByBCL") ? "✅" : "❌"}</div>,
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
    cell: ({ row }) => <div>{row.getValue("closingBalance") || 'N/A'}</div>,
  },
  {
    accessorKey: "closingBalanceVerified",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Closing Balance Verified
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("closingBalanceVerified") ? "✅" : "❌"}</div>,
  
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
                <span className="font-bold">Bank PIN:</span>
                <span className="col-span-3">{bank.bankPIN}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold">Contact Name:</span>
                <span className="col-span-3">{bank.bankContactName}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold">Contact Mobile:</span>
                <span className="col-span-3">{bank.bankContactMobile}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold">Contact Email:</span>
                <span className="col-span-3">{bank.bankContactEmail}</span>
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

export default bankColumns;