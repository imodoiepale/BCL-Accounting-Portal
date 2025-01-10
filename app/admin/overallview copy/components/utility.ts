// utils.ts
// @ts-nocheck
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';
import { toast } from "sonner";

const safeJSONParse = (jsonString: string, defaultValue = {}) => {
  try {
      if (!jsonString) return defaultValue;
      
      // Handle already parsed objects
      if (typeof jsonString === 'object') return jsonString;
      
      // Handle strings with escaped quotes
      let processedString = jsonString;
      if (typeof jsonString === 'string') {
          // Replace escaped backslashes first
          processedString = processedString.replace(/\\\\/g, '\\');
          // Replace escaped quotes
          processedString = processedString.replace(/\\"/g, '"');
          // Handle double-encoded JSON
          while (processedString.includes('\\"')) {
              try {
                  processedString = JSON.parse(processedString);
                  if (typeof processedString !== 'string') break;
              } catch {
                  break;
              }
          }
      }

      return typeof processedString === 'string' 
          ? JSON.parse(processedString) 
          : processedString;
  } catch (error) {
      console.error('JSON Parse Error:', error, 'Input:', jsonString);
      return defaultValue;
  }
};

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

          // Get table structure from profile_category_table_mapping_2
          const { data: mappings, error: mappingError } = await supabase
              .from('profile_category_table_mapping_2')
              .select('*')
              .eq('Tabs', activeSubTab)
              .eq('main_tab', activeMainTab);

          if (mappingError) throw mappingError;

          if (mappings.length === 0) {
              toast.error('No mappings found for the selected tab.');
              return;
          }

          const structure = mappings[0].structure;
          const fields = [];

          // Extract fields from structure
          structure.sections.forEach(section => {
              section.subsections.forEach(subsection => {
                  subsection.fields.forEach(field => {
                      fields.push({
                          name: field.name,
                          display: field.display
                      });
                  });
              });
          });

          // Get data from acc_portal_company_duplicate
          const { data: tableData, error: tableError } = await supabase
              .from('acc_portal_company_duplicate')
              .select('*');
        
          if (tableError) throw tableError;

          // Prepare worksheet data
          const wsData = [];
        
          // Create header row with company names
          const headerRow = ['Fields'];
          companies.forEach(company => {
              headerRow.push(company.company_name);
          });
          wsData.push(headerRow);

          // Add data rows for each field
          fields.forEach(field => {
              const row = [field.display];

              companies.forEach(company => {
                  const record = tableData.find(record => record.id === company.id);
                  row.push(record ? record[field.name] || '' : '');
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
          return { wsData, tableData, companies, fields };
      } catch (error) {
          console.error('Export error:', error);
          toast.error('Failed to export data');
          throw error;
      }
  };

// Modified handleImport function
export const handleImport = async (file: File, activeMainTab: string, activeSubTab: string) => {
  try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rows.length < 2) {
          toast.error('File is empty or invalid');
          return;
      }

      // Fetch ALL mappings and handle multiple rows
      const { data: mappingsData, error: mappingError } = await supabase
          .from('profile_category_table_mapping_2')
          .select('*')
          .eq('Tabs', activeSubTab)
          .eq('main_tab', activeMainTab);

      if (mappingError) {
          console.error('Error fetching mappings:', mappingError);
          toast.error('Failed to fetch mappings');
          return;
      }

      if (!mappingsData || mappingsData.length === 0) {
          toast.error('No mappings found for the selected tab.');
          return;
      }

      // Use the first mapping that matches our criteria
      const mapping = mappingsData[0];
      const structure = mapping.structure;
      const fieldMapping = {};
      const tableMapping = {};

      // Process structure
      structure.sections.forEach(section => {
          section.subsections.forEach(subsection => {
              subsection.fields.forEach(field => {
                  fieldMapping[field.display] = {
                      name: field.name,
                      table: field.table
                  };
                  if (!tableMapping[field.table]) {
                      tableMapping[field.table] = [];
                  }
                  tableMapping[field.table].push(field.name);
              });
          });
      });

      // Fetch companies
      const { data: companies, error: companiesError } = await supabase
          .from('acc_portal_company_duplicate')
          .select('id, company_name');

      if (companiesError) {
          console.error('Error fetching companies:', companiesError);
          toast.error('Failed to fetch companies');
          return;
      }

      if (!companies || companies.length === 0) {
          toast.error('No companies found.');
          return;
      }

      // Create company mapping
      const companyMap = companies.reduce((acc, company) => {
          acc[company.company_name.toLowerCase()] = { id: company.id, name: company.company_name };
          return acc;
      }, {});

      // Process rows and prepare updates
      const headerRow = rows[0];
      const dataToUpdate = new Map();

      // Process each column (company)
      for (let colIndex = 1; colIndex < headerRow.length; colIndex++) {
          const companyName = headerRow[colIndex]?.toString().toLowerCase();
          const company = companyMap[companyName];

          if (!company) {
              console.warn(`Company not found: ${headerRow[colIndex]}`);
              continue;
          }

          const recordData = { company_name: company.name };

          // Process each row (field)
          for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
              const fieldLabel = rows[rowIndex][0];
              const field = fieldMapping[fieldLabel];
              const value = rows[rowIndex][colIndex];

              if (field && value !== undefined && value !== null && value !== '') {
                  const { table, name } = field;
                  
                  if (!dataToUpdate.has(table)) {
                      dataToUpdate.set(table, []);
                  }

                  const existingRecord = recordData[table] || {};
                  existingRecord[name] = value;
                  recordData[table] = existingRecord;
              }
          }

          // Prepare updates for each table
          for (const [tableName, record] of Object.entries(recordData)) {
              if (tableName !== 'company_name' && Object.keys(record).length > 0) {
                  const recordToUpdate = {
                      ...record,
                      company_id: company.id,
                      company_name: company.name
                  };
              
                  dataToUpdate.get(tableName)?.push(recordToUpdate);
              }
          }
      }

      // Execute updates
      const updatePromises = [];
      for (const [tableName, records] of dataToUpdate) {
          if (records.length === 0) continue;

          console.log(`Processing ${records.length} records for table ${tableName}`);
          
          for (const record of records) {
              // Check if record exists
              const { data: existingRecords, error: existingError } = await supabase
                  .from(tableName)
                  .select('id')
                  .eq('company_id', record.company_id)
                  .maybeSingle(); // Use maybeSingle instead of single

              if (existingError) {
                  console.error(`Error checking existing record: ${existingError.message}`);
                  continue;
              }

              let queryPromise;
              if (existingRecords?.id) {
                  // Update existing record
                  queryPromise = supabase
                      .from(tableName)
                      .update(record)
                      .eq('id', existingRecords.id);
              } else {
                  // Insert new record
                  queryPromise = supabase
                      .from(tableName)
                      .insert(record);
              }

              updatePromises.push(queryPromise);
          }
      }

      // Execute all updates
      const results = await Promise.all(updatePromises);
      console.log('Update results:', results);

      toast.success('Import completed successfully');
      window.dispatchEvent(new Event('refreshData'));
      
  } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data');
  }
};
  
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
        if (value !== null && value !== undefined && value.toString().trim() !== '') {
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
　　 　　　　　　// For acc_portal_company_duplicate table
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