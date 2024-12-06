// utils/dynamicFormUtils.ts
import { supabase } from "@/lib/supabaseClient";

interface TableMapping {
  id: number;
  main_tab: string;
  Tabs: string;
  structure: {
    order: {
      tab: number;
      sections: Record<string, number>;
    };
    sections: Array<{
      name: string;
      order: number;
      visible: boolean;
      subsections: Array<{
        name: string;
        order: number;
        fields: Array<{
          name: string;
          order: number;
          table: string;
          display: string;
          visible: boolean;
          verification: {
            is_verified: boolean;
            verified_at: string;
            verified_by: string;
          };
          dropdownOptions: string[];
        }>;
        tables: string[];
        visible: boolean;
      }>;
    }>;
    visibility: {
      tab: boolean;
      sections: Record<string, boolean>;
    };
    verification: {
      verified_at: string;
      verified_by: string;
      field_verified: boolean;
    };
    relationships: Record<string, any>;
  };
}

export const fetchFormStructure = async () => {
  const { data, error } = await supabase
    .from('profile_category_table_mapping_2')
    .select('*')
    .order('id');

  if (error) throw new Error(`Error fetching form structure: ${error.message}`);
  return data as TableMapping[];
};

export const getStages = (mappings: TableMapping[]) => {
  return mappings
    .filter(mapping => mapping.structure.visibility.tab)
    .map((mapping, index) => ({
      id: index + 1,
      name: mapping.main_tab,
      order: mapping.structure.order.tab
    }))
    .sort((a, b) => a.order - b.order);
};

export const getFormFields = async (currentStage: number, mappings: TableMapping[]) => {
  const currentMapping = mappings.find(m => m.structure.order.tab === currentStage);
  
  if (!currentMapping) return { fields: [], defaultValues: {} };

  const fields = currentMapping.structure.sections
    .flatMap(section => 
      section.subsections.flatMap(subsection =>
        subsection.fields
          .filter(field => field.visible)
          .map(field => ({
            name: field.name,
            label: field.display,
            type: getFieldType(field),
            table: field.table,
            options: field.dropdownOptions,
            order: field.order,
            verification: field.verification
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

const getFieldType = (field: any) => {
  // Add logic to determine field type based on name or other attributes
  if (field.name.includes('date')) return 'date';
  if (field.name.includes('status')) return 'select';
  if (field.name.includes('amount') || field.name.includes('number')) return 'number';
  return 'text';
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