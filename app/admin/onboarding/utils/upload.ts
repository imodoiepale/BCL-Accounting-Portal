// utils/upload.ts
// @ts-nocheck
import { supabase } from "@/lib/supabaseClient";
import { TableMapping } from "../types/upload";
import * as XLSX from 'xlsx';

export const fetchFormStructure = async () => {
    const { data, error } = await supabase
      .from('profile_category_table_mapping_2')
      .select('*')
      .eq('main_tab', main_tab) // Fetch specific stages
      .order('structure->order->tab', { ascending: true }); // Order by tab order
  
    if (error) {
      console.error('Error fetching form structure:', error);
      throw error;
    }
  
    return data as TableMapping[];
  };
  
  export const fetchStages = async () => {
    const { data, error } = await supabase
      .from('profile_category_table_mapping_2')
      .select('id, main_tab, structure')
      .order('structure->order->tab', { ascending: true });
  
    if (error) {
      console.error('Error fetching stages:', error);
      throw error;
    }
  
    const groupedData = data.reduce((acc, item) => {
      const existingItem = acc.find(x => x.name === item.main_tab);
      if (existingItem) {
        existingItem.tables = [...new Set([...existingItem.tables, ...extractTablesFromStructure(item.structure)])];
      } else {
        acc.push({
          id: acc.length + 1,
          name: item.main_tab,
          order: item.structure.order.tab,
          tables: extractTablesFromStructure(item.structure)
        });
      }
      return acc;
    }, []);

    return groupedData;
  };  

  const extractTablesFromStructure = (structure: TableMapping['structure']) => {
    const tables = new Set<string>();
    
    structure.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        subsection.tables.forEach(table => tables.add(table));
      });
    });
  
    return Array.from(tables);
  };
  

export const getFieldType = (field: any) => {
  if (field.name.includes('date')) return 'date';
  if (field.name.includes('status')) return 'select';
  if (field.name.includes('amount') || field.name.includes('number')) return 'number';
  return 'text';
};

export const getFormFields = async (currentStage: number, formStructure: TableMapping[]) => {
    const currentMapping = formStructure.find(m => m.structure.order.tab === currentStage);
    
    if (!currentMapping) return { fields: [], defaultValues: {} };
  
    const fields = currentMapping.structure.sections
      .filter(section => section.visible)
      .flatMap(section => 
        section.subsections
          .filter(subsection => subsection.visible)
          .flatMap(subsection =>
            subsection.fields
              .filter(field => field.visible)
              .map(field => ({
                name: field.name,
                label: field.display,
                type: getFieldType(field),
                table: field.table,
                options: field.dropdownOptions,
                order: field.order,
                verification: field.verification,
                section: section.name,
                subsection: subsection.name
              }))
          )
      )
      .sort((a, b) => a.order - b.order);
  
    const defaultValues = fields.reduce((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, {} as Record<string, string>);
  
    return { fields, defaultValues };
  };
  
  export const handleFileUpload = async (
    file: File,
    currentStage: number,
    formStructure: TableMapping[],
    userId: string
  ) => {
    const currentMapping = formStructure.find(m => m.structure.order.tab === currentStage);
    if (!currentMapping) throw new Error('Form structure not found');
  
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx'].includes(fileExtension || '')) {
      throw new Error('Invalid file format. Please upload CSV or XLSX file.');
    }
  
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const content = event.target?.result;
          const parsedData = fileExtension === 'csv'
            ? parseCSV(content as string, userId)
            : parseXLSX(content, userId);
  
          const validatedData = validateDataAgainstStructure(
            parsedData,
            currentMapping.structure
          );
  
          const processedData = prepareDataForSubmission(validatedData, currentMapping);
          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      };
  
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsBinaryString(file);
    });
  };

  const validateDataAgainstStructure = (
    data: any[],
    structure: TableMapping['structure']
  ) => {
    const validFields = new Set(
      structure.sections.flatMap(section =>
        section.subsections.flatMap(subsection =>
          subsection.fields.filter(f => f.visible).map(f => f.name)
        )
      )
    );
  
    return data.map(row => {
      const validatedRow = {};
      Object.entries(row).forEach(([key, value]) => {
        if (validFields.has(key)) {
          validatedRow[key] = value;
        }
      });
      return validatedRow;
    });
  };
  
