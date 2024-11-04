// @ts-nocheck
"use client";
// EntriesTab.tsx
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCwIcon, Search, FilterIcon, Download, RotateCcw, Loader2, Eye, Check } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { format } from 'date-fns';
import { PettyCashService } from './PettyCashService';
import { TableActions } from './TableActions';
import { CategoryFilter } from './CategoryFilter';
import { EXPENSE_CATEGORIES, getCategoryName, getSubcategoryName } from './expenseCategories';
import EditEntryForm from './EntryForm';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import PettyCashEntryForm from './EntryForm';


const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0
  }).format(amount);
};

interface PettyCashEntry {
  id: string;
  amount: number;
  invoice_number: string;
  invoice_date: string;
  description: string;
  category_code: string;
  subcategory_code: string;
  payment_type: string;
  checked_by: string;
  approved_by: string;
  branch_name: string;
  user_name: string;
  account_type: string;
  receipt_url: string | null;
  is_verified: boolean;
  created_at: string;
  supplier_name: string;
  supplier_pin: string;
  purchase_type: string;
  paid_via: string;
  petty_cash_account: string;
  bill_upload_url: string;
  payment_proof_url: string;
}

interface ExpenseCategory {
  category_code: string;
  expense_category: string;
  subcategories: {
    subcategory_code: string;
    expense_subcategory: string;
  }[];
}

interface EntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entry: PettyCashEntry | null;
  onSave: (entry: PettyCashEntry) => Promise<void>;
  mode: 'create' | 'edit';
  userId: string;
  fetchEntries: () => Promise<void>;
}

const formFields = [
  { name: 'invoice_date', label: 'Invoice Date', type: 'date', required: true },
  { name: 'branch_id', label: 'Branch', type: 'select', required: true },
  { name: 'user_id', label: 'User', type: 'select', required: true },
  { name: 'account_type', label: 'Account Type', type: 'select', required: true },
  { name: 'petty_cash_account', label: 'Petty Cash Account', type: 'text', required: true },
  { name: 'supplier_name', label: 'Supplier Name', type: 'text', required: true },
  { name: 'supplier_pin', label: 'Supplier PIN/ID', type: 'text', required: true },
  {
    name: 'purchase_type', label: 'Trading Type', type: 'select', required: true,
    options: [
      { value: 'goods', label: 'Goods' },
      { value: 'services', label: 'Services' },
      { value: 'assets', label: 'Assets' }
    ]
  },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'description', label: 'Description', type: 'text', required: true },
  { name: 'paid_via', label: 'Paid Via/By', type: 'text', required: true },
  { name: 'checked_by', label: 'Checked By', type: 'text' },
  { name: 'approved_by', label: 'Approved By', type: 'text' },
  { name: 'receipt_url', label: 'Bill/PCV Upload', type: 'file', accept: 'image/*' },
  { name: 'payment_proof_url', label: 'Payment Proof', type: 'file', accept: 'image/*' }
];



const EntryDialog: React.FC<EntryDialogProps> = ({
  isOpen,
  onClose,
  entry,
  onSave,
  mode,
  userId,
  fetchEntries
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Entry' : 'Edit Entry'}
          </DialogTitle>
        </DialogHeader>
        <PettyCashEntryForm
          mode={mode}
          initialData={entry}
          onSubmit={async (data) => {
            await onSave(data);
          }}
          onClose={onClose}
          userId={userId}
          onSuccess={fetchEntries} // Pass the fetchEntries function
        />
      </DialogContent>
    </Dialog>
  );
};



