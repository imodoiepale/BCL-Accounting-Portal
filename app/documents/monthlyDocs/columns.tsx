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
import { yupResolver } from '@hookform/resolvers/yup';
import { createClient } from '@supabase/supabase-js';
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Info } from "lucide-react";
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import * as yup from 'yup';
import { AllCompanies } from './page';

const supabaseUrl = 'https://zyszsqgdlrpnunkegipk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const UploadCell = React.memo(({ row }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(row.getValue("uploadStatus"));
  const [isLoading, setIsLoading] = useState(false);

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
    const fetchUploadStatus = async () => {
      const { data, error } = await supabase
        .from('acc_portal_monthly_files_upload')
        .select('upload_status')
        .eq('company_id', row.original.CompanyId)
        .eq('document_type', 'supplier statement')
        .order('upload_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching upload status:', error);
      } else if (data) {
        setUploadStatus(data.upload_status);
      }
    };

    fetchUploadStatus();
  }, [row.original.CompanyId]);

  const handleViewUpload = useCallback(async () => {
  if (row.original.filePath) {
    try {
      const { data, error } = await supabase.storage
        .from('Accounting-Portal')
        .createSignedUrl(row.original.filePath, 60);

      if (error) throw error;
      
      // Open the file in a popup window
      const popupWindow = window.open('', '_blank', 'width=800,height=600');
      popupWindow.document.write(`
        <iframe src="${data.signedUrl}" style="width:100%;height:100%;border:none;"></iframe>
      `);
    } catch (error) {
      console.error('Error viewing file:', error);
      alert('Error viewing file. Please try again.');
    }
  } else {
    alert('No file uploaded yet.');
  }
}, [row.original.filePath]);


  const onSubmit = useCallback(async (data) => {
    setIsLoading(true);
    try {
      const file = data.file[0];
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.toLocaleString('default', { month: 'long' });

      const { data: companyData, error: companyError } = await supabase
        .from('acc_portal_company')
        .select('company_name')
        .eq('id', row.original.CompanyId)
        .single();

      if (companyError) throw companyError;

      const filePath = `Monthly-Documents/suppliers/${year}/${month}/${companyData.company_name}/${file.name}`;

      await supabase.storage.createBucket('Accounting-Portal', { public: false });

      const { error: storageError } = await supabase.storage
        .from('Accounting-Portal')
        .upload(filePath, file);

      if (storageError) throw storageError;

      const { error: insertError } = await supabase
        .from('acc_portal_monthly_files_upload')
        .insert({
          supplier_id: row.original.CompanyId,
          company_id: row.original.CompanyId,
          document_type: 'supplier statement',
          upload_date: currentDate.toISOString(),
          docs_date_range: data.periodFrom,
          docs_date_range_end: data.periodTo,
          closing_balance: data.closingBalance,
          balance_verification: false,
          file_path: filePath,
          upload_status: 'Uploaded' 
        });

      if (insertError) throw insertError;

      setUploadStatus('Uploaded');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Error uploading file: ${error.message || error.error}`);
      setUploadStatus('Failed');
    } finally {
      setIsLoading(false);
    }
  }, [row.original.CompanyId]);

  return (
    
    <div className="text-center">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild className="whitespace-nowrap">
          <WrappedButton 
            variant="outline" 
            onClick={() => uploadStatus === 'Uploaded' ? handleViewUpload() : setIsDialogOpen(true)}
            disabled={isLoading}
          >
            {uploadStatus === 'Uploaded' ? '✅ View Upload' : 
             uploadStatus === 'Failed' ? '❌ Retry Upload' : 'Upload'}
          </WrappedButton>
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
              <WrappedButton type="submit" disabled={isLoading}>
                {isLoading ? 'Uploading...' : 'Submit'}
              </WrappedButton>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
});

UploadCell.displayName = 'UploadCell';

const WrappedButton = ({ children, ...props }) => (
  <div className="text-center">
    <Button
      variant="ghost"
      className="h-auto whitespace-break-spaces text-wrap"
      {...props}
    >
      {children}
    </Button>
  </div>
);


export const supplierColumns: ColumnDef<AllCompanies>[] = [
  {
    accessorKey: "suppSeq",
    header: ({ column }) => (
      <WrappedButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Supp Seq
        <ArrowUpDown className="2 h-4 w-4" />
      </WrappedButton>
    ),
    cell: ({ row }) => <div className="text-center ">SUP-{row.getValue("suppSeq")}</div>,
  },
  {
    accessorKey: "suppName",
    header: ({ column }) => (
      <WrappedButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Supp Name
        <ArrowUpDown className="2 h-4 w-4" />
      </WrappedButton>
    ),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("suppName")}</div>,
  },
  {
    accessorKey: "suppStatus",
    header: ({ column }) => (
      <WrappedButton
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="2 h-4 w-4" />
      </WrappedButton>
    ),
    cell: ({ row }) => {
      const status = row.getValue("suppStatus");
      const statusClass = status === 'Active' ? 'text-green-500' : 'text-red-500';
      return <div className={` text-center font-medium ${statusClass}`}>{status}</div>;
    },
  },
  
  {
    accessorKey: "suppStartDate",
    header: ({ column }) => (
      <WrappedButton
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Start date
        <ArrowUpDown className="2 h-4 w-4" />
      </WrappedButton>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("suppStartDate")}</div>,
  },
  {
    accessorKey: "verifiedByBCLAccManager",
    header: ({ column }) => (
      <WrappedButton
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Verified by BCL
        <ArrowUpDown className="2 h-4 w-4" />
      </WrappedButton>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("verifiedByBCLAccManager") ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "uploadStatus",
    header: ({ column }) => (
      <WrappedButton
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Upload
      </WrappedButton>
    ),
    cell: UploadCell,
  },
  {
    accessorKey: "uploadDate",
    header: ({ column }) => (
      <WrappedButton
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="whitespace-nowrap"
      >
        Upload Date
        <ArrowUpDown className="2 h-4 w-4" />
      </WrappedButton>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("uploadDate") || 'N/A'}</div>,
  },
  {
    accessorKey: "supplierWefDate",
    header: ({ column }) => (
      <WrappedButton
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Period From (SWEF Date)
        <ArrowUpDown className="2 h-4 w-4" />
      </WrappedButton>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("supplierWefDate") || 'N/A'}</div>,
  },
  {
    accessorKey: "supplierUntilDate",
    header: ({ column }) => (
      <WrappedButton
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Period To
        <ArrowUpDown className="2 h-4 w-4" />
      </WrappedButton>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("supplierUntilDate") || 'N/A'}</div>,
  },
  {
    accessorKey: "verifyByBCL",
    header: ({ column }) => (
      <WrappedButton
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Start Range Verification
        <ArrowUpDown className="2 h-4 w-4" />
      </WrappedButton>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("verifyByBCL") ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "closingBalance",
    header: ({ column }) => (
      <WrappedButton
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Closing Balance
        <ArrowUpDown className="2 h-4 w-4" />
      </WrappedButton>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("closingBalance") || 'N/A'}</div>,
  },
  {
    accessorKey: "closingBalanceVerify",
    header: ({ column }) => (
      <WrappedButton
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Closing Balance Verified
        <ArrowUpDown className="2 h-4 w-4" />
      </WrappedButton>
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
            <WrappedButton variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open profile</span>
              <Info className="h-4 w-4" />
            </WrappedButton>
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

export default supplierColumns