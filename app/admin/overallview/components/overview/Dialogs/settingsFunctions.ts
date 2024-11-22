// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { toast } from "sonner";

export const safeJSONParse = (jsonString: string, fallback: any = {}) => {
  try {
    return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch (error) {
    return fallback;
  }
};

export const useSettingsState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [structure, setStructure] = useState<StructureItem[]>([]);
  const [uniqueTabs, setUniqueTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [existingSections, setExistingSections] = useState<string[]>([]);
  const [existingSubsections, setExistingSubsections] = useState<Record<string, string[]>>({});
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedTableFields, setSelectedTableFields] = useState<{ [table: string]: string[] }>({});
  const [newStructure, setNewStructure] = useState<NewStructure>({section: '',subsection: '',table_name: '',Tabs: '',column_mappings: {},isNewTab: false,isNewSection: false,isNewSubsection: false,table_names: [] });
  const [selectedSection, setSelectedSection] = useState<StructureItem | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [newField, setNewField] = useState({ key: '', value: '' });
  const [tables, setTables] = useState<string[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [showNewTableDialog, setShowNewTableDialog] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [loadingTable, setLoadingTable] = useState(false);
  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
  const [showMultiSelectDialog, setShowMultiSelectDialog] = useState(false);
  const [availableFields, setAvailableFields] = useState<{ table: string, fields: TableColumn[] }[]>([]);
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({});
  const [categoryVisibility, setCategoryVisibility] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [indexMapping, setIndexMapping] = useState<{
    tabs: { [key: string]: number },
    sections: { [key: string]: string },
    subsections: { [key: string]: string }
  }>({
    tabs: {},
    sections: {},
    subsections: {}
  });
const [addFieldState, setAddFieldState] = useState({ displayName: '', selectedTables: [], selectedFields: {}, selectedTab: 'new', newFieldTable: ''});
  const [sectionFields, setSectionFields] = useState<SectionFields>({});
  const resetAddFieldState = () => { setAddFieldState({   displayName: '',   selectedTables: [],   selectedFields: {},   selectedTab: 'new',   newFieldTable: '',   hasDropdown: 'no',   dropdownOptions: [] });};
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [editFieldDialogOpen, setEditFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState({ key: '', displayName: '', tableName: '', columnName: '', dropdownOptions: [] as string[], hasDropdown: 'no' as 'yes' | 'no' });
  const resetNewStructure = () => { setNewStructure({   section: '',   subsection: '',   table_name: '',   Tabs: '',   column_mappings: {},   isNewTab: false,   isNewSection: false,   isNewSubsection: false,   table_names: [] }); setSelectedTables([]); setSelectedTableFields({}) };
  const [editedNames, setEditedNames] = useState({ tab: '', section: '', subsection: ''  }); 

return {
  isOpen, setIsOpen,
  structure, setStructure,
  uniqueTabs, setUniqueTabs,
  selectedTab, setSelectedTab,
  existingSections, setExistingSections,
  existingSubsections, setExistingSubsections,
  selectedTables, setSelectedTables,
  selectedTableFields, setSelectedTableFields,
  newStructure, setNewStructure,
  selectedSection, setSelectedSection,
  selectedSubsection, setSelectedSubsection,
  editing, setEditing,
  newField, setNewField,
  tables, setTables,
  tableColumns, setTableColumns,
  selectedFields, setSelectedFields,
  showNewTableDialog, setShowNewTableDialog,
  newTableName, setNewTableName,
  loadingTable, setLoadingTable,
  addFieldDialogOpen, setAddFieldDialogOpen,
  showMultiSelectDialog, setShowMultiSelectDialog,
  availableFields, setAvailableFields,
  sectionVisibility, setSectionVisibility,
  categoryVisibility, setCategoryVisibility,
  columnVisibility, setColumnVisibility,
  indexMapping, setIndexMapping,
  addFieldState, setAddFieldState,
  sectionFields, setSectionFields,
  resetAddFieldState,
  tabs, setTabs,
  editFieldDialogOpen, setEditFieldDialogOpen,
  editingField, setEditingField,
  resetNewStructure,
  editedNames, setEditedNames
};};


export const fetchStructure = async () => {
  try {
    const { data: mappings, error } = await supabase
      .from('profile_category_table_mapping')
      .select('*')
      .order('Tabs', { ascending: true });

    if (error) throw error;

    const processedMappings = mappings.map(mapping => ({
      id: mapping.id,
      section: mapping.section,
      subsection: mapping.subsection,
      table_name: mapping.table_name,
      column_mappings: typeof mapping.column_mappings === 'string'
        ? JSON.parse(mapping.column_mappings)
        : mapping.column_mappings || {},
      column_order: mapping.column_order || {},
      Tabs: mapping.Tabs,
      sections_subsections: typeof mapping.sections_subsections === 'string'
        ? JSON.parse(mapping.sections_subsections)
        : mapping.sections_subsections || {},
      sections_sections: typeof mapping.sections_sections === 'string'
        ? JSON.parse(mapping.sections_sections)
        : mapping.sections_sections || {},
      field_dropdowns: typeof mapping.field_dropdowns === 'string'
        ? JSON.parse(mapping.field_dropdowns)
        : mapping.field_dropdowns || {}
    }));

    return {
      processedMappings,
      uniqueTabs: [...new Set(mappings.map(m => m.Tabs))]
    };
  } catch (error) {
    console.error('Error fetching structure:', error);
    toast.error('Failed to fetch table structure');
    return {
      processedMappings: [],
      uniqueTabs: []
    };
  }
};


export const fetchTables = async () => {
  try {
    const { data: tablesData, error: tablesError } = await supabase.rpc('get_all_tables');
    if (tablesError) throw tablesError;

    const tableNames = tablesData.map(t => t.table_name).sort();
    setTables(tableNames);

    const columnsPromises = tableNames.map(async (tableName) => {
      const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
        input_table_name: tableName
      });

      if (columnsError) throw columnsError;

      return {
        table_name: tableName,
        columns: columns.map(col => ({
          ...col,
          table_name: tableName
        }))
      };
    });

    const allTableColumns = await Promise.all(columnsPromises);
    const flattenedColumns = allTableColumns.reduce((acc, table) => {
      return [...acc, ...table.columns];
    }, []);

    // console.log('Tables with columns:', allTableColumns);
    setTableColumns(flattenedColumns);
  } catch (error) {
    toast.error('Failed to fetch tables and columns');
  }
};