export function TransactionsTab() {
  const { userId } = useAuth();
  const [entries, setEntries] = useState<PettyCashEntry[]>([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSubcategory, setSelectedSubcategory] = useState('ALL');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [newPettyCash, setNewPettyCash] = useState<NewPettyCashEntry>({
    invoice_date: '',
    branch_id: '',
    user_id: '',
    account_type: '',
    category_code: '',
    subcategory_code: '',
    amount: '',
    description: '',
    checked_by: '',
    approved_by: '',
    receipt_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const [paymentProofPreview, setPaymentProofPreview] = useState<{
    isOpen: boolean;
    url: string | null;
  }>({
    isOpen: false,
    url: null
  });

  const [suppliers, setSuppliers] = useState([]);
  const [openSupplier, setOpenSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPettyCash(prev => ({
      ...prev,
      [name]: value
    }));
  };



  const [receiptPreview, setReceiptPreview] = useState<{
    isOpen: boolean;
    url: string | null;
  }>({
    isOpen: false,
    url: null
  });

  const handleViewReceipt = (entry: PettyCashEntry) => {
    if (entry.receipt_url) {
      setReceiptPreview({
        isOpen: true,
        url: entry.receipt_url
      });
    }
  };

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    entry: PettyCashEntry | null;
  }>({
    isOpen: false,
    mode: 'create',
    entry: null
  });

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const data = await PettyCashService.fetchRecords('acc_portal_pettycash_entries', userId);
      setEntries(data);
    } catch (error) {
     // toast.error('Failed to fetch entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    const fetchSuppliers = async () => {
      const suppliersData = await PettyCashService.fetchRecords('acc_portal_pettycash_suppliers', userId);
      setSuppliers(suppliersData);
    };
    fetchSuppliers();
  }, [userId]);

  const handleCreateEntry = () => {
    setDialogState({
      isOpen: true,
      mode: 'create',
      entry: null
    });
  };

  const handleEditEntry = (entry: PettyCashEntry) => {
    setDialogState({
      isOpen: true,
      mode: 'edit',
      entry
    });
  };

  const handleSaveEntry = async (entry: PettyCashEntry) => {
    try {
      if (dialogState.mode === 'create') {
        await PettyCashService.createRecord('acc_portal_pettycash_entries', entry, userId);
       // toast.success('Entry created successfully');
      } else {
        await PettyCashService.updateRecord('acc_portal_pettycash_entries', entry.id, entry);
       // toast.success('Entry updated successfully');
      }
      fetchEntries();
    } catch (error) {
     // toast.error('Failed to save entry');
    }
  };

  const handleDeleteEntry = async (entry: PettyCashEntry) => {
    try {
      await PettyCashService.deleteRecord('acc_portal_pettycash_entries', entry.id);
     // toast.success('Entry deleted successfully');
      fetchEntries();
    } catch (error) {
     // toast.error('Failed to delete entry');
    }
  };

  const handleVerifyEntry = async (entry: PettyCashEntry) => {
    try {
      await PettyCashService.verifyRecord('acc_portal_pettycash_entries', entry.id);
     // toast.success('Entry verified successfully');
      fetchEntries();
    } catch (error) {
     // toast.error('Failed to verify entry');
    }
  };

  const handleEditSubmit = async (updatedEntry: PettyCashEntry) => {
    try {
      await PettyCashService.updateRecord('acc_portal_pettycash_entries', updatedEntry.id, {
        ...updatedEntry,
        category_code: updatedEntry.category_code === 'ALL' ? '' : updatedEntry.category_code,
        subcategory_code: updatedEntry.subcategory_code === 'ALL' ? '' : updatedEntry.subcategory_code
      });
     // toast.success('Entry updated successfully');
      fetchEntries();
    } catch (error) {
     // toast.error('Failed to update entry');
      console.error('Error updating entry:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPettyCash(prev => ({
        ...prev,
        receipt_url: file
      }));
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await PettyCashService.fetchExpenseCategories();
        setExpenseCategories(categories);
      } catch (error) {
        console.error('Error fetching expense categories:', error);
       // toast.error('Failed to load expense categories');
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    try {
      // If it's a new supplier, create supplier record first
      if (isNewSupplier) {
        const supplierData = {
          supplierName: newPettyCash.supplier_name,
          pin: newPettyCash.supplier_pin,
          // Add other required supplier fields
          supplierType: 'Individual',
          mobile: '',  // You might want to add these fields to your form
          email: '',   // You might want to add these fields to your form
        };

        await PettyCashService.createRecord('acc_portal_pettycash_suppliers', supplierData, userId);
      }

      let receiptUrl = null;
      let paymentProofUrl = null;

      // Handle receipt upload
      if (newPettyCash.receipt_url instanceof File) {
        const uploadPath = `receipts/${Date.now()}_${newPettyCash.receipt_url.name}`;
        receiptUrl = await PettyCashService.uploadReceipt(newPettyCash.receipt_url, uploadPath);
      }

      // Handle payment proof upload
      if (newPettyCash.payment_proof_url instanceof File) {
        const uploadPath = `payment_proofs/${Date.now()}_${newPettyCash.payment_proof_url.name}`;
        paymentProofUrl = await PettyCashService.uploadReceipt(newPettyCash.payment_proof_url, uploadPath);
      }

      const entryData = {
        ...newPettyCash,
        receipt_url: receiptUrl,
        payment_proof_url: paymentProofUrl,
        userid: userId
      };

      await PettyCashService.createRecord('acc_portal_pettycash_entries', entryData, userId);
     // toast.success('Entry created successfully');
      setIsSheetOpen(false);
      resetForm();
      fetchEntries();
    } catch (error) {
      console.error('Error creating entry:', error);
     // toast.error('Failed to create entry');
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || entry.category_code === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'ALL' || entry.subcategory_code === selectedSubcategory;

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const columnDefinitions = [
    {
      header: '#',
      width: '40px',
      cell: (_: any, index: number) => <div className="font-bold text-center">{index + 1}</div>
    },
    {
      header: 'Date',
      width: '100px',
      cell: (entry: PettyCashEntry) => format(new Date(entry.invoice_date), 'dd/MM/yyyy')
    },
    // {
    //   header: 'Branch',
    //   width: '40px',
    //   cell: (entry: PettyCashEntry) => <div className="text-center">{entry.branch_name || '-'}</div>
    // },
    {
      header: <div className="">User</div>,
      width: '150px',
      cell: (entry: PettyCashEntry) => <div className="text-nowrap ">{entry.user_name || '-'}</div>
    },
    {
      header: <div className="text-center">Account Type</div>,
      width: '120px',
      cell: (entry: PettyCashEntry) => (
        <div className="capitalize text-center">
          {entry.account_type?.replace('_', ' ') || '-'}
        </div>
      )
    },
    {
      header: <div className="text-center">Account No.</div>,
      width: '120px',
      cell: (entry: PettyCashEntry) => entry.petty_cash_account || '-'
    },
    {
      header: 'Supplier Name',
      width: '150px',
      cell: (entry: PettyCashEntry) => entry.supplier_name || '-'
    },
    {
      header: 'Supplier PIN/ID',
      width: '120px',
      cell: (entry: PettyCashEntry) => entry.supplier_pin || '-'
    },
    {
      header: 'Purchase Type',
      width: '120px',
      cell: (entry: PettyCashEntry) => (
        <div className="capitalize">
          {entry.purchase_type ? entry.purchase_type.charAt(0).toUpperCase() + entry.purchase_type.slice(1) : '-'}
        </div>
      )
    },
    {
      header: 'Category',
      width: '150px',
      cell: (entry) => entry.expense_category || '-'
    },
    {
      header: 'Subcategory',
      width: '150px',
      cell: (entry) => entry.subcategory || '-'
    },
    {
      header: 'Amount',
      width: '120px',
      cell: (entry: PettyCashEntry) => formatCurrency(entry.amount)
    },


    {
      header: 'Description',
      width: '50px',
      cell: (entry: PettyCashEntry) => {

        return (
          <div
            className={`transition-all duration-300 cursor-pointer relative ${isExpanded ? 'w-[300px]' : 'w-[200px]'}`}
            onClick={() => setIsExpanded(!isExpanded)}
            title={entry.description}
          >
            <span className={`block  ${isExpanded ? 'max-w-[300px]' : 'max-w-[200px]'}`}>
              {entry.description.split(/[\s,]+/).slice(0, 7).join(' ')}
              {/* {entry.description.split(/[\s,]+/).length > 7? '...' : ''} */}
            </span>
          </div>
        );
      }
    },

    // {
    //   header: <div className="text-center"> Paid Via/By</div>,
    //   width: '120px',
    //   cell: (entry: PettyCashEntry) => entry.checked_by || '-'
    // },
    // {
    //   header: <div className="text-center"> Approved By</div>,
    //   width: '120px',
    //   cell: (entry: PettyCashEntry) => entry.approved_by || '-'
    // },

    {
      header: 'Paid Via/By',
      width: '120px',
      cell: (entry: PettyCashEntry) => entry.checked_by || '-'
    },
    {
      header: 'Payment Proof',
      width: '100px',
      cell: (entry: PettyCashEntry) => entry.payment_proof_url ? (
        <Button
          className="h-6 px-1.5 text-[11px] bg-blue-500 flex text-white items-center gap-0.5"
          onClick={() => handleViewPaymentProof(entry)}
        >
          <Eye size={12} /> View
        </Button>) : <div className="flex justify-center"><span className="text-red-500 font-bold text-center">Missing</span></div>
    }, {
      header: 'Bill/PCV Upload',
      width: '100px',
      cell: (entry: PettyCashEntry) => entry.receipt_url ? (
        <Button
          className="h-6 px-1.5 text-[11px] bg-blue-500 flex text-white items-center gap-0.5"
          onClick={() => handleViewReceipt(entry)}
        >
          <Eye size={12} /> View
        </Button>) : <div className="flex justify-center"><span className="text-red-500 font-bold text-center">Missing</span></div>
    },
    {
      header: 'Status',
      width: '100px',
      cell: (entry: PettyCashEntry) => (
        <span className={`px-2 py-1 rounded-full text-xs ${entry.approved_by ? 'bg-green-100 text-green-800' :
          entry.checked_by ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
          {entry.approved_by ? 'Approved' :
            entry.checked_by ? 'Checked' :
              'Pending'}
        </span>
      )
    },
    {
      header: 'Actions',
      width: '100px',
      cell: (entry: PettyCashEntry) => (
        <TableActions
          row={entry}
          onEdit={() => handleEditEntry(entry)}
          onDelete={() => handleDeleteEntry(entry)}
          onVerify={() => handleVerifyEntry(entry)}
          isVerified={Boolean(entry.approved_by)}
          editForm={EditEntryForm}
          editFormProps={{
            branches,
            users
          }}
        />
      )
    }
  ];
  const EditForm = ({ entry, onClose, onSubmit }) => {
    const [editedEntry, setEditedEntry] = useState(entry);
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>("ALL");

    const handleSubmit = async (e) => {
      e.preventDefault();
      await onSubmit(editedEntry);
      onClose();
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (KES)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            value={editedEntry.amount}
            onChange={(e) => setEditedEntry({ ...editedEntry, amount: parseFloat(e.target.value) })}
            className="h-8"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invoice_date">Invoice Date</Label>
          <Input
            id="invoice_date"
            name="invoice_date"
            type="date"
            value={editedEntry.invoice_date}
            onChange={(e) => setEditedEntry({ ...editedEntry, invoice_date: e.target.value })}
            className="h-8"
            required
          />
        </div>

        <CategoryFilter
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          onCategoryChange={setSelectedCategory}
          onSubcategoryChange={setSelectedSubcategory}
        />

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            value={editedEntry.description}
            onChange={(e) => setEditedEntry({ ...editedEntry, description: e.target.value })}
            className="h-8"
            required
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-8"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-8 bg-blue-600 text-white"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const handleViewPaymentProof = (entry: PettyCashEntry) => {
    if (entry.payment_proof_url) {
      setPaymentProofPreview({
        isOpen: true,
        url: entry.payment_proof_url
      });
    }
  };

  const SupplierSelection = () => (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Select Supplier Type</Label>
        <Select
          onValueChange={(value) => {
            setIsNewSupplier(value === 'new');
            setSelectedSupplier(null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose supplier type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="existing">Existing Supplier</SelectItem>
            <SelectItem value="new">New Supplier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!isNewSupplier ? (
        <div className="space-y-2">
          <Label>Search Existing Supplier</Label>
          <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openSupplier}
                className="w-full justify-between"
              >
                {selectedSupplier ? selectedSupplier.supplierName : "Select supplier..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="Search suppliers..." />
                <CommandEmpty>No supplier found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-72">
                    {suppliers.map((supplier) => (
                      <CommandItem
                        key={supplier.id}
                        onSelect={() => {
                          setSelectedSupplier(supplier);
                          setOpenSupplier(false);
                          // Update form data with supplier details
                          setNewPettyCash(prev => ({
                            ...prev,
                            supplier_name: supplier.supplierName,
                            supplier_pin: supplier.pin
                          }));
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedSupplier?.id === supplier.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {supplier.supplierName}
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        // New supplier form fields
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Supplier Name</Label>
            <Input
              value={newPettyCash.supplier_name}
              onChange={(e) => handleInputChange('supplier_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Supplier PIN</Label>
            <Input
              value={newPettyCash.supplier_pin}
              onChange={(e) => handleInputChange('supplier_pin', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );

  const PaymentProofPreviewDialog = () => (
    <Dialog
      open={paymentProofPreview.isOpen}
      onOpenChange={(open) => setPaymentProofPreview(prev => ({ ...prev, isOpen: open }))}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Payment Proof Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentProofPreview(prev => ({
                ...prev,
                rotation: ((prev.rotation || 0) + 90) % 360
              }))}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Rotate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch(
                    `https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${paymentProofPreview.url}`
                  );
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `payment-proof-${paymentProofPreview.url}`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error('Download failed:', error);
                }
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </DialogHeader>
        {paymentProofPreview.url && (
          <div className="relative w-full h-[calc(90vh-100px)] bg-gray-50 group">
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
            <Image
              src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${paymentProofPreview.url}`}
              alt="Payment Proof"
              fill
              className="transition-transform duration-300 ease-in-out hover:scale-150 cursor-zoom-in"
              style={{
                objectFit: 'contain',
                transform: `rotate(${paymentProofPreview.rotation || 0}deg)`,
                transition: 'transform 0.3s ease-in-out'
              }}
              priority
              onLoadingComplete={(image) => {
                image.classList.remove('opacity-0');
                image.classList.add('opacity-100');
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 w-64"
              />
            </div>
            <CategoryFilter
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              onCategoryChange={setSelectedCategory}
              onSubcategoryChange={setSelectedSubcategory}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEntries}
              className="h-8"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleCreateEntry}
              className="h-8 bg-blue-600 text-white"
            >
              Add New Entry
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <ScrollArea className="h-[calc(100vh-370px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-blue-800 z-10">
                <TableRow className="bg-blue-600 hover:bg-blue-600">
                  {columnDefinitions.map((col, index) => (
                    <TableHead
                      key={index}
                      style={{ width: col.width }}
                      className="text-white h-8 text-xs font-medium border-r border-blue-500 last:border-r-0"
                    >
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnDefinitions.length}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCwIcon className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                        <span className="text-sm text-gray-500">Loading entries...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnDefinitions.length}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="rounded-full bg-gray-100 p-3 mb-2">
                          <Search className="h-6 w-6 text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">No Entries Found</span>
                        <p className="text-sm text-gray-500 mt-1">
                          {searchQuery
                            ? 'No entries match your search criteria'
                            : 'Get started by adding your first entry'}
                        </p>
                        {!searchQuery && (
                          <Button
                            onClick={handleCreateEntry}
                            className="mt-3 bg-blue-600 text-white"
                          >
                            Add New Entry
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className="hover:bg-blue-50 border-b border-gray-100 transition-colors [&>td]:h-8"
                    >
                      {columnDefinitions.map((col, colIndex) => (
                        <TableCell
                          key={`${entry.id}-${colIndex}`}
                          style={{ width: col.width }}
                          className="py-1 px-2 text-xs border-r border-gray-100 last:border-r-0"
                        >
                          {col.cell(entry, index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        {/* Receipt Preview Dialog */}
        <Dialog
          open={receiptPreview.isOpen}
          onOpenChange={(open) => setReceiptPreview(prev => ({ ...prev, isOpen: open }))}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>Receipt Preview</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReceiptPreview(prev => ({ ...prev, rotation: ((prev.rotation || 0) + 90) % 360 }))}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Rotate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch(`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${receiptPreview.url}`)
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = `receipt-${receiptPreview.url}`
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      window.URL.revokeObjectURL(url)
                    } catch (error) {
                      console.error('Download failed:', error)
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </DialogHeader>
            {receiptPreview.url && (
              <div className="relative w-full h-[calc(90vh-100px)] bg-gray-50 group">
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
                <Image
                  src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${receiptPreview.url}`}
                  alt="Receipt"
                  fill
                  className="transition-transform duration-300 ease-in-out hover:scale-150 cursor-zoom-in"
                  style={{
                    objectFit: 'contain',
                    transform: `rotate(${receiptPreview.rotation || 0}deg)`,
                    transition: 'transform 0.3s ease-in-out'
                  }}
                  priority
                  onLoadingComplete={(image) => {
                    image.classList.remove('opacity-0')
                    image.classList.add('opacity-100')
                  }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
        <PaymentProofPreviewDialog />

        {/* Update the EntryDialog SheetContent to be wider */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add New Entry</SheetTitle>
              <SheetDescription>
                Add a new petty cash entry with all details.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col pt-4 gap-4">
              {formFields.map(({ id, label, type, placeholder, options, required, accept }) => (
                <div key={id} className="space-y-1.5">
                  <Label htmlFor={id}>{label}</Label>
                  {type === 'select' ? (
                    <Select
                      value={newPettyCash[id]}
                      onValueChange={(value) => setNewPettyCash(prev => ({ ...prev, [id]: value }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : type === 'file' ? (
                    <div className="space-y-2">
                      <Input
                        id={id}
                        type={type}
                        accept={accept}
                        onChange={(e) => setNewPettyCash(prev => ({
                          ...prev,
                          [id]: e.target.files?.[0] || null
                        }))}
                        className="h-9"
                      />
                      {newPettyCash.receipt_url && (
                        <div className="relative h-[200px] bg-gray-50 rounded-md overflow-hidden">
                          <Image
                            src={URL.createObjectURL(newPettyCash.receipt_url)}
                            alt="Receipt preview"
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input
                      id={id}
                      type={type}
                      value={newPettyCash[id]}
                      onChange={(e) => setNewPettyCash(prev => ({
                        ...prev,
                        [id]: e.target.value
                      }))}
                      placeholder={placeholder}
                      required={required}
                      className="h-9"
                    />
                  )}
                </div>
              ))}

              <div className="pt-4">
                <Button
                  className="w-full h-9 bg-blue-600 text-white"
                  onClick={handleSubmit}
                >
                  Submit Entry
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Entry Form Dialog */}
        <EntryDialog
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState({ isOpen: false, mode: 'create', entry: null })}
          entry={dialogState.entry}
          onSave={handleSaveEntry}
          mode={dialogState.mode}
          userId={userId}
          fetchEntries={fetchEntries}
        />
      </main>
    </div>
  );
}

// Receipt Preview Component
const ReceiptPreview: React.FC<{ url: string }> = ({ url }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="link"
        className="h-8 px-2 text-xs"
        onClick={() => setIsOpen(true)}
      >
        Receipt
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[calc(90vh-100px)] overflow-hidden">
            <Image
              src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${url}`}
              alt="Receipt"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Utility function for amount input formatting
const formatAmountInput = (value: string): string => {
  // Remove all non-digit characters except decimal point
  const cleanedValue = value.replace(/[^\d.]/g, '');

  // Ensure only one decimal point
  const parts = cleanedValue.split('.');
  if (parts.length > 2) {
    parts.splice(2);
  }

  // Limit decimal places to 2
  if (parts[1]) {
    parts[1] = parts[1].slice(0, 2);
  }

  // Add commas for thousands
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return parts.join('.');
};

// Amount Input Component
const AmountInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  className?: string;
}> = ({ value, onChange, className }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatAmountInput(e.target.value);
    onChange(formattedValue);
  };

  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
        KSh
      </span>
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        className={`pl-12 ${className}`}
        placeholder="0.00"
      />
    </div>
  );
};


export default TransactionsTab;