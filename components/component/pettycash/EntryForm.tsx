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
  category_name: string; // Added for full category name
  subcategory_code: string;
  subcategory_name: string; // Added for full subcategory name
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
  id: string;
  data: {
    supplierName: string;
    supplierType: 'Corporate' | 'Individual';
    pin: string;
    idNumber: string;
    mobile: string;
    email: string;
  };
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
  userId
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
    category_name: '',
    subcategory_code: '',
    subcategory_name: '',
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

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!userId) {
        console.error('UserId is undefined');
        return;
      }
      try {
        const data = await PettyCashService.fetchRecords('acc_portal_pettycash_suppliers', userId);
        setSuppliers(Array.isArray(data) ? data : []);
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
        category_name: EXPENSE_CATEGORIES[initialData.category_code]?.name || '',
        subcategory_name: EXPENSE_CATEGORIES[initialData.category_code]?.subcategories.find(
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
        newData.category_name = category?.name || '';
        newData.subcategory_code = '';
        newData.subcategory_name = '';
      }

      // Handle subcategory changes
      if (fieldId === 'subcategory_code' && prev.category_code) {
        const subcategory = EXPENSE_CATEGORIES[prev.category_code]?.subcategories
          .find(sub => sub.code === value);
        newData.subcategory_name = subcategory?.name || '';
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

      // Handle file uploads
      if (formData.receipt_url instanceof File) {
        const uploadPath = `receipts/${Date.now()}_${formData.receipt_url.name}`;
        const receiptUrl = await PettyCashService.uploadReceipt(formData.receipt_url, uploadPath);
        finalData.receipt_url = receiptUrl;
      }

      if (formData.payment_proof_url instanceof File) {
        const uploadPath = `payment_proofs/${Date.now()}_${formData.payment_proof_url.name}`;
        const paymentProofUrl = await PettyCashService.uploadReceipt(formData.payment_proof_url, uploadPath);
        finalData.payment_proof_url = paymentProofUrl;
      }

      // Handle new supplier creation
      if (isNewSupplier) {
        const supplierData = {
          supplierName: formData.supplier_name,
          supplierType: 'Individual',
          pin: formData.supplier_pin,
          idNumber: formData.supplier_pin,
          mobile: '',
          email: ''
        };

        await PettyCashService.createRecord('acc_portal_pettycash_suppliers', {
          data: supplierData,
          userid: userId
        }, userId);
      }

      await onSubmit(finalData);

      // Clean up preview URLs
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
      if (paymentProofPreview) URL.revokeObjectURL(paymentProofPreview);

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
          <Label>Search Existing Supplier</Label>
          <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openSupplier}
                className="w-full justify-between h-8"
              >
                {selectedSupplier ? selectedSupplier.data.supplierName : "Select supplier..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput
                  placeholder="Search suppliers..."
                  value={supplierSearchQuery}
                  onValueChange={setSupplierSearchQuery}
                />
                <CommandEmpty>No supplier found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-72">
                    {suppliers
                      .filter(supplier => {
                        const searchLower = supplierSearchQuery.toLowerCase();
                        return (
                          supplier.data.supplierName?.toLowerCase().includes(searchLower) ||
                          supplier.data.pin?.toLowerCase().includes(searchLower) ||
                          supplier.data.idNumber?.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((supplier) => (
                        <CommandItem
                          key={supplier.id}
                          onSelect={() => {
                            setSelectedSupplier(supplier);
                            setOpenSupplier(false);
                            setFormData(prev => ({
                              ...prev,
                              supplier_name: supplier.data.supplierName,
                              supplier_pin: supplier.data.supplierType === 'Corporate'
                                ? supplier.data.pin
                                : supplier.data.idNumber
                            }));
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedSupplier?.id === supplier.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{supplier.data.supplierName}</span>
                            <span className="text-xs text-gray-500">
                              {supplier.data.supplierType === 'Corporate'
                                ? `PIN: ${supplier.data.pin}`
                                : `ID: ${supplier.data.idNumber}`}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                  </ScrollArea>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
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
            <Label>Supplier PIN/ID<span className="text-red-500">*</span></Label>
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