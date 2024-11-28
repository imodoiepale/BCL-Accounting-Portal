// @ts-nocheck 
"use client";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

// Helper functions
export const safeJSONParse = (jsonString: string, fallback: any = {}) => {
    try {
      return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch (error) {
      return fallback;
    }
  };

export const safeJSONStringify = (data: any, fallback = '{}') => {
    try {
      return JSON.stringify(data || {});
    } catch (error) {
      console.error('JSON Stringify Error:', error);
      return fallback;
    }
  };


  export const processStructureData = (data: any) => {
    // Validate input structure
    if (!data || !data.sections || !Array.isArray(data.sections)) {
      console.error('Invalid structure data format');
      return {
        sections: [],
        subsections: {},
        mappings: {}
      };
    }
  
    try {
      const allSections = new Set<string>();
      const allSubsections: Record<string, Set<string>> = {};
      const mappings: Record<string, Record<string, any[]>> = {};
  
      // Process each section
      data.sections.forEach(section => {
        if (section.name) {
          allSections.add(section.name);
          
          if (!allSubsections[section.name]) {
            allSubsections[section.name] = new Set();
          }
  
          // Process subsections
          section.subsections?.forEach(subsection => {
            if (subsection.name) {
              allSubsections[section.name].add(subsection.name);
  
              // Process fields within subsection
              if (subsection.fields) {
                if (!mappings[section.name]) {
                  mappings[section.name] = {};
                }
                mappings[section.name][subsection.name] = subsection.fields;
              }
            }
          });
        }
      });
  
      return {
        sections: Array.from(allSections),
        subsections: Object.fromEntries(
          Object.entries(allSubsections).map(([k, v]) => [k, Array.from(v)])
        ),
        mappings
      };
    } catch (error) {
      console.error('Error processing structure data:', error);
      return {
        sections: [],
        subsections: {},
        mappings: {}
      };
    }
  };
  
export const reorderColumns = (columns: string[], startIndex: number, endIndex: number) => {
  const result = Array.from(columns);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export const getColumnOrder = (structure: any) => {
  if (!structure || !structure.column_order?.columns) return [];
  return Object.entries(structure.column_order.columns)
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key);
};

export const toColumnName = (displayName: string) => {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .trim();
};

// API functions
export const fetchTables = async () => {
  try {
    const { data: tablesData, error: tablesError } = await supabase.rpc('get_all_tables');
    if (tablesError) throw tablesError;
    return tablesData.map(t => t.table_name).sort();
  } catch (error) {
    toast.error('Failed to fetch tables');
    return [];
  }
};

export const fetchTableColumns = async (tableName: string) => {
  if (!tableName) {
    toast.error('Table name is required');
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('get_table_columns', {
      input_table_name: tableName
    });
    if (error) throw error;
    return data.map(col => ({
      column_name: col.column_name,
      data_type: col.data_type,
      table_name: tableName
    }));
  } catch (error) {
    toast.error('Failed to fetch columns');
    return [];
  }
};
export  const handleAddField = async () => {
    if (!selectedSection || !newField.value) return;

    try {
      const columnName = toColumnName(newField.value);

      // Add new column mapping
      const { error: addError } = await supabase.rpc('add_column_mapping_overalltable', {
        p_table_name: selectedSection.table_name,
        p_column_name: columnName,
        p_display_name: newField.value
      });

      if (addError) throw addError;

      // Refresh the table columns
      await fetchTableColumns(selectedSection.table_name);

      // Refresh the selected section to get updated mappings
      const { data: updatedSection } = await supabase
        .from('profile_category_table_mapping')
        .select('*')
        .eq('id', selectedSection.id)
        .single();

      if (updatedSection) {
        setSelectedSection(updatedSection);
      }

      setNewField({ key: '', value: '' });
      setAddFieldDialog(false);
      toast.success('Field added successfully');

    } catch (error) {
      console.error('Error adding field:', error);
      toast.error('Failed to add field');
    }
  };
  export const handleEditField = (
    key: string, 
    structure: any[], 
    selectedTab: string,
    selectedSection: any,
    selectedSubsection: string,
    setEditingField: Function,
    setEditFieldDialogOpen: Function
) => {
    console.log('Edit field clicked:', { key, selectedTab, selectedSection, selectedSubsection });
    
    const section = structure
        .find(item => item.Tabs === selectedTab)
        ?.sections
        .find(s => s.name === selectedSection?.section);

    const subsection = section?.subsections
        .find(sub => sub.name === selectedSubsection);

    console.log('Found subsection:', subsection);

    if (!subsection) {
        console.log('No matching subsection found');
        return;
    }

    // Split the key to get table and field name
    const [table, fieldName] = key.split('-');
    
    // Find the field in the subsection's fields array
    const field = subsection.fields.find(f => 
        f.table === table && f.name === fieldName
    );

    console.log('Found field:', field);
    
    if (field) {
        const editingFieldData = {
            key,
            displayName: field.display,
            tableName: field.table,
            columnName: field.name,
            dropdownOptions: field.dropdownOptions || [],
            hasDropdown: field.dropdownOptions?.length > 0 ? 'yes' : 'no'
        };
        
        console.log('Setting editing field:', editingFieldData);
        setEditingField(editingFieldData);
        
        console.log('Opening dialog...');
        setEditFieldDialogOpen(true);
    }
};

  export const handleDeleteField = async (key: string) => {
    if (!selectedSection) return;

    try {
      // Delete column mapping
      const { error: deleteError } = await supabase.rpc('delete_column_mapping_overalltable', {
        p_table_name: selectedSection.table_name,
        p_column_name: key
      });

      if (deleteError) throw deleteError;

      // Refresh the table columns
      await fetchTableColumns(selectedSection.table_name);

      // Refresh the selected section to get updated mappings
      const { data: updatedSection } = await supabase
        .from('profile_category_table_mapping')
        .select('*')
        .eq('id', selectedSection.id)
        .single();

      if (updatedSection) {
        setSelectedSection(updatedSection);
      }

      toast.success('Field removed successfully');

    } catch (error) {
      console.error('Error removing field:', error);
      toast.error('Failed to remove field');
    }
  };

  export const handleCreateTable = async (tableName: string) => {
    setLoadingTable(true);
    try {
      // Create table with default mappings
      const { error: createError } = await supabase.rpc('create_table_with_mappings_overalltable', {
        p_table_name: tableName
      });

      if (createError) throw createError;

      await fetchTables();
      setNewTableName('');
      setShowNewTableDialog(false);

      // Set the new table as selected and fetch its columns
      setNewStructure(prev => ({
        ...prev,
        table_name: tableName
      }));
      await fetchTableColumns(tableName);

      toast.success('Table created successfully');

    } catch (error) {
      toast.error('Failed to create table');
      console.error('Error creating table:', error);
    } finally {
      setLoadingTable(false);
    }
  };

  export const handleUpdateSection = async (id: number, updates: any) => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('structure')
        .eq('id', id)
        .single();
  
      if (fetchError) throw fetchError;
  
      const updatedStructure = {
        ...existing.structure,
        sections: existing.structure.sections.map(section => {
          if (section.name === updates.section) {
            return {
              ...section,
              ...updates,
            };
          }
          return section;
        })
      };
  
      const { error: updateError } = await supabase
        .from('profile_category_table_mapping_2')
        .update({ 
          structure: updatedStructure,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
  
      if (updateError) throw updateError;
      toast.success('Updated successfully');
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error('Update failed');
    }
  };
  

  export const handleNameUpdate = async (type: 'tab' | 'section' | 'subsection', oldName: string, newName: string) => {
    try {
      const { data: records, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*');
  
      if (fetchError) throw fetchError;
  
      for (const record of records) {
        let needsUpdate = false;
        const updatedStructure = { ...record.structure };
  
        if (type === 'tab' && record.Tabs === oldName) {
          // Update tab name
          const { error: updateError } = await supabase
            .from('profile_category_table_mapping_2')
            .update({ Tabs: newName })
            .eq('id', record.id);
  
          if (updateError) throw updateError;
        } else if (type === 'section' || type === 'subsection') {
          // Update section or subsection names in structure
          updatedStructure.sections = updatedStructure.sections.map(section => {
            if (type === 'section' && section.name === oldName) {
              needsUpdate = true;
              return { ...section, name: newName };
            }
            if (type === 'subsection') {
              section.subsections = section.subsections.map(subsection => {
                if (subsection.name === oldName) {
                  needsUpdate = true;
                  return { ...subsection, name: newName };
                }
                return subsection;
              });
            }
            return section;
          });
  
          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from('profile_category_table_mapping_2')
              .update({ 
                structure: updatedStructure,
                updated_at: new Date().toISOString()
              })
              .eq('id', record.id);
  
            if (updateError) throw updateError;
          }
        }
      }
  
      toast.success(`${type} updated successfully`);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(`Failed to update ${type}`);
    }
  };
  // Add this function to generate indices
  export const generateIndices = (structure: any[]) => {
    const indexMapping = {
        tabs: {},
        sections: {},
        subsections: {}
      };
        const newIndexMapping = {
      tabs: {},
      sections: {},
      subsections: {}
    };

    // Index tabs and organize by tabs
    const tabStructure = {};
    structure.forEach(item => {
      if (!tabStructure[item.Tabs]) {
        tabStructure[item.Tabs] = [];
      }
      tabStructure[item.Tabs].push(item);
    });

    // Process each tab
    Object.keys(tabStructure).forEach((tab, tabIndex) => {
      const tabNumber = tabIndex + 1;
      newIndexMapping.tabs[tab] = `${tabNumber}.0`;

      // Process items within each tab
      tabStructure[tab].forEach(item => {
        // Safely parse JSON or use default empty object
        const sections = typeof item.sections_sections === 'string'
          ? JSON.parse(item.sections_sections)
          : item.sections_sections || {};

        const subsections = typeof item.sections_subsections === 'string'
          ? JSON.parse(item.sections_subsections)
          : item.sections_subsections || {};

        Object.keys(sections).forEach((section, sectionIndex) => {
          const sectionNumber = `${tabNumber}.${sectionIndex + 1}`;
          newIndexMapping.sections[section] = sectionNumber;

          const sectionSubsections = subsections[section];
          if (Array.isArray(sectionSubsections)) {
            sectionSubsections.forEach((subsection, subsectionIndex) => {
              newIndexMapping.subsections[subsection] = `${sectionNumber}.${subsectionIndex + 1}`;
            });
          } else if (sectionSubsections) {
            newIndexMapping.subsections[sectionSubsections] = `${sectionNumber}.1`;
          }
        });
      });
    });

    return indexMapping; // Return the mapping instead of setting it
};
export const handleTabSelection = async (
  tabValue: string,
  isNewStructure: boolean,
  supabaseClient: any,
  stateSetters: {
    setExistingSections: (sections: string[]) => void;
    setExistingSubsections: (subsections: Record<string, string[]>) => void;
    setNewStructure: (value: any) => void;
    setSelectedTab: (tab: string) => void;
    setSelectedTables: (tables: string[]) => void;
    setSelectedTableFields: (fields: any) => void;
  }
) => {
  const {
    setExistingSections,
    setExistingSubsections,
    setNewStructure,
    setSelectedTab,
    setSelectedTables,
    setSelectedTableFields
  } = stateSetters;

  if (tabValue === 'new') {
    setNewStructure(prev => ({
      ...prev,
      Tabs: '',
      isNewTab: true
    }));
    return;
  }

  setSelectedTab(tabValue);
  setNewStructure(prev => ({
    ...prev,
    Tabs: tabValue,
    isNewTab: false
  }));
  try {
    const processedTabValue = typeof tabValue === 'object' ? tabValue?.name || '' : tabValue;
    setSelectedTab(processedTabValue);

    const { data, error } = await supabaseClient
      .from('profile_category_table_mapping_2')
      .select('structure')
      .eq('Tabs', processedTabValue)
      .single();

    if (error) throw error;

    if (data?.structure?.sections) {
      const sections = data.structure.sections.map(s => s.name);
      const subsectionsMap = data.structure.sections.reduce((acc, section) => {
        acc[section.name] = section.subsections.map(sub => sub.name);
        return acc;
      }, {});

      setExistingSections(sections);
      setExistingSubsections(subsectionsMap);

      // Set tables and fields
      const allTables = new Set();
      const tableFields = {};
      data.structure.sections.forEach(section => {
        section.subsections.forEach(subsection => {
          subsection.tables.forEach(table => {
            allTables.add(table);
            if (!tableFields[table]) tableFields[table] = [];
            subsection.fields
              .filter(f => f.table === table)
              .forEach(f => tableFields[table].push(f.name));
          });
        });
      });

      setSelectedTables(Array.from(allTables));
      setSelectedTableFields(tableFields);
    }
  } catch (error) {
    console.error('Error in tab selection:', error);
    toast.error('Failed to load tab data');
  }
};
export const processStructureForUI = (structure: any) => {
  return {
    sections: structure?.sections || [],
    order: structure?.order || {},
    visibility: structure?.visibility || {},
    relationships: structure?.relationships || {}
  };
};
export const mergeAndProcessStructure = (data: any) => {
  const mergedSections = data.sections.reduce((acc, section) => {
    const existingSection = acc.find(s => s.name === section.name);
    
    if (existingSection) {
      // Merge subsections of matching sections
      existingSection.subsections = [
        ...existingSection.subsections,
        ...section.subsections
      ].sort((a, b) => a.order - b.order);
    } else {
      acc.push({
        ...section,
        subsections: [...section.subsections]
      });
    }
    
    return acc;
  }, []);

  return {
    ...data,
    sections: mergedSections
  };
};

export const handleSectionSelection = async (
  sectionValue: string,
  supabaseClient: any,
  setNewStructure: (value: any) => void,
  setSelectedTables: (tables: string[]) => void,
  setSelectedTableFields: (fields: any) => void,
  selectedTab: string,
  processColumnMappings: (mappings: Record<string, string>) => Record<string, string[]>
) => {
  try {
    if (sectionValue === 'new') {
      setNewStructure(prev => ({
        ...prev,
        section: '',
        isNewSection: true
      }));
      return;
    }

    const { data, error } = await supabaseClient
      .from('profile_category_table_mapping')
      .select('*')
      .filter('sections_sections', 'cs', `{"${sectionValue}": true}`);

    if (error) throw error;

    console.log('Found data for section:', data);

    const allSubsections = new Set();
    const allTables = new Set();
    const allMappings = {};

    data.forEach(item => {
      console.log('Processing item:', item);

      const subsectionsData = safeJSONParse(item.sections_subsections, {});
      console.log('Subsections data:', subsectionsData);

      if (subsectionsData[sectionValue]) {
        if (Array.isArray(subsectionsData[sectionValue])) {
          subsectionsData[sectionValue].forEach(sub => allSubsections.add(sub));
        } else {
          allSubsections.add(subsectionsData[sectionValue]);
        }
      }

      const tableNames = safeJSONParse(item.table_names, {})[sectionValue] || [];
      console.log('Table names:', tableNames);
      tableNames.forEach(table => allTables.add(table));

      const columnMappings = safeJSONParse(item.column_mappings, {});
      console.log('Column mappings:', columnMappings);
      Object.assign(allMappings, columnMappings);
    });

    console.log('Processed data:', {
      subsections: Array.from(allSubsections),
      tables: Array.from(allTables),
      mappings: allMappings
    });

    setNewStructure(prev => ({
      ...prev,
      section: sectionValue,
      isNewSection: false,
      subsections: Array.from(allSubsections),
      table_names: Array.from(allTables),
      column_mappings: allMappings
    }));

    setSelectedTables(Array.from(allTables));
    setSelectedTableFields(processColumnMappings(allMappings));
  } catch (error) {
    console.error('Error fetching section data:', error);
    toast.error('Failed to load section data');
  }
};

export const handleSubsectionSelection = async (
  subsectionValue: string,
  supabaseClient: any,
  setNewStructure: (value: any) => void,
  setSelectedTables: (tables: string[]) => void,
  setSelectedTableFields: (fields: any) => void,
  processColumnMappings: (mappings: Record<string, string>) => Record<string, string[]>
) => {
  try{
    if (subsectionValue === 'new') {
      setNewStructure(prev => ({
        ...prev,
        subsection: '',
        isNewSubsection: true
      }));
      return;
    }

    console.log('Fetching data for subsection:', subsectionValue);

    const { data, error } = await supabase
      .from('profile_category_table_mapping')
      .select('*');

    if (error) throw error;
    if (!data) {
      throw new Error('No data returned from database');
    }

    console.log('Found data for subsection:', data);

    const relevantStructures = data.filter(item => {
      if (!item.sections_subsections) return false;
      const subsectionsData = safeJSONParse(item.sections_subsections, {});
      return Object.values(subsectionsData).some(subs => {
        if (Array.isArray(subs)) {
          return subs.includes(subsectionValue);
        }
        return subs === subsectionValue;
      });
    });

    console.log('Relevant structures:', relevantStructures);

    const allTables = new Set();
    const allMappings = {};

    relevantStructures.forEach(item => {
      const tableNames = safeJSONParse(item.table_names || '{}', {});
      console.log('Table names:', tableNames);
      Object.values(tableNames).flat().forEach(table => {
        if (table) allTables.add(table);
      });

      const columnMappings = safeJSONParse(item.column_mappings || '{}', {});
      console.log('Column mappings:', columnMappings);
      Object.assign(allMappings, columnMappings);
    });

    console.log('Processed data:', {
      tables: Array.from(allTables),
      mappings: allMappings
    });

    setSelectedTables(Array.from(allTables));
    setSelectedTableFields(processColumnMappings(allMappings));

    setNewStructure(prev => ({
      ...prev,
      subsection: subsectionValue,
      isNewSubsection: false,
      table_names: Array.from(allTables),
      column_mappings: allMappings
    }));
  } catch (error) {
    console.error('Error in subsection selection:', error);
    toast.error('Failed to load subsection data');
  }
};

export const handleAddExistingFields = async () => {
  try {
    if (Object.keys(selectedTableFields).length === 0) {
      toast.error('Please select at least one field');
      return;
    }

    const currentStructure = structure.find(item =>
      item.Tabs === selectedTab &&
      item.sections_sections &&
      Object.keys(item.sections_sections).includes(selectedSection.section) &&
      item.sections_subsections &&
      item.sections_subsections[selectedSection.section] === selectedSubsection
    );

    if (!currentStructure) {
      toast.error('No matching structure found');
      return;
    }

    const existingMappings = typeof currentStructure.column_mappings === 'string'
      ? JSON.parse(currentStructure.column_mappings)
      : currentStructure.column_mappings || {};

    const updatedMappings = { ...existingMappings };
    const updatedTableNames = typeof currentStructure.table_names === 'string'
      ? JSON.parse(currentStructure.table_names)
      : currentStructure.table_names || {};

    Object.entries(selectedTableFields).forEach(([table, fields]) => {
      fields.forEach(field => {
        const key = `${table}.${field}`;
        if (!updatedMappings[key]) {
          updatedMappings[key] = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      });

      if (!updatedTableNames[selectedSection.section]) {
        updatedTableNames[selectedSection.section] = [];
      }
      if (!updatedTableNames[selectedSection.section].includes(table)) {
        updatedTableNames[selectedSection.section].push(table);
      }
    });

    const { error } = await supabase
      .from('profile_category_table_mapping')
      .update({
        column_mappings: updatedMappings,
        table_names: updatedTableNames,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentStructure.id);

    if (error) throw error;

    await fetchStructure();
    setAddFieldDialogOpen(false);
    resetAddFieldState();
    toast.success('Fields added successfully');
  } catch (error) {
    console.error('Error adding existing fields:', error);
    toast.error('Failed to add fields');
  }
};

export const handleSaveFieldEdit = async (
  editingField: any,
  structure: any[],
  selectedTab: string,
  selectedSection: any,
  selectedSubsection: string,
  supabaseClient: any,
  fetchStructure: () => Promise<void>
) => {
  try {
    const currentItem = structure.find(item => item.Tabs === selectedTab);
    if (!currentItem || !currentItem.id) {
      throw new Error('Invalid structure ID');
    }

    const updatedStructure = {
      order: currentItem.structure.order,
      sections: currentItem.structure.sections.map(section => {
        if (section.name === selectedSection?.section) {
          return {
            ...section,
            subsections: section.subsections.map(subsection => {
              if (subsection.name === selectedSubsection) {
                return {
                  ...subsection,
                  fields: subsection.fields.map(field => {
                    if (`${field.table}.${field.name}` === editingField.key) {
                      return {
                        ...field,
                        display: editingField.displayName,
                        dropdownOptions: editingField.hasDropdown === 'yes' ? editingField.dropdownOptions : []
                      };
                    }
                    return field;
                  })
                };
              }
              return subsection;
            })
          };
        }
        return section;
      }),
      visibility: currentItem.structure.visibility,
      relationships: currentItem.structure.relationships
    };

    const { error } = await supabaseClient
      .from('profile_category_table_mapping_2')
      .update({ structure: updatedStructure })
      .eq('id', currentItem.id);

    if (error) throw error;
    await fetchStructure();
    toast.success('Field updated successfully');
  } catch (error) {
    console.error('Error updating field:', error);
    toast.error('Failed to update field');
  }
};


export const fetchExistingSectionsAndSubsections = async (
  tab: string,
  supabaseClient: any,
  stateSetters: {
    setExistingSections: (sections: string[]) => void;
    setExistingSubsections: (subsections: Record<string, string[]>) => void;
  }
) => {
  const { setExistingSections, setExistingSubsections } = stateSetters;
  
  try {
    const { data, error } = await supabaseClient
      .from('profile_category_table_mapping')
      .select('sections_sections, sections_subsections')
      .eq('Tabs', tab);

    if (error) throw error;

    const sections = new Set<string>();
    const subsectionsMap = new Map<string, Set<string>>();
    const allSubsections = new Set<string>();

    data?.forEach(item => {
      if (item?.structure?.sections) {
        item.structure.sections.forEach(section => {
          if (section?.name) {
            sections.add(section.name);
            if (!subsectionsMap.has(section.name)) {
              subsectionsMap.set(section.name, new Set<string>());
            }
            section.subsections?.forEach(subsection => {
              if (subsection?.name) {
                subsectionsMap.get(section.name)?.add(subsection.name);
                allSubsections.add(subsection.name);
              }
            });
          }
        });
      }
    });

    const processedSubsections = {
      ...Object.fromEntries(
        Array.from(subsectionsMap.entries()).map(([k, v]) => [k, Array.from(v)])
      ),
      all: Array.from(allSubsections)
    };

    setExistingSections(Array.from(sections));
    setExistingSubsections(processedSubsections);
  } catch (error) {
    console.error('Error fetching sections and subsections:', error);
    toast.error('Failed to fetch sections and subsections');
  }
};


export const validateStructureData = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  // Check required top-level properties
  const requiredProps = ['order', 'sections', 'visibility', 'relationships'];
  if (!requiredProps.every(prop => prop in data)) return false;

  // Validate sections array
  if (!Array.isArray(data.sections)) return false;
  
  // Validate each section
  return data.sections.every(section => {
    if (!section.name || !section.subsections) return false;
    
    // Validate subsections
    return Array.isArray(section.subsections) && section.subsections.every(subsection => {
      if (!subsection.name || !Array.isArray(subsection.fields)) return false;
      
      // Validate fields
      return subsection.fields.every(field => {
        return field.name && field.table && typeof field.display === 'string';
      });
    });
  });
};

// Helper function to create standardized error responses
export const createErrorResponse = (message: string, data?: any) => {
  return {
    error: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};
export const processColumnMappings = (mappings: Record<string, string>) => {
  const result: Record<string, string[]> = {};
  Object.keys(mappings).forEach(key => {
    const [table, field] = key.split('.');
    if (!result[table]) {
      result[table] = [];
    }
    result[table].push(field);
  });
  return result;
};

export const fetchSectionFields = async (section: string) => {
  try {
    const { data, error } = await supabase
      .from('profile_category_table_mapping_2')
      .select('structure')
      .single();

    if (error) throw error;

    const fields: string[] = [];
    const subsectionFields: Record<string, string[]> = {};

    const sectionData = data.structure.sections.find(s => s.name === section);
    if (sectionData) {
      sectionData.subsections.forEach(subsection => {
        subsectionFields[subsection.name] = subsection.fields.map(field => 
          `${field.table}.${field.name}`
        );
        
        // Add to overall fields list
        subsection.fields.forEach(field => {
          const fieldKey = `${field.table}.${field.name}`;
          if (!fields.includes(fieldKey)) {
            fields.push(fieldKey);
          }
        });
      });
    }

    return {
      fields,
      subsections: subsectionFields
    };
  } catch (error) {
    console.error('Error fetching section fields:', error);
    toast.error('Failed to fetch section fields');
    return { fields: [], subsections: {} };
  }
};


export const handleAddNewField = async () => {
  if (!addFieldState.displayName || !addFieldState.newFieldTable) {
    toast.error('Please fill in all fields');
    return;
  }

  try {
    console.log('Starting handleAddNewField with state:', {
      selectedTab,
      selectedSection,
      selectedSubsection,
      addFieldState
    });

    const { data: tabMatches, error: tabError } = await supabase
      .from('profile_category_table_mapping')
      .select('*')
      .eq('Tabs', selectedTab);

    console.log('Tab matches:', tabMatches);
    if (tabError) throw tabError;

    const sectionMatches = tabMatches.filter(record => {
      const sectionData = JSON.parse(record.sections_sections || '{}');
      return sectionData[selectedSection.section] === true;
    });

    console.log('Section matches:', sectionMatches);

    const subsectionMatches = sectionMatches.filter(record => {
      const subsectionData = JSON.parse(record.sections_subsections || '{}');
      return subsectionData[selectedSection.section] === selectedSubsection;
    });

    console.log('Subsection matches:', subsectionMatches);

    if (subsectionMatches.length > 0) {
      const matchingRecord = subsectionMatches[0];
      const columnName = toColumnName(addFieldState.displayName);

      const existingTableNames = typeof matchingRecord.table_names === 'string'
        ? JSON.parse(matchingRecord.table_names)
        : matchingRecord.table_names || {};

      const sectionTableNames = existingTableNames[selectedSection.section] || [];
      const updatedTableNames = {
        ...existingTableNames,
        [selectedSection.section]: sectionTableNames.includes(addFieldState.newFieldTable)
          ? sectionTableNames
          : [...sectionTableNames, addFieldState.newFieldTable]
      };

      const updatedColumnMappings = {
        ...(typeof matchingRecord.column_mappings === 'string'
          ? JSON.parse(matchingRecord.column_mappings)
          : matchingRecord.column_mappings || {}),
        [`${addFieldState.newFieldTable}.${columnName}`]: addFieldState.displayName
      };

      const updatedDropdowns = addFieldState.hasDropdown === 'yes' ? {
        ...(matchingRecord.field_dropdowns || {}),
        [`${addFieldState.newFieldTable}.${columnName}`]: addFieldState.dropdownOptions
      } : matchingRecord.field_dropdowns;

      const { error: updateError } = await supabase
        .from('profile_category_table_mapping')
        .update({
          column_mappings: updatedColumnMappings,
          field_dropdowns: updatedDropdowns,
          table_names: updatedTableNames,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchingRecord.id);

      if (updateError) throw updateError;

      await fetchTableColumns(addFieldState.newFieldTable);
      await fetchStructure();
      setAddFieldDialogOpen(false);
      resetAddFieldState();
      toast.success('Field added successfully');
    } else {
      toast.error('No matching structure found');
    }
  } catch (error) {
    console.error('Error in handleAddNewField:', error);
    toast.error('Failed to add field');
  }
};

// Visibility Settings Handlers
export const handleSaveVisibilitySettings = async (
  structureId: number, 
  visibilitySettings: any
) => {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('profile_category_table_mapping_2')
      .select('structure')
      .eq('id', structureId)
      .single();

    if (fetchError) throw fetchError;

    const updatedStructure = {
      ...existing.structure,
      visibility: visibilitySettings
    };

    const { error: updateError } = await supabase
      .from('profile_category_table_mapping_2')
      .update({ 
        structure: updatedStructure,
        updated_at: new Date().toISOString()
      })
      .eq('id', structureId);

    if (updateError) throw updateError;
    toast.success('Visibility settings saved successfully');
  } catch (error) {
    console.error('Error saving visibility settings:', error);
    toast.error('Failed to save visibility settings');
  }
};

// Helper Functions
export const isVisible = (visibilitySettings, type: string, key: string): boolean => {
  return visibilitySettings[type]?.[key] !== false;
};

export const getVisibleColumns = (structure, visibilitySettings) => {
  const mappings = safeJSONParse(structure?.column_mappings, {});

  return Object.entries(mappings)
    .filter(([key]) => visibilitySettings?.columns?.[key] !== false)
    .sort((a, b) => {
      const orderA = structure?.column_order?.columns?.[a[0]] || 0;
      const orderB = structure?.column_order?.columns?.[b[0]] || 0;
      return orderA - orderB;
    });
};