export const fetchTableColumns = async (tableName: string) => {
  try {
    const { data, error } = await supabase.rpc('get_table_columns', {
      input_table_name: tableName
    });

    if (error) throw error;

    const columns = data.map(col => ({
      column_name: col.column_name,
      data_type: col.data_type,
      table_name: tableName // Add table name to track source
    }));

    setTableColumns(prev => [...prev, ...columns]);
  } catch (error) {
    toast.error('Failed to fetch columns');
  }
};

export const fetchExistingSectionsAndSubsections = async (tab) => {
  try {
    const { data, error } = await supabase
      .from('profile_category_table_mapping')
      .select('sections_sections, sections_subsections')
      .eq('Tabs', tab);

    if (error) throw error;

    const sections = [];
    const subsections = {};

    data.forEach(item => {
      const sectionsData = item.sections_sections ? JSON.parse(item.sections_sections) : {};
      const subsectionsData = item.sections_subsections ? JSON.parse(item.sections_subsections) : {};

      Object.keys(sectionsData).forEach(section => {
        if (!sections.includes(section)) {
          sections.push(section);
        }
        if (!subsections[section]) {
          subsections[section] = [];
        }
        if (subsectionsData[section]) {
          subsections[section].push(subsectionsData[section]);
        }
      });
    });

    setExistingSections(sections);
    setExistingSubsections(subsections);
  } catch (error) {
    toast.error('Failed to fetch sections and subsections');
  }
};

