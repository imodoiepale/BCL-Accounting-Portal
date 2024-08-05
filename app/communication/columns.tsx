import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Pencil } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export type Ticket = {
  id: string
  subject: string
  description: string
  category: string
  priority: string
  date_submitted: string
  time_submitted: string
  status: string
  product_service: string
}

export const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "id",
    header: "Ticket ID",
  },
  {
    accessorKey: "subject",
    header: "Subject",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "priority",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "date_submitted",
    header: "Date Submitted",
  },
  {
    accessorKey: "time_submitted",
    header: "Time Submitted",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "product_service",
    header: "Product/Service",
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const ticket = row.original
      const { onEdit, setEditFormFields, editFormFields } = table.options.meta as { 
        onEdit: (id: string) => void, 
        setEditFormFields: React.Dispatch<React.SetStateAction<Ticket | null>>,
        editFormFields: Ticket | null
      }

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(ticket.id)}>
              Copy ticket ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Ticket</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[450px]">
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="subject">Subject</label>
                        <Input
                          id="subject"
                          value={editFormFields?.subject || ''}
                          onChange={(e) => setEditFormFields(prev => prev ? { ...prev, subject: e.target.value } : null)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="description">Description</label>
                        <Textarea
                          id="description"
                          value={editFormFields?.description || ''}
                          onChange={(e) => setEditFormFields(prev => prev ? { ...prev, description: e.target.value } : null)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="category">Category</label>
                        <Select
                          value={editFormFields?.category}
                          onValueChange={(value) => setEditFormFields(prev => prev ? { ...prev, category: value } : null)}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technical">Technical Support</SelectItem>
                            <SelectItem value="billing">Billing</SelectItem>
                            <SelectItem value="product">Product Inquiry</SelectItem>
                            <SelectItem value="feedback">General Feedback</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="priority">Priority</label>
                        <Select
                          value={editFormFields?.priority}
                          onValueChange={(value) => setEditFormFields(prev => prev ? { ...prev, priority: value } : null)}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="status">Status</label>
                        <Select
                          value={editFormFields?.status}
                          onValueChange={(value) => setEditFormFields(prev => prev ? { ...prev, status: value } : null)}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="product_service">Product/Service</label>
                        <Input
                          id="product_service"
                          value={editFormFields?.product_service || ''}
                          onChange={(e) => setEditFormFields(prev => prev ? { ...prev, product_service: e.target.value } : null)}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                  </ScrollArea>
                  <DialogFooter>
                    <Button onClick={() => onEdit(ticket.id)} className="bg-blue-500 text-white">Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DropdownMenuItem>
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Update status</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]