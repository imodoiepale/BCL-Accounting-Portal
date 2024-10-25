// components/EditEntryForm.tsx
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { CategoryFilter } from './CategoryFilter';
import { toast } from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import PettyCashService from './PettyCashService';

const PettyCashEntryForm = ({
  mode = 'create',
  initialData = null,
  onSubmit,
  onClose
}) => {
  const { userId } = useAuth();
  const [nextEntryNumber, setNextEntryNumber] = useState<number | null>(null);
  const [lastEntryNumber, setLastEntryNumber] = useState(0);
  useEffect(() => {
    if (mode === 'create') {
      PettyCashService.getNextEntryNumber(userId)
        .then(number => setNextEntryNumber(number))
        .catch(error => {
          console.error('Error fetching next entry number:', error);
          toast.error('Failed to get entry number');
        });
    }
  }, [mode, userId]);

  // Initialize form state
  // const [formData, setFormData] = useState(() => ({
  //   ...initialData,
  //   entryNumber: mode === 'create' ? nextEntryNumber : initialData?.entryNumber,
  //   // ... other form data initialization
  // }));

  // Update form data when nextEntryNumber is fetched
  useEffect(() => {
    if (mode === 'create' && nextEntryNumber) {
      setFormData(prev => ({
        ...prev,
        entryNumber: nextEntryNumber
      }));
    }
  }, [nextEntryNumber, mode]);

  const formFields = [
    {
      id: 'entryNumber',
      label: '#',
      type: 'number',
      width: '40px',
      required: true,
      disabled: true,
      defaultValue: lastEntryNumber + 1
    },
    {
      id: 'date',
      label: 'Date',
      type: 'date',
      width: '100px',
      required: true,
      defaultValue: format(new Date(), 'yyyy-MM-dd')
    },
    {
      id: 'user',
      label: 'User',
      type: 'text',
      width: '350px',
      required: true
    },
    {
      id: 'accountType',
      label: 'Account Type',
      type: 'select',
      width: '120px',
      required: true,
      options: [
        { value: 'corporate', label: 'Corporate' },
        { value: 'personal', label: 'Personal' }
      ]
    },
    {
      id: 'accountNo',
      label: 'Account No.',
      type: 'text',
      width: '120px',
      required: true
    },
    {
      id: 'supplierName',
      label: 'Supplier Name',
      type: 'text',
      width: '150px',
      required: true
    },
    {
      id: 'supplierPin',
      label: 'Supplier PIN/ID',
      type: 'text',
      width: '120px',
      required: true
    },
    {
      id: 'purchaseType',
      label: 'Purchase Type',
      type: 'select',
      width: '120px',
      required: true,
      options: [
        { value: 'goods', label: 'Goods' },
        { value: 'services', label: 'Services' },
        { value: 'assets', label: 'Assets' }
      ]
    },
    {
      id: 'category',
      label: 'Category',
      type: 'category',
      width: '150px',
      required: true
    },
    {
      id: 'subcategory',
      label: 'Subcategory',
      width: '150px',
      required: true
    },
    {
      id: 'amount',
      label: 'Amount',
      type: 'number',
      width: '120px',
      required: true,
      step: '0.01',
      min: '0'
    },
    {
      id: 'description',
      label: 'Description',
      type: 'text',
      width: '300px',
      required: true,
      className: 'col-span-2'
    },
    {
      id: 'paidVia',
      label: 'Paid Via/By',
      type: 'text',
      width: '120px',
      required: true
    },
    {
      id: 'checkedBy',
      label: 'Checked By',
      type: 'text',
      width: '120px'
    },
    {
      id: 'approvedBy',
      label: 'Approved By',
      type: 'text',
      width: '120px'
    },
    {
      id: 'billUpload',
      label: 'Bill/PCV Upload',
      type: 'file',
      width: '100px',
      accept: 'image/*,.pdf'
    },
    {
      id: 'paymentProof',
      label: 'Payment Proof',
      type: 'file',
      width: '100px',
      accept: 'image/*,.pdf'
    }
  ];

  // Initialize form state based on field definitions
  const [formData, setFormData] = useState(() => {
    const initialState = formFields.reduce((acc, field) => ({
      ...acc,
      [field.id]: field.defaultValue || initialData?.[field.id] || ''
    }), {});

    return mode === 'edit' && initialData ? {
      ...initialState,
      ...initialData,
      entryNumber: mode === 'create' ? nextEntryNumber : initialData?.entryNumber,
      date: initialData.date ? format(new Date(initialData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    } : initialState;
  });

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Handle file uploads
      const processedData = { ...formData };
      
      for (const field of formFields) {
        if (field.type === 'file' && formData[field.id] instanceof File) {
          const path = `${field.id}/${formData.entryNumber}_${formData[field.id].name}`;
          const uploadedUrl = await PettyCashService.uploadReceipt(formData[field.id], path);
          processedData[field.id] = uploadedUrl;
        }
      }

      // Add metadata
      processedData.created_at = processedData.created_at || new Date().toISOString();
      processedData.updated_at = new Date().toISOString();
      processedData.status = processedData.approvedBy ? 'Approved' : 
                            processedData.checkedBy ? 'Checked' : 'Pending';

      await onSubmit(processedData);
      toast.success(`Entry ${mode === 'create' ? 'created' : 'updated'} successfully`);
      onClose();
    } catch (error) {
      console.error('Error submitting entry:', error);
      toast.error(`Failed to ${mode} entry`);
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'select':
        return (
          <Select
            value={formData[field.id]?.toString()}
            onValueChange={(value) => handleInputChange(field.id, value)}
            disabled={field.disabled}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'category':
        return (
          <CategoryFilter
            selectedCategory={formData.category}
            selectedSubcategory={formData.subcategory}
            onCategoryChange={(value) => handleInputChange('category', value)}
            onSubcategoryChange={(value) => handleInputChange('subcategory', value)}
          />
        );
      
      case 'file':
        return (
          <div className="space-y-2">
            <Input
              type="file"
              accept={field.accept}
              onChange={(e) => handleInputChange(field.id, e.target.files[0])}
              className="h-9"
            />
            {formData[field.id] && (
              <div className="text-sm text-gray-500">
                {formData[field.id] instanceof File ? 
                  formData[field.id].name : 
                  'File already uploaded'}
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <Input
            type={field.type}
            value={formData[field.id]}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="h-9"
            required={field.required}
            disabled={field.disabled}
            step={field.step}
            min={field.min}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      {formFields.map((field) => (
        <div 
          key={field.id}
          className={`space-y-1.5 ${field.className || ''}`}
          style={{ width: field.width }}
        >
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}

      <DialogFooter className="col-span-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 text-white">
          {mode === 'create' ? 'Create Entry' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PettyCashEntryForm;