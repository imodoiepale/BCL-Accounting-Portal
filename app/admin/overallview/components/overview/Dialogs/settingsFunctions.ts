// @ts-nocheck
"use client";
import { toast } from "sonner";
import { supabase } from '@/lib/supabaseClient';

export const fetchStructure = async (setStructure, setUniqueTabs, setSelectedTab, toast) => {
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

    setStructure(processedMappings);
    const uniqueTabs = [...new Set(mappings.map(m => m.Tabs))];
    setUniqueTabs(uniqueTabs);

    if (!selectedTab && uniqueTabs.length > 0) {
      setSelectedTab(uniqueTabs[0]);
    }
  } catch (error) {
    console.error('Error fetching structure:', error);
    toast.error('Failed to fetch table structure');
  }
};

export const fetchTables = async (setTables, setTableColumns, toast) => {
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

    setTableColumns(flattenedColumns);
  } catch (error) {
    toast.error('Failed to fetch tables and columns');
  }
};

export const fetchTableColumns = async (tableName, setTableColumns, toast) => {
  try {
    const { data, error } = await supabase.rpc('get_table_columns', {
      input_table_name: tableName
    });

    if (error) throw error;

    const columns = data.map(col => ({
      column_name: col.column_name,
      data_type: col.data_type,
      table_name: tableName
    }));

    setTableColumns(prev => [...prev, ...columns]);
  } catch (error) {
    toast.error('Failed to fetch columns');
  }
};

export const handleAddStructure = async (newStructure, selectedTables, selectedTableFields, setNewStructure, fetchStructure, onStructureChange, toast) => {
  try {
    const payload = {
      sections_sections: JSON.stringify({ [newStructure.section]: true }),
      sections_subsections: JSON.stringify({
        [newStructure.section]: newStructure.subsections
      }),
      Tabs: newStructure.Tabs,
      column_mappings: JSON.stringify(newStructure.column_mappings),
      table_names: JSON.stringify({
        [newStructure.section]: selectedTables
      }),
      column_order: JSON.stringify(
        Object.keys(newStructure.column_mappings).reduce((acc, key, index) => {
          acc[key] = index + 1;
          return acc;
        }, {})
      )
    };

    const { error } = await supabase
      .from('profile_category_table_mapping')
      .insert([payload]);

    if (error) throw error;

    await fetchStructure();
    await onStructureChange();
    setNewStructure({
      section: '',
      subsection: '',
      table_name: '',
      Tabs: '',
      column_mappings: {},
      isNewTab: false,
      isNewSection: false,
      isNewSubsection: false,
      table_names: []
    });
    toast.success('Structure added successfully');

  } catch (error) {
    console.error('Error adding structure:', error);
    toast.error('Failed to add structure');
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

export const handleNewStructureTabSelection = async (tabValue: string) => {
    try {
      if (tabValue === 'new') {
        const { data, error } = await supabase
          .from('profile_category_table_mapping')
          .select('*');

        if (error) throw error;

        const allSections = new Set<string>();
        data.forEach(item => {
          const sectionsData = safeJSONParse(item.sections_sections, {});
          Object.keys(sectionsData).forEach(section => allSections.add(section));
        });

        setExistingSections(Array.from(allSections));
        setNewStructure(prev => ({
          ...prev,
          Tabs: '',
          isNewTab: true
        }));
      } else {
        setNewStructure(prev => ({
          ...prev,
          Tabs: tabValue,
          isNewTab: false
        }));
      }
    } catch (error) {
      console.error('Error in new structure tab selection:', error);
      toast.error('Failed to load tab data');
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
  
export const handleTabSelection = async (tabValue: string, isNewStructure: boolean = false) => {
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

    // Fetch all data associated with this section regardless of tab
    const { data, error } = await supabase
      .from('profile_category_table_mapping')
      .select('*')
      .filter('sections_sections', 'cs', `{"${sectionValue}": true}`);

    if (error) throw error;

    // Process all subsections, tables and mappings for this section
    const allSubsections = new Set();
    const allTables = new Set();
    const allMappings = {};

    data.forEach(item => {
      // Get subsections
      const subsectionsData = safeJSONParse(item.sections_subsections, {});
      if (subsectionsData[sectionValue]) {
        if (Array.isArray(subsectionsData[sectionValue])) {
          subsectionsData[sectionValue].forEach(sub => allSubsections.add(sub));
        } else {
          allSubsections.add(subsectionsData[sectionValue]);
        }
      }

      // Get tables
      const tableNames = safeJSONParse(item.table_names, {})[sectionValue] || [];
      tableNames.forEach(table => allTables.add(table));

      // Get column mappings
      const columnMappings = safeJSONParse(item.column_mappings, {});
      Object.assign(allMappings, columnMappings);
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

// Handle Subsection Selection
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

    let mappingsToUse = {};

    if (newStructure.isNewTab) {
      // For new tab, get all mappings for this section/subsection combination
      const { data, error } = await supabase
        .from('profile_category_table_mapping')
        .select('*');

      if (error) throw error;

      const relevantStructure = data.find(item => {
        const sections = safeJSONParse(item.sections_sections);
        const subsections = safeJSONParse(item.sections_subsections);
        return Object.keys(sections).includes(newStructure.section) &&
          subsections[newStructure.section] === subsectionValue;
      });

      if (relevantStructure) {
        mappingsToUse = safeJSONParse(relevantStructure.column_mappings);
      }
    } else {
      // For existing tab, get mappings only from this tab
      const existingStructure = structure.find(item =>
        item.Tabs === newStructure.Tabs &&
        item.sections_sections &&
        Object.keys(safeJSONParse(item.sections_sections)).includes(newStructure.section) &&
        safeJSONParse(item.sections_subsections)[newStructure.section] === subsectionValue
      );

      if (existingStructure) {
        mappingsToUse = safeJSONParse(existingStructure.column_mappings);
      }
    }

    // Extract tables and fields
    const mappings = Object.entries(mappingsToUse).reduce((acc, [key, value]) => {
      const [table, field] = key.split('.');
      if (!acc[table]) {
        acc[table] = [];
      }
      acc[table].push(field);
      return acc;
    }, {} as Record<string, string[]>);

    // Update states
    setSelectedTables(Object.keys(mappings));
    setSelectedTableFields(mappings);

    setNewStructure(prev => ({
      ...prev,
      subsection: subsectionValue,
      isNewSubsection: false,
      table_names: Object.keys(mappings),
      column_mappings: mappingsToUse
    }));

  } catch (error) {
    console.error('Error in subsection selection:', error);
    toast.error('Failed to load subsection data');
  }
};