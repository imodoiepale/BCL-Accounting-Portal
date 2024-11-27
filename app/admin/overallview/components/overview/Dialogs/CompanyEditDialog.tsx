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
  const [newFormData, setNewFormData] = useState({});
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

useEffect(() => {
  // console.log('CompanyEditDialog - Initial companyData:', companyData);

  if (!companyData?.company) {
    console.log('CompanyEditDialog - No company data available');
    return;
  }

  try {
    let initialData = {};

    // First add all company fields
    Object.entries(companyData.company).forEach(([key, value]) => {
      initialData[`acc_portal_company_duplicate.${key}`] = value ?? '';
    });

    // console.log('Initial company data mapped:', initialData);

    // Then add any additional fields from rows
    if (companyData.rows?.length > 0) {
      companyData.rows.forEach(row => {
        Object.entries(row).forEach(([key, value]) => {
          if (key.endsWith('_data') && value) {
            const tableName = key.replace('_data', '');
            Object.entries(value).forEach(([field, fieldValue]) => {
              initialData[`${tableName}.${field}`] = fieldValue ?? '';
            });
          } else if (!['isFirstRow', 'isAdditionalRow', 'sourceTable', 'id'].includes(key)) {
            initialData[`acc_portal_company_duplicate.${key}`] = value ?? '';
          }
        });
      });
    }

    // console.log('CompanyEditDialog - Final mapped data:', initialData);
    setFormData(initialData);
  } catch (error) {
    console.error('Error mapping company data:', error);
    toast.error('Failed to map company data');
  }
}, [companyData]);
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
        acc[tableName][columnName] = value;
        return acc;
      }, {});

      // console.log('Updates grouped by table:', updatesByTable);

      // Execute updates for each table
      for (const [tableName, updates] of Object.entries(updatesByTable)) {
        const { error } = await supabase
          .from(tableName)
          .update(updates)
          .eq('company_name', companyData.company.company_name);

        if (error) throw error;
      }

      toast.success('Changes saved successfully');
      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Failed to save changes: ' + (error.message || 'Unexpected error'));
    } finally {
      setLoading(false);
    }
  };

  const handleNewDataChange = (field: string, value: string) => {
    setNewFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNewDataSubmit = async () => {
    setLoading(true);
    // console.log('Submitting new data:', newFormData);

    try {
      const updatesByTable = Object.entries(newFormData).reduce((acc, [fieldName, value]) => {
        const [tableName, columnName] = fieldName.split('.');
        if (!acc[tableName]) {
          acc[tableName] = {};
        }
        acc[tableName][columnName] = value;
        return acc;
      }, {});

      // Insert new records for each table
      for (const [tableName, data] of Object.entries(updatesByTable)) {
        const { error } = await supabase
          .from(tableName)
          .insert([{ ...data, company_name: companyData.company.company_name }]);

        if (error) throw error;
      }

      toast.success('New data added successfully');
      onSave(newFormData);
      onClose();
    } catch (error) {
      console.error('Error adding new data:', error);
      toast.error('Failed to add new data: ' + (error.message || 'Unexpected error'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
                              {renderInput(field, true)} {/* Add new parameter for new data form */}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                <Button
                  onClick={handleNewDataSubmit}
                  disabled={loading}
                  className="w-full mt-4"
                >
                  {loading ? 'Adding...' : 'Add New Data'}
                </Button>
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