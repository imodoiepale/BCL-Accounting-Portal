//@ts-nocheck
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Upload, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type BankStatement = {
  id: string;
  accountNumber: string;
  bankName: string;
  statementDate: string;
  balance: number;
  currency: string;
  uploadStatus: "Uploaded" | "Pending" | "Failed";
  bankStatus: "Active" | "Inactive";
  startDate: string;
  bclVerification: boolean;
  uploadDate: string;
  periodFrom: string;
  periodTo: string;
  startRangeVerification: boolean;
  closingBalance: number;
  closingBalanceVerified: boolean;
};

const UploadDialog = ({ onSubmit }) => {
  const { register, handleSubmit } = useForm();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Statement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="periodFrom">Period From (SWEF Date)</Label>
            <Input type="date" id="periodFrom" {...register("periodFrom")} />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="periodTo">Period To</Label>
            <Input type="date" id="periodTo" {...register("periodTo")} />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="closingBalance">Closing Balance</Label>
            <Input type="number" id="closingBalance" {...register("closingBalance")} />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="file">Upload File</Label>
            <Input type="file" id="file" {...register("file")} />
          </div>
          <Button type="submit">Submit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const columns: ColumnDef<BankStatement>[] = [
  {
    accessorKey: "accountNumber",
    header: "Account Number",
  },
  {
    accessorKey: "bankName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Bank Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "statementDate",
    header: "Statement Date",
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("balance"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: row.original.currency,
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "uploadStatus",
    header: "Upload Status",
    cell: ({ row }) => {
      const status = row.getValue("uploadStatus") as string;
      return (
        <div
          className={`font-medium ${
            status === "Uploaded"
              ? "text-green-600"
              : status === "Failed"
              ? "text-red-600"
              : "text-yellow-600"
          }`}
        >
          {status}
        </div>
      );
    },
  },
  {
    accessorKey: "bankStatus",
    header: "Bank Status",
    cell: ({ row }) => {
      const status = row.getValue("bankStatus") as string;
      return (
        <div
          className={`font-medium ${
            status === "Active" ? "text-green-600" : "text-red-600"
          }`}
        >
          {status}
        </div>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
  },
  {
    accessorKey: "bclVerification",
    header: "BCL Verification",
    cell: ({ row }) => {
      const verified = row.getValue("bclVerification") as boolean;
      return <Checkbox checked={verified} disabled />;
    },
  },
  {
    id: "upload",
    header: "Upload",
    cell: ({ row }) => {
      const onSubmit = (data) => {
        console.log(data);
        // Handle file upload logic here
      };
      return <UploadDialog onSubmit={onSubmit} />;
    },
  },
  {
    accessorKey: "uploadDate",
    header: "Upload Date",
  },
  {
    accessorKey: "periodFrom",
    header: "Period From (SWEF Date)",
  },
  {
    accessorKey: "periodTo",
    header: "Period To",
  },
  {
    accessorKey: "startRangeVerification",
    header: "Start Range Verification",
    cell: ({ row }) => {
      const verified = row.getValue("startRangeVerification") as boolean;
      return <Checkbox checked={verified} disabled />;
    },
  },
  {
    accessorKey: "closingBalance",
    header: "Closing Balance",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("closingBalance"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: row.original.currency,
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "closingBalanceVerified",
    header: "Closing Balance Verified",
    cell: ({ row }) => {
      const verified = row.getValue("closingBalanceVerified") as boolean;
      return <Checkbox checked={verified} disabled />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const bankStatement = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(bankStatement.id)}
            >
              Copy statement ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Download statement</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];