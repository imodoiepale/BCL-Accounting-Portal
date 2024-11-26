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
// Add this helper function to both dialogs
const parseTableNames = (mappings) => {
  try {
    const allTables = new Set();
    if (Array.isArray(mappings)) {
      mappings.forEach(mapping => {
        try {
          let tableNames;
          if (typeof mapping.table_names === 'string') {
            tableNames = JSON.parse(mapping.table_names || '{}');
          } else if (typeof mapping.table_names === 'object') {
            tableNames = mapping.table_names;
          }
          
          if (tableNames) {
            Object.values(tableNames).forEach(tables => {
              if (Array.isArray(tables)) {
                tables.forEach(table => allTables.add(table));
              }
            });
          }
        } catch (e) {
          console.warn('Error parsing individual table names:', e);
        }
      });
    }
    return Array.from(allTables);
  } catch (error) {
    console.error('Error in parseTableNames:', error);
    return ['acc_portal_company_duplicate']; // Fallback to base table
  }
};
// MissingFieldsDialog.tsx
useEffect(() => {
  // console.log('MissingFieldsDialog - Initial companyData:', companyData);
  // console.log('MissingFieldsDialog - Processed Sections:', processedSections);

  if (!companyData?.company) {
    // console.log('MissingFieldsDialog - No company data available');
    return;
  }

  try {
    // Get all fields from processed sections
    const allFields = new Map(); // Changed to Map to store field info
    const existingData = {};

    // First collect all fields
    processedSections.forEach(section => {
      if (!section.isSeparator && section.categorizedFields) {
        section.categorizedFields.forEach(category => {
          if (!category.isSeparator && category.fields) {
            category.fields.forEach(field => {
              // console.log('Processing field:', field);
              allFields.set(field.name, field);
            });
          }
        });
      }
    });

    // console.log('MissingFieldsDialog - All possible fields:', Array.from(allFields.values()));

    // Process existing data
    // Company data
    if (companyData.company) {
      Object.entries(companyData.company).forEach(([key, value]) => {
        existingData[`acc_portal_company_duplicate.${key}`] = value;
      });
    }

    // Process rows data
    if (companyData.rows?.length > 0) {
      companyData.rows.forEach((row) => {
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
      });
    }

    // console.log('MissingFieldsDialog - Existing data:', existingData);

    // Find missing or empty fields
    const missingFields = {};
    allFields.forEach((fieldInfo, fieldName) => {
      const value = existingData[fieldName];
      if (value === undefined || value === null || value === '' || 
          value === 'null' || value === ' ' || value === "null") {
        // console.log('Found missing field:', fieldName, value);
        missingFields[fieldName] = '';
      }
    });

    // console.log('MissingFieldsDialog - Missing fields:', missingFields);
    setFormData(missingFields);

  } catch (error) {
    console.error('MissingFieldsDialog - Error:', error);
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
  // console.log('Submitting form data:', formData);
  
  try {
    // Group updates by table
    const updatesByTable = Object.entries(formData).reduce((acc, [fieldName, value]) => {
      const [tableName, columnName] = fieldName.split('.');
      if (!acc[tableName]) {
        acc[tableName] = {};
      }
      // Skip the ID field
      if (columnName !== 'id') {
        acc[tableName][columnName] = value;
      }
      return acc;
    }, {});

    for (const [tableName, updates] of Object.entries(updatesByTable)) {
      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('company_name', companyData.company.company_name)
        .eq('company_id', companyData.company.company_id);

      if (error) throw error;
    }

    toast.success('Changes saved successfully');
    onSave(formData);
    onClose();
  } catch (error) {
    console.error('Error saving changes:', error);
    toast.error('Failed to save changes: ' + (error.message || 'Unexpected error'));
  } finally {
    setLoading(false);
  }
};

// In both dialogs, modify renderInput
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
    />
  );
};

const groupFieldsBySection = () => {
  const groups = {};

  processedSections.forEach(section => {
    if (!section.isSeparator && section.categorizedFields) {
      section.categorizedFields.forEach(category => {
        if (!category.isSeparator && category.fields) {
          const categoryName = category.category || 'General';
          const missingFieldsInCategory = category.fields.filter(field => {
            return formData.hasOwnProperty(field.name);
          });

          if (missingFieldsInCategory.length > 0) {
            if (!groups[categoryName]) {
              groups[categoryName] = [];
            }
            groups[categoryName].push(...missingFieldsInCategory);
          }
        }
      });
    }
  });

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