// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabaseClient';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

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
const [formData, setFormData] = useState({});
const [loading, setLoading] = useState(false);

// MissingFieldsDialog.tsx
useEffect(() => {
  console.log('MissingFieldsDialog - Initial companyData:', companyData);
  if (!companyData?.company) {
    console.log('MissingFieldsDialog - No company data available');
    return;
  }

  try {
    // Collect all possible fields from processed sections
    const allFields = new Set();
    const existingData = {};

    console.log('MissingFieldsDialog - Processing sections:', processedSections);
    processedSections.forEach(section => {
      if (!section.isSeparator && section.categorizedFields) {
        section.categorizedFields.forEach(category => {
          if (!category.isSeparator) {
            category.fields.forEach(field => {
              allFields.add(field.name);
            });
          }
        });
      }
    });

    console.log('MissingFieldsDialog - All possible fields:', Array.from(allFields));

    // Process company data
    Object.entries(companyData.company).forEach(([key, value]) => {
      existingData[`acc_portal_company_duplicate.${key}`] = value;
    });

    // Process all row data
    if (companyData.rows?.length > 0) {
      companyData.rows.forEach((row) => {
        // Handle regular rows
        if (!row.isAdditionalRow) {
          Object.entries(row).forEach(([key, value]) => {
            if (key.endsWith('_data') && value) {
              const tableName = key.replace('_data', '');
              Object.entries(value).forEach(([field, fieldValue]) => {
                existingData[`${tableName}.${field}`] = fieldValue;
              });
            }
          });
        }
        // Handle additional rows
        else if (row.sourceTable) {
          Object.entries(row).forEach(([key, value]) => {
            if (!['sourceTable', 'isAdditionalRow', 'id'].includes(key)) {
              existingData[`${row.sourceTable}.${key}`] = value;
            }
          });
        }
      });
    }

    // Identify truly missing or empty fields
    const missingFields = {};
    allFields.forEach(fieldName => {
      const value = existingData[fieldName];
      if (value === undefined || value === null || value === '' || value === 'null') {
        missingFields[fieldName] = '';
      }
    });

    console.log('MissingFieldsDialog - Existing data:', existingData);
    console.log('MissingFieldsDialog - Missing fields:', missingFields);
    setFormData(missingFields);
  } catch (error) {
    console.error('MissingFieldsDialog - Error processing data:', error);
  }
}, [companyData, processedSections]);

const handleChange = (field: string, value: string) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
};

const handleSubmit = async () => {
  setLoading(true);
  try {
    const { data: mappings, error: mappingError } = await supabase
      .from('profile_category_table_mapping')
      .select('*');

    if (mappingError) throw mappingError;

    const allTableNames = parseTableNames(mappings);
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

    for (const [tableName, { updates: tableUpdates, idField }] of Object.entries(updates)) {
      if (Object.keys(tableUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update(tableUpdates)
          .eq(idField, companyData.company.company_name);

        if (updateError) throw updateError;
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

const renderInput = (field: any) => {
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

const groupFieldsBySection = () => {
  const groups = {};

  if (processedSections && Array.isArray(processedSections)) {
    processedSections.forEach(section => {
      if (!section.isSeparator && section.categorizedFields) {
        section.categorizedFields.forEach(category => {
          if (!category.isSeparator) {
            const missingFieldsInCategory = category.fields.filter(field => 
              formData.hasOwnProperty(field.name)
            );

            if (missingFieldsInCategory.length > 0) {
              if (!groups[category.category]) {
                groups[category.category] = [];
              }
              groups[category.category].push(...missingFieldsInCategory);
            }
          }
        });
      }
    });
  }

  return groups;
};

return (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-[95vw] max-h-[90vh] p-8">
    <DialogHeader>
  <DialogTitle className="flex items-center space-x-2">
    <span className="font-bold text-xl">
      Missing Fields: {companyData?.company?.company_name || 'Company'}
    </span>
  </DialogTitle>
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