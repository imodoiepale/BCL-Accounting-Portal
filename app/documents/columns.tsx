// @ts-nocheck
//@ts-ignore
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

// Create a cache object outside of the component
const dataCache = new Map();

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

  const cacheKey = useMemo(() => {
    return `${userId}-${selectedMonth}-${row.getValue(type === 'supplier' ? 'suppSeq' : 'bankSeq')}-${type}`;
  }, [userId, selectedMonth, row, type]);

  const fetchData = useCallback(async () => {
    if (!userId || !selectedMonth || !row.getValue(type === 'supplier' ? 'suppSeq' : 'bankSeq')) {
      console.error('Missing required data:', { userId, selectedMonth, rowId: row.getValue(type === 'supplier' ? 'suppSeq' : 'bankSeq') });
      setState(prev => ({ ...prev, isDataFetching: false }));
      return;
    }

    // Check if data is in cache
    if (dataCache.has(cacheKey)) {
      setState(prev => ({
        ...prev,
        ...dataCache.get(cacheKey),
        isDataFetching: false
      }));
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

      const newState = {
        itemData: fetchedItemData,
        uploadStatus: uploadData && uploadData.length > 0 ? uploadData[0].upload_status : 'Not Uploaded',
        filePath: uploadData && uploadData.length > 0 ? uploadData[0].file_path : null,
        isDataFetching: false
      };

      // Update cache
      dataCache.set(cacheKey, newState);

      setState(prev => ({ ...prev, ...newState }));

    } catch (error) {
      console.error('Error fetching data:', error);
      setState(prev => ({ ...prev, uploadStatus: 'Error', isDataFetching: false }));
      alert(`Error fetching ${type} data: ${error.message}`);
    }
  }, [userId, selectedMonth, row, type, cacheKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

                  <FormField
                    control={form.control}
                    name="closingBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Closing Balance</FormLabel>
                        <FormControl>
                          <Input type="number" className='w-[280px]'{...field} />
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
                            className='w-[280px]'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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

// Helper function for creating sortable header
const createSortableHeader = (label: string) => {
  const SortableHeader = ({ column }) => {
    const words = label.split(' ');
    const isLongHeader = words.length > 2;

    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className={`text-center ${isLongHeader ? 'flex items-start p-2 h-auto min-h-[60px] ' : 'whitespace-nowrap'}`}
      >
        <span className={isLongHeader ? 'whitespace-normal mb-1 w-30 text-center' : 'whitespace-nowrap'}>
          {label}
        </span>
        {/* <ArrowUpDown className={`${isLongHeader ? 'mt-1' : 'ml-2'} h-4 w-4`} /> */}
      </Button>
    );
  };
  SortableHeader.displayName = `SortableHeader_${label}`;
  return SortableHeader;
};

// Helper function for creating status cell
const createStatusCell = (getValue) => {
  const status = getValue();
  const statusClass = status === 'Active' ? 'text-green-500' : 'text-red-500';
  return <div className={`text-center font-medium ${statusClass}`}>{status}</div>;
};

// Supplier Profile Component
const SupplierProfile = ({ suppSeq }) => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('acc_portal_suppliers')
        .select('*')
        .eq('id', suppSeq)
        .single();

      if (error) throw error;
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching supplier profile:', error);
      alert('Error fetching supplier profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [suppSeq]);

  useEffect(() => {
    if (isOpen && !profileData) {
      fetchProfileData();
    }
  }, [isOpen, profileData, fetchProfileData]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open profile</span>
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{profileData?.name || 'Supplier'} Profile</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div>Loading profile data...</div>
        ) : profileData ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Supplier PIN:</span>
              <span className="col-span-3">{profileData.pin}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Contact Name:</span>
              <span className="col-span-3">{profileData.contact_name}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Contact Mobile:</span>
              <span className="col-span-3">{profileData.contact_mobile}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Contact Email:</span>
              <span className="col-span-3">{profileData.contact_email}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Start Date:</span>
              <span className="col-span-3">{profileData.startdate}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Status:</span>
              <span className="col-span-3">{profileData.status ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ) : (
          <div>No profile data available</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Bank Profile Component
const BankProfile = ({ bankSeq }) => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('acc_portal_banks')
        .select('*')
        .eq('id', bankSeq)
        .single();

      if (error) throw error;
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching bank profile:', error);
      alert('Error fetching bank profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [bankSeq]);

  useEffect(() => {
    if (isOpen && !profileData) {
      fetchProfileData();
    }
  }, [isOpen, profileData, fetchProfileData]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open profile</span>
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{profileData?.name || 'Bank'} Profile</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div>Loading profile data...</div>
        ) : profileData ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Account Number:</span>
              <span className="col-span-3">{profileData.account_number}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Currency:</span>
              <span className="col-span-3">{profileData.currency}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Branch Name:</span>
              <span className="col-span-3">{profileData.branch}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Start Date:</span>
              <span className="col-span-3">{profileData.startdate}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Status:</span>
              <span className="col-span-3">{profileData.status ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ) : (
          <div>No profile data available</div>
        )}
      </DialogContent>
    </Dialog>
  );
};


export const supplierColumns: ColumnDef<any>[] = [
  {
    accessorKey: "suppSeq",
    header: createSortableHeader("Supp Seq"),
    cell: ({ row, table }) => {
      const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id) + 1;
      return <div className="text-center">S-{index}</div>;
    },
  },
  {
    accessorKey: "suppName",
    header: createSortableHeader("Supp Name"),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("suppName")}</div>,
  },
  {
    accessorKey: "suppStatus",
    header: createSortableHeader("Status"),
    cell: ({ row }) => createStatusCell(() => row.getValue("suppStatus")),
  },
  {
    accessorKey: "suppStartDate",
    header: createSortableHeader("Start date"),
    cell: ({ row }) => <div className="text-center">{row.getValue("suppStartDate")}</div>,
  },
  {
    accessorKey: "verifiedByBCLAccManager",
    header: createSortableHeader("Verified by BCL"),
    cell: ({ row }) => <div className="text-center">{row.getValue("verifiedByBCLAccManager") ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "uploadStatus",
    header: "Upload",
    cell: ({ row, table }) => <UploadCell row={row} selectedMonth={table.options.meta?.selectedMonth} type="supplier" />,
  },
  {
    accessorKey: "uploadDate",
    header: createSortableHeader("Upload Date"),
    cell: ({ row }) => <div className="text-center">{row.getValue("uploadDate") || 'N/A'}</div>,
  },
  {
    accessorKey: "supplierWefDate",
    header: createSortableHeader("Period From"),
    cell: ({ row }) => <div className="text-center">{row.getValue("supplierWefDate") || 'N/A'}</div>,
  },
  {
    accessorKey: "supplierUntilDate",
    header: createSortableHeader("Period To"),
    cell: ({ row }) => <div className="text-center">{row.getValue("supplierUntilDate") || 'N/A'}</div>,
  },
  {
    accessorKey: "verifyByBCL",
    header: createSortableHeader("Start Range Verification"),
    cell: ({ row }) => <div className="text-center">{row.getValue("verifyByBCL") ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "closingBalance",
    header: createSortableHeader("Closing Balance"),
    cell: ({ row }) => <div className="text-center">{row.getValue("closingBalance") || 'N/A'}</div>,
  },
  {
    accessorKey: "closingBalanceVerify",
    header: createSortableHeader("Closing Balance Verified"),
    cell: ({ row }) => <div className="text-center">{row.getValue("closingBalanceVerify") === true ? "✅" : "❌"}</div>,
  },
  {
    id: "profile",
    header: "Profile",
    cell: ({ row }) => <SupplierProfile suppSeq={row.getValue('suppSeq')} />,
  },
];

export const bankColumns: ColumnDef<any>[] = [
  {
    accessorKey: "bankSeq",
    header: createSortableHeader("Bank Acc Seq"),
    cell: ({ row, table }) => {
      const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id) + 1;
      return <div className="text-center">B-{index}</div>;
    },
  },
  {
    accessorKey: "bankName",
    header: createSortableHeader("Bank Name"),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("bankName")}</div>,
  },
  {
    accessorKey: "bankStatus",
    header: createSortableHeader("Status"),
    cell: ({ row }) => createStatusCell(() => row.getValue("bankStatus")),
  },
  {
    accessorKey: "bankStartDate",
    header: createSortableHeader("Start date"),
    cell: ({ row }) => <div className="text-center">{row.getValue("bankStartDate")}</div>,
  },
  {
    accessorKey: "verified",
    header: createSortableHeader("Verified by BCL"),
    cell: ({ row }) => <div className="text-center">{row.getValue("verified") ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "uploadStatus",
    header: "Upload",
    cell: ({ row, table }) => <UploadCell row={row} selectedMonth={table.options.meta?.selectedMonth} type="bank" />,
  },
  {
    accessorKey: "uploadDate",
    header: createSortableHeader("Upload Date"),
    cell: ({ row }) => <div className="text-center">{row.getValue("uploadDate") || 'N/A'}</div>,
  },
  {
    accessorKey: "periodFrom",
    header: createSortableHeader("Period From"),
    cell: ({ row }) => <div className="text-center">{row.getValue("periodFrom") || 'N/A'}</div>,
  },
  {
    accessorKey: "periodTo",
    header: createSortableHeader("Period To"),
    cell: ({ row }) => <div className="text-center">{row.getValue("periodTo") || 'N/A'}</div>,
  },
  {
    accessorKey: "verifyByBCL",
    header: createSortableHeader("Start Range Verification"),
    cell: ({ row }) => <div className="text-center">{row.getValue("verifyByBCL") ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "closingBalance",
    header: createSortableHeader("Closing Balance"),
    cell: ({ row }) => <div className="text-center">{row.getValue("closingBalance") || 'N/A'}</div>,
  },
  {
    accessorKey: "closingBalanceVerified",
    header: createSortableHeader("Closing Balance Verified"),
    cell: ({ row }) => <div className="text-center">{row.getValue("closingBalanceVerified") === true ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "currency",
    header: createSortableHeader("Currency"),
    cell: ({ row }) => <div className="text-center">{row.getValue("currency")}</div>,
  },
  {
    accessorKey: "accountNumber",
    header: createSortableHeader("Account Number"),
    cell: ({ row }) => <div className="text-center">{row.getValue("accountNumber")}</div>,
  },
  {
    id: "profile",
    header: "Profile",
    cell: ({ row }) => <BankProfile bankSeq={row.getValue('bankSeq')} />,
  },
];
