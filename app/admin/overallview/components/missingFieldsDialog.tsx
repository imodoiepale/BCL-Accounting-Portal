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
import { toast } from 'sonner';

interface MissingField {
  field: string;
  label: string;
  value: string | null;
}
interface MissingFieldsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyData: {
    company: any;
    rows: any[];
    rowSpan: number;
  };
  processedSections: any[];
  onSave: (updatedData: any) => void;
}

export const MissingFieldsDialog = ({ 
  isOpen, 
  onClose, 
  companyData, 
  processedSections,
  onSave 
}: MissingFieldsDialogProps) => {
  const [formData, setFormData] = useState(() => {
    if (!companyData) return {};
    
    // Merge data from all tables
    let initialData = {
        'acc_portal_company_duplicate.company_name': companyData.company.company_name,
        ...companyData.company
    };
    
    // Merge data from additional rows
    if (companyData.rows) {
        companyData.rows.forEach(row => {
            if (row.isAdditionalRow) {
                initialData = { ...initialData, ...row };
            } else {
                Object.keys(row).forEach(key => {
                    if (key.endsWith('_data') && row[key]) {
                        initialData = { ...initialData, ...row[key] };
                    }
                });
            }
        });
    }
    
    return initialData;
});

  const [loading, setLoading] = useState(false);
  const parseTableNames = (mappings) => {
    return mappings.reduce((acc, mapping) => {
        try {
            // Parse the JSON string if it's a string
            const tableData = typeof mapping.table_names === 'string' 
                ? JSON.parse(mapping.table_names)
                : mapping.table_names;
            
            // Extract table names from all categories
            Object.values(tableData).forEach(tables => {
                if (Array.isArray(tables)) {
                    acc.push(...tables);
                }
            });
        } catch (error) {
            console.error('Error parsing table names:', error);
        }
        return acc;
    }, []);
};
  const handleChange = (field: string, value: string) => {
    // console.log('Field changed:', field, 'New value:', value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = async () => {
    setLoading(true);
    try {
        // Fetch all mappings
        const { data: mappings, error: mappingError } = await supabase
            .from('profile_category_table_mapping')
            .select('*');

        if (mappingError) throw mappingError;

        const allTableNames = parseTableNames(mappings);
        console.log('Available tables:', allTableNames);

        // Group changes by table and prepare updates
        const updates = {};
        for (const [fieldName, value] of Object.entries(formData)) {
            const [tableName, columnName] = fieldName.split('.');
            if (allTableNames.includes(tableName)) {
                if (!updates[tableName]) {
                    updates[tableName] = {
                        updates: {},
                        idField: tableName === 'ecitizen_companies_duplicate' ? 'name' : 'company_name'
                    };
                }
                updates[tableName].updates[columnName] = value;
            }
        }

        // Process updates for each table
        for (const [tableName, { updates: tableUpdates, idField }] of Object.entries(updates)) {
            if (Object.keys(tableUpdates).length > 0) {
                console.log('Updating table:', tableName, 'with data:', tableUpdates);
                const { error: updateError } = await supabase
                    .from(tableName)
                    .update(tableUpdates)
                    .eq(idField, companyData.company.company_name);

                if (updateError) {
                    throw updateError;
                }
            }
        }

        toast.success('All changes saved successfully');
        window.dispatchEvent(new CustomEvent('refreshData'));
        onSave(formData);
        onClose();
    } catch (error) {
        console.error('Error updating company:', error);
        toast.error('Failed to save changes: ' + (error.message || 'Unexpected error'));
    } finally {
        setLoading(false);
    }
};
  // Modified renderInput to prevent field disappearing
  const renderInput = (field: any) => {
    // Ensure we always have a value, even if it's empty string
    const currentValue = formData[field.name] ?? '';
    
    if (field.dropdownOptions?.length > 0) {
        return (
            <select
                id={field.name}
                value={currentValue}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
                <option value="">Select {field.label}</option>
                {field.dropdownOptions.map((option: string) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <Input
            id={field.name}
            type={field.type || 'text'}
            value={currentValue}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full"
            placeholder={`Enter ${field.label.toLowerCase()}`}
            readOnly={field.name === 'acc_portal_company_duplicate.company_name'}
        />
    );
};

  // Group fields by category
  const groupFieldsBySection = () => {
    const groups = {};
    
    if (processedSections && Array.isArray(processedSections)) {
        processedSections.forEach(section => {
            if (!section.isSeparator && section.categorizedFields) {
                section.categorizedFields.forEach(category => {
                    if (!category.isSeparator) {
                        category.fields.forEach(field => {
                            // Remove the filtering condition that was causing fields to disappear
                            if (!groups[category.category]) {
                                groups[category.category] = [];
                            }
                            groups[category.category].push(field);
                        });
                    }
                });
            }
        });
    }
    
    // Return all groups without filtering
    return groups;
};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] p-8">
        <DialogHeader>
          <DialogTitle>Edit Missing Fields: {companyData?.company.company_name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[80vh] px-6">
          <div className="space-y-6">
            {Object.entries(groupFieldsBySection())
              .map(([category, fields]) => (
                <div key={category} className="rounded-lg bg-gray-50 p-6">
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="h-8 w-1 bg-primary rounded-full"></div>
                      <h3 className="text-xl font-bold text-primary">{category}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-md shadow-sm">
                      {fields.map((field) => (
                        <div key={field.name} className="flex flex-col gap-2 mb-4">
                          <Label htmlFor={field.name} className="text-sm font-medium">
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
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
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