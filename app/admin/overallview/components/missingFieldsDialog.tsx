//@ts-nocheck
"use client";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabaseClient';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formFields } from '../formfields';

interface MissingField {
  field: string;
  label: string;
  value: string | null;
}

interface MissingFieldsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyData: {
    id: number;
    missingFields: MissingField[];
    [key: string]: any;
  };
  onSave: (updatedData: any) => void;
}

export const MissingFieldsDialog = ({ isOpen, onClose, companyData, onSave }: MissingFieldsDialogProps) => {
  const [formData, setFormData] = useState(companyData);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const changedValues = {};
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== companyData[key]) {
          changedValues[key] = formData[key];
          
          if (key === 'acc_client_effective_to') {
            const effectiveDate = new Date(formData[key]);
            changedValues['acc_client_status'] = effectiveDate > today ? 'Active' : 'Inactive';
            changedValues['acc_client'] = effectiveDate > today ? 'Yes' : 'No';
          }
          if (key === 'audit_tax_client_effective_to') {
            const effectiveDate = new Date(formData[key]);
            changedValues['audit_tax_client_status'] = effectiveDate > today ? 'Active' : 'Inactive';
            changedValues['audit_tax_client'] = effectiveDate > today ? 'Yes' : 'No';
          }
          if (key === 'imm_client_effective_to') {
            const effectiveDate = new Date(formData[key]);
            changedValues['imm_client_status'] = effectiveDate > today ? 'Active' : 'Inactive';
            changedValues['imm_client'] = effectiveDate > today ? 'Yes' : 'No';
          }
          if (key === 'cps_sheria_client_effective_to') {
            const effectiveDate = new Date(formData[key]);
            changedValues['cps_sheria_client_status'] = effectiveDate > today ? 'Active' : 'Inactive';
            changedValues['cps_sheria_client'] = effectiveDate > today ? 'Yes' : 'No';
          }
        }
      });

      const tableUpdates = {
        acc_portal_company_duplicate: {},
        nssf_companies_duplicate: {},
        nhif_companies_duplicate2: {},
        ecitizen_companies_duplicate: {},
        etims_companies_duplicate: {}
      };

      Object.entries(changedValues).forEach(([field, value]) => {
        const companyName = companyData.company_name;
        
        if (field.startsWith('nssf_')) {
          tableUpdates.nssf_companies_duplicate[field] = value;
          tableUpdates.nssf_companies_duplicate.company_name = companyName;
        } else if (field.startsWith('nhif_')) {
          tableUpdates.nhif_companies_duplicate2[field] = value;
          tableUpdates.nhif_companies_duplicate2.company_name = companyName;
        } else if (field.startsWith('etims_')) {
          tableUpdates.etims_companies_duplicate[field] = value;
          tableUpdates.etims_companies_duplicate.company_name = companyName;
        } else if (field.startsWith('ecitizen_')) {
          tableUpdates.ecitizen_companies_duplicate[field] = value;
          tableUpdates.ecitizen_companies_duplicate.company_name = companyName;
        } else {
          tableUpdates.acc_portal_company_duplicate[field] = value;
        }
      });

      for (const [table, updates] of Object.entries(tableUpdates)) {
        if (Object.keys(updates).length > 0) {
          const { data, error } = await supabase
            .from(table)
            .update(updates)
            .match({ company_name: companyData.company_name });

          if (error) {
            console.error(`Error updating ${table}:`, error);
            throw error;
          }
        }
      }

      const [
        { data: companies },
        { data: users },
        { data: nssfData },
        { data: nhifData },
        { data: ecitizenData },
        { data: etimsData }
      ] = await Promise.all([
        supabase.from('acc_portal_company_duplicate').select('*').eq('company_name', companyData.company_name),
        supabase.from('acc_portal_clerk_users_duplicate').select('*').eq('company_name', companyData.company_name),
        supabase.from('nssf_companies_duplicate').select('*').eq('company_name', companyData.company_name),
        supabase.from('nhif_companies_duplicate2').select('*').eq('company_name', companyData.company_name),
        supabase.from('ecitizen_companies_duplicate').select('*').eq('company_name', companyData.company_name),
        supabase.from('etims_companies_duplicate').select('*').eq('company_name', companyData.company_name)
      ]);

      const updatedCompanyData = {
        ...companies?.[0],
        ...users?.[0],
        ...nssfData?.[0],
        ...nhifData?.[0],
        ...ecitizenData?.[0],
        ...etimsData?.[0]
      };

      onSave(updatedCompanyData);
      onClose();
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshData'));
      }
    } catch (error) {
      console.error('Error updating company:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (field: MissingField & { type?: string; options?: string[] }) => {
    if (field.type === 'select' && field.options) {
      return (
        <select
          id={field.field}
          value={formData[field.field] || ''}
          onChange={(e) => handleChange(field.field, e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="">Select {field.label}</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
  
    return (
      <Input
        id={field.field}
        type={field.type || 'text'}
        value={formData[field.field] || ''}
        onChange={(e) => handleChange(field.field, e.target.value)}
        className="w-full"
        placeholder={`Enter ${field.label.toLowerCase()}`}
      />
    );
  };

  const groupFieldsByCategory = (fields: MissingField[]) => {
    // Find field definitions from formFields
    const fieldDefinitions = formFields.companyDetails.fields;
    
    return fields.reduce((groups, field) => {
      const fieldDef = fieldDefinitions.find(f => f.name === field.field);
      const category = fieldDef?.category || 'General Information';
      
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({
        ...field,
        type: fieldDef?.type || 'text',
        options: fieldDef?.options
      });
      return groups;
    }, {} as Record<string, Array<MissingField & { type?: string; options?: string[] }>>);
  };

  return (
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-[95vw] max-h-[90vh] p-8">
    <DialogHeader>
      <DialogTitle>Edit Missing Fields: {companyData?.company_name}</DialogTitle>
    </DialogHeader>
    <ScrollArea className="h-[80vh] px-6">
      <div className="space-y-6">
        {Object.entries(groupFieldsByCategory(companyData.missingFields))
          .map(([category, fields]) => (
            <div key={category} className="rounded-lg bg-gray-50 p-6">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="h-8 w-1 bg-primary rounded-full"></div>
                  <h3 className="text-xl font-bold text-primary">{category}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-md shadow-sm">
                  {fields.map((field) => (
                    <div key={field.field} className="flex flex-col gap-2 mb-4">
                    <Label htmlFor={field.field} className="text-sm font-medium">
                      {field.label}
                    </Label>
                    {renderInput(field)}
                  </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>
    </ScrollArea>
    <DialogFooter className="bg-white pt-2">
      <Button
        variant="outline"
        onClick={onClose}
        className="mr-2"
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center">
            <span className="animate-spin mr-2">⟳</span>
            Saving...
          </div>
        ) : 'Save Changes'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    );
};

export const getMissingFields = (row: any): MissingField[] => {
  return Object.entries(row)
    .filter(([key, value]) => 
      !key.startsWith('data.') && 
      !['index', 'isFirstRow', 'rowSpan'].includes(key) &&
      (value === null || value === '')
    )
    .map(([key, value]) => ({
      field: key,
      label: key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      value
    }));
};