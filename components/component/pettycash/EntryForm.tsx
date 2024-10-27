// components/EditEntryForm.tsx
// @ts-nocheck
// components/EntryForm.tsx
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { EXPENSE_CATEGORIES } from './expenseCategories';
import { Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PettyCashService } from './PettyCashService';
import { cn } from "@/lib/utils";
import { toast } from 'react-hot-toast';

interface SupplierData {
  supplierName: string;
  supplierType: 'Corporate' | 'Individual';
  pin: string;
  idNumber: string;
  mobile: string;
  email: string;
  tradingType: 'Purchase Only' | 'Expense Only' | 'Both Purchase + Expense';
}

interface Supplier {
  id: string;
  userid: string;
  data: SupplierData;
  created_at: string;
}

const PettyCashEntryForm = ({
  mode = 'create',
  initialData = null,
  onSubmit,
  onClose,
  userId
}) => {
  const initialFormState = {
    invoice_date: '',
    user_name: '',
    account_type: '',
    petty_cash_account: '',
    supplier_name: '',
    supplier_pin: '',
    purchase_type: '',
    category_code: '',
    subcategory_code: '',
    amount: '',
    description: '',
    paid_via: '',
    checked_by: '',
    approved_by: '',
    receipt_url: null,
    payment_proof_url: null,
    created_at: new Date().toISOString(),
    is_verified: false
  };

  const [formData, setFormData] = useState(initialData || initialFormState);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [openSupplier, setOpenSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await PettyCashService.fetchRecords('acc_portal_pettycash_suppliers', userId);
        setSuppliers(data);
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
      setFormData(initialData);
      // Find matching supplier
      const matchingSupplier = suppliers.find(s => s.data.supplierName === initialData.supplier_name);
      if (matchingSupplier) {
        setSelectedSupplier(matchingSupplier);
        setIsNewSupplier(false);
      }
    }
  }, [initialData, suppliers]);

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
        id: 'invoice_number',
        label: 'Invoice Number',
        type: 'text',
        required: true,
        colSpan: 1
      }
    ],
    [
      {
        id: 'user_name',
        label: 'User',
        type: 'text',
        required: true,
        colSpan: 1
      },
      {
        id: 'branch_name',
        label: 'Branch',
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
    // Transaction Details
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
    [
      {
        id: 'description',
        label: 'Description',
        type: 'text',
        required: true,
        colSpan: 2
      }
    ],
    // Approval Information
    [
      {
        id: 'paid_via',
        label: 'Paid Via/By',
        type: 'text',
        required: true,
        colSpan: 1
      },
      {
        id: 'checked_by',
        label: 'Checked By',
        type: 'text',
        colSpan: 1
      }
    ],
    [
      {
        id: 'approved_by',
        label: 'Approved By',
        type: 'text',
        colSpan: 2
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

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    if (fieldId === 'category_code') {
      setFormData(prev => ({
        ...prev,
        subcategory_code: ''
      }));
    }

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

  const renderSupplierSection = () => (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="col-span-2">
        <Label>Select Supplier Type</Label>
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
        <div className="col-span-2">
          <Label>Search Existing Supplier</Label>
          <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openSupplier}
                className="w-full justify-between"
              >
                {selectedSupplier ? selectedSupplier.data.supplierName : "Select supplier..."}
                <Check className={cn(
                  "ml-2 h-4 w-4",
                  selectedSupplier ? "opacity-100" : "opacity-0"
                )} />
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
                      .filter(supplier =>
                        supplier.data.supplierName.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
                        (supplier.data.pin || '').toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
                        (supplier.data.idNumber || '').toLowerCase().includes(supplierSearchQuery.toLowerCase())
                      )
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
                          <div className="flex flex-col">
                            <span>{supplier.data.supplierName}</span>
                            <span className="text-sm text-gray-500">
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
        <>
          <div className="col-span-1">
            <Label>Supplier Name<span className="text-red-500">*</span></Label>
            <Input
              value={formData.supplier_name}
              onChange={(e) => handleInputChange('supplier_name', e.target.value)}
              required
            />
          </div>
          <div className="col-span-1">
            <Label>Supplier PIN/ID<span className="text-red-500">*</span></Label>
            <Input
              value={formData.supplier_pin}
              onChange={(e) => handleInputChange('supplier_pin', e.target.value)}
              required
            />
          </div>
        </>
      )}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // If it's a new supplier, create supplier record first
      if (isNewSupplier) {
        const supplierData = {
          supplierName: formData.supplier_name,
          supplierType: 'Individual', // Default to Individual for new suppliers
          pin: formData.supplier_pin,
          idNumber: formData.supplier_pin,
          mobile: '',  // These could be added to the form if needed
          email: '',   // These could be added to the form if needed
          tradingType: 'Both Purchase + Expense'
        };

        await PettyCashService.createRecord('acc_portal_pettycash_suppliers', {
          userid: userId,
          data: supplierData
        });
      }

      await onSubmit(finalData);

      // Clean up preview URLs
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
      if (paymentProofPreview) URL.revokeObjectURL(paymentProofPreview);

    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit entry');
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'select':
        return (
          <Select
            value={formData[field.id]?.toString()}
            onValueChange={(value) => handleInputChange(field.id, value)}
            disabled={field.disabled || !field.options?.length}
          >
            <SelectTrigger className="h-9">
              <SelectValue // Continuing from the previous code...

                placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
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
              className="h-9"
            />
            {field.id === 'receipt_url' && (formData.receipt_url || receiptPreview) && (
              <div className="relative h-[100px] bg-gray-50 rounded-md overflow-hidden">
                {formData.receipt_url instanceof File ? (
                  <img
                    src={receiptPreview!}
                    alt="Receipt preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${formData.receipt_url}`}
                    alt="Receipt"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}
            {field.id === 'payment_proof_url' && (formData.payment_proof_url || paymentProofPreview) && (
              <div className="relative h-[100px] bg-gray-50 rounded-md overflow-hidden">
                {formData.payment_proof_url instanceof File ? (
                  <img
                    src={paymentProofPreview!}
                    alt="Payment proof preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${formData.payment_proof_url}`}
                    alt="Payment proof"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="h-9"
            required={field.required}
            disabled={field.disabled}
            step="0.01"
            min="0"
          />
        );

      default:
        return (
          <Input
            type={field.type}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="h-9"
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-1">Required fields missing:</h4>
        <ul className="text-sm text-yellow-700 list-disc list-inside grid grid-cols-4 gap-2">
          {incompleteFields.map(field => (
            <li key={field.id}>{field.label}</li>
          ))}
        </ul>
      </div>
    );
  };
  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      {/* Render supplier section first */}
      {renderSupplierSection()}

      {/* Render all other form fields */}
      {formFields.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-2 gap-4">
          {row.map((field) => (
            <div
              key={field.id}
              className={`space-y-1.5 ${field.colSpan === 2 ? 'col-span-2' : ''}`}
            >
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))}
        </div>
      ))}

      {/* Validation Status */}
      {renderValidationStatus()}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-9"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-9 bg-blue-600 text-white"
          disabled={formFields
            .flat()
            .filter(field => field.required)
            .some(field => !formData[field.id])
          }
        >
          {mode === 'create' ? 'Create Entry' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PettyCashEntryForm;