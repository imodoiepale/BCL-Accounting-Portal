// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabaseClient';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CompanyEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyData: any;
  processedSections: any[];
  onSave: (updatedData: any) => void;
  mainActiveTab?: string;
}

export const CompanyEditDialog = ({
  isOpen,
  onClose,
  companyData,
  processedSections,
  onSave,
  mainActiveTab
}: CompanyEditDialogProps) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // CompanyEditDialog.tsx
useEffect(() => {
  console.log('CompanyEditDialog - Initial companyData:', companyData);
  // Add check for all required properties
  if (!companyData?.company || !companyData?.rows) {
    console.log('CompanyEditDialog - Missing required data');
    return;
  }

  let initialData = {};

  try {
    // Set company name and basic company data
    console.log('CompanyEditDialog - Processing company data:', companyData.company);
    Object.entries(companyData.company).forEach(([key, value]) => {
      initialData[`acc_portal_company_duplicate.${key}`] = value;
    });

    // Process all rows including the additional data
    console.log('CompanyEditDialog - Processing rows:', companyData.rows);
    companyData.rows.forEach((row) => {
      // Process regular rows
      if (!row.isAdditionalRow) {
        Object.entries(row).forEach(([key, value]) => {
          if (key.endsWith('_data') && value) {
            const tableName = key.replace('_data', '');
            console.log(`CompanyEditDialog - Processing table data for ${tableName}:`, value);
            Object.entries(value).forEach(([field, fieldValue]) => {
              initialData[`${tableName}.${field}`] = fieldValue;
            });
          }
        });
      }
      // Process additional rows
      else if (row.sourceTable) {
        console.log('CompanyEditDialog - Processing additional row:', row);
        Object.entries(row).forEach(([key, value]) => {
          if (!['sourceTable', 'isAdditionalRow', 'id'].includes(key)) {
            initialData[`${row.sourceTable}.${key}`] = value;
          }
        });
      }
    });

    console.log('CompanyEditDialog - Final processed data:', initialData);
    setFormData(initialData);
  } catch (error) {
    console.error('CompanyEditDialog - Error processing data:', error);
  }
}, [companyData]);

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

      window.dispatchEvent(new CustomEvent('refreshData'));
      onSave(formData);
      onClose();
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Failed to save changes');
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
              category.fields.forEach(field => {
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

    return groups;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[100vh] p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span className="font-bold text-xl">
              {companyData?.company?.company_name || 'Company Details'}
            </span>
            <span className="text-sm text-gray-500">
              ({companyData?.activeTab})
            </span>
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit {mainActiveTab}</TabsTrigger>
            <TabsTrigger value="details">Add New {mainActiveTab}</TabsTrigger>
          </TabsList>
          <TabsContent value="edit">
            <ScrollArea className="h-[70vh] px-6">
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
          </TabsContent>
          <TabsContent value="details">
            <ScrollArea className="h-[80vh] px-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Details</h3>
                <pre className="bg-gray-50 p-4 rounded-md">
                  {JSON.stringify(companyData, null, 2)}
                </pre>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
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