/* eslint-disable react-hooks/rules-of-hooks */
//@ts-nocheck
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableRowActions } from "./data-table-row-actions";
import { useEffect, useState } from "react";
import { handleDocumentUpload, checkFileExists, handleDocumentUpdateOrDelete } from "./utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

export type AllCompanies = {
  CompanyId: string;
  incorporation: string;
  cr12: boolean;
  bank_slips: boolean;
  bank_statements: string;
  sbp: string;
  fireLicense: string;
  balanceSheets: string;
  taxReturns: string;
};

export const supplierColumns: ColumnDef<AllCompanies>[] = [
  {
    accessorKey: "suppSeq",
    header: () => <div className="text-center">Supp Seq</div>,
    cell: ({ row }) => <div className="text-center font-medium">{row.getValue("suppSeq")}</div>,
  },
  {
    accessorKey: "suppName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Supp Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("suppName")}</div>,
  },
  {
    accessorKey: "suppStatus",
    header: "Status",
    cell: ({ row }) => <div>{row.getValue("suppStatus")}</div>,
  },
  {
    accessorKey: "suppStartDate",
    header: "Start date",
    cell: ({ row }) => <div>{row.getValue("suppStartDate")}</div>,
  },
  {
    accessorKey: "verifiedByBCLAccManager",
    header: "Verified by BCL ",
    cell: ({ row }) => <div>{row.getValue("verifiedByBCLAccManager") ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "uploadStatus",
    header: "Upload",
    cell: ({ row }) => {
      const [status, setStatus] = useState('checking');
      const [isDialogOpen, setIsDialogOpen] = useState(false);
      
      const form = useForm({
        defaultValues: {
          periodFrom: '',
          periodTo: '',
          closingBalance: '',
          file: null
        }
      });

      useEffect(() => {
        const fetchData = async () => {
          const fileExists = await checkFileExists(row.original.CompanyId, "PURCHASE");
          setStatus(fileExists ? "true" : "false");
        }
        fetchData();
      }, [row.original.CompanyId]);

      const icon = status === "true" ? "✅" : status === "false" ? "" : "...";

      const onSubmit = async (data) => {
        await handleDocumentUpload(
          data.file,
          setStatus,
          row.original.companyName,
          "PURCHASE",
          row.original.CompanyId,
          data
        );
        setIsDialogOpen(false);
      };

      return (
        <div className="text-center font-medium">
          {status === "true" ? (
            <Button variant="outline" onClick={() => handleDocumentUpdateOrDelete(row.original.CompanyId, documentId)}>
              {icon} View Upload
            </Button>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  {icon} {status === "false" ? "Upload" : "View Upload"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                              onChange={(e) => field.onChange(e.target.files[0])}
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
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "uploadDate",
    header: "Upload Date",
    cell: ({ row }) => <div>{row.getValue("uploadDate")}</div>,
  },
  {
    accessorKey: "supplierWefDate",
    header: "Supplier W.E.F Date",
    cell: ({ row }) => <div>{row.getValue("supplierWefDate")}</div>,
  },
  {
    accessorKey: "supplierUntilDate",
    header: "Supplier Until date",
    cell: ({ row }) => <div>{row.getValue("supplierUntilDate")}</div>,
  },
  {
    accessorKey: "verifyByBCL",
    header: "Start Range Verification",
    cell: ({ row }) => <div>{row.getValue("verifyByBCL") ? "✅" : "❌"}</div>,
  },
  {
    accessorKey: "suppPIN",
    header: "KRA PIN",
    cell: ({ row }) => <div>{row.getValue("suppPIN")}</div>,
  },
  {
    accessorKey: "suppContactName",
    header: "Contact Name",
    cell: ({ row }) => <div>{row.getValue("suppContactName")}</div>,
  },
  {
    accessorKey: "suppContactMobile",
    header: "Contact Mobile",
    cell: ({ row }) => <div>{row.getValue("suppContactMobile")}</div>,
  },
  {
    accessorKey: "suppContactEmail",
    header: "Contact Email",
    cell: ({ row }) => <div>{row.getValue("suppContactEmail")}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} companyId={row.original.CompanyId} />,
  },
];