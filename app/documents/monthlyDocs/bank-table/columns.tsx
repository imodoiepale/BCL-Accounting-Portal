/* eslint-disable react-hooks/rules-of-hooks */
//@ts-nocheck

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { createClient } from '@supabase/supabase-js';
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Info } from "lucide-react";
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AllBanks } from './page';
import { useAuth } from "@clerk/clerk-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

const UploadCell = React.memo(({ row }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(row.getValue("uploadStatus"));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { userId } = useAuth();

  const form = useForm({
    defaultValues: {
      periodFrom: '',
      periodTo: '',
      closingBalance: '',
      file: null
    },
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    const fetchUploadStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('acc_portal_monthly_files_upload')
          .select('upload_status')
          .eq('userid', userId)
          .eq('document_type', 'bank statement')
          .eq('bank_id', row.original.bankSeq)  // Add this line
          .order('upload_date', { ascending: false })
          .limit(1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setUploadStatus(data[0].upload_status);
        } else {
          setUploadStatus('Not Uploaded');
        }
      } catch (error) {
        console.error('Error fetching upload status:', error);
        setUploadStatus('Not Uploaded');
        setErrorMessage('Unable to fetch upload status. Please try again later.');
      }
    };

    fetchUploadStatus();
  }, [userId, row.original.bankSeq]); 

  const handleViewUpload = useCallback(async () => {
    if (row.original.filePath) {
      try {
        const { data, error } = await supabase.storage
          .from('Bank-Statements')
          .createSignedUrl(row.original.filePath, 60);

        if (error) throw error;
        window.open(data.signedUrl, '_blank');
      } catch (error) {
        console.error('Error viewing file:', error);
        setErrorMessage('Error viewing file. Please try again.');
      }
    } else {
      setErrorMessage('No file uploaded yet.');
    }
  }, [row.original.filePath]);

  const onSubmit = useCallback(async (data) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const file = data.file[0];
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.toLocaleString('default', { month: 'long' });
  
      // Fetch company data
      const { data: companyData, error: companyError } = await supabase
        .from('acc_portal_company')
        .select('company_name')
        .eq('userid', userId);
  
      if (companyError) {
        throw new Error(`Error fetching company data: ${companyError.message}`);
      }
  
      if (!companyData || companyData.length === 0) {
        throw new Error(`No company found for user: ${userId}`);
      }
  
      const companyName = companyData[0].company_name;
  
      const filePath = `Accounting-Portal/banks/${year}/${month}/${companyName}/${file.name}`;
  
      // Ensure the bucket exists
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('Bank-Statements');
      if (bucketError && bucketError.statusCode === '404') {
        await supabase.storage.createBucket('Bank-Statements', { public: false });
      } else if (bucketError) {
        throw new Error(`Error checking/creating bucket: ${bucketError.message}`);
      }
  
      // Upload file
      const { error: storageError } = await supabase.storage
        .from('Bank-Statements')
        .upload(filePath, file);
  
      if (storageError) {
        throw new Error(`Error uploading file: ${storageError.message}`);
      }
  
      // Insert record
      const { error: insertError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .insert({
          userid: userId,
          bank_id: row.original.bankSeq,  // Add this line
          document_type: 'bank statement',
          upload_date: currentDate.toISOString(),
          docs_date_range: data.periodFrom,
          docs_date_range_end: data.periodTo,
          closing_balance: data.closingBalance,
          balance_verification: false,
          file_path: filePath,
          upload_status: 'Uploaded'
        });
  
      if (insertError) {
        throw new Error(`Error inserting data: ${insertError.message}`);
      }
  
      setUploadStatus('Uploaded');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error in upload process:', error);
      setErrorMessage(`Upload failed: ${error.message}`);
      setUploadStatus('Failed');
    } finally {
      setIsLoading(false);
    }
  }, [userId, row.original.bankSeq]);

  return (
    <div className="text-center font-medium">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            onClick={() => uploadStatus === 'Uploaded' ? handleViewUpload() : setIsDialogOpen(true)}
            disabled={isLoading}
          >
            {uploadStatus === 'Uploaded' ? '✅ View Upload' : 
             uploadStatus === 'Failed' ? '❌ Retry Upload' : 'Upload'}
          </Button>
        </DialogTrigger>
        <DialogContent>
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
                      <FormLabel>Period From</FormLabel>
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Uploading...' : 'Submit'}
              </Button>
            </form>
          </Form>
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
    cell: UploadCell,
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