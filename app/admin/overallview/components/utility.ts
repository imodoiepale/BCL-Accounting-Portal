// utils.ts
// @ts-nocheck

import { formFields } from '../formfields';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { safeJSONParse } from '../page';
export interface CompanyData {
  company_name: string;
  [key: string]: any;
}

export interface TableData {
  [key: string]: any;
}

// Generic function to filter fields by category
export const filterFieldsByCategory = (category: string) => {
  return formFields.companyDetails.fields.filter(
    field => field.category === category
  );
};

// Helper function to get general company fields
export const getGeneralCompanyFields = () => {
  return formFields.companyDetails.fields.filter(
    field => !field.category || field.category === 'General Information'
  );
};

// Format date values
export const formatDate = (date: string | null): string => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString();
  } catch (e) {
    return date;
  }
};

// Format boolean values
export const formatBoolean = (value: boolean | null): string => {
  if (value === null) return '';
  return value ? 'Yes' : 'No';
};

// Helper to check if a field is empty
export const isEmptyField = (value: any): boolean => {
  return value === null || value === undefined || value === '';
};

// Helper to count missing fields
export const countMissingFields = (data: any, fields: any[]): number => {
  return fields.reduce((count, field) => {
    return count + (isEmptyField(data[field.name]) ? 1 : 0);
  }, 0);
};

// Helper to calculate completion percentage
export const calculateCompletionPercentage = (data: any, fields: any[]): number => {
  const totalFields = fields.length;
  const missingFields = countMissingFields(data, fields);
  return Math.round(((totalFields - missingFields) / totalFields) * 100);
};

// Helper to group data by category
export const groupDataByCategory = (fields: any[]) => {
  return fields.reduce((acc, field) => {
    const category = field.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(field);
    return acc;
  }, {});
};
export const handleExport = async (activeMainTab: string, activeSubTab: string) => {
    try {
        // Get all companies
        const { data: companies, error: companiesError } = await supabase
            .from('acc_portal_company_duplicate')
            .select('*')
            .order('company_name');

        if (companiesError) throw companiesError;

        // Get table structure from profile_category_table_mapping
        const { data: mappings, error: mappingError } = await supabase
            .from('profile_category_table_mapping')
            .select('*')
            .eq('Tabs', activeSubTab)
            .eq('main_tab', activeMainTab);

        if (mappingError) throw mappingError;

        const columnMappings = safeJSONParse(mappings[0].column_mappings, {});
        const tableNames = safeJSONParse(mappings[0].table_names, {});
        
        // Get all relevant tables' data
        const allTables = new Set(Object.values(tableNames).flat());
        const tableData = {};

        for (const table of allTables) {
            const { data, error } = await supabase
                .from(table)
                .select('*');
            
            if (error) throw error;
            tableData[table] = data || [];
        }

        // Prepare worksheet data
        const wsData = [];
        
        // Create header row with company names
        const headerRow = ['Fields'];
        companies.forEach(company => {
            const companyRecords = Object.values(tableData).flatMap(tableRows => 
                tableRows.filter(row => row.company_id === company.id)
            );
            const recordCount = Math.max(1, companyRecords.length);
            for (let i = 0; i < recordCount; i++) {
                headerRow.push(company.company_name);
            }
        });
        wsData.push(headerRow);

        // Add data rows for each field
        Object.entries(columnMappings).forEach(([fieldKey, fieldLabel]) => {
            const [tableName, columnName] = fieldKey.split('.');
            const row = [fieldLabel];

            companies.forEach(company => {
                const records = tableData[tableName]?.filter(
                    record => record.company_id === company.id
                ) || [null];

                if (records.length === 0) {
                    row.push(''); // Empty value for companies with no records
                } else {
                    records.forEach(record => {
                        row.push(record ? record[columnName] || '' : '');
                    });
                }
            });
            
            wsData.push(row);
        });

        // Create and download Excel file
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
        
        // Create download link
        const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeMainTab}_${activeSubTab}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success('Export completed successfully');
    } catch (error) {
        console.error('Export error:', error);
        toast.error('Failed to export data');
    }
};

