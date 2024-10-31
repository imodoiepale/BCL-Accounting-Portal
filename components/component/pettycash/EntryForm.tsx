// @ts-nocheck
// PettyCashEntryForm.tsx

// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EXPENSE_CATEGORIES } from './expenseCategories';
import { Check, Loader2, AlertCircle } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PettyCashService } from './PettyCashService';
import { cn } from "@/lib/utils";
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface PettyCashEntry {
  id?: string;
  petty_cash_number?: string;
  invoice_date: string;
  invoice_number: string;
  cuin_number: string;
  user_name: string;
  account_type: string;
  petty_cash_account: string;
  supplier_name: string;
  supplier_pin: string;
  purchase_type: string;
  category_code: string;
  category: string;
  subcategory_code: string;
  subcategory: string;
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
  status: 'Pending' | 'Checked' | 'Approved';
  document_references?: string[];
}

interface SupplierData {
  id: string;
  pin: string | null;
  email: string;
  mobile: string;
  idNumber: string;
  tradingType: string;
  supplierName: string;
  supplierType: "Individual" | "Corporate";
  data?: any;
}

interface PettyCashEntryFormProps {
  mode: 'create' | 'edit';
  initialData: PettyCashEntry | null;
  onSubmit: (entry: PettyCashEntry) => Promise<void>;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

const PettyCashEntryForm: React.FC<PettyCashEntryFormProps> = ({
  mode = 'create',
  initialData = null,
  onSubmit,
  onClose,
  userId,
  onSuccess
}) => {
  // Initialize form state
  const initialFormState: PettyCashEntry = {
    petty_cash_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    cuin_number: '',
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
    status: 'Pending',
    document_references: []
  };

  // State Management
  const [formData, setFormData] = useState<PettyCashEntry>(initialData || initialFormState);
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // File Preview States
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);

  // Supplier Selection States
  const [openSupplier, setOpenSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
  const [nextPettyCashNumber, setNextPettyCashNumber] = useState<string>('');

  const [userAccounts, setUserAccounts] = useState<any[]>([]);


  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [usersData, suppliersData, accountsData, nextNumber] = await Promise.all([
          PettyCashService.fetchUserRecords(userId),
          PettyCashService.fetchRecords('acc_portal_pettycash_suppliers', userId),
          PettyCashService.fetchAccountRecords(userId),
          PettyCashService.getNextEntryNumber(userId)
        ]);

        setUsers(usersData);

        // Format suppliers properly
        if (Array.isArray(suppliersData)) {
          setSuppliers(suppliersData);
          const formattedSuppliers = suppliersData
            .filter(supplier => supplier && supplier.data) // Ensure supplier and data exist
            .map(supplier => ({
              id: supplier.id,
              data: supplier.data,
              value: supplier.id,
              label: supplier.data.supplierName
            }));
          setSupplierOptions(formattedSuppliers);
        }

        setAccounts(accountsData);
        setNextPettyCashNumber(`PC${nextNumber.toString().padStart(6, '0')}`);

      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
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

  useEffect(() => {
    if (formData.user_name) {
      const selectedUser = users.find(u => u.id === formData.user_name);
      const userAccountsList = accounts.filter(acc => acc.user_id === formData.user_name);

      if (userAccountsList.length > 0) {
        setFormData(prev => ({
          ...prev,
          account_type: userAccountsList[0].account_type,
          petty_cash_account: userAccountsList[0].account_number
        }));
        setUserAccounts(userAccountsList);
      }
    }
  }, [formData.user_name]);

  useEffect(() => {
    if (selectedSupplier) {
      setFormData(prev => ({
        ...prev,
        purchase_type: selectedSupplier.data.tradingType === 'Purchase Only' ? 'goods' :
          selectedSupplier.data.tradingType === 'Both Purchase + Expense' ? 'goods' : 'services'
      }));
    }
  }, [selectedSupplier]);


  // Form validation
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.invoice_date) errors.push('Invoice date is required');
    if (!formData.invoice_number) errors.push('Invoice number is required');
    if (!formData.cuin_number) errors.push('CUIN number is required');
    if (!formData.user_name) errors.push('User is required');
    if (!formData.account_type) errors.push('Account type is required');
    if (!formData.petty_cash_account) errors.push('Account number is required');
    if (!formData.supplier_name) errors.push('Supplier name is required');
    if (!formData.category_code) errors.push('Category is required');
    if (!formData.subcategory_code) errors.push('Subcategory is required');
    if (!formData.amount || Number(formData.amount) <= 0) errors.push('Valid amount is required');
    if (!formData.description) errors.push('Description is required');

