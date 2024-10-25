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
import { RefreshCwIcon, Search, FilterIcon, Download, RotateCcw, Loader2, Eye } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast, Toaster } from 'react-hot-toast';
import Image from 'next/image';
import { format } from 'date-fns';
import { PettyCashService } from './PettyCashService';
import { TableActions } from './TableActions';
import { CategoryFilter } from './CategoryFilter';
import { EXPENSE_CATEGORIES, getCategoryName, getSubcategoryName } from './expenseCategories';
import EditEntryForm from './EditEntryForm';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"


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

interface EntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entry: PettyCashEntry | null;
  onSave: (entry: PettyCashEntry) => Promise<void>;
  mode: 'create' | 'edit';
}

const EntryDialog: React.FC<EntryDialogProps> = ({
  isOpen,
  onClose,
  entry,
  onSave,
  mode
}) => {

  const { userId } = useAuth();
  const [formData, setFormData] = useState<PettyCashEntry | null>(entry);
  const [selectedCategory, setSelectedCategory] = useState(entry?.category_code || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState(entry?.subcategory_code || '');
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const[branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  useEffect(() => {
    setFormData(entry);
    setSelectedCategory(entry?.category_code || '');
    setSelectedSubcategory(entry?.subcategory_code || '');
  }, [entry]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesData, usersData] = await Promise.all([
          PettyCashService.fetchRecords('acc_portal_pettycash_branches', userId),
          PettyCashService.fetchRecords('acc_portal_pettycash_users', userId)
        ]);

        setBranches(branchesData);
        setUsers(usersData);
      } catch (error) {
        toast.error('Failed to fetch data');
      }
    };

    fetchData();
  }, [userId]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      const updatedEntry = {
        ...formData,
        category_code: selectedCategory,
        subcategory_code: selectedSubcategory
      };

      if (fileUpload) {
        // Handle file upload here
        const uploadPath = `receipts/${formData.id}/${fileUpload.name}`;
        const receiptUrl = await PettyCashService.uploadReceipt(fileUpload, uploadPath);
        updatedEntry.receipt_url = receiptUrl;
      }

      await onSave(updatedEntry);
      onClose();
    } catch (error) {
      toast.error('Failed to save entry');
      console.error('Error saving entry:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {mode === 'create' ? 'Add New Entry' : 'Edit Entry'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (KES)</Label>
              <AmountInput
                value={formData?.amount || ''}
                onChange={handleInputChange}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account_type">Account Type</Label>
              <Select
                value={formData?.account_type || ''}
                onValueChange={(value) => handleInputChange({
                  target: { name: 'account_type', value }
                })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Account Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="branch">Branch</Label>
              <Select
                value={formData?.branch_id || ''}
                onValueChange={(value) => handleInputChange({
                  target: { name: 'branch_id', value }
                })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.branch_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user">User</Label>
              <Select
                value={formData?.user_id || ''}
                onValueChange={(value) => handleInputChange({
                  target: { name: 'user_id', value }
                })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <CategoryFilter
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              onCategoryChange={setSelectedCategory}
              onSubcategoryChange={setSelectedSubcategory}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invoice_date">Invoice Date</Label>
              <Input
                type="date"
                value={formData?.invoice_date || ''}
                onChange={handleInputChange}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                value={formData?.description || ''}
                onChange={handleInputChange}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="receipt">Receipt</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFileUpload(e.target.files?.[0] || null)}
                className="h-9"
              />
            </div>
          </div>
        </div>

        {/* Receipt Preview */}
        {formData?.receipt_url && (
          <div className="mt-4">
            <Label>Current Receipt</Label>
            <div className="relative h-[200px] mt-2 bg-gray-50 rounded-lg overflow-hidden">
              <Image
                src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${formData.receipt_url}`}
                alt="Receipt preview"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="bg-blue-600 text-white">
            {mode === 'create' ? 'Create Entry' : 'Save Changes'}
          </Button>
        </DialogFooter>
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

  const formFields = [
    {
      id: 'invoice_date',
      label: 'Invoice Date',
      type: 'date',
      required: true
    },
    {
      id: 'branch_id',
      label: 'Branch',
      type: 'select',
      placeholder: 'Select Branch',
      required: true,
      options: branches.map(branch => ({
        value: branch.id.toString(),
        label: branch.branch_name
      }))
    },
    {
      id: 'user_id',
      label: 'User',
      type: 'select',
      placeholder: 'Select User',
      required: true,
      options: users.map(user => ({
        value: user.id.toString(),
        label: user.name
      }))
    },
    {
      id: 'account_type',
      label: 'Account Type',
      type: 'select',
      placeholder: 'Select Account Type',
      required: true,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'mpesa', label: 'M-Pesa' },
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'debit_card', label: 'Debit Card' }
      ]
    },
    {
      id: 'category_code',
      label: 'Expense Category',
      type: 'select',
      placeholder: 'Select Expense Category',
      required: true,
      options: EXPENSE_CATEGORIES.map(category => ({
        value: category.code,
        label: category.name
      }))
    },
    {
      id: 'amount',
      label: 'Amount',
      type: 'number',
      required: true,
      placeholder: '0.00'
    },
    {
      id: 'description',
      label: 'Description',
      type: 'text',
      required: true,
      placeholder: 'Enter description'
    },
    {
      id: 'checked_by',
      label: 'Checked By',
      type: 'text',
      required: false,
      placeholder: 'Enter name'
    },
    {
      id: 'approved_by',
      label: 'Approved By',
      type: 'text',
      required: false,
      placeholder: 'Enter name'
    },
    {
      id: 'receipt_url',
      label: 'Receipt Image',
      type: 'file',
      accept: 'image/*',
      required: false
    }, {
      name: 'supplier_name',
      label: 'Supplier Name',
      type: 'text',
      required: true
    },
    {
      name: 'supplier_pin',
      label: 'Supplier PIN/ID',
      type: 'text',
      required: true
    },
    {
      name: 'purchase_type',
      label: 'Type of Purchase',
      type: 'select',
      options: [
        { value: 'goods', label: 'Goods' },
        { value: 'services', label: 'Services' },
        { value: 'assets', label: 'Assets' }
      ],
      required: true
    },
    {
      name: 'paid_via',
      label: 'Paid Via/By',
      type: 'text',
      required: true
    },
    {
      name: 'petty_cash_account',
      label: 'Petty Cash Account Number',
      type: 'text',
      required: true
    },
    {
      name: 'bill_upload',
      label: 'Bill/PCV Upload',
      type: 'file',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: true
    },
    {
      name: 'payment_proof',
      label: 'Payment Proof',
      type: 'file',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: true
    }
  ];

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
      toast.error('Failed to fetch entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
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
        toast.success('Entry created successfully');
      } else {
        await PettyCashService.updateRecord('acc_portal_pettycash_entries', entry.id, entry);
        toast.success('Entry updated successfully');
      }
      fetchEntries();
    } catch (error) {
      toast.error('Failed to save entry');
    }
  };

  const handleDeleteEntry = async (entry: PettyCashEntry) => {
    try {
      await PettyCashService.deleteRecord('acc_portal_pettycash_entries', entry.id);
      toast.success('Entry deleted successfully');
      fetchEntries();
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const handleVerifyEntry = async (entry: PettyCashEntry) => {
    try {
      await PettyCashService.verifyRecord('acc_portal_pettycash_entries', entry.id);
      toast.success('Entry verified successfully');
      fetchEntries();
    } catch (error) {
      toast.error('Failed to verify entry');
    }
  };

  const handleEditSubmit = async (updatedEntry: PettyCashEntry) => {
    try {
      await PettyCashService.updateRecord('acc_portal_pettycash_entries', updatedEntry.id, {
        ...updatedEntry,
        category_code: updatedEntry.category_code === 'ALL' ? '' : updatedEntry.category_code,
        subcategory_code: updatedEntry.subcategory_code === 'ALL' ? '' : updatedEntry.subcategory_code
      });
      toast.success('Entry updated successfully');
      fetchEntries();
    } catch (error) {
      toast.error('Failed to update entry');
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

  const handleSubmit = async () => {
    try {
      let receiptUrl = null;
      if (newPettyCash.receipt_url instanceof File) {
        const uploadPath = `receipts/${Date.now()}_${newPettyCash.receipt_url.name}`;
        receiptUrl = await PettyCashService.uploadReceipt(newPettyCash.receipt_url, uploadPath);
      }

      const entryData = {
        ...newPettyCash,
        receipt_url: receiptUrl,
        userid: userId
      };

      await PettyCashService.createRecord('acc_portal_pettycash_entries', entryData, userId);
      toast.success('Entry created successfully');
      setIsSheetOpen(false);
      setNewPettyCash({
        id: '',
        amount: '',
        invoice_number: '',
        invoice_date: '',
        description: '',
        category_code: '',
        subcategory_code: '',
        payment_type: '',
        branch_id: '',
        user_id: '',
        checked_by: '',
        approved_by: '',
        account_type: '',
        receipt_url: null,
        created_at: new Date().toISOString(),
        is_verified: false
      });
      fetchEntries();
    } catch (error) {
      console.error('Error creating entry:', error);
      toast.error('Failed to create entry');
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
      width: '350px',
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
      cell: (entry: PettyCashEntry) => entry.purchase_type || '-'
    },
    
    {
      header: 'Category',
      width: '150px',
      cell: (entry: PettyCashEntry) => getCategoryName(entry.category_code)
    },
    {
      header: 'Subcategory',
      width: '150px',
      cell: (entry: PettyCashEntry) => getSubcategoryName(entry.category_code, entry.subcategory_code)
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
   
    // {
    //   header: 'Bill/PCV',
    //   width: '100px',
    //   cell: (entry: PettyCashEntry) => entry.bill_upload_url ? (
    //     <Button variant="link" onClick={() => handleViewBill(entry)}>View Bill</Button>
    //   ) : '-'
    // },
    {
      header: 'Payment Proof',
      width: '100px',
      cell: (entry: PettyCashEntry) => entry.payment_proof_url ? (
        <Button variant="link" onClick={() => handleViewPaymentProof(entry)}>View Proof</Button>
      ) : '-'
    },
    {
      header: 'Bill/PCV Upload',
      width: '100px',
      cell: (entry: PettyCashEntry) => entry.receipt_url ? (
        <Button
          className="h-6 px-1.5 text-[11px] bg-blue-500 flex text-white items-center gap-0.5"
          onClick={() => handleViewReceipt(entry)}
        >
          <Eye size={12} /> View
        </Button>      ) : <div className="flex justify-center"><span className="text-red-500 font-bold text-center">Missing</span></div>
    },
    {
      header: 'Status',
      width: '100px',
      cell: (entry: PettyCashEntry) => (
        <span className={`px-2 py-1 rounded-full text-xs ${entry.approved_by ? 'bg-green-100 text-green-800' :
          entry.checked_by ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
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
    const [selectedCategory, setSelectedCategory] = useState(entry?.category_code || 'ALL');
    const [selectedSubcategory, setSelectedSubcategory] = useState(entry?.subcategory_code || 'ALL');

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

  return (
    <div className="flex w-full bg-gray-100">
      <Toaster position="top-right" />
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
          <ScrollArea className="h-[calc(100vh-200px)]">
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
                      Loading entries...
                    </TableCell>
                  </TableRow>
                ) : filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnDefinitions.length}
                      className="h-32 text-center"
                    >
                      No entries found
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