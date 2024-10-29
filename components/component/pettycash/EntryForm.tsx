// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { EXPENSE_CATEGORIES } from './expenseCategories';
import { Check, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PettyCashService } from './PettyCashService';
import { cn } from "@/lib/utils";
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface PettyCashEntry {
  id?: string;
  invoice_date: string;
  user_name: string;
  account_type: string;
  petty_cash_account: string;
  supplier_name: string;
  supplier_pin: string;
  purchase_type: string;
  category_code: string;
  category: string; // Added for full category name
  subcategory_code: string;
  subcategory: string; // Added for full subcategory name
  amount: number | string;
  description: string;
  paid_via: string;
  checked_by: string;
  approved_by: string;
  receipt_url: File | string | null;
  payment_proof_url: File | string | null;
  created_at: string;
  is_verified: boolean;
  branch_name?: string;
}

interface SupplierData {
  pin: string | null;
  email: string;
  mobile: string;
  idNumber: string;
  tradingType: string;
  supplierName: string;
  supplierType: "Individual" | "Corporate";
}

interface SupplierRecord {
  id: string;
  userid: string;
  data: SupplierData;
  created_at: string;
  updated_at: string;
}

interface PettyCashEntryFormProps {
  mode: 'create' | 'edit';
  initialData: PettyCashEntry | null;
  onSubmit: (entry: PettyCashEntry) => Promise<void>;
  onClose: () => void;
  userId: string;
}

