/* eslint-disable react/jsx-key */
// @ts-nocheck
"use client";
import React, {  useState, useCallback, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formFields } from '../formfields';
import { supabase } from '@/lib/supabaseClient';
import { toast } from "sonner";
import { renderSeparatorCell } from './overview/TableComponents copy';

export function CompanyEditDialog({ isOpen, onClose, companyData, onSave ,processedSections }) {
    const [editedData, setEditedData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (companyData) {
            setEditedData(companyData);
        }
    }, [companyData]);

    const handleInputChange = (fieldName, value) => {
        setEditedData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };
    const handleSubmit = async () => {
      setLoading(true);
      try {
          const today = new Date();
          const changedValues = {};
          Object.keys(editedData).forEach(key => {
              if (editedData[key] !== companyData[key]) {
                  changedValues[key] = editedData[key];
                  
                  // Check effective dates and update status and client fields
                  if (key === 'acc_client_effective_to') {
                      const effectiveDate = new Date(editedData[key]);
                      changedValues['acc_client_status'] = effectiveDate > today ? 'Active' : 'Inactive';
                      changedValues['acc_client'] = effectiveDate > today ? 'Yes' : 'No';
                  }
                  if (key === 'audit_tax_client_effective_to') {
                      const effectiveDate = new Date(editedData[key]);
                      changedValues['audit_tax_client_status'] = effectiveDate > today ? 'Active' : 'Inactive';
                      changedValues['audit_tax_client'] = effectiveDate > today ? 'Yes' : 'No';
                  }
                  if (key === 'imm_client_effective_to') {
                      const effectiveDate = new Date(editedData[key]);
                      changedValues['imm_client_status'] = effectiveDate > today ? 'Active' : 'Inactive';
                      changedValues['imm_client'] = effectiveDate > today ? 'Yes' : 'No';
                  }
                  if (key === 'cps_sheria_client_effective_to') {
                      const effectiveDate = new Date(editedData[key]);
                      changedValues['cps_sheria_client_status'] = effectiveDate > today ? 'Active' : 'Inactive';
                      changedValues['cps_sheria_client'] = effectiveDate > today ? 'Yes' : 'No';
                  }
              }
          });
  
          // Map fields to their respective tables
          const tableUpdates = {
              acc_portal_company_duplicate: {},
              nssf_companies_duplicate: {},
              nhif_companies_duplicate2: {},
              ecitizen_companies_duplicate: {},
              etims_companies_duplicate: {}
          };
  
          // Sort changed fields into their respective tables
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
  
          // Execute updates
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
  
          // Fetch updated data
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
  
          // Combine updated data
          const updatedCompanyData = {
              ...companies?.[0],
              ...users?.[0],
              ...nssfData?.[0],
              ...nhifData?.[0],
              ...ecitizenData?.[0],
              ...etimsData?.[0]
          };
  
          toast.success('Company details updated successfully');
          onSave(updatedCompanyData);
          onClose();
          // Call the provided fetchAllData function
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('refreshData'));
      }
      } catch (error) {
          console.error('Error updating company:', error);
          toast.error('Failed to update company details');
      } finally {
          setLoading(false);
      }
  };
  
  const renderField = (field) => {
    const value = editedData[field.name] || '';

    if (field.type === 'select' && field.options) {
        return (
            <div key={field.name} className="flex flex-col gap-2 mb-4">
                <Label htmlFor={field.name} className="text-sm font-medium">
                    {field.label}
                </Label>
                <select
                    id={field.name}
                    value={value}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                    <option value="">Select {field.label}</option>
                    {field.options.map((option) => (
                        <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div key={field.name} className="flex flex-col gap-2 mb-4">
            <Label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
            </Label>
            <Input
                id={field.name}
                type={field.type === 'date' ? 'date' : 'text'}
                value={field.type === 'date' ? (value && !isNaN(new Date(value).getTime()) ? new Date(value).toISOString().split('T')[0] : '') : value}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className="w-full"
            />
        </div>
    );
};

const renderFieldsByCategory = () => {
    const categorizedFields = {};
    formFields.companyDetails.fields.forEach(field => {
        const category = field.category || 'General Information';
        if (!categorizedFields[category]) {
            categorizedFields[category] = [];
        }
        categorizedFields[category].push(field);
    });

    return Object.entries(categorizedFields).map(([category, fields], index, array) => (
        <div key={category} className="rounded-lg bg-gray-50 p-6">
            <div className="mb-6">
                <div className="flex items-center space-x-2 mb-6">
                    <div className="h-8 w-1 bg-primary rounded-full"></div>
                    <h3 className="text-xl font-bold text-primary">{category}</h3>
                </div>
                <div className="grid grid-cols-4 gap-4 bg-white p-4 rounded-md shadow-sm">
                    {fields.map(field => renderField(field))}
                </div>
            </div>
            {index < array.length - 1 && (
                <div className="border-b-2 border-gray-200 my-8"></div>
            )}
        </div>
    ));
};

const renderColumnReferences = () => {
    return (
        <div className="rounded-lg bg-yellow-50 p-6">
            <div className="mb-6">
                <div className="flex items-center space-x-2 mb-6">
                    <div className="h-8 w-1 bg-primary rounded-full"></div>
                    <h3 className="text-xl font-bold text-primary">Column References</h3>
                </div>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-yellow-100">
                            <th className="font-medium">CLM REF</th>
                            {(() => {
                                let columnCounter = 1;
                                return processedSections.slice(1).map((section, sectionIndex) => {
                                    if (section.isSeparator) {
                                        return (
                                            <>
                                                {renderSeparatorCell(`col-ref-sep-${sectionIndex}`, 'section')}
                                                <th className="text-center font-medium bg-yellow-50 border-b border-yellow-200">-</th>
                                                {renderSeparatorCell(`col-ref-sep-${sectionIndex}`, 'section')}
                                            </>
                                        );
                                    }

                                    return section.categorizedFields?.map((category, catIndex) => {
                                        if (category.isSeparator) {
                                            return renderSeparatorCell(`col-ref-cat-${catIndex}`, 'category');
                                        }

                                        return category.fields.map((field, fieldIndex, fieldsArray) => (
                                            <>
                                                <th
                                                    key={`col-ref-${columnCounter}`}
                                                    className="text-center font-medium bg-yellow-50 border-b border-yellow-200"
                                                >
                                                    {columnCounter++}
                                                </th>
                                                {fieldIndex < fieldsArray.length - 1 &&
                                                    field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                                                    renderSeparatorCell(`col-ref-subcat-${sectionIndex}-${catIndex}-${fieldIndex}`, 'mini')}
                                            </>
                                        ));
                                    });
                                });
                            })()}
                        </tr>
                    </thead>
                </table>
            </div>
        </div>
    );
};

return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] p-8">
            <DialogHeader>
                <DialogTitle>Edit Company: {companyData?.company_name}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[80vh] px-6">
                <div className="space-y-6">
                    {renderFieldsByCategory()}
                    {renderColumnReferences()} {/* Render column references here */}
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
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);
}

export interface VisibilityState { [key: string]: boolean; }


export interface FilterState {
  [key: string]: string | null;
}

export const useTableFunctionalities = (initialData: any[]) => {
  // States
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');

  // Custom debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(globalFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [globalFilter]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sectionVisibility, setSectionVisibility] = useState<VisibilityState>({});
  const [categoryVisibility, setCategoryVisibility] = useState<VisibilityState>({});
  const [fieldFilters, setFieldFilters] = useState<FilterState>({});

  // Handle global search
  const handleGlobalSearch = useCallback((searchTerm: string) => {
    setGlobalFilter(searchTerm);
  }, []);

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  }, []);

  // Toggle section visibility
  const toggleSectionVisibility = useCallback((sectionId: string) => {
    setSectionVisibility(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  // Toggle category visibility
  const toggleCategoryVisibility = useCallback((categoryId: string) => {
    setCategoryVisibility(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  // Set field filter
  const setFieldFilter = useCallback((fieldId: string, value: string | null) => {
    setFieldFilters(prev => ({
      ...prev,
      [fieldId]: value
    }));
  }, []);

  // Filter data based on all active filters
  const filteredData = useMemo(() => {
    let filtered = [...initialData];

    // Apply global search
    if (debouncedFilter) {
      filtered = filtered.filter(item => {
        return Object.entries(item).some(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            return String(value)
              .toLowerCase()
              .includes(debouncedFilter.toLowerCase());
          }
          return false;
        });
      });
    }

    // Apply field-specific filters
    Object.entries(fieldFilters).forEach(([fieldId, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(item => {
          const value = item[fieldId];
          if (typeof value === 'string' || typeof value === 'number') {
            return String(value)
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          }
          return false;
        });
      }
    });

    return filtered;
  }, [initialData, debouncedFilter, fieldFilters]);

  // Get visible columns based on section and category visibility
  const getVisibleColumns = useCallback(
    (columns: any[]) => {
      return columns.filter(column => {
        const isColumnVisible = !columnVisibility[column.id];
        const isSectionVisible = !sectionVisibility[column.section];
        const isCategoryVisible = !categoryVisibility[column.category];
        return isColumnVisible && isSectionVisible && isCategoryVisible;
      });
    },
    [columnVisibility, sectionVisibility, categoryVisibility]
  );

  // Reset all filters and visibility states
  const resetAll = useCallback(() => {
    setGlobalFilter('');
    setColumnVisibility({});
    setSectionVisibility({});
    setCategoryVisibility({});
    setFieldFilters({});
  }, []);

  // Generate column filters based on unique values
  const generateColumnFilters = useCallback(
    (columnId: string) => {
      const uniqueValues = new Set(
        initialData.map(item => item[columnId]).filter(Boolean)
      );
      return Array.from(uniqueValues).sort();
    },
    [initialData]
  );

  // Export visibility state
  const exportVisibilityState = useCallback(() => {
    return {
      columns: columnVisibility,
      sections: sectionVisibility,
      categories: categoryVisibility
    };
  }, [columnVisibility, sectionVisibility, categoryVisibility]);

  // Import visibility state
  const importVisibilityState = useCallback(
    (state: {
      columns: VisibilityState;
      sections: VisibilityState;
      categories: VisibilityState;
    }) => {
      setColumnVisibility(state.columns);
      setSectionVisibility(state.sections);
      setCategoryVisibility(state.categories);
    },
    []
  );

  return {
    // Data
    filteredData,
    
    // Search
    globalFilter,
    handleGlobalSearch,
    
    // Visibility controls
    columnVisibility,
    toggleColumnVisibility,
    sectionVisibility,
    toggleSectionVisibility,
    categoryVisibility,
    toggleCategoryVisibility,
    
    // Filters
    fieldFilters,
    setFieldFilter,
    generateColumnFilters,
    
    // Utility functions
    getVisibleColumns,
    resetAll,
    exportVisibilityState,
    importVisibilityState
  };
};

// Additional utility types and functions
export interface Column {
  id: string;
  label: string;
  section?: string;
  category?: string;
  accessor: (row: any) => any;
}

export interface Section {
  id: string;
  label: string;
  categories?: Category[];
}

export interface Category {
  id: string;
  label: string;
  columns: Column[];
}

// Function to organize columns by section and category
export const organizeColumns = (columns: Column[]): Section[] => {
  const sections: { [key: string]: Section } = {};

  columns.forEach(column => {
    const sectionId = column.section || 'Other';
    const categoryId = column.category || 'General';

    if (!sections[sectionId]) {
      sections[sectionId] = {
        id: sectionId,
        label: sectionId,
        categories: []
      };
    }

    let category = sections[sectionId].categories?.find(c => c.id === categoryId);
    if (!category) {
      category = {
        id: categoryId,
        label: categoryId,
        columns: []
      };
      sections[sectionId].categories?.push(category);
    }

    category.columns.push(column);
  });

  return Object.values(sections);
};

// Custom hook for managing table state persistence
export const useTableStatePersistence = (tableId: string) => {
  const saveState = useCallback((state: any) => {
    localStorage.setItem(`table-state-${tableId}`, JSON.stringify(state));
  }, [tableId]);

  const loadState = useCallback(() => {
    const saved = localStorage.getItem(`table-state-${tableId}`);
    return saved ? JSON.parse(saved) : null;
  }, [tableId]);

  return { saveState, loadState };
};

// Function to generate column definitions from form fields
export const generateColumnsFromFields = (
  fields: any[],
  section?: string
): Column[] => {
  return fields.map(field => ({
    id: field.name,
    label: field.label,
    section: section || field.category || 'Other',
    category: field.category || 'General',
    accessor: (row: any) => row[field.name]
  }));
};
