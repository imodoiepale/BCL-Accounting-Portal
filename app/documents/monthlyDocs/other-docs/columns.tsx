//@ts-nocheck

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

export type OtherDocument = {
  id: string
  documentName: string
  documentType: string
  uploadDate: string
  uploadedBy: string
  fileSize: string
  status: "Approved" | "Pending" | "Rejected"
}

export const columns: ColumnDef<OtherDocument>[] = [
  {
    accessorKey: "documentName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Document Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "documentType",
    header: "Document Type",
  },
  {
    accessorKey: "uploadDate",
    header: "Upload Date",
  },
  {
    accessorKey: "uploadedBy",
    header: "Uploaded By",
  },
  {
    accessorKey: "fileSize",
    header: "File Size",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className={`font-medium ${
          status === "Approved" ? "text-green-600" :
          status === "Rejected" ? "text-red-600" :
          "text-yellow-600"
        }`}>
          {status}
        </div>
      )
    },
  },

 
  {
    id: "actions",
    cell: ({ row }) => {
      const document = row.original
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
              onClick={() => navigator.clipboard.writeText(document.id)}
            >
              Copy document ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View document</DropdownMenuItem>
            <DropdownMenuItem>Download document</DropdownMenuItem>
            <DropdownMenuItem>Change status</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
