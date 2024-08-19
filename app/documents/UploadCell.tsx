// @ts-nocheck
//@ts-ignore
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import * as yup from 'yup';
import { useAuth } from '@clerk/clerk-react';
import { format } from "date-fns"

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const schema = yup.object().shape({
  periodFrom: yup.date().required("Period From is required"),
  periodTo: yup.date()
    .required("Period To is required")
    .min(yup.ref('periodFrom'), "Period To must be later than Period From"),
  closingBalance: yup.number().required("Closing Balance is required"),
  file: yup.mixed().required("File is required")
});

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

interface UploadCellProps {
  row: any;
  selectedMonth: string;
  type: 'supplier' | 'bank';
}

export const UploadCell: React.FC<UploadCellProps> = ({ row, selectedMonth, type }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(row.getValue("uploadStatus"));
  const [isLoading, setIsLoading] = useState(false);
  const [isDataFetching, setIsDataFetching] = useState(true);
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
      
      const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const startDate = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
      const endDate = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0);
  
      form.setValue('periodFrom', startDate);
      form.setValue('periodTo', endDate);
    }
  }, [selectedMonth, form]);

  useEffect(() => {
    const fetchData = async () => {
      setIsDataFetching(true);
      if (!userId || !selectedMonth || !row.original.id) {
        console.error('Missing required data:', { userId, selectedMonth, rowId: row.original.id });
        setIsDataFetching(false);
        return;
      }

      const [monthName, year] = selectedMonth.split(' ');
      const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth();
      const startDate = new Date(parseInt(year), monthNumber, 1);
      const endDate = new Date(parseInt(year), monthNumber + 1, 0);

      try {
        console.log(`Fetching ${type} data for id:`, row.original.id);
        
        // Fetch item data
        const { data: fetchedItemData, error: itemError } = await supabase
          .from(type === 'supplier' ? 'acc_portal_suppliers' : 'acc_portal_banks')
          .select('*')
          .eq('id', row.original.id)
          .single();

        if (itemError) throw itemError;

        if (!fetchedItemData) {
          throw new Error(`No ${type} data found for id: ${row.original.id}`);
        }

        setItemData(fetchedItemData);
        console.log(`${type} data:`, itemData);

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
        alert(`Error fetching ${type} data: ${error.message}`);
      } finally {
        setIsDataFetching(false);
      }
    };

    fetchData();
  }, [userId, selectedMonth, row.original.id, type, row.original, itemData]);

  const handleButtonClick = useCallback(async () => {
    if (isDataFetching) {
      alert("Data is still loading. Please wait.");
      return;
    }

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
  }, [isDataFetching, uploadStatus, row.original.filePath, type]);

  const onSubmit = useCallback(async (data) => {
    if (isDataFetching) {
      alert("Data is still loading. Please wait.");
      return;
    }

    setIsLoading(true);
    try {
      console.log('onSubmit - itemData:', itemData);
      console.log('onSubmit - selectedMonth:', selectedMonth);

      if (!itemData || !itemData.id) {
        console.error('Item data is missing or invalid:', itemData);
        throw new Error(`${type.charAt(0).toUpperCase() + type.slice(1)} data is not available. Please try again.`);
      }

      if (!selectedMonth) {
        console.error('Selected month is missing');
        throw new Error('Selected month is not available. Please try again.');
      }

      const file = data.file[0];
      const [monthName, year] = selectedMonth.split(' ');

      const filePath = `Monthly-Documents/${type}s/${year}/${monthName}/${itemData.name}/${file.name}`;

      console.log('Uploading file to:', filePath);

      const { error: storageError } = await supabase.storage
        .from(type === 'supplier' ? 'Accounting-Portal' : 'Bank-Statements')
        .upload(filePath, file);

      if (storageError) throw new Error(`Error uploading file: ${storageError.message}`);

      console.log('File uploaded successfully. Inserting record into database.');

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

      console.log('Record inserted successfully');

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
  }, [isDataFetching, itemData, selectedMonth, userId, row.original, type]);

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
};