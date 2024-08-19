// @ts-nocheck
//@ts-ignore
import React, { useCallback, useEffect, useState } from 'react';
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
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import * as yup from 'yup';
import { useAuth } from '@clerk/clerk-react';
import { format } from "date-fns"
// @ts-nocheck
import { ColumnDef } from "@tanstack/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { debounce } from 'lodash';

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

// Form schema (unchanged)
const schema = yup.object().shape({
  periodFrom: yup.date().required("Period From is required"),
  periodTo: yup.date()
    .required("Period To is required")
    .min(yup.ref('periodFrom'), "Period To must be later than Period From"),
  closingBalance: yup.number().required("Closing Balance is required"),
  file: yup.mixed().required("File is required")
});

interface UploadCellProps {
  row: any;
  selectedMonth: string;
  type: 'supplier' | 'bank';
}

const UploadCell: React.FC<UploadCellProps> = ({ row, selectedMonth, type }) => {
  const [state, setState] = useState({
    isDialogOpen: false,
    isLoading: false,
    isDataFetching: true,
    previewUrl: '',
    itemData: null,
    uploadStatus: 'Not Uploaded',
    filePath: null
  });

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

  const fetchData = useCallback(async () => {
    if (!userId || !selectedMonth || !row.getValue(type === 'supplier' ? 'suppSeq' : 'bankSeq')) {
      console.error('Missing required data:', { userId, selectedMonth, rowId: row.getValue(type === 'supplier' ? 'suppSeq' : 'bankSeq') });
      setState(prev => ({ ...prev, isDataFetching: false }));
      return;
    }

    const [monthName, year] = selectedMonth.split(' ');
    const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth();
    const startDate = new Date(parseInt(year), monthNumber, 1);
    const endDate = new Date(parseInt(year), monthNumber + 1, 0);

    try {
      // Fetch item data
      const { data: fetchedItemData, error: itemError } = await supabase
        .from(type === 'supplier' ? 'acc_portal_suppliers' : 'acc_portal_banks')
        .select('*')
        .eq('id', row.getValue(type === 'supplier' ? 'suppSeq' : 'bankSeq'))
        .single();

      if (itemError) throw itemError;

      if (!fetchedItemData) {
        throw new Error(`No ${type} data found for id: ${row.getValue(type === 'supplier' ? 'suppSeq' : 'bankSeq')}`);
      }

      // Fetch upload status
      const { data: uploadData, error: uploadError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .select('*')
        .eq('document_type', type === 'supplier' ? 'supplier statement' : 'bank statement')
        .eq('userid', userId)
        .eq(type === 'supplier' ? 'supplier_id' : 'bank_id', row.getValue(type === 'supplier' ? 'suppSeq' : 'bankSeq'))
        .gte('docs_date_range', startDate.toISOString())
        .lte('docs_date_range_end', endDate.toISOString())
        .order('upload_date', { ascending: false })
        .limit(1);

      if (uploadError) throw uploadError;

      setState(prev => ({
        ...prev,
        itemData: fetchedItemData,
        uploadStatus: uploadData && uploadData.length > 0 ? uploadData[0].upload_status : 'Not Uploaded',
        filePath: uploadData && uploadData.length > 0 ? uploadData[0].file_path : null,
        isDataFetching: false
      }));

    } catch (error) {
      console.error('Error fetching data:', error);
      setState(prev => ({ ...prev, uploadStatus: 'Error', isDataFetching: false }));
      alert(`Error fetching ${type} data: ${error.message}`);
    }
  }, [userId, selectedMonth, row, type]);

  const debouncedFetchData = debounce(fetchData, 300);

  useEffect(() => {
    debouncedFetchData();
    return () => debouncedFetchData.cancel();
  }, [debouncedFetchData]);

  const handleButtonClick = useCallback(async () => {
    if (state.isDataFetching) {
      alert("Data is still loading. Please wait.");
      return;
    }

    if (state.uploadStatus === 'Uploaded' && state.filePath) {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        const { data, error } = await supabase.storage
          .from(type === 'supplier' ? 'Accounting-Portal' : 'Bank-Statements')
          .createSignedUrl(state.filePath, 60);

        if (error) throw error;

        setState(prev => ({ ...prev, previewUrl: data.signedUrl, isDialogOpen: true, isLoading: false }));
      } catch (error) {
        console.error('Error viewing file:', error);
        alert('Error viewing file. Please try again.');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isDialogOpen: true }));
    }
  }, [state, type]);

  const onSubmit = useCallback(async (data) => {
    if (state.isDataFetching) {
      alert("Data is still loading. Please wait.");
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      if (!state.itemData || !state.itemData.id) {
        throw new Error(`${type.charAt(0).toUpperCase() + type.slice(1)} data is not available. Please try again.`);
      }

      if (!selectedMonth) {
        throw new Error('Selected month is not available. Please try again.');
      }

      const file = data.file[0];
      const [monthName, year] = selectedMonth.split(' ');

      const filePath = `Monthly-Documents/${type}s/${year}/${monthName}/${state.itemData.name}/${file.name}`;

      const { error: storageError } = await supabase.storage
        .from(type === 'supplier' ? 'Accounting-Portal' : 'Bank-Statements')
        .upload(filePath, file);

      if (storageError) throw new Error(`Error uploading file: ${storageError.message}`);

      const { error: insertError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .insert({
          [type === 'supplier' ? 'supplier_id' : 'bank_id']: row.getValue(type === 'supplier' ? 'suppSeq' : 'bankSeq'),
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

      setState(prev => ({
        ...prev,
        uploadStatus: 'Uploaded',
        filePath: filePath,
        isDialogOpen: false,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
      setState(prev => ({ ...prev, uploadStatus: 'Failed', isLoading: false }));
    }
  }, [state, selectedMonth, userId, row, type]);

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

  return (
    <div className="text-center">
      <Button
        variant="outline"
        onClick={handleButtonClick}
        disabled={state.isLoading}
      >
        {state.uploadStatus === 'Uploaded' ? '✅View Upload' :
          state.uploadStatus === 'Failed' ? '❌Retry Upload' : 'Upload'}
      </Button>
      <Dialog open={state.isDialogOpen} onOpenChange={(open) => setState(prev => ({ ...prev, isDialogOpen: open }))}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {state.uploadStatus === 'Uploaded' ? 'File Preview' : `Upload Document for ${state.itemData?.name || type}`}
            </DialogTitle>
            <DialogDescription>
              {state.uploadStatus === 'Uploaded'
                ? 'Preview of the uploaded document'
                : `Upload a new document for ${selectedMonth}`}
            </DialogDescription>
          </DialogHeader>
          {state.uploadStatus === 'Uploaded' && state.previewUrl ? (
            <iframe
              src={state.previewUrl}
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
                <Button type="submit" disabled={state.isLoading}>
                  {state.isLoading ? 'Uploading...' : 'Submit'}
                </Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

UploadCell.displayName = 'UploadCell';

export const supplierColumns: ColumnDef<any>[] = [
  {
    accessorKey: "suppSeq",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Supp Seq
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">SUP-{row.getValue("suppSeq")}</div>,
  },
  {
    accessorKey: "suppName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Supp Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("suppName")}</div>,
  },
  {
    accessorKey: "suppStatus",
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
      const status = row.getValue("suppStatus");
      const statusClass = status === 'Active' ? 'text-green-500' : 'text-red-500';
      return <div className={`text-center font-medium ${statusClass}`}>{status}</div>;
    },
  },
  {
    accessorKey: "suppStartDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Start date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("suppStartDate")}</div>,
  },
  {
    accessorKey: "verifiedByBCLAccManager",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Verified by BCL
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("verifiedByBCLAccManager") ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "uploadStatus",
    header: "Upload",
    cell: ({ row, table }) => <UploadCell row={row} selectedMonth={table.options.meta?.selectedMonth} type="supplier" />,
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
    accessorKey: "supplierWefDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Period From
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("supplierWefDate") || 'N/A'}</div>,
  },
  {
    accessorKey: "supplierUntilDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Period To
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("supplierUntilDate") || 'N/A'}</div>,
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
    accessorKey: "closingBalanceVerify",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Closing Balance Verified
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("closingBalanceVerify") === true ? "✅" : "❌"}</div>,
  },
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

export const bankColumns: ColumnDef<any>[] = [
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
    cell: ({ row }) => <div className="text-center">BA-{row.getValue("bankSeq")}</div>,
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
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("bankName")}</div>,
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
    cell: ({ row }) => {
      const status = row.getValue("bankStatus");
      const statusClass = status === 'Active' ? 'text-green-500' : 'text-red-500';
      return <div className={`text-center font-medium ${statusClass}`}>{status}</div>;
    },
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
    cell: ({ row }) => <div className="text-center">{row.getValue("startDate")}</div>,
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
    cell: ({ row }) => <div className="text-center">{row.getValue("verified") ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "uploadStatus",
    header: "Upload",
    cell: ({ row, table }) => <UploadCell row={row} selectedMonth={table.options.meta?.selectedMonth} type="bank" />,
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
    cell: ({ row }) => <div className="text-center">{row.getValue("periodFrom") || 'N/A'}</div>,
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
    cell: ({ row }) => <div className="text-center">{row.getValue("periodTo") || 'N/A'}</div>,
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
    cell: ({ row }) => <div className="text-center">{row.getValue("closingBalanceVerified") === true ? "✅" : "❌"}</div>,
  },
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