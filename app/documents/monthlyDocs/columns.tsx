/* eslint-disable react-hooks/rules-of-hooks */
//@ts-nocheck

"use client";

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
import { Input } from "@/components/ui/input";
import { yupResolver } from '@hookform/resolvers/yup';
import { createClient } from '@supabase/supabase-js';
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import * as yup from 'yup';
import { AllCompanies } from './page';
import { useAuth } from '@clerk/clerk-react';

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseAnonKey);


const UploadCell = React.memo(({ row }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(row.getValue("uploadStatus"));
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [supplierData, setSupplierData] = useState(null);

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
    if (row.original) {
      setSupplierData({
        suppSeq: row.original.suppSeq,
        suppName: row.original.suppName,
        CompanyId: row.original.CompanyId
      });
    }
  }, [row.original]);

  useEffect(() => {
    if (supplierData && userId) {
      const fetchUploadStatus = async () => {
        try {
          const { data, error } = await supabase
            .from('acc_portal_monthly_files_upload')
            .select('upload_status')
            .eq('supplier_id', supplierData.suppSeq)
            .eq('document_type', 'supplier statement')
            .eq('userid', userId)
            .order('upload_date', { ascending: false })
            .limit(1);
  
          if (error) {
            throw error;
          }
  
          if (data && data.length > 0) {
            setUploadStatus(data[0].upload_status);
          } else {
            // No upload record found, set status to 'Not Uploaded'
            setUploadStatus('Not Uploaded');
          }
        } catch (error) {
          console.error('Error fetching upload status:', error);
          // In case of error, we'll assume 'Not Uploaded' status
          setUploadStatus('Not Uploaded');
        }
      };
  
      fetchUploadStatus();
    }
  }, [supplierData, userId]);

  const handleButtonClick = useCallback(async () => {
    if (uploadStatus === 'Uploaded') {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from('Accounting-Portal')
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
      if (!supplierData || !supplierData.suppSeq) {
        throw new Error('Supplier data is not available. Please try again.');
      }

      console.log('Submitting for supplier:', supplierData);

      const file = data.file[0];
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.toLocaleString('default', { month: 'long' });

      const filePath = `Monthly-Documents/suppliers/${year}/${month}/${supplierData.suppName}/${file.name}`;

      const { error: storageError } = await supabase.storage
        .from('Accounting-Portal')
        .upload(filePath, file);

      if (storageError) throw new Error(`Error uploading file: ${storageError.message}`);

      const { error: insertError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .insert({
          supplier_id: supplierData.suppSeq,
          document_type: 'supplier statement',
          upload_date: currentDate.toISOString(),
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
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
      setUploadStatus('Failed');
    } finally {
      setIsLoading(false);
    }
  }, [userId, supplierData]);

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
              {uploadStatus === 'Uploaded' ? 'File Preview' : `Upload Document for ${supplierData?.suppName || 'Supplier'}`}
            </DialogTitle>
            <DialogDescription>
              {uploadStatus === 'Uploaded' 
                ? 'Preview of the uploaded document' 
                : 'Upload a new document for the selected supplier'}
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

export const supplierColumns: ColumnDef<AllCompanies>[] = [
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
    accessorKey: "suppEndDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        End date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("suppEndDate")}</div>,
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
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Upload
      </Button>
    ),
    cell: UploadCell,
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
        Period From (SWEF Date)
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
    cell: ({ row }) => <div className="text-center">{row.getValue("closingBalanceVerify") === "true" ? "✅" : "❌"}</div>,
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
              <DialogTitle>{supplier.name} Profile</DialogTitle>
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

export default supplierColumns;