    // File validation for new entries
    if (mode === 'create') {
      if (!formData.receipt_url) errors.push('Bill/PCV upload is required');
      if (!formData.payment_proof_url) errors.push('Payment proof is required');
    }

    return errors;
  };

  // Handle input changes
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

  // Handle supplier selection
  const handleSupplierSelect = (supplierId: string) => {
    const selectedSupplier = supplierOptions.find(s => s.value === supplierId);
    if (selectedSupplier) {
      setFormData(prev => ({
        ...prev,
        supplier_name: selectedSupplier.data.supplierName,
        supplier_pin: selectedSupplier.data.pin || selectedSupplier.data.idNumber || ''
      }));
      setSelectedSupplier(selectedSupplier);
      setOpenSupplier(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      errors.forEach(error => toast.error(error));
      return;
    }

    try {
      let finalData = { ...formData };
      const uploadPromises = [];
      let receiptUrl = null;
      let paymentProofUrl = null;

      // Handle file uploads
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
            userid: userId
          }, userId)
        );
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Update final data with uploaded URLs
      finalData = {
        ...finalData,
        receipt_url: receiptUrl || finalData.receipt_url,
        payment_proof_url: paymentProofUrl || finalData.payment_proof_url,
        userid: userId
      };

      await onSubmit(finalData);

      // Clean up preview URLs
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
      if (paymentProofPreview) URL.revokeObjectURL(paymentProofPreview);

      toast.success(`Entry ${mode === 'create' ? 'created' : 'updated'} successfully`);

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


  // File preview renderer
  const renderFilePreview = (fieldId: string) => {
    const fileUrl = formData[fieldId];
    const previewUrl = fieldId === 'receipt_url' ? receiptPreview : paymentProofPreview;

    if (!fileUrl && !previewUrl) return null;

    return (
      <div className="relative h-20 bg-gray-50 rounded-md overflow-hidden">
        {fileUrl instanceof File ? (
          <Image
            src={previewUrl!}
            alt={`${fieldId === 'receipt_url' ? 'Receipt' : 'Payment proof'} preview`}
            fill
            className="object-contain"
          />
        ) : fileUrl && (
          <Image
            src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${fileUrl}`}
            alt={fieldId === 'receipt_url' ? 'Receipt' : 'Payment proof'}
            fill
            className="object-contain"
          />
        )}
      </div>
    );
  };

  const formSections = {
    basicInfo: {
      title: "Basic Information",
      fields: [
        {
          id: "petty_cash_number",
          label: "Petty Cash Number",
          type: "text",
          disabled: true,
          value: nextPettyCashNumber,
          className: "bg-gray-50"
        },
        {
          id: "invoice_date",
          label: "Invoice Date",
          type: "date",
          required: true,
          value: formData.invoice_date
        }
      ]
    },
    userAccount: {
      title: "User & Account Details",
      fields: [
        {
          id: "user_name",
          label: "User",
          type: "select",
          required: true,
          value: formData.user_name,
          options: users.map(user => ({
            value: user.name,
            label: user.name
          }))
        },
        {
          id: "account_type",
          label: "Account Type",
          type: "select",
          required: true,
          value: formData.account_type,
          options: [
            { value: "Corporate", label: "Corporate" },
            { value: "Personal", label: "Personal" }
          ]
        },
        {
          id: "petty_cash_account",
          label: "Account Number",
          type: "select",
          required: true,
          colSpan: 2,
          value: formData.petty_cash_account,
          disabled: !formData.user_name || !formData.account_type,
          options: accounts
            .filter(acc => acc.user_id === formData.user_name &&
              acc.account_type === formData.account_type)
            .map(acc => ({
              value: acc.account_number,
              label: acc.account_number
            }))
        }
      ]
    },
    transactionDetails: {
      title: "Transaction Details",
      fields: [
        {
          id: "amount",
          label: "Amount (KES)",
          type: "number",
          required: true,
          value: formData.amount,
          step: "0.01"
        },
        {
          id: "purchase_type",
          label: "Purchase Type",
          type: "select",
          required: true,
          value: formData.purchase_type,
          options: [
            { value: "purchase", label: "Purchase" },
            { value: "expense", label: "Expense" },
            { value: "both", label: "Purchase + Expense" }
          ]
        },
        {
          id: "category_code",
          label: "Category",
          type: "select",
          required: true,
          value: formData.category_code,
          options: Object.entries(EXPENSE_CATEGORIES).map(([code, category]) => ({
            value: code,
            label: category.name
          }))
        },
        {
          id: "subcategory_code",
          label: "Subcategory",
          type: "select",
          required: true,
          value: formData.subcategory_code,
          disabled: !formData.category_code,
          options: formData.category_code ?
            EXPENSE_CATEGORIES[formData.category_code]?.subcategories.map(sub => ({
              value: sub.code,
              label: sub.name
            })) : []
        },
        {
          id: "description",
          label: "Description",
          type: "text",
          required: true,
          value: formData.description,
          colSpan: 2
        }
      ]
    },
    paymentVerification: {
      title: "Payment & Verification",
      fields: [
        {
          id: "paid_via",
          label: "Paid Via/By",
          type: "text",
          required: true,
          value: formData.paid_via
        },
        {
          id: "checked_by",
          label: "Checked By",
          type: "select",
          value: formData.checked_by,
          options: users
            .filter(user => user.role === 'manager' || user.role === 'admin')
            .map(user => ({
              value: user.name,
              label: user.name
            }))
        },
        {
          id: "approved_by",
          label: "Approved By",
          type: "select",
          value: formData.approved_by,
          options: users
            .filter(user => user.role === 'manager' || user.role === 'admin')
            .map(user => ({
              value: user.name,
              label: user.name
            }))
        },
        {
          id: "receipt_url",
          label: "Bill/PCV Upload",
          type: "file",
          required: true,
          accept: "image/*,.pdf"
        },
        {
          id: "bill_number",
          label: "Bill Number",
          type: "text",
          required: true,
          value: formData.bill_number
        },
        {
          id: "cuin_number",
          label: "CUIN Number",
          type: "text",
          required: true,
          value: formData.cuin_number
        },
        {
          id: "payment_proof_url",
          label: "Payment Proof",
          type: "file",
          required: true,
          accept: "image/*,.pdf"
        }
      ]
    }
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case 'select':
        return (
          <Select
            value={field.value?.toString()}
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
              required={field.required}
            />
            {renderFilePreview(field.id)}
          </div>
        );

      default:
        return (
          <Input
            type={field.type}
            value={field.value || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="h-8"
            required={field.required}
            disabled={field.disabled}
            step={field.step}
          />
        );
    }
  };


  const renderFormSection = (section: any) => (
    <div key={section.title} className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">{section.title}</h3>
        <Separator className="flex-1" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {section.fields.map((field: any) => (
          <div
            key={field.id}
            className={cn(
              "space-y-2",
              field.colSpan === 2 ? "col-span-2" : "",
              field.className
            )}
          >
            <Label>{field.label} {field.required && '*'}</Label>
            {renderField(field)}
          </div>
        ))}
      </div>
    </div>
  );


  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-2">
      {Object.values(formSections).map((section: any) => renderFormSection(section))}

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-4">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

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
          disabled={isLoading}
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