export const generateTemplateForStage = (
  currentStage: number,
  formStructure: TableMapping[]
) => {
  const currentMapping = formStructure.find(m => m.structure.order.tab === currentStage);
  if (!currentMapping) throw new Error('Form structure not found');

  // Create section headers
  const headerRows: string[][] = [];
  let fieldHeaders: string[] = [];
  let columnMetadata: { section: string; subsection: string; field: string }[] = [];

  currentMapping.structure.sections
    .filter(section => section.visible)
    .forEach(section => {
      section.subsections
        .filter(subsection => subsection.visible)
        .forEach(subsection => {
          const fields = subsection.fields.filter(field => field.visible);
          
          // Add section and subsection headers
          fieldHeaders = [...fieldHeaders, ...fields.map(f => f.display)];
          columnMetadata = [...columnMetadata, ...fields.map(f => ({
            section: section.name,
            subsection: subsection.name,
            field: f.display
          }))];
        });
    });

  // Create the worksheet
  const ws = XLSX.utils.aoa_to_sheet([
    columnMetadata.map(cm => cm.section), // Section row
    columnMetadata.map(cm => cm.subsection), // Subsection row
    fieldHeaders, // Field headers
    Array(fieldHeaders.length).fill('') // Empty row for data
  ]);

  // Set column widths and merge cells for sections/subsections
  let currentCol = 0;
  let currentSection = '';
  let sectionStart = 0;
  columnMetadata.forEach((cm, idx) => {
    const col = XLSX.utils.encode_col(idx);
    ws[`!cols`] = ws[`!cols`] || [];
    ws[`!cols`][idx] = { width: 20 };

    // Merge section cells
    if (cm.section !== currentSection) {
      if (currentSection !== '') {
        const mergeCell = {
          s: { r: 0, c: sectionStart },
          e: { r: 0, c: idx - 1 }
        };
        ws['!merges'] = ws['!merges'] || [];
        ws['!merges'].push(mergeCell);
      }
      currentSection = cm.section;
      sectionStart = idx;
    }
  });

  return ws;
};
  
export const prepareDataForSubmission = (formData: any, mapping: TableMapping) => {
  const tableData: Record<string, any[]> = {};
  
  mapping.structure.sections.forEach(section => {
    section.subsections.forEach(subsection => {
      subsection.tables.forEach(table => {
        if (!tableData[table]) tableData[table] = [];
        
        const tableFields = subsection.fields
          .filter(field => field.table === table)
          .reduce((acc, field) => {
            if (formData[field.name] !== undefined) {
              acc[field.name] = formData[field.name];
            }
            return acc;
          }, {} as Record<string, any>);
          
        if (Object.keys(tableFields).length > 0) {
          tableData[table].push(tableFields);
        }
      });
    });
  });
  
  return tableData;
};

export const submitFormData = async (
  data: Record<string, any[]>,
  userId: string,
  companyName: string
) => {
  const submitPromises = Object.entries(data).map(([table, records]) => {
    const enrichedRecords = records.map(record => ({
      ...record,
      userid: userId,
      company_name: companyName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    return supabase
      .from(table)
      .insert(enrichedRecords)
      .then(({ error }) => {
        if (error) throw new Error(`Error inserting into ${table}: ${error.message}`);
        return table;
      });
  });

  const results = await Promise.allSettled(submitPromises);
  const failures = results.filter(r => r.status === 'rejected');
  
  if (failures.length > 0) {
    throw new Error(`Failed to submit to some tables: ${failures.map(f => (f as PromiseRejectedResult).reason).join(', ')}`);
  }

  return true;
};

export const parseXLSX = (content: any, userId: string) => {
  const workbook = XLSX.read(content, { type: 'binary' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  return jsonData.map(row => {
    const transformedRow = {};
    Object.entries(row).forEach(([key, value]) => {
      const dbKey = key.toLowerCase().replace(/\s+/g, '_');
      transformedRow[dbKey] = value;
    });
    return {
      ...transformedRow,
      userid: userId
    };
  });
};

export const parseCSV = (content: string, userId: string) => {
  const rows = content.split('\n');
  const headers = rows[0].split(',');
  return rows.slice(1)
    .map(row => {
      const values = row.split(',');
      const rowData = headers.reduce((acc, header, index) => {
        const value = values[index]?.trim();
        if (value) acc[header.trim()] = value;
        return acc;
      }, {} as Record<string, string>);
      return { ...rowData, userid: userId };
    })
    .filter(row => Object.keys(row).length > 1);
};