export const handleImport = async (file: File, activeMainTab: string, activeSubTab: string) => {
    try {
        // Read the Excel file
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length < 2) {
            toast.error('File is empty or invalid');
            return;
        }

        // Get mapping information
        const { data: mappings, error: mappingError } = await supabase
            .from('profile_category_table_mapping')
            .select('*')
            .eq('Tabs', activeSubTab)
            .eq('main_tab', activeMainTab);

        if (mappingError) throw mappingError;

        const columnMappings = safeJSONParse(mappings[0].column_mappings, {});
        const tableNames = safeJSONParse(mappings[0].table_names, {});

        // Create reverse mapping for field labels to column names
        const fieldMapping = Object.entries(columnMappings).reduce((acc, [key, label]) => {
            acc[label.toString()] = key;
            return acc;
        }, {});

        // Get all companies to map names to IDs
        const { data: companies, error: companiesError } = await supabase
            .from('acc_portal_company_duplicate')
            .select('id, company_name');

        if (companiesError) throw companiesError;

        const companyMap = companies.reduce((acc, company) => {
            acc[company.company_name.toLowerCase()] = { id: company.id, name: company.company_name };
            return acc;
        }, {});

        // Process each column (company) in the spreadsheet
        const headerRow = rows[0];
        const dataToInsert = new Map(); // Map to store data by table name

        for (let colIndex = 1; colIndex < headerRow.length; colIndex++) {
            const companyName = headerRow[colIndex]?.toString().toLowerCase();
            const company = companyMap[companyName];

            if (!company) {
                console.warn(`Company not found: ${headerRow[colIndex]}`);
                continue;
            }

            // Create data object for each field
            const recordData = { company_id: company.id, company_name: company.name };

            for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
                const fieldLabel = rows[rowIndex][0];
                const fieldKey = fieldMapping[fieldLabel];
                const value = rows[rowIndex][colIndex];

                if (fieldKey) {
                    const [tableName, columnName] = fieldKey.split('.');
                    
                    if (!dataToInsert.has(tableName)) {
                        dataToInsert.set(tableName, []);
                    }

                    // Add or update record
                    const existingRecord = recordData[tableName] || {};
                    existingRecord[columnName] = value;
                    recordData[tableName] = existingRecord;
                }
            }

            // Add records to respective tables with company_name
            for (const [tableName, record] of Object.entries(recordData)) {
                if (tableName !== 'company_id' && tableName !== 'company_name') {
                    dataToInsert.get(tableName).push({
                        ...record,
                        company_id: company.id,
                        company_name: company.name
                    });
                }
            }
        }

        // Insert data into respective tables
        for (const [tableName, records] of dataToInsert) {
            if (records.length === 0) continue;

            // First delete existing records for these companies
            const companyIds = [...new Set(records.map(r => r.company_id))];
            
            const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .in('company_id', companyIds);

            if (deleteError) throw deleteError;

            // Insert new records with company_name
            const { error: insertError } = await supabase
                .from(tableName)
                .insert(records.map(record => ({
                    ...record,
                    company_name: record.company_name // Ensure company_name is included
                })));

            if (insertError) throw insertError;
        }

        toast.success('Import completed successfully');
        window.dispatchEvent(new Event('refreshData'));
    } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import data');
    }
};
// Helper function to convert string to array buffer
function s2ab(s: string) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
}


export const calculateFieldStats = (fieldName: string, data: any[]) => {
    let total = 0;
    let completed = 0;
  
    data.forEach(group => {
      if (group.rows && group.rows[0] && fieldName in group.rows[0]) {
        total++;
        const value = group.rows[0][fieldName];
        if (value !== null && value !== undefined && value !== '') {
          completed++;
        }
      }
    });
  
    return {
      total: total.toString(), // Convert to string to ensure we're not returning an object
      completed: completed.toString(),
      pending: (total - completed).toString()
    };
  };
  
export const groupFieldsByCategory = (fields) => {
  // First group fields by their categories
  const categorizedFields = fields.reduce((acc, field) => {
      const category = field.category || 'General';
      if (!acc[category]) {
          acc[category] = [];
      }
      acc[category].push(field);
      return acc;
  }, {});

  // Convert to array format with separators
  const result = Object.entries(categorizedFields).flatMap(([category, fields], index, array) => {
      // Add category with its fields
      const categoryGroup = {
          category,
          fields,
          colSpan: fields.length
      };

      // Add separator if not the last category
      if (index < array.length - 1) {
          return [categoryGroup, { isSeparator: true }];
      }
      return [categoryGroup];
  });

  return result;
};

export const calculateTotalFields = (section) => {
    return section.categorizedFields?.reduce((total, category) => {
        if (category.isSeparator) return total;
        return total + category.fields.length;
    }, 0) || 0;
};

export const calculateCompletedFields = (section, data) => {
  let completed = 0;
  section.categorizedFields?.forEach(category => {
      if (!category.isSeparator) {
          category.fields.forEach(field => {
              if (data.some(item => item[field.name])) {
                  completed++;
              }
          });
      }
  });
  return completed;
};

export const calculatePendingFields = (section, data) => {
  const total = calculateTotalFields(section);
  const completed = calculateCompletedFields(section, data);
  return total - completed;
};

export const getMissingFields = (row: any, processedSections: any[]) => {
    const missingFields = [];
    
    processedSections.forEach(section => {
      if (!section.isSeparator && section.categorizedFields) {
        section.categorizedFields.forEach(category => {
          if (!category.isSeparator) {
            category.fields.forEach(field => {
              const [tableName, columnName] = field.name.split('.');
              let value;
              
              if (row.isAdditionalRow && row.sourceTable === tableName) {
                value = row[columnName];
              } else if (row[`${tableName}_data`]) {
                value = row[`${tableName}_data`][columnName];
              } else {
                value = row[columnName];
              }
              
              if (value === null || value === '' || value === undefined) {
                missingFields.push({
                  ...field,
                  value: value
                });
              }
            });
          }
        });
      }
    });
    
    return missingFields;
  };