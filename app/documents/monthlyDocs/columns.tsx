/* eslint-disable react-hooks/rules-of-hooks */
//@ts-nocheck

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableRowActions } from "./data-table-row-actions";
import { useEffect, useState } from "react";
import { handleDocumentUpload, checkFileExists, handleDocumentUpdateOrDelete } from "./utils"


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
  // {
  //   accessorKey: "supplierDetailsByFinance",
  //   header: "Suppliers Details By Finance",
  //   cell: ({ row }) => <div>{row.getValue("supplierDetailsByFinance") ? "Yes" : "No"}</div>,
  // },
  {
    accessorKey: "uploadStatus",
    header: "Upload",
    cell: ({ row }) => {
      const [status, setStatus] = useState('checking'); // Initial state of "checking"
      
      useEffect(() => {
        const fetchData = async () => {
          const fileExists = await checkFileExists(row.original.CompanyId, "PURCHASE");
          setStatus(fileExists ? "true" : "false");
        }
        fetchData();
      }, [row.original.CompanyId]); // Fetch when CompanyId changes
  
      const icon = status === "true" ? "✅" : status === "false" ? "❌" : "...";
  
      return (
        <div className="text-center font-medium">
          {status === "true" ? (
            <Button variant="outline" onClick={() => handleDocumentUpdateOrDelete(row.original.CompanyId, documentId)}>
              {icon} View Upload
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  document.getElementById(`fileInput-${row.original.CompanyId}`).click();
                }}
              >
                {icon} {status === "false" ? "Upload" : "View Upload"}
              </Button>
              <input
                id={`fileInput-${row.original.CompanyId}`}
                type="file"
                style={{ display: "none" }}
                onChange={(e) =>
                  handleDocumentUpload(e, setStatus, row.original.companyName, "PURCHASE", row.original.CompanyId)
                }
              />
            </>
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