export const handleAddField = async () => {
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

export const handleEditField = async (key: string) => {
  const currentStructure = structure.find(item =>
    item.Tabs === selectedTab &&
    item.sections_sections &&
    Object.keys(item.sections_sections).includes(selectedSection.section) &&
    item.sections_subsections &&
    item.sections_subsections[selectedSection.section] === selectedSubsection
  );

  if (!currentStructure) return;

  const columnMappings = typeof currentStructure.column_mappings === 'string'
    ? JSON.parse(currentStructure.column_mappings)
    : currentStructure.column_mappings;

  const dropdowns = currentStructure.field_dropdowns || {};
  const [tableName, columnName] = key.split('.');

  setEditingField({
    key,
    displayName: columnMappings[key],
    tableName,
    columnName,
    dropdownOptions: dropdowns[key] || [],
    hasDropdown: dropdowns[key]?.length > 0 ? 'yes' : 'no'
  });

  setEditFieldDialogOpen(true);
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

export const handleReorder = async (key: string, newOrder: number) => {
  if (!selectedSection) return;

  try {
    // Update column order
    const { error: updateError } = await supabase.rpc('update_column_order_overalltable', {
      p_table_name: selectedSection.table_name,
      p_column_name: key,
      p_new_order: newOrder
    });

    if (updateError) throw updateError;

    // Refresh the selected section to get updated order
    const { data: updatedSection } = await supabase
      .from('profile_category_table_mapping')
      .select('*')
      .eq('id', selectedSection.id)
      .single();

    if (updatedSection) {
      setSelectedSection(updatedSection);
    }

    toast.success('Order updated successfully');

  } catch (error) {
    console.error('Error updating order:', error);
    toast.error('Failed to update order');
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

export const handleUpdateSection = async (id: number, updates: Partial<StructureItem>) => {
  try {
    const { error } = await supabase
      .from('profile_category_table_mapping')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await fetchStructure();
    toast.success('Updated successfully');
  } catch (error) {
    toast.error('Update failed');
  }
};

export const handleNameUpdate = async (type: 'tab' | 'section' | 'subsection', oldName: string, newName: string) => {
  console.log('Starting update:', { type, oldName, newName });

  try {
    if (type === 'tab') {
      const { error } = await supabase
        .from('profile_category_table_mapping')
        .update({ Tabs: newName })
        .eq('Tabs', oldName);
      if (error) throw error;
    }
    else if (type === 'section') {
      // Get ALL records that contain this section
      const { data: records, error: fetchError } = await supabase
        .from('profile_category_table_mapping')
        .select('*')

      if (fetchError) throw fetchError;

      for (const record of records) {
        const existingSections = JSON.parse(record.sections_sections || '{}');

        // Only update records that contain this section
        if (existingSections[oldName]) {
          const existingSubsections = JSON.parse(record.sections_subsections || '{}');
          const existingTableNames = JSON.parse(record.table_names || '{}');

          delete existingSections[oldName];
          existingSections[newName] = true;

          existingSubsections[newName] = existingSubsections[oldName];
          delete existingSubsections[oldName];

          existingTableNames[newName] = existingTableNames[oldName];
          delete existingTableNames[oldName];

          const { error: updateError } = await supabase
            .from('profile_category_table_mapping')
            .update({
              sections_sections: JSON.stringify(existingSections),
              sections_subsections: JSON.stringify(existingSubsections),
              table_names: JSON.stringify(existingTableNames)
            })
            .eq('id', record.id);

          if (updateError) throw updateError;
        }
      }
    }
    else if (type === 'subsection') {
      // Get ALL records
      const { data: records, error: fetchError } = await supabase
        .from('profile_category_table_mapping')
        .select('*');

      if (fetchError) throw fetchError;

      for (const record of records) {
        const existingSubsections = JSON.parse(record.sections_subsections || '{}');

        // Only update if this record has the section and subsection
        if (existingSubsections[selectedSection?.section] === oldName) {
          existingSubsections[selectedSection?.section] = newName;

          const { error: updateError } = await supabase
            .from('profile_category_table_mapping')
            .update({
              sections_subsections: JSON.stringify(existingSubsections)
            })
            .eq('id', record.id);

          if (updateError) throw updateError;
        }
      }
    }

    await fetchStructure();
    toast.success(`${type} updated successfully`);

  } catch (error) {
    console.error('Update error:', error);
    toast.error(`Failed to update ${type}`);
  }
};

export const generateIndices = (structure: any[], uniqueTabs: string[]) => {
  const newIndexMapping = {
    tabs: {},
    sections: {},
    subsections: {}
  };

  // Index tabs
  uniqueTabs.forEach((tab, tabIndex) => {
    newIndexMapping.tabs[tab] = tabIndex + 1;
  });

  // Index sections and subsections
  structure.forEach(item => {
    const tabIndex = newIndexMapping.tabs[item.Tabs];
    const sections = typeof item.sections_sections === 'string'
      ? JSON.parse(item.sections_sections)
      : item.sections_sections || {};
    const subsections = typeof item.sections_subsections === 'string'
      ? JSON.parse(item.sections_subsections)
      : item.sections_subsections || {};

    Object.keys(sections).forEach((section, sectionIndex) => {
      newIndexMapping.sections[section] = `${tabIndex}.${sectionIndex + 1}`;
      const sectionSubsections = subsections[section];
      if (Array.isArray(sectionSubsections)) {
        sectionSubsections.forEach((subsection, subsectionIndex) => {
          newIndexMapping.subsections[subsection] = `${tabIndex}.${sectionIndex + 1}.${subsectionIndex + 1}`;
        });
      } else if (sectionSubsections) {
        newIndexMapping.subsections[sectionSubsections] = `${tabIndex}.${sectionIndex + 1}.1`;
      }
    });
  });

  return newIndexMapping;
};

export const handleAddStructure = async () => {
  try {
    console.log('Adding new structure with:', newStructure);

    // Check for matching tab, section, and subsection
    const { data: existingRecord, error: existingError } = await supabase
      .from('profile_category_table_mapping')
      .select('*')
      .eq('Tabs', newStructure.Tabs)
      .eq('sections_sections', JSON.stringify({ [newStructure.section]: true }))
      .eq('sections_subsections', JSON.stringify({ [newStructure.section]: newStructure.subsection }))
      .single();

    if (!existingError && existingRecord) {
      // Update existing record
      const updatedColumnMappings = {
        ...existingRecord.column_mappings,
        ...newStructure.column_mappings
      };

      const { error: updateError } = await supabase
        .from('profile_category_table_mapping')
        .update({
          table_names: JSON.stringify({
            ...JSON.parse(existingRecord.table_names || '{}'),
            [newStructure.section]: newStructure.table_names
          }),
          column_mappings: JSON.stringify(updatedColumnMappings),
          field_dropdowns: JSON.stringify({
            ...JSON.parse(existingRecord.field_dropdowns || '{}'),
            ...newStructure.field_dropdowns
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);

      if (updateError) throw updateError;
    } else {
      // Create new record
      const payload = {
        sections_sections: JSON.stringify({ [newStructure.section]: true }),
        sections_subsections: JSON.stringify({
          [newStructure.section]: newStructure.subsection
        }),
        Tabs: newStructure.Tabs,
        column_mappings: JSON.stringify(newStructure.column_mappings),
        table_names: JSON.stringify({
          [newStructure.section]: newStructure.table_names
        }),
        column_order: JSON.stringify(
          Object.keys(newStructure.column_mappings).reduce((acc, key, index) => {
            acc[key] = index + 1;
            return acc;
          }, {})
        ),
        field_dropdowns: JSON.stringify(newStructure.field_dropdowns)
      };

      const { error: insertError } = await supabase
        .from('profile_category_table_mapping')
        .insert([payload]);

      if (insertError) throw insertError;
    }

    await fetchStructure();
    await onStructureChange();
    resetNewStructure();
    toast.success('Structure added/updated successfully');

  } catch (error) {
    console.error('Error adding/updating structure:', error);
    toast.error('Failed to add/update structure');
  }
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

export const fetchSectionFields = async (section) => {
  try {
    const { data, error } = await supabase
      .from('profile_category_table_mapping')
      .select('sections_sections, sections_subsections, column_mappings, field_dropdowns')
      .eq('sections_sections', JSON.stringify({ [section]: true }));

    if (error) throw error;

    const fields = [];
    const subsectionFields = {};

    data.forEach(item => {
      const columnMappings = typeof item.column_mappings === 'string' ? JSON.parse(item.column_mappings) : item.column_mappings || {};
      const sectionsSubsections = typeof item.sections_subsections === 'string' ? JSON.parse(item.sections_subsections) : item.sections_subsections || {};

      Object.entries(columnMappings).forEach(([key]) => {
        if (!fields.includes(key)) {
          fields.push(key);
        }
      });

      if (sectionsSubsections && sectionsSubsections[section]) {
        const subsection = sectionsSubsections[section];
        if (typeof subsection === 'string') {
          subsectionFields[subsection] = Object.keys(columnMappings);
        } else if (Array.isArray(subsection)) {
          subsection.forEach(sub => {
            subsectionFields[sub] = Object.keys(columnMappings);
          });
        }
      }
    });

    setSectionFields(prev => ({
      ...prev,
      [section]: {
        fields,
        subsections: subsectionFields
      }
    }));
  } catch (error) {
    toast.error('Failed to fetch section fields');
  }
};

export const handleTabSelection = async (  tabValue: string, 
  isNewStructure: boolean = false,
  setSelectedTab: (tab: string) => void,
  setNewStructure: (structure: any) => void,
  setSelectedTables: (tables: string[]) => void,
  setSelectedTableFields: (fields: any) => void,
  fetchExistingSectionsAndSubsections: (tab: string) => void) => {
  try {
    if (isNewStructure) {
      // This is for Add New Structure section
      if (tabValue === 'new') {
        // Load ALL sections and subsections independently for new tab
        const { data, error } = await supabase
          .from('profile_category_table_mapping')
          .select('*');

        if (error) throw error;

        // Get ALL sections and subsections regardless of tab
        const allSections = new Set<string>();
        const allSubsections = new Set<string>();

        data.forEach(item => {
          const sectionsData = safeJSONParse(item.sections_sections, {});
          const subsectionsData = safeJSONParse(item.sections_subsections, {});

          Object.keys(sectionsData).forEach(section => allSections.add(section));
          Object.values(subsectionsData).forEach(subs => {
            if (Array.isArray(subs)) {
              subs.forEach(sub => allSubsections.add(sub));
            } else if (subs) {
              allSubsections.add(subs as string);
            }
          });
        });

        setExistingSections(Array.from(allSections));
        setExistingSubsections({
          "all": Array.from(allSubsections)
        });

        setNewStructure({
          section: '',
          subsection: '',
          table_name: '',
          Tabs: '',
          column_mappings: {},
          isNewTab: true,
          isNewSection: false,
          isNewSubsection: false,
          table_names: []
        });
      } else {
        // Existing tab for new structure
        setNewStructure(prev => ({
          ...prev,
          Tabs: tabValue,
          isNewTab: false
        }));
      }
    } else {
      // This is for Table Structure Settings section
      setSelectedTab(tabValue);
      fetchExistingSectionsAndSubsections(tabValue);
    }

    setSelectedTables([]);
    setSelectedTableFields({});

  } catch (error) {
    console.error('Error in tab selection:', error);
    toast.error('Failed to load tab data');
  }
};

export const handleSectionSelection = async (sectionValue: string) => {
  try {
    if (sectionValue === 'new') {
      setNewStructure(prev => ({
        ...prev,
        section: '',
        isNewSection: true
      }));
      return;
    }

    console.log('Fetching data for section:', sectionValue);

    // Fetch all data associated with this section across all tabs
    const { data, error } = await supabase
      .from('profile_category_table_mapping')
      .select('*')
      .filter('sections_sections', 'cs', `{"${sectionValue}": true}`);

    if (error) throw error;

    console.log('Found data for section:', data);

    // Process all subsections, tables and mappings for this section
    const allSubsections = new Set();
    const allTables = new Set();
    const allMappings = {};

    data.forEach(item => {
      console.log('Processing item:', item);

      // Get subsections
      const subsectionsData = safeJSONParse(item.sections_subsections, {});
      console.log('Subsections data:', subsectionsData);

      if (subsectionsData[sectionValue]) {
        if (Array.isArray(subsectionsData[sectionValue])) {
          subsectionsData[sectionValue].forEach(sub => allSubsections.add(sub));
        } else {
          allSubsections.add(subsectionsData[sectionValue]);
        }
      }

      // Get tables
      const tableNames = safeJSONParse(item.table_names, {})[sectionValue] || [];
      console.log('Table names:', tableNames);
      tableNames.forEach(table => allTables.add(table));

      // Get column mappings
      const columnMappings = safeJSONParse(item.column_mappings, {});
      console.log('Column mappings:', columnMappings);
      Object.assign(allMappings, columnMappings);
    });

    console.log('Processed data:', {
      subsections: Array.from(allSubsections),
      tables: Array.from(allTables),
      mappings: allMappings
    });

    // Update state with all found data
    setNewStructure(prev => ({
      ...prev,
      section: sectionValue,
      isNewSection: false,
      subsections: Array.from(allSubsections),
      table_names: Array.from(allTables),
      column_mappings: allMappings
    }));

    // Update preview data
    setSelectedTables(Array.from(allTables));
    setSelectedTableFields(processColumnMappings(allMappings));

  } catch (error) {
    console.error('Error fetching section data:', error);
    toast.error('Failed to load section data');
  }
};

export const handleSubsectionSelection = async (subsectionValue: string) => {
  try {
    if (subsectionValue === 'new') {
      setNewStructure(prev => ({
        ...prev,
        subsection: '',
        isNewSubsection: true
      }));
      return;
    }

    console.log('Fetching data for subsection:', subsectionValue);

    // Fetch all data associated with this subsection across all tabs and sections
    const { data, error } = await supabase
      .from('profile_category_table_mapping')
      .select('*');

    if (error) throw error;

    console.log('Found data for subsection:', data);

    // Find relevant structure with this subsection
    const relevantStructures = data.filter(item => {
      const subsectionsData = safeJSONParse(item.sections_subsections, {});
      return Object.values(subsectionsData).some(subs => {
        if (Array.isArray(subs)) {
          return subs.includes(subsectionValue);
        }
        return subs === subsectionValue;
      });
    });

    console.log('Relevant structures:', relevantStructures);

    // Combine all mappings and tables
    const allTables = new Set();
    const allMappings = {};

    relevantStructures.forEach(item => {
      // Get tables
      const tableNames = safeJSONParse(item.table_names, {});
      console.log('Table names:', tableNames);
      Object.values(tableNames).flat().forEach(table => allTables.add(table));

      // Get column mappings
      const columnMappings = safeJSONParse(item.column_mappings, {});
      console.log('Column mappings:', columnMappings);
      Object.assign(allMappings, columnMappings);
    });

    console.log('Processed data:', {
      tables: Array.from(allTables),
      mappings: allMappings
    });

    // Update states
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

    // First, find matching tab
    const { data: tabMatches, error: tabError } = await supabase
      .from('profile_category_table_mapping')
      .select('*')
      .eq('Tabs', selectedTab);

    console.log('Tab matches:', tabMatches);
    if (tabError) throw tabError;

    // From tab matches, find matching section
    const sectionMatches = tabMatches.filter(record => {
      const sectionData = JSON.parse(record.sections_sections || '{}');
      return sectionData[selectedSection.section] === true;
    });

    console.log('Section matches:', sectionMatches);

    // From section matches, find matching subsection
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

      // Prepare the new column mapping
      const updatedColumnMappings = {
        ...(typeof matchingRecord.column_mappings === 'string'
          ? JSON.parse(matchingRecord.column_mappings)
          : matchingRecord.column_mappings || {}),
        [`${addFieldState.newFieldTable}.${columnName}`]: addFieldState.displayName
      };

      // Prepare the dropdown options if they exist
      const updatedDropdowns = addFieldState.hasDropdown === 'yes' ? {
        ...(matchingRecord.field_dropdowns || {}),
        [`${addFieldState.newFieldTable}.${columnName}`]: addFieldState.dropdownOptions
      } : matchingRecord.field_dropdowns;

      // Update the matching record
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

export const handleAddExistingFields = async () => {
  console.log('Adding existing fields:', addFieldState.selectedFields);
  if (Object.keys(addFieldState.selectedFields).length === 0) {
    toast.error('Please select at least one field');
    return;
  }

  try {
    // Get all selected tables
    const selectedTables = Object.keys(addFieldState.selectedFields);

    // Process each field for selected tables
    for (const [table, fields] of Object.entries(addFieldState.selectedFields)) {
      console.log('Processing fields for table:', table, fields);
      for (const field of fields) {
        const { error } = await supabase
          .from('profile_categories_mappings')
          .insert([{
            table_name: table,
            column_name: field,
            display_name: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            selected_tables: selectedTables
          }]);

        if (error) throw error;
      }
    }

    // Refresh data
    await Promise.all(selectedTables.map(table => fetchTableColumns(table)));
    await fetchStructure();

    setAddFieldDialogOpen(false);
    setAddFieldState({
      displayName: '',
      selectedTables: [],
      selectedFields: {},
      selectedTab: 'new',
      newFieldTable: ''
    });

    toast.success('Fields added successfully');
  } catch (error) {
    console.error('Error adding existing fields:', error);
    toast.error('Failed to add fields');
  }
};

export const handleSaveFieldEdit = async () => {
  try {
    const currentStructure = structure.find(item =>
      item.Tabs === selectedTab &&
      item.sections_sections &&
      Object.keys(item.sections_sections).includes(selectedSection.section) &&
      item.sections_subsections &&
      item.sections_subsections[selectedSection.section] === selectedSubsection
    );

    if (!currentStructure) return;

    const updatedColumnMappings = {
      ...currentStructure.column_mappings,
      [editingField.key]: editingField.displayName
    };

    const updatedDropdowns = {
      ...currentStructure.field_dropdowns,
      [editingField.key]: editingField.hasDropdown === 'yes' ? editingField.dropdownOptions : []
    };

    const { error } = await supabase
      .from('profile_category_table_mapping')
      .update({
        column_mappings: updatedColumnMappings,
        field_dropdowns: updatedDropdowns
      })
      .eq('id', currentStructure.id);

    if (error) throw error;

    await fetchStructure();
    setEditFieldDialogOpen(false);
    toast.success('Field updated successfully');
  } catch (error) {
    console.error('Error updating field:', error);
    toast.error('Failed to update field');
  }
};

export const toggleSectionVisibility = (section: string) => {
  setSectionVisibility(prev => ({
    ...prev,
    [section]: !prev[section]
  }));
};

export const toggleCategoryVisibility = (category: string) => {
  setCategoryVisibility(prev => ({
    ...prev,
    [category]: !prev[category]
  }));
};

export const toggleColumnVisibility = (column: string) => {
  setColumnVisibility(prev => ({
    ...prev,
    [column]: !prev[column]
  }));
};

export const handleSaveVisibilitySettings = async () => {
  try {
    await supabase.from('visibility_settings').upsert([
      {
        sections: sectionVisibility,
        categories: categoryVisibility,
        columns: columnVisibility,
        updated_at: new Date().toISOString()
      }
    ]);
    toast.success('Visibility settings saved successfully');
  } catch (error) {
    console.error('Error saving visibility settings:', error);
    toast.error('Failed to save visibility settings');
  }
};