const PettyCashEntryForm: React.FC<PettyCashEntryFormProps> = ({
  mode = 'create',
  initialData = null,
  onSubmit,
  onClose,
  userId,
  onSuccess
}) => {
  // Initial form state
  const initialFormState: PettyCashEntry = {
    invoice_date: '',
    user_name: '',
    account_type: '',
    petty_cash_account: '',
    supplier_name: '',
    supplier_pin: '',
    purchase_type: '',
    category_code: '',
    category: '',
    subcategory_code: '',
    subcategory: '',
    amount: '',
    description: '',
    paid_via: '',
    checked_by: '',
    approved_by: '',
    receipt_url: null,
    payment_proof_url: null,
    created_at: new Date().toISOString(),
    is_verified: false,
    branch_name: ''
  };

  // State management
  const [formData, setFormData] = useState<PettyCashEntry>(initialData || initialFormState);
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [openSupplier, setOpenSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [supplierOptions, setSupplierOptions] = useState<Array<{ value: string; label: string; data: any }>>([]);

  const [users, setUsers] = useState<Array<{ name: string; id: string }>>([]);
  const [accounts, setAccounts] = useState<Array<{ account_number: string; user_id: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isReimbursement, setIsReimbursement] = useState(false);
  const [isLoan, setIsLoan] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    mobile: '',
    id: '',
    email: ''
  });
  
  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!userId) return;

      try {
        const data = await PettyCashService.fetchRecords('acc_portal_pettycash_suppliers', userId);
        const validSuppliers = Array.isArray(data) ? data.filter(supplier =>
          supplier?.data?.supplierName && supplier.id
        ) : [];

        setSupplierOptions(validSuppliers);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        toast.error('Failed to fetch suppliers');
      }
    };
    fetchSuppliers();
  }, [userId]);


  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        category: EXPENSE_CATEGORIES[initialData.category_code]?.name || '',
        subcategory: EXPENSE_CATEGORIES[initialData.category_code]?.subcategories.find(
          sub => sub.code === initialData.subcategory_code
        )?.name || ''
      });

      const matchingSupplier = suppliers.find(s => s.data.supplierName === initialData.supplier_name);
      if (matchingSupplier) {
        setSelectedSupplier(matchingSupplier);
        setIsNewSupplier(false);
      }
    }
  }, [initialData, suppliers]);

  // Form field definitions
  const formFields = [
    // Basic Information
    [
      {
        id: 'invoice_date',
        label: 'Invoice Date',
        type: 'date',
        required: true,
        colSpan: 1
      },
      {
        id: 'user_name',
        label: 'User',
        type: 'text',
        required: true,
        colSpan: 1
      }
    ],
    // Account Information
    [
      {
        id: 'account_type',
        label: 'Account Type',
        type: 'select',
        options: [
          { value: 'Corporate', label: 'Corporate' },
          { value: 'Personal', label: 'Personal' }
        ],
        required: true,
        colSpan: 1
      },
      {
        id: 'petty_cash_account',
        label: 'Account Number',
        type: 'text',
        required: true,
        colSpan: 1
      }
    ],
    // Purchase Information
    [
      {
        id: 'purchase_type',
        label: 'Purchase Type',
        type: 'select',
        options: [
          { value: 'goods', label: 'Goods' },
          { value: 'services', label: 'Services' },
          { value: 'assets', label: 'Assets' }
        ],
        required: true,
        colSpan: 1
      },
      {
        id: 'amount',
        label: 'Amount (KES)',
        type: 'number',
        required: true,
        colSpan: 1
      }
    ],
    // Categories
    [
      {
        id: 'category_code',
        label: 'Category',
        type: 'select',
        options: Object.entries(EXPENSE_CATEGORIES).map(([code, cat]) => ({
          value: code,
          label: cat.name
        })),
        required: true,
        colSpan: 1
      },
      {
        id: 'subcategory_code',
        label: 'Subcategory',
        type: 'select',
        options: formData.category_code
          ? EXPENSE_CATEGORIES[formData.category_code]?.subcategories.map(sub => ({
            value: sub.code,
            label: sub.name
          }))
          : [],
        required: true,
        colSpan: 1
      }
    ],
    // Description and Payment
    [
      {
        id: 'description',
        label: 'Description',
        type: 'text',
        required: true,
        colSpan: 1
      },
      {
        id: 'paid_via',
        label: 'Paid Via/By',
        type: 'text',
        required: true,
        colSpan: 1
      }
    ],
    // Approval Information
    [
      {
        id: 'checked_by',
        label: 'Checked By',
        type: 'text',
        colSpan: 1
      },
      {
        id: 'approved_by',
        label: 'Approved By',
        type: 'text',
        colSpan: 1
      }
    ],
    // File Uploads
    [
      {
        id: 'receipt_url',
        label: 'Bill/PCV Upload',
        type: 'file',
        accept: 'image/*,.pdf',
        colSpan: 1
      },
      {
        id: 'payment_proof_url',
        label: 'Payment Proof',
        type: 'file',
        accept: 'image/*,.pdf',
        colSpan: 1
      }
    ]
  ];

  // Event Handlers
  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [fieldId]: value };

      // Handle category changes
      if (fieldId === 'category_code') {
        const category = EXPENSE_CATEGORIES[value];
        newData.category = category?.name || '';
        newData.subcategory_code = '';
        newData.subcategory = '';
      }

      // Handle subcategory changes
      if (fieldId === 'subcategory_code' && prev.category_code) {
        const subcategory = EXPENSE_CATEGORIES[prev.category_code]?.subcategories
          .find(sub => sub.code === value);
        newData.subcategory = subcategory?.name || '';
      }

      return newData;
    });

    // Handle file previews
    if (fieldId === 'receipt_url' && value instanceof File) {
      const url = URL.createObjectURL(value);
      setReceiptPreview(url);
    }
    if (fieldId === 'payment_proof_url' && value instanceof File) {
      const url = URL.createObjectURL(value);
      setPaymentProofPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalData = { ...formData };
      const uploadPromises = [];
      let receiptUrl = null;
      let paymentProofUrl = null;

      // Prepare file uploads
      if (formData.receipt_url instanceof File) {
        const uploadPath = `receipts/${Date.now()}_${formData.receipt_url.name}`;
        uploadPromises.push(
          PettyCashService.uploadReceipt(formData.receipt_url, uploadPath)
            .then(url => { receiptUrl = url; })
        );
      }

      if (formData.payment_proof_url instanceof File) {
        const uploadPath = `payment_proofs/${Date.now()}_${formData.payment_proof_url.name}`;
        uploadPromises.push(
          PettyCashService.uploadReceipt(formData.payment_proof_url, uploadPath)
            .then(url => { paymentProofUrl = url; })
        );
      }

      // Handle new supplier creation if needed
      if (isNewSupplier) {
        const supplierData = {
          supplierName: formData.supplier_name,
          supplierType: 'Individual',
          pin: formData.supplier_pin,
          idNumber: formData.supplier_pin,
          mobile: '',
          email: ''
        };

        uploadPromises.push(
          PettyCashService.createRecord('acc_portal_pettycash_suppliers', {
            data: supplierData,
            userid: userId // Explicitly pass userId
          }, userId)
        );
      }

      // Wait for all uploads and supplier creation to complete
      await Promise.all(uploadPromises);

      // Update final data with uploaded URLs
      finalData = {
        ...finalData,
        receipt_url: receiptUrl || finalData.receipt_url,
        payment_proof_url: paymentProofUrl || finalData.payment_proof_url,
        userid: userId // Ensure userid is included
      };

      // Submit the entry
      await onSubmit(finalData);

      // Clean up preview URLs
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
      if (paymentProofPreview) URL.revokeObjectURL(paymentProofPreview);

      toast.success(`Entry ${mode === 'create' ? 'created' : 'updated'} successfully`);

      // Call onSuccess callback if provided
      if (onSuccess) {
        await onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit entry');
    } finally {
      setIsLoading(false);
    }
  };

  // Render Functions
  const renderSupplierSection = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Supplier Type</Label>
        <Select
          value={isNewSupplier ? 'new' : 'existing'}
          onValueChange={(value) => {
            setIsNewSupplier(value === 'new');
            setSelectedSupplier(null);
            setFormData(prev => ({
              ...prev,
              supplier_name: '',
              supplier_pin: ''
            }));
          }}
        >
          <SelectTrigger className="h-8">
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
          <Label>Select Supplier</Label>
          <Select
            value={formData.supplier_name || ''}
            onValueChange={(supplierId) => {
              const selectedSupplier = supplierOptions.find(s => s.id.toString() === supplierId);
              if (selectedSupplier) {
                const { data } = selectedSupplier;
                setFormData(prev => ({
                  ...prev,
                  supplier_name: data.supplierName,
                  // Use idNumber if pin is null
                  supplier_pin: data.pin || data.idNumber || ''
                }));
                setSelectedSupplier(selectedSupplier);
              }
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select supplier..." />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-72">
                {supplierOptions.map((supplier) => (
                  <SelectItem
                    key={supplier.id}
                    value={supplier.id.toString()}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col py-1">
                      <span className="font-medium text-sm">
                        {supplier.data.supplierName}
                      </span>
                      <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-50 px-1.5 py-0.5 rounded">
                            {supplier.data.supplierType}
                          </span>
                          {supplier.data.idNumber && (
                            <span>ID: {supplier.data.idNumber}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{supplier.data.tradingType}</span>
                          <span>•</span>
                          <span>{supplier.data.email}</span>
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>

          {selectedSupplier && (
            <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Contact:</span>
                  <span>{selectedSupplier.data.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span>{selectedSupplier.data.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trading Type:</span>
                  <span>{selectedSupplier.data.tradingType}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Supplier Name<span className="text-red-500">*</span></Label>
            <Input
              value={formData.supplier_name}
              onChange={(e) => handleInputChange('supplier_name', e.target.value)}
              className="h-8"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>ID Number<span className="text-red-500">*</span></Label>
            <Input
              value={formData.supplier_pin}
              onChange={(e) => handleInputChange('supplier_pin', e.target.value)}
              className="h-8"
              required
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderField = (field: any) => {
    switch (field.type) {
      case 'select':
        return (
          <Select
            value={formData[field.id]?.toString()}
            onValueChange={(value) => handleInputChange(field.id, value)}
            disabled={field.disabled}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <Input
              type="file"
              accept={field.accept}
              onChange={(e) => handleInputChange(field.id, e.target.files?.[0])}
              className="h-8"
            />
            {field.id === 'receipt_url' && (formData.receipt_url || receiptPreview) && (
              <div className="relative h-20 bg-gray-50 rounded-md overflow-hidden">
                {formData.receipt_url instanceof File ? (
                  <Image
                    src={receiptPreview!}
                    alt="Receipt preview"
                    fill
                    className="object-contain"
                  />
                ) : formData.receipt_url && (
                  <Image
                    src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${formData.receipt_url}`}
                    alt="Receipt"
                    fill
                    className="object-contain"
                  />
                )}
              </div>
            )}
            {field.id === 'payment_proof_url' && (formData.payment_proof_url || paymentProofPreview) && (
              <div className="relative h-20 bg-gray-50 rounded-md overflow-hidden">
                {formData.payment_proof_url instanceof File ? (
                  <Image
                    src={paymentProofPreview!}
                    alt="Payment proof preview"
                    fill
                    className="object-contain"
                  />
                ) : formData.payment_proof_url && (
                  <Image
                    src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${formData.payment_proof_url}`}
                    alt="Payment proof"
                    fill
                    className="object-contain"
                  />
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            type={field.type}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="h-8"
            required={field.required}
            disabled={field.disabled}
          />
        );
    }
  };

  const renderValidationStatus = () => {
    const requiredFields = formFields
      .flat()
      .filter(field => field.required)
      .map(field => ({
        id: field.id,
        label: field.label,
        valid: Boolean(formData[field.id])
      }));

    const incompleteFields = requiredFields.filter(field => !field.valid);

    if (incompleteFields.length === 0) return null;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mt-4">
        <h4 className="text-sm font-medium text-yellow-800">Required fields missing:</h4>
        <ul className="text-xs text-yellow-700 mt-1 grid grid-cols-2 gap-1">
          {incompleteFields.map(field => (
            <li key={field.id} className="list-disc list-inside">
              {field.label}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-2">
      {/* Supplier Section */}
      {renderSupplierSection()}

      {/* Form Fields */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {formFields.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((field) => (
              <div
                key={field.id}
                className={cn(
                  "space-y-1",
                  field.colSpan === 2 ? "col-span-2" : "col-span-1"
                )}
              >
                <Label className="text-sm">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Validation Status */}
      {renderValidationStatus()}

      {/* Form Actions */}
      <DialogFooter className="gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-8"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-8 bg-blue-600 text-white"
          disabled={isLoading || formFields
            .flat()
            .filter(field => field.required)
            .some(field => !formData[field.id])
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            mode === 'create' ? 'Create Entry' : 'Save Changes'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PettyCashEntryForm;