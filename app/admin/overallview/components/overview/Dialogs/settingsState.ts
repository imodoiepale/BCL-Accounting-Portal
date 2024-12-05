// SettingsState.ts
// @ts-nocheck
import { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from "sonner";

// Interfaces
export interface StructureItem {
  id: number;
  section: string;
  subsection: string;
  table_name: string;
  column_mappings: Record<string, string>;
  column_order: Record<string, number>;
  Tabs: string;
  table_names: Record<string, string[]>;
}

export interface Tab {
  name: string;
  sections: Section[];
}

export interface Section {
  name: string;
  subsections: Subsection[];
}

export interface Subsection {
  name: string;
  tables: string[];
}

export interface VisibilitySettings {
  tabs: { [key: string]: boolean };
  sections: { [key: string]: boolean };
  subsections: { [key: string]: boolean };
  columns: { [key: string]: boolean };
}

export interface OrderSettings {
  tabs: { [key: string]: number };
  sections: { [key: string]: number };
  subsections: { [key: string]: number };
  fields: { [key: string]: number };
}

export interface TableColumn {
  column_name: string;
  data_type: string;
}

export interface NewStructure {
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

// Custom Hooks
export const useStructureState = (supabase: SupabaseClient, activeMainTab: string) => {
  const [structure, setStructure] = useState<StructureItem[]>([]);
  const [mappingData, setMappingData] = useState<any>(null);
  const [uniqueTabs, setUniqueTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [selectedSection, setSelectedSection] = useState<StructureItem | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);

  const fetchStructure = useCallback(async () => {
    try {
      const { data: mappings, error } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*')
        .eq('main_tab', activeMainTab)
        .order('created_at');

      if (error) throw error;

      setMappingData(mappings[0]);
      const processedStructure = mappings.map(mapping => ({
        id: mapping.id,
        Tabs: mapping.Tabs,
        sections: mapping.structure?.sections || [],
        column_mappings: mapping.structure?.column_mappings || {},
        column_order: mapping.structure?.order || {},
        visibility: mapping.structure?.visibility || {},
        table_names: mapping.structure?.table_names || {}
      }));

      setStructure(processedStructure);
      setUniqueTabs([...new Set(mappings.map(m => m.Tabs))]);

    } catch (error) {
      console.error('Error fetching structure:', error);
      toast.error('Failed to fetch structure');
    }
  }, [supabase, activeMainTab]);

  return {
    structure,
    setStructure,
    mappingData,
    setMappingData,
    uniqueTabs,
    setUniqueTabs,
    selectedTab,
    setSelectedTab,
    selectedSection,
    setSelectedSection,
    selectedSubsection,
    setSelectedSubsection,
    fetchStructure
  };
};

export const useVisibilityState = () => {
  const [visibilityState, setVisibilityState] = useState<VisibilitySettings>({
    tabs: {},
    sections: {},
    subsections: {},
    fields: {}
  });

  const [orderState, setOrderState] = useState<OrderSettings>({
    tabs: {},
    sections: {},
    subsections: {},
    fields: {}
  });

  return {
    visibilityState,
    setVisibilityState,
    orderState,
    setOrderState
  };
};

export const useTableState = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedTableFields, setSelectedTableFields] = useState<{ [table: string]: string[] }>({});
  const [newTableName, setNewTableName] = useState('');  
  const [loadingTable, setLoadingTable] = useState(false);
  return {
    tables,
    setTables,
    tableColumns,
    setTableColumns,
    loadingTable, 
    setLoadingTable,
    newTableName,
    setNewTableName,
    selectedTables,
    setSelectedTables,
    selectedTableFields,
    setSelectedTableFields
  };
};

export const useFormState = () => {
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
  const [sectionFields, setSectionFields] = useState<SectionFields>({});
  const [currentStructure, setCurrentStructure] = useState({
    id: '',
    sections_sections: {},
    sections_subsections: {},
    column_mappings: {},
    column_order: {},
    Tabs: '',
    table_names: {}
  });
  const [editingField, setEditingField] = useState({
    key: '',
    displayName: '',
    tableName: '',
    columnName: '',
    dropdownOptions: [] as string[],
    hasDropdown: 'no' as 'yes' | 'no'
  });

  const [addFieldState, setAddFieldState] = useState({
    displayName: '',
    selectedTables: [],
    selectedFields: {},
    selectedTab: 'new',
    newFieldTable: '',
    hasDropdown: 'no',
    dropdownOptions: []
  });

  return {
    newStructure,
    setNewStructure,
    currentStructure,
    setCurrentStructure,
    sectionFields,
    setSectionFields,
    editingField,
    setEditingField,
    addFieldState,
    setAddFieldState
  };
};

// Utility functions
export const processStructureForUI = (structure: any) => {
  if (!structure) return {};
  return {
    sections: structure?.sections || [],
    order: structure?.order || {},
    visibility: structure?.visibility || {},
    relationships: structure?.relationships || {}
  };
};
