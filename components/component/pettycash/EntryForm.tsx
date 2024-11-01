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

type EntryStatus = 'pending' | 'checked' | 'approved';

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
  status: EntryStatus;
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

interface ExpenseCategory {
  category_code: string;
  expense_category: string;
  subcategories: ExpenseSubcategory[];
}

interface ExpenseSubcategory {
  subcategory_code: string;
  expense_subcategory: string;
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
    expense_category: '',
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
    status: 'pending',
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

  const [supplierFormData, setSupplierFormData] = useState({
    supplierName: '',
    pin: '',
    tradingType: ''
  });

  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [isReceiptUploaded, setIsReceiptUploaded] = useState(false);
  const [accountTypeOptions, setAccountTypeOptions] = useState([]);
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);

  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);


  const mapPurchaseTypeToTradingType = (purchaseType: string): string => {
    switch (purchaseType) {
      case 'purchase': return 'Purchase Only';
      case 'expense': return 'Expense Only';
      case 'both': return 'Both Purchase + Expense';
      default: return '';
    }
  };

  const mapTradingTypeToPurchaseType = (tradingType: string): string => {
    switch (tradingType) {
      case 'Purchase Only': return 'purchase';
      case 'Expense Only': return 'expense';
      case 'Both Purchase + Expense': return 'both';
      default: return '';
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [accountsData, suppliersData, nextNumber] = await Promise.all([
          PettyCashService.fetchAccountRecords(userId),
          PettyCashService.fetchRecords('acc_portal_pettycash_suppliers', userId),
          PettyCashService.getNextEntryNumber(userId)
        ]);

        setNextPettyCashNumber(nextNumber);
        // Update the form data with the next number
        setFormData(prev => ({
          ...prev,
          petty_cash_number: nextNumber
        }));


        if (accountsData && Array.isArray(accountsData)) {
          // Set accounts directly since they're already in the correct format
          setAccounts(accountsData);

          // Extract unique users
          const users = Array.from(new Set(accountsData.map(acc => acc.accountUser)))
            .filter(user => user);
          setUniqueUsers(users);
        }

        if (suppliersData && Array.isArray(suppliersData)) {
          console.log('Setting suppliers state with:', suppliersData);
          setSuppliers(suppliersData);
        } else {
          console.error('Suppliers data is not in expected format:', suppliersData);
        }


        // Rest of your existing code...

      } catch (error) {
        console.error('Error in fetchInitialData:', error);
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
        category_code: initialData.category_code || '',
        subcategory_code: initialData.subcategory_code || ''
      });

      const matchingSupplier = suppliers.find(s => s.data.supplierName === initialData.supplier_name);
      if (matchingSupplier) {
        setIsNewSupplier(false);
        setFormData(prev => ({
          ...prev,
          supplier_name: matchingSupplier.data.supplierName,
          supplier_pin: matchingSupplier.data.pin || matchingSupplier.data.idNumber || ''
        }));
      }
    }
  }, [initialData, suppliers]);


  useEffect(() => {

    if (formData.user_name) {
      // Filter accounts for selected user
      const userAccountsList = accounts.filter(acc => acc.accountUser === formData.user_name);

      if (userAccountsList.length > 0) {
        setUserAccounts(userAccountsList);

        // Extract unique petty cash types for this user
        const uniqueAccountTypes = Array.from(new Set(userAccountsList.map(acc => acc.pettyCashType)));

        setAccountTypeOptions(uniqueAccountTypes.map(type => ({
          value: type,
          label: type
        })));

        // If user has only one petty cash type, auto-select it
        if (uniqueAccountTypes.length === 1) {
          const accountType = uniqueAccountTypes[0];
          const accountsOfType = userAccountsList.filter(acc => acc.pettyCashType === accountType);

          setFormData(prev => {
            const newData = {
              ...prev,
              account_type: accountType,
              // If there's only one account of this type, auto-select it
              petty_cash_account: accountsOfType.length === 1 ? accountsOfType[0].accountNumber : ''
            };
            return newData;
          });
        }
      }
    }
  }, [formData.user_name, accounts]);

  useEffect(() => {
    if (selectedSupplier) {
      const purchaseType = mapTradingTypeToPurchaseType(selectedSupplier.data.tradingType);

      setFormData(prev => ({
        ...prev,
        supplier_name: selectedSupplier.data.supplierName,
        supplier_pin: selectedSupplier.data.pin || selectedSupplier.data.idNumber || '',
        purchase_type: purchaseType
      }));
    }
  }, [selectedSupplier]);

  useEffect(() => {

    if (formData.account_type && formData.user_name) {
      const accountsOfType = userAccounts.filter(acc =>
        acc.pettyCashType === formData.account_type
      );

      // If there's only one account of this type, auto-select it
      if (accountsOfType.length === 1) {
        setFormData(prev => ({
          ...prev,
          petty_cash_account: accountsOfType[0].accountNumber
        }));
      } else if (accountsOfType.length === 0) {
        setFormData(prev => ({
          ...prev,
          petty_cash_account: ''
        }));
      }
    }
  }, [formData.account_type, formData.user_name, userAccounts]);



  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await PettyCashService.fetchExpenseCategories();
        console.log('Fetched categories:', categories); // Check the fetched categories
        setExpenseCategories(categories);
      } catch (error) {
        console.error('Error fetching expense categories:', error);
        toast.error('Failed to load expense categories');
      }
    };

    fetchCategories();
  }, []);

  // Form validation
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.invoice_date) errors.push('Invoice date is required');
    if (!formData.cuin_number) errors.push('CUIN number is required');
    if (!formData.user_name) errors.push('User is required');
    if (!formData.account_type) errors.push('Account type is required');
    if (!formData.petty_cash_account) errors.push('Account number is required');
    if (!formData.supplier_name) errors.push('Supplier name is required');
    if (!formData.expense_category) errors.push('Category is required');
    if (!formData.subcategory) errors.push('Subcategory is required');
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

      // Handle file previews
      if (fieldId === 'receipt_url' && value instanceof File) {
        const url = URL.createObjectURL(value);
        setReceiptPreview(url);
        setIsReceiptUploaded(true); // Set receipt uploaded state
      }
      if (fieldId === 'payment_proof_url' && value instanceof File) {
        const url = URL.createObjectURL(value);
        setPaymentProofPreview(url);
      }

      return newData;
    });
  };

  // Handle supplier selection
  const handleSupplierSelect = (supplierId: string) => {
    const selectedSupplier = supplierOptions.find(s => s.id.toString() === supplierId);
    if (selectedSupplier) {
      setFormData(prev => ({
        ...prev,
        supplier_name: selectedSupplier.data.supplierName, // Set the supplier name
        supplier_pin: selectedSupplier.data.pin || selectedSupplier.data.idNumber || '' // Autofill supplier ID/PIN
      }));
      setSelectedSupplier(selectedSupplier);
      setOpenSupplier(false);
    }
  };

  const handleCategoryChange = (selectedExpenseCategory: string) => {
    const selectedCategoryData = expenseCategories.find(cat => cat.expense_category === selectedExpenseCategory);

    // Update formData with the selected expense category and reset subcategory
    setFormData(prev => ({
      ...prev,
      expense_category: selectedCategoryData?.expense_category || '',
      subcategory: '' // Reset subcategory when category changes
    }));
  };

  const formatStatus = (status: string): string => {
    return status.toLowerCase();
  };

  const determineStatus = (checkedBy: string | null, verifiedBy: string | null): 'pending' | 'checked' | 'verified' => {
    if (!checkedBy && !verifiedBy) return 'pending';
    if (checkedBy && !verifiedBy) return 'checked';
    if (checkedBy && verifiedBy) return 'verified';
    return 'pending'; // Default fallback
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

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Log checkedBy and verifiedBy values
      console.log('Checked By:', formData.checked_by);
      console.log('Verified By:', formData.approved_by);

      // Determine status based on checked_by and approved_by
      const status = determineStatus(formData.checked_by, formData.approved_by);
      console.log('Determined Status:', status); // Log the determined status

      // Remove petty_cash_number from finalData as it shouldn't be submitted
      const { petty_cash_number, ...dataWithoutPCVNumber } = finalData;

      // Update final data with uploaded URLs and other required fields
      finalData = {
        ...dataWithoutPCVNumber,
        receipt_url: receiptUrl || finalData.receipt_url,
        payment_proof_url: paymentProofUrl || finalData.payment_proof_url,
        status: status, // Ensure this is a valid status
        userid: userId,
      };

      console.log('Final Data before submission:', finalData); // Log final data

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

  useEffect(() => {
    console.log('Suppliers loaded:', suppliers.map(s => s.data.supplierName));
  }, [suppliers]);

  const renderSupplierSection = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Supplier Type Selection */}
          <div className="space-y-2">
            <Select
              value={isNewSupplier ? 'new' : 'existing'}
              onValueChange={(value) => {
                setIsNewSupplier(value === 'new');
                if (value === 'new') {
                  setFormData(prev => ({
                    ...prev,
                    supplier_name: '',
                    supplier_pin: '',
                    purchase_type: ''
                  }));
                  setSelectedSupplier(null);
                }
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

          {/* Existing Supplier Selection */}
          {!isNewSupplier && (
            <div className="space-y-2">
              <Label>Select Supplier</Label>
              <Select
                value={selectedSupplier?.id?.toString()}
                onValueChange={(value) => {
                  const supplier = suppliers.find(s => s.id.toString() === value);
                  if (supplier) {
                    setSelectedSupplier(supplier);
                  }
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select a supplier">
                    {selectedSupplier?.data?.supplierName || "Select supplier..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem
                      key={supplier.id}
                      value={supplier.id.toString()}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {supplier.data.supplierName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {supplier.data.pin || supplier.data.idNumber || 'No ID'} •
                          {supplier.data.tradingType} •
                          {supplier.data.supplierType}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Selected Supplier Details */}
              {selectedSupplier && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label>Supplier Name</Label>
                    <Input
                      value={formData.supplier_name}
                      disabled
                      className="h-8 bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier PIN/ID</Label>
                    <Input
                      value={formData.supplier_pin}
                      disabled
                      className="h-8 bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trading Type</Label>
                    <Input
                      value={mapPurchaseTypeToTradingType(formData.purchase_type)}
                      disabled
                      className="h-8 bg-gray-50"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New Supplier Form */}
          {isNewSupplier && (
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
                <Label>ID Number/PIN<span className="text-red-500">*</span></Label>
                <Input
                  value={formData.supplier_pin}
                  onChange={(e) => handleInputChange('supplier_pin', e.target.value)}
                  className="h-8"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Trading Type<span className="text-red-500">*</span></Label>
                <Select
                  value={formData.purchase_type}
                  onValueChange={(value) => handleInputChange('purchase_type', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select trading type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase Only</SelectItem>
                    <SelectItem value="expense">Expense Only</SelectItem>
                    <SelectItem value="both">Both Purchase + Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
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
          value: formData.petty_cash_number,
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
          options: uniqueUsers.map(user => ({
            value: user,
            label: user
          }))
        },
        {
          id: "account_type",
          label: "Account Type",
          type: "select",
          required: true,
          value: formData.account_type,
          disabled: !formData.user_name,
          options: accountTypeOptions
        },
        {
          id: "petty_cash_account",
          label: "Account Number",
          type: "select",
          required: true,
          colSpan: 2,
          value: formData.petty_cash_account,
          disabled: !formData.user_name || !formData.account_type,
          options: (() => {
            const filteredAccounts = accounts
              .filter(acc =>
                acc.accountUser === formData.user_name &&
                acc.pettyCashType === formData.account_type
              )
              .map(acc => ({
                value: acc.accountNumber,
                label: acc.accountNumber
              }));
            return filteredAccounts;
          })()
        }
      ]
    },
    supplierDetails: {
      title: "Supplier Details",
      fields: [
        {
          id: "supplier_type",
          label: "Supplier Type",
          type: "custom", // Custom type to render the supplier selection
          required: true,
          render: renderSupplierSection,
          colSpan: 2
        },
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
          disabled: false,
          options: [
            { value: "purchase", label: "Purchase Only" },
            { value: "expense", label: "Expense Only" },
            { value: "both", label: "Both Purchase + Expense" }
          ]
        },
        {
          id: "expense_category", // Change to expense_category
          label: "Category",
          type: "select",
          required: true,
          value: formData.expense_category, // Use expense_category
          options: expenseCategories.map(category => ({
            value: category.expense_category,
            label: category.expense_category
          }))
        },
        {
          id: "subcategory", // Change to subcategory
          label: "Subcategory",
          type: "select",
          required: true,
          value: formData.subcategory, // Use the subcategory name directly
          disabled: !formData.expense_category, // Disable if no category is selected
          options: (() => {
            const selectedCategory = expenseCategories.find(
              cat => cat.expense_category === formData.expense_category // Match by expense category
            );
            return selectedCategory?.subcategories?.map(sub => ({
              value: sub.name, // Use the subcategory name directly
              label: sub.name // Display the subcategory name
            })) || [];
          })()
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
    // paymentVerification: {
    //   title: "Payment & Verification",
    //   fields: [
    //     {
    //       id: "paid_via",
    //       label: "Paid Via/By",
    //       type: "text",
    //       required: true,
    //       value: formData.paid_via
    //     },
    //     {
    //       id: "checked_by",
    //       label: "Checked By",
    //       type: "select",
    //       value: formData.checked_by,
    //       options: uniqueUsers.map(user => ({
    //         value: user,
    //         label: user
    //       }))
    //     },
    //     {
    //       id: "approved_by",
    //       label: "Approved By",
    //       type: "select",
    //       value: formData.approved_by,
    //       options: uniqueUsers.map(user => ({
    //         value: user,
    //         label: user
    //       }))
    //     },
    //     {
    //       id: "receipt_url",
    //       label: "Bill/PCV Upload",
    //       type: "file",
    //       required: true,
    //       accept: "image/*,.pdf"
    //     },
    //     {
    //       id: "bill_number",
    //       label: "Bill Number",
    //       type: "text",
    //       required: true,
    //       value: formData.bill_number
    //     },
    //     {
    //       id: "cuin_number",
    //       label: "Bill CUIN Number",
    //       type: "text",
    //       required: true,
    //       value: formData.cuin_number
    //     },
    //     {
    //       id: "payment_proof_url",
    //       label: "Payment Proof",
    //       type: "file",
    //       required: true,
    //       accept: "image/*,.pdf"
    //     }
    //   ]
    // },
    payment: {
      title: "Payment Verification",
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
          options: uniqueUsers.map(user => ({
            value: user,
            label: user
          }))
        },
        {
          id: "approved_by",
          label: "Approved By",
          type: "select",
          value: formData.approved_by,
          options: uniqueUsers.map(user => ({
            value: user,
            label: user
          }))
        },
        {
          id: "payment_proof_url",
          label: "Payment Proof",
          type: "file",
          required: true,
          accept: "image/*,.pdf"
        }
      ]
    },
    billPaymentVerification: {
      title: "Bill Verification",
      fields: [
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
          label: "Bill CUIN Number",
          type: "text",
          required: true,
          value: formData.cuin_number
        }
      ]
    }
  };

  const renderField = (field: any) => {
    if (field.type === 'custom' && field.render) {
      return field.render(); // Render the custom supplier section
    }

    if (field.id === 'category_code') {
      return (
        <Select
          value={formData.category} // This should reflect the selected category
          onValueChange={handleCategoryChange} // Call the updated handler
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map(category => (
              <SelectItem
                key={category.expense_category}
                value={category.expense_category}
              >
                {category.expense_category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.id === 'subcategory') { // Change to use subcategory directly
      const selectedCategory = expenseCategories.find(
        cat => cat.expense_category === formData.expense_category // Match by expense category
      );
      const subcategories = selectedCategory?.subcategories || [];

      return (
        <Select
          value={formData.subcategory} // Use the subcategory name directly
          onValueChange={(value) => {
            handleInputChange('subcategory', value); // Update the subcategory name directly
          }}
          disabled={!formData.expense_category || subcategories.length === 0} // Disable if no category is selected or no subcategories
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select subcategory" />
          </SelectTrigger>
          <SelectContent>
            {subcategories.map(sub => (
              <SelectItem
                key={sub.name} // Use the subcategory name as the key
                value={sub.name} // Use the subcategory name as the value
              >
                {sub.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={field.value?.toString()}
            onValueChange={(value) => {
              console.log(`Select Change - ${field.id}:`, value);
              handleInputChange(field.id, value);
            }}
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
            {/* {renderFilePreview(field.id)} */}
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
    <div key={section.title} className="space-y-2 border-l-4 border border-l-blue-500 border-black p-2 rounded-md">
      <div className="flex items-center gap-1">
        <h3 className="text-black font-bold text-sm">{section.title}</h3>
        {/* <Separator className="flex-1 text-black" /> */}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {section.fields.map((field: any) => (
          <div
            key={field.id}
            className={cn(
              "space-y-1",
              field.colSpan === 2 ? "col-span-2" : "",
              field.className
            )}
          >
            <Label className="text-sm">{field.label} {field.required && '*'}</Label>
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