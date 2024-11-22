// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus, Trash, Settings, Edit2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface StructureItem {
  id: number;
  section: string;
  subsection: string;
  table_name: string;
  column_mappings: Record<string, string>;
  column_order: Record<string, number>;
  Tabs: string;
  table_names: Record<string, string[]>;
}
interface Tab {
  name: string;
  sections: Section[];
}
interface Section {
  name: string;
  subsections: Subsection[];
}

interface Subsection {
  name: string;
  tables: string[];
}

// Add these helper functions
const toColumnName = (displayName: string) => {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim();
};

// Add this interface
interface TableColumn {
  column_name: string;
  data_type: string;
}
interface NewStructure {
  section: string;
  subsection: string;
  table_name: string;
  Tabs: string;
  column_mappings: Record<string, string>;
  isNewTab: boolean;
  isNewSection: boolean;
  isNewSubsection: boolean;
  table_names: string[];
}

interface SectionFields {
  [section: string]: {
    fields: string[];
    subsections: {
      [subsection: string]: string[];
    };
  };
}

// Helper function to parse JSON safely
const safeJSONParse = (jsonString: string, fallback: any = {}) => {
  try {
    return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch (error) {
    return fallback;
  }
};

// Helper function to process sections and subsections
const processStructureData = (data: any[]) => {
  const allSections = new Set<string>();
  const allSubsections: Record<string, Set<string>> = {};
  const mappings: Record<string, Record<string, string[]>> = {};

  data.forEach(item => {
    const sectionsData = safeJSONParse(item.sections_sections);
    const subsectionsData = safeJSONParse(item.sections_subsections);
    const columnMappings = safeJSONParse(item.column_mappings);

    // Process sections
    Object.keys(sectionsData).forEach(section => {
      allSections.add(section);
      if (!allSubsections[section]) {
        allSubsections[section] = new Set();
      }
      if (!mappings[section]) {
        mappings[section] = {};
      }
    });

    // Process subsections and their mappings
    Object.entries(subsectionsData).forEach(([section, subs]) => {
      if (!allSubsections[section]) {
        allSubsections[section] = new Set();
      }

      const subsections = Array.isArray(subs) ? subs : [subs];
      subsections.forEach(sub => {
        if (sub) {
          allSubsections[section].add(sub);
          if (!mappings[section][sub]) {
            mappings[section][sub] = [];
          }
        }
      });
    });

    // Process column mappings
    Object.entries(columnMappings).forEach(([key, value]) => {
      const [table, field] = key.split('.');
      Object.keys(sectionsData).forEach(section => {
        const subsection = subsectionsData[section];
        if (subsection) {
          if (!mappings[section][subsection]) {
            mappings[section][subsection] = [];
          }
          if (!mappings[section][subsection].includes(field)) {
            mappings[section][subsection].push(field);
          }
        }
      });
    });
  });

  return {
    sections: Array.from(allSections),
    subsections: Object.fromEntries(
      Object.entries(allSubsections).map(([k, v]) => [k, Array.from(v)])
    ),
    mappings
  };
};



export function SettingsDialog({ mainTabs, mainSections, mainSubsections, onStructureChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [structure, setStructure] = useState<StructureItem[]>([]);
  const [uniqueTabs, setUniqueTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [existingSections, setExistingSections] = useState<string[]>([]);
  const [existingSubsections, setExistingSubsections] = useState<Record<string, string[]>>({});
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedTableFields, setSelectedTableFields] = useState<{ [table: string]: string[] }>({});
  const [newStructure, setNewStructure] = useState<NewStructure>({
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

const [addFieldState, setAddFieldState] = useState({
    displayName: '',
    selectedTables: [],
    selectedFields: {},
    selectedTab: 'new',
    newFieldTable: ''
  });
  const [sectionFields, setSectionFields] = useState<SectionFields>({});
  const resetAddFieldState = () => {
    setAddFieldState({
      displayName: '',
      selectedTables: [],
      selectedFields: {},
      selectedTab: 'new',
      newFieldTable: '',
      hasDropdown: 'no',
      dropdownOptions: []
    });
  };
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [editFieldDialogOpen, setEditFieldDialogOpen] = useState(false);
const [editingField, setEditingField] = useState({
  key: '',
  displayName: '',
  tableName: '',
  columnName: '',
  dropdownOptions: [] as string[],
  hasDropdown: 'no' as 'yes' | 'no'
});
  const resetNewStructure = () => {
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
    setSelectedTables([]);
    setSelectedTableFields({});
  };
  const [editedNames, setEditedNames] = useState({
    tab: '',
    section: '',
    subsection: ''
  });
  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
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

  useEffect(() => {
    fetchTables();
    fetchExistingSectionsAndSubsections();
  }, []);

  const fetchTables = async () => {
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

  const fetchTableColumns = async (tableName: string) => {
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

  useEffect(() => {
    if (selectedTab) {
      fetchExistingSectionsAndSubsections(selectedTab);
    }
  }, [selectedTab]);

  const fetchExistingSectionsAndSubsections = async (tab) => {
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

  const handleAddField = async () => {
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

  const handleEditField = async (key: string) => {
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

  const handleDeleteField = async (key: string) => {
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

  const handleReorder = async (key: string, newOrder: number) => {
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

  const handleCreateTable = async (tableName: string) => {
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

  const handleUpdateSection = async (id: number, updates: Partial<StructureItem>) => {
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
  const handleNameUpdate = async (type: 'tab' | 'section' | 'subsection', oldName: string, newName: string) => {
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
  // Add this function to generate indices
  const generateIndices = (structure: any[]) => {
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
      
      // Safely parse JSON or use default empty object
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
  
    setIndexMapping(newIndexMapping);
  };
  

// Call this in useEffect after fetching structure
useEffect(() => {
  if (structure.length > 0) {
    generateIndices(structure);
  }
}, [structure, uniqueTabs]);
  const handleAddStructure = async () => {
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

  const processColumnMappings = (mappings: Record<string, string>) => {
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

  const fetchSectionFields = async (section) => {
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
  // Add useEffect for section/subsection changes
  useEffect(() => {
    if (newStructure.section && !newStructure.isNewSection) {
      fetchSectionFields(newStructure.section);
    }
  }, [newStructure.section]);

  useEffect(() => {
    if (newStructure.section && newStructure.subsection && !newStructure.isNewSubsection) {
      const subsectionFields = sectionFields[newStructure.section]?.subsections[newStructure.subsection] || [];
      setSelectedTableFields(prevFields => ({
        ...prevFields,
        [newStructure.section]: subsectionFields
      }));
    }
  }, [newStructure.subsection, sectionFields, newStructure.section]);


  const MultiSelectDialog = () => {
    const [tempSelectedTables, setTempSelectedTables] = useState<string[]>(selectedTables);
    const [tempSelectedFields, setTempSelectedFields] = useState<{ [table: string]: string[] }>(selectedTableFields);

    useEffect(() => {
      if (showMultiSelectDialog) {
        setTempSelectedTables(selectedTables);
        setTempSelectedFields(selectedTableFields);
      }
    }, [showMultiSelectDialog, selectedTables, selectedTableFields]);

    return (
      <Dialog open={showMultiSelectDialog} onOpenChange={setShowMultiSelectDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Tables and Fields</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* Tables Selection */}
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <h4 className="font-medium mb-4 text-lg text-gray-800">Select Tables</h4>
              <ScrollArea className="h-[400px]">
                {tables.map(table => (
                  <div key={table} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`multiselect-table-${table}`}
                      checked={tempSelectedTables.includes(table)}
                      onChange={(e) => {
                        setTempSelectedTables(prev =>
                          e.target.checked
                            ? [...prev, table]
                            : prev.filter(t => t !== table)
                        );
                        if (!e.target.checked) {
                          setTempSelectedFields(prev => {
                            const { [table]: _, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor={`multiselect-table-${table}`}
                      className="text-sm text-gray-700 hover:text-gray-900 cursor-pointer flex-1"
                    >
                      {table.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Fields Selection */}
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <h4 className="font-medium mb-4 text-lg text-gray-800">Select Fields</h4>
              <ScrollArea className="h-[400px]">
                {tempSelectedTables.map((tableName, index) => {
                  const tableFields = tableColumns.filter(col => col.table_name === tableName);
                  return (
                    <div key={tableName}>
                      <div className="bg-gray-50 p-3 rounded-t-lg border-b-2 border-primary/20">
                        <h5 className="font-lg text-black">
                          {tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h5>
                      </div>
                      <div className="p-2 mb-4 border-x border-b rounded-b-lg">
                        {tableFields.map(field => (
                          <div
                            key={`${tableName}-${field.column_name}`}
                            className="flex items-center gap-3 p-2.5 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                          >
                            <input
                              type="checkbox"
                              id={`multiselect-field-${tableName}-${field.column_name}`}
                              checked={tempSelectedFields[tableName]?.includes(field.column_name) || false}
                              onChange={(e) => {
                                setTempSelectedFields(prev => ({
                                  ...prev,
                                  [tableName]: e.target.checked
                                    ? [...(prev[tableName] || []), field.column_name]
                                    : (prev[tableName] || []).filter(f => f !== field.column_name)
                                }));
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label
                              htmlFor={`multiselect-field-${tableName}-${field.column_name}`}
                              className="text-sm text-gray-700 hover:text-gray-900 cursor-pointer flex-1"
                            >
                              {field.column_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              <span className="ml-2 text-xs text-gray-500">({field.data_type})</span>
                            </label>
                          </div>
                        ))}
                      </div>
                      {index < tempSelectedTables.length - 1 && (
                        <div className="h-4 border-l-2 border-r-2 border-dashed border-gray-200 mx-4" />
                      )}
                    </div>
                  );
                })}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMultiSelectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setSelectedTables(tempSelectedTables);
                setSelectedTableFields(tempSelectedFields);
                setNewStructure(prev => ({
                  ...prev,
                  table_names: tempSelectedTables,
                  column_mappings: Object.entries(tempSelectedFields).reduce((acc, [table, fields]) => {
                    fields.forEach(field => {
                      acc[`${table}.${field}`] = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    });
                    return acc;
                  }, {})
                }));
                setShowMultiSelectDialog(false);
              }}
            >
              Apply Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Handle Tab Selection
  const handleTabSelection = async (tabValue: string, isNewStructure: boolean = false) => {
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

  const handleSectionSelection = async (sectionValue: string) => {
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

  // Handle Subsection Selection
  const handleSubsectionSelection = async (subsectionValue: string) => {
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
  
  const handleAddNewField = async () => {
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

  const handleAddExistingFields = async () => {
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
  const handleNewStructureTabSelection = async (tabValue: string) => {
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
  const EditFieldDialog = () => (
    <Dialog open={editFieldDialogOpen} onOpenChange={setEditFieldDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Field</DialogTitle>
        </DialogHeader>
  
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Table Name</label>
              <Input value={editingField.tableName} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Column Name</label>
              <Input value={editingField.columnName} disabled />
            </div>
          </div>
  
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input 
              value={editingField.displayName}
              onChange={(e) => setEditingField(prev => ({
                ...prev,
                displayName: e.target.value
              }))}
            />
          </div>
  
          <div className="space-y-2">
            <label className="text-sm font-medium">Has Dropdown Options?</label>
            <Select
              value={editingField.hasDropdown}
              onValueChange={(value: 'yes' | 'no') => setEditingField(prev => ({
                ...prev,
                hasDropdown: value,
                dropdownOptions: value === 'no' ? [] : prev.dropdownOptions
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
  
          {editingField.hasDropdown === 'yes' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Dropdown Options</label>
              <div className="space-y-2">
                {editingField.dropdownOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editingField.dropdownOptions];
                        newOptions[index] = e.target.value;
                        setEditingField(prev => ({
                          ...prev,
                          dropdownOptions: newOptions
                        }));
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditingField(prev => ({
                          ...prev,
                          dropdownOptions: prev.dropdownOptions.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingField(prev => ({
                      ...prev,
                      dropdownOptions: [...prev.dropdownOptions, '']
                    }));
                  }}
                >
                  Add Option
                </Button>
              </div>
            </div>
          )}
        </div>
  
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditFieldDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveFieldEdit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  // Add the save handler:
  const handleSaveFieldEdit = async () => {
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
  const toggleSectionVisibility = (section: string) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const toggleCategoryVisibility = (category: string) => {
    setCategoryVisibility(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  const toggleColumnVisibility = (column: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };
  
  const resetAll = () => {
    setSectionVisibility({});
    setCategoryVisibility({});
    setColumnVisibility({});
  };
  
  // Add function to save visibility settings
  const handleSaveVisibilitySettings = async () => {
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
  
  // Add useEffect to load initial visibility settings
  useEffect(() => {
    const loadVisibilitySettings = async () => {
      try {
        const { data, error } = await supabase
          .from('visibility_settings')
          .select('*')
          .single();
  
        if (error) throw error;
  
        if (data) {
          setSectionVisibility(data.sections || {});
          setCategoryVisibility(data.categories || {});
          setColumnVisibility(data.columns || {});
        }
      } catch (error) {
        console.error('Error loading visibility settings:', error);
      }
    };
  
    loadVisibilitySettings();
  }, []);
  
  // Add useEffect to initialize visibility settings based on structure
  useEffect(() => {
    if (structure.length > 0) {
      const newSectionVisibility = {};
      const newCategoryVisibility = {};
      const newColumnVisibility = {};
  
      structure.forEach(item => {
        // Initialize sections
        if (item.sections_sections) {
          Object.keys(item.sections_sections).forEach(section => {
            newSectionVisibility[section] = true;
          });
        }
  
        // Initialize categories and columns from mappings
        if (item.column_mappings) {
          Object.entries(item.column_mappings).forEach(([key, value]) => {
            const [table, field] = key.split('.');
            newCategoryVisibility[table] = true;
            newColumnVisibility[field] = true;
          });
        }
      });
  
      setSectionVisibility(prev => ({ ...prev, ...newSectionVisibility }));
      setCategoryVisibility(prev => ({ ...prev, ...newCategoryVisibility }));
      setColumnVisibility(prev => ({ ...prev, ...newColumnVisibility }));
    }
  }, [structure]);
  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen} modal>
        <DialogContent className="max-w-8xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Table Structure Settings</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="structure" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="newstructure">Add Structure</TabsTrigger>
        <TabsTrigger value="structure">Table Structure</TabsTrigger>
        <TabsTrigger value="visibility">Column Management</TabsTrigger>
      </TabsList>

        {/* Table Structure Tab */}
        <TabsContent value="structure" className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            {/* Left Panel - Tabs */}
            <Card className="col-span-2 h-[700px]">
              <CardContent className="p-2">
                <ScrollArea className="h-[700px]">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <h3 className="font-semibold">Tabs</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTab('')}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {uniqueTabs.map(tab => (
                    <button
                      key={tab}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${selectedTab === tab ? 'bg-primary text-white' : 'hover:bg-gray-100'
                        }`}
                      onClick={() => handleTabSelection(tab, false)}
                    >
                        {indexMapping.tabs[tab] || ''} {tab}
                    </button>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Middle Panel - Sections */}
            <Card className="col-span-2 h-[700px]">
              <CardContent className="p-2">
                <ScrollArea className="h-[700px]">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <h3 className="font-semibold">Sections</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSection(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {existingSections
                    .filter(section => {
                      const sectionItems = structure.filter(item =>
                        item.Tabs === selectedTab &&
                        item.sections_sections &&
                        Object.keys(item.sections_sections).includes(section)
                      );
                      return sectionItems.length > 0;
                    })
                    .map(section => (
                      <div
                        key={section}
                        className={`mb-2 p-2 rounded cursor-pointer transition-colors ${selectedSection?.section === section ? 'bg-primary/10' : 'hover:bg-gray-100'
                          }`}
                        onClick={() => setSelectedSection({ section })}
                      >
                        <div className="font-medium"> {indexMapping.sections[section] || ''} {section}</div>
                      </div>
                    ))}

                </ScrollArea>
              </CardContent>
            </Card>

            {/* Subsections Panel */}
            <Card className="col-span-2 h-[700px]">
              <CardContent className="p-2">
                <ScrollArea className="h-[700px]">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <h3 className="font-semibold">Subsections</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSubsection(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedSection && structure
                    .filter(item =>
                      item.Tabs === selectedTab &&
                      item.sections_sections &&
                      item.sections_subsections &&
                      Object.keys(item.sections_sections).includes(selectedSection.section)
                    )
                    .flatMap(item => {
                      const subsections = item.sections_subsections[selectedSection.section] || [];
                      return Array.isArray(subsections) ? subsections : [subsections];
                    })
                    .map(subsection => (
                      <div
                        key={subsection}
                        className={`mb-2 p-2 rounded cursor-pointer transition-colors ${selectedSubsection === subsection ? 'bg-primary/10' : 'hover:bg-gray-100'
                          }`}
                        onClick={() => setSelectedSubsection(subsection)}
                      >
                        <div className="font-medium">{indexMapping.subsections[subsection] || ''} {subsection}</div>
                      </div>
                    ))}

                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right Panel - Details */}
            <Card className="col-span-6 h-[700px]">
              <CardContent className="p-4">
                <ScrollArea className="h-[700px]">
                  {selectedSubsection ? (
                    <div className="space-y-4">
                      {/* Header with Edit Button */}
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Section Details</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing(!editing)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            {editing ? 'View' : 'Edit'}
                          </Button>
                          {editing && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {/* Add delete handler */ }}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Section Info */}
                      <div className="grid gap-4">  
                      <div>
    <label className="text-sm font-medium">Tab Name</label>
    <Input
      value={editedNames.tab || selectedTab}
      disabled={!editing}
      onChange={(e) => setEditedNames(prev => ({ ...prev, tab: e.target.value }))}
      onBlur={() => {
        if (editedNames.tab && editedNames.tab !== selectedTab) {
          handleNameUpdate('tab', selectedTab, editedNames.tab);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && editedNames.tab && editedNames.tab !== selectedTab) {
          handleNameUpdate('tab', selectedTab, editedNames.tab);
        }
      }}
    />
  </div>
  <div>
    <label className="text-sm font-medium">Section Name</label>
    <Input
      value={editedNames.section || selectedSection?.section}
      disabled={!editing}
      onChange={(e) => setEditedNames(prev => ({ ...prev, section: e.target.value }))}
      onBlur={() => {
        if (editedNames.section && editedNames.section !== selectedSection?.section) {
          handleNameUpdate('section', selectedSection?.section || '', editedNames.section);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && editedNames.section && editedNames.section !== selectedSection?.section) {
          handleNameUpdate('section', selectedSection?.section || '', editedNames.section);
        }
      }}
    />
  </div>
  <div>
    <label className="text-sm font-medium">Subsection Name</label>
    <Input
      value={editedNames.subsection || selectedSubsection}
      disabled={!editing}
      onChange={(e) => setEditedNames(prev => ({ ...prev, subsection: e.target.value }))}
      onBlur={() => {
        if (editedNames.subsection && editedNames.subsection !== selectedSubsection) {
          handleNameUpdate('subsection', selectedSubsection || '', editedNames.subsection);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && editedNames.subsection && editedNames.subsection !== selectedSubsection) {
          handleNameUpdate('subsection', selectedSubsection || '', editedNames.subsection);
        }
      }}
    />
  </div>
                        <div>
                          <label className="text-sm font-medium">Table Name</label>
                          {selectedSection && selectedSubsection && structure
                            .filter(item =>
                              item.Tabs === selectedTab &&
                              item.sections_sections &&
                              Object.keys(item.sections_sections).includes(selectedSection.section) &&
                              item.sections_subsections &&
                              item.sections_subsections[selectedSection.section] === selectedSubsection
                            )
                            .map(item => {
                              const tableNames = typeof item.table_names === 'string'
                                ? JSON.parse(item.table_names)
                                : item.table_names || {};

                              const sectionTables = tableNames[selectedSection.section] || [];

                              return sectionTables.map(tableName => (
                                <Input
                                  key={tableName}
                                  value={tableName || ''}
                                  disabled={!editing}
                                  onChange={(e) => handleUpdateSection(item.id, { table_name: e.target.value })}
                                />
                              ));
                            })}
                        </div>
                      </div>

                      {/* Column Mappings */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Column Mappings</h4>
                          {editing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAddFieldDialogOpen(true)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Field
                            </Button>
                          )}
                        </div>
                        <div className="border rounded-lg">
                          <div className="grid grid-cols-[60px,40px,1fr,1fr,1fr,1fr,120px] gap-2 p-2 bg-gray-50 border-b">
                            <div className="text-sm font-medium text-gray-500">Order</div>
                            <div className="text-sm font-medium text-gray-500">#</div>
                            <div className="text-sm font-medium text-gray-500">Column Name</div>
                            <div className="text-sm font-medium text-gray-500">Display Name</div>
                            <div className="text-sm font-medium text-gray-500">Table Name</div>
                            <div className="text-sm font-medium text-gray-500">Dropdown Options</div>
                            <div className="text-sm font-medium text-gray-500">Actions</div>
                          </div>
                          <ScrollArea className="h-[300px]" orientation="both">
                            {selectedSection && selectedSubsection && structure
                              .filter(item =>
                                item.Tabs === selectedTab &&
                                item.sections_sections &&
                                Object.keys(item.sections_sections).includes(selectedSection.section) &&
                                item.sections_subsections &&
                                item.sections_subsections[selectedSection.section] === selectedSubsection
                              )
                              .map(item => {
                                const columnMappings = typeof item.column_mappings === 'string'
                                  ? JSON.parse(item.column_mappings)
                                  : item.column_mappings;

                                const dropdowns = item.field_dropdowns || {};

                                return Object.entries(columnMappings)
                                  .sort((a, b) => {
                                    const orderA = item.column_order?.[a[0]] || 0;
                                    const orderB = item.column_order?.[b[0]] || 0;
                                    return orderA - orderB;
                                  })
                                  .map(([key, value], index) => (
                                    <div key={key} className="grid grid-cols-[60px,40px,1fr,1fr,1fr,1fr,120px] gap-2 p-2 border-b last:border-b-0 hover:bg-gray-50">
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm text-gray-500">{index + 1}</span>
                                      </div>
                                      <div className="text-sm text-gray-500">{index + 1}</div>
                                      <div className="text-sm">{key.split('.')[1]}</div>
                                      <div className="text-sm">{value}</div>
                                      <div className="text-sm">{key.split('.')[0]}</div>
                                      <div className="text-sm">
                                        {dropdowns[key] && (
                                          <div className="flex flex-wrap gap-1">
                                            {dropdowns[key].map((option, idx) => (
                                              <div key={idx} className="text-xs py-1 px-2 bg-gray-50 rounded-md border">
                                                {option}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditField(key)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Edit2 className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteField(key)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Trash className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </div>
                                    </div>
                                  ));
                              })}
                            <ScrollBar orientation="horizontal" />
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Settings className="h-12 w-12 mb-4" />
                      <p>Select a section to view details</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
            </div>
      </TabsContent>

      <TabsContent value="newstructure" className="space-y-6">
          {/* Add New Structure UI */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-6">Add New Structure</h3>
            <div className="flex flex-row md:flex-row gap-4">
              {/* Tab Selection/Creation */}
              <div className="space-y-3 w-full md:w-1/2 mb-4">
                <label className="text-sm font-medium text-gray-700">Tab</label>
                <Select
                  value={newStructure.Tabs}
                  onValueChange={(value) => handleTabSelection(value, true)}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select or Create Tab" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueTabs.filter(tab => tab?.trim()).map(tab => (
                      <SelectItem key={tab} value={tab}>{tab}</SelectItem>
                    ))}
                    <SelectItem value="new" className="text-blue-600 font-medium">+ Create New Tab</SelectItem>
                  </SelectContent>
                </Select>

                {/* Add this input field for new tab */}
                {newStructure.isNewTab && (
                  <Input
                    placeholder="Enter new tab name"
                    value={newStructure.Tabs}
                    onChange={(e) => setNewStructure(prev => ({
                      ...prev,
                      Tabs: e.target.value
                    }))}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Section Selection/Creation */}
              <div className="space-y-3 w-full md:w-1/2 mb-4 ">
                <label className="text-sm font-medium text-gray-700">Section</label>
                <Select
                  value={newStructure.section}
                  onValueChange={(value) => {
                    if (value === 'new') {
                      setNewStructure(prev => ({
                        ...prev,
                        section: '',
                        isNewSection: true,
                        subsection: '',
                        isNewSubsection: false
                      }));
                    } else {
                      handleSectionSelection(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select or Create Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingSections.filter(section => section?.trim()).map(section => (
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                    <SelectItem value="new" className="text-blue-600 font-medium">+ Create New Section</SelectItem>
                  </SelectContent>
                </Select>

                {newStructure.isNewSection && (
                  <Input
                    placeholder="Enter new section name"
                    value={newStructure.section}
                    onChange={(e) => setNewStructure(prev => ({
                      ...prev,
                      section: e.target.value
                    }))}
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-row md:flex-row gap-4">
              {/* Subsection Selection/Creation */}
              <div className="space-y-3 w-full md:w-1/2 mb-4">
                <label className="text-sm font-medium text-gray-700">Subsection</label>
                {!newStructure.isNewSection ? (
                  <Select
                    value={newStructure.subsection}
                    onValueChange={(value) => {
                      if (value === 'new') {
                        setNewStructure(prev => ({
                          ...prev,
                          subsection: '',
                          isNewSubsection: true
                        }));
                      } else {
                        handleSubsectionSelection(value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select or Create Subsection" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* This is the key change - when in new tab mode, always show all subsections */}
                      {(newStructure.isNewTab
                        ? existingSubsections["all"] || []  // Show ALL subsections for new tab
                        : existingSubsections[newStructure.section] || []  // Show section-specific subsections for existing tab
                      )
                        .filter(subsection => subsection?.trim())
                        .map(subsection => (
                          <SelectItem key={subsection} value={subsection}>
                            {subsection}
                          </SelectItem>
                        ))}
                      <SelectItem value="new" className="text-blue-600 font-medium">
                        + Create New Subsection
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Enter new subsection name"
                    value={newStructure.subsection}
                    onChange={(e) => setNewStructure(prev => ({
                      ...prev,
                      subsection: e.target.value
                    }))}
                    className="mt-2"
                  />
                )}

                {!newStructure.isNewSection && newStructure.isNewSubsection && (
                  <Input
                    placeholder="Enter new subsection name"
                    value={newStructure.subsection}
                    onChange={(e) => setNewStructure(prev => ({
                      ...prev,
                      subsection: e.target.value
                    }))}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Table Selection/Creation */}
              <div className="space-y-3 w-full md:w-1/2 mb-4">
                <label className="text-sm font-medium text-gray-700">Tables and Fields</label>
                <Button
                  onClick={() => setShowMultiSelectDialog(true)}
                  variant="outline"
                  className="w-full justify-between"
                  type="button"
                >
                  {selectedTables.length > 0
                    ? `${selectedTables.length} tables selected`
                    : "Select Tables and Fields"}
                  <Plus className="h-4 w-4" />
                </Button>

                {/* Show selected tables and fields preview */}
                {newStructure.table_names.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {newStructure.table_names.map(table => (
                      <div key={table} className="border rounded-md p-2">
                        <h6 className="font-medium text-sm">{table}</h6>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedTableFields[table]?.map(fieldName => (
                            <span key={fieldName} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {fieldName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-row md:flex-row gap-4">
              {/* Preview and Add Button */}
              <div className="pt-6 space-y-6">
                {(newStructure.Tabs || newStructure.isNewTab) &&
                  (newStructure.section || newStructure.isNewSection) && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                      <h4 className="font-medium text-gray-900">Structure Preview</h4>
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Tab:</span>
                              <span className="text-gray-600">{newStructure.Tabs || 'New Tab'}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Section:</span>
                              <span className="text-gray-600">{newStructure.section}</span>
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Subsections:</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {newStructure.subsections?.map(sub => (
                                <span key={sub} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Tables and Fields:</p>
                          <div className="space-y-2">
                            {selectedTables.map(table => (
                              <div key={table} className="border rounded-md p-2 bg-white">
                                <h6 className="font-medium text-sm">{table}</h6>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedTableFields[table]?.map(fieldName => (
                                    <span key={fieldName} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                      {fieldName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                <div className="flex justify-end">
                  <Button
                    onClick={handleAddStructure}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Structure
                  </Button>
                </div>
              </div>  
            </div>
          </div>

      </TabsContent>

       {/* Column Management Tab */}
       <TabsContent value="visibility" className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Section Management */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Section Visibility</h3>
                {Object.entries(sectionVisibility).map(([section, visible]) => (
                  <div key={section} className="flex items-center mb-2">
                    <Checkbox 
                      id={`section-${section}`}
                      checked={visible}
                      onCheckedChange={() => toggleSectionVisibility(section)}
                    />
                    <label className="ml-2" htmlFor={`section-${section}`}>
                      {section}
                    </label>
                  </div>
                ))}
              </div>

              {/* Category Management */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Category Visibility</h3>
                {Object.entries(categoryVisibility).map(([category, visible]) => (
                  <div key={category} className="flex items-center mb-2">
                    <Checkbox 
                      id={`category-${category}`}
                      checked={visible}
                      onCheckedChange={() => toggleCategoryVisibility(category)}
                    />
                    <label className="ml-2" htmlFor={`category-${category}`}>
                      {category}
                    </label>
                  </div>
                ))}
              </div>

              {/* Column Management */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Column Visibility</h3>
                {Object.entries(columnVisibility).map(([column, visible]) => (
                  <div key={column} className="flex items-center mb-2">
                    <Checkbox 
                      id={`column-${column}`}
                      checked={visible}
                      onCheckedChange={() => toggleColumnVisibility(column)}
                    />
                    <label className="ml-2" htmlFor={`column-${column}`}>
                      {column}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Management Tools */}
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <div className="space-x-2">
                  <Button variant="outline" onClick={resetAll}>
                    Reset All
                  </Button>
                  <Button onClick={() => handleSaveVisibilitySettings()}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>

      {/* New Table Dialog */}
      <AlertDialog open={showNewTableDialog} onOpenChange={setShowNewTableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Table</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a name for the new table. It will be created with default columns (id, created_at, updated_at).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="table_name"
              className="mb-2"
            />
            <p className="text-sm text-gray-500">
              Only lowercase letters, numbers, and underscores allowed
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleCreateTable(newTableName)}
              disabled={!newTableName || loadingTable}
            >
              {loadingTable ? 'Creating...' : 'Create Table'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addFieldDialogOpen} onOpenChange={setAddFieldDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Field</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="new" onValueChange={(value) => setAddFieldState(prev => ({ ...prev, selectedTab: value }))}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">Add New Field</TabsTrigger>
              <TabsTrigger value="existing">Add Existing Field</TabsTrigger>
            </TabsList>

            {/* New Field Tab */}
            <div className={addFieldState.selectedTab === 'new' ? 'space-y-4 py-4' : 'hidden'}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  value={addFieldState.displayName}
                  onChange={(e) => setAddFieldState(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Enter display name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Has Dropdown Options?</label>
                <Select
                  value={addFieldState.hasDropdown}
                  onValueChange={(value) => setAddFieldState(prev => ({ ...prev, hasDropdown: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select yes/no" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {addFieldState.hasDropdown === 'yes' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dropdown Options</label>
                  <div className="space-y-2">
                    {addFieldState.dropdownOptions?.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(addFieldState.dropdownOptions || [])];
                            newOptions[index] = e.target.value;
                            setAddFieldState(prev => ({ ...prev, dropdownOptions: newOptions }));
                          }}
                          placeholder="Enter option"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newOptions = addFieldState.dropdownOptions?.filter((_, i) => i !== index);
                            setAddFieldState(prev => ({ ...prev, dropdownOptions: newOptions }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newOptions = [...(addFieldState.dropdownOptions || []), ''];
                        setAddFieldState(prev => ({ ...prev, dropdownOptions: newOptions }));
                      }}
                    >
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Table</label>
                <Select
                  value={addFieldState.newFieldTable}
                  onValueChange={(value) => setAddFieldState(prev => ({ ...prev, newFieldTable: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.filter(table => table?.trim()).map(table => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Existing Fields Tab */}
            <div className={addFieldState.selectedTab === 'existing' ? 'grid grid-cols-2 gap-4 py-4' : 'hidden'}>
              {/* Tables Selection */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Select Tables</h4>
                <ScrollArea className="h-[400px]">
                  {tables.map(table => (
                    <div key={table} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id={`table-${table}`}
                        checked={selectedTables.includes(table)}
                        onChange={(e) => {
                          const newSelection = e.target.checked
                            ? [...selectedTables, table]
                            : selectedTables.filter(t => t !== table);
                          setSelectedTables(newSelection);

                        }}
                        className="h-4 w-4"
                      />
                      <label htmlFor={`table-${table}`}>{table}</label>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {/* Fields Selection */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Select Fields</h4>
                <ScrollArea className="h-[400px]">
                  {selectedTables.map((tableName) => {
                    const tableFields = tableColumns.filter(col => col.table_name === tableName);
                    return (
                      <div key={tableName}>
                        <div className="bg-gray-50 p-3 rounded-t-lg border-b-2 border-primary/20">
                          <h5 className="font-lg text-black">{tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h5>
                        </div>
                        <div className="p-2 mb-4 border-x border-b rounded-b-lg">
                          {tableFields.map(field => (
                            <div key={`${tableName}-${field.column_name}`} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                              <input
                                type="checkbox"
                                id={`field-${tableName}-${field.column_name}`}
                                checked={selectedTableFields[tableName]?.includes(field.column_name) || false}
                                onChange={(e) => {
                                  setSelectedTableFields(prev => ({
                                    ...prev,
                                    [tableName]: e.target.checked
                                      ? [...(prev[tableName] || []), field.column_name]
                                      : (prev[tableName] || []).filter(f => f !== field.column_name)
                                  }));
                                }}
                                className="h-4 w-4"
                              />
                              <label htmlFor={`field-${tableName}-${field.column_name}`}>
                                {field.column_name}
                                <span className="ml-2 text-xs text-gray-500">({field.data_type})</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </ScrollArea>
              </div>
            </div>
          </Tabs>

          <DialogFooter>
            <Button onClick={() => setAddFieldDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => {
              if (addFieldState.selectedTab === 'new') {
                handleAddNewField();
              } else {
                handleAddExistingFields();
              }
            }}>
              Add Field{addFieldState.selectedTab === 'existing' && 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <MultiSelectDialog />
      <EditFieldDialog />
    </>
  );
}