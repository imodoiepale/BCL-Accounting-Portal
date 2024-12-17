// SettingsHandlers.ts
// @ts-nocheck
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import {
  StructureItem,
  VisibilitySettings,
  NewStructure
} from './SettingsState';
import { fetchExistingSectionsAndSubsections } from './settingsFunctions';

interface StateSetters {
  setExistingSections: (sections: string[]) => void;
  setExistingSubsections: (subsections: Record<string, string[]>) => void;
  setNewStructure: (value: any) => void;
  setSelectedTab: (tab: string) => void;
  setSelectedTables: (tables: string[]) => void;
  setSelectedTableFields: (fields: any) => void;
}

const handleAddStructure = async (
  newStructure: NewStructure,
  supabase: SupabaseClient,
  activeMainTab: string,
  resetNewStructure: () => void,
  setAddFieldDialogOpen: (open: boolean) => void,
  fetchStructure: () => Promise<void>,
  onStructureChange: () => void
) => {
  try {
    if (!newStructure.Tabs || !newStructure.section) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { data: existingStructure, error: checkError } = await supabase
      .from('profile_category_table_mapping_2')
      .select('*')
      .eq('main_tab', activeMainTab)
      .eq('Tabs', newStructure.Tabs)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    const newSectionData = {
      name: newStructure.section,
      order: newStructure.order || 1,
      visible: true,
      subsections: [{
        name: newStructure.subsection,
        order: 1,
        visible: true,
        tables: newStructure.table_names,
        fields: Object.entries(newStructure.column_mappings).map(([key, value], index) => ({
          name: key.split('.')[1],
          display: value,
          table: key.split('.')[0],
          order: index + 1,
          visible: true,
          dropdownOptions: newStructure.dropdownOptions?.[key] || []
        }))
      }]
    };

    if (existingStructure) {
      await updateExistingStructure(
        supabase,
        existingStructure,
        newSectionData
      );
    } else {
      await createNewStructure(
        supabase,
        activeMainTab,
        newStructure,
        newSectionData
      );
    }

    await fetchStructure();
    await onStructureChange();
    resetNewStructure();
    setAddFieldDialogOpen(false);
    toast.success('Structure added successfully');

  } catch (error) {
    console.error('Error managing structure:', error);
    toast.error('Failed to manage structure');
  }
};

const handleTabSelect = async (
  tabValue: string,
  isNewStructure: boolean,
  supabase: SupabaseClient,
  stateSetters: StateSetters
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
  } else {
    setSelectedTab(tabValue);
    setNewStructure(prev => ({
      ...prev,
      Tabs: tabValue,
      isNewTab: false
    }));

    if (!isNewStructure) {
      await fetchExistingSectionsAndSubsections(
        tabValue,
        supabase,
        setExistingSections,
        setExistingSubsections
      );
    }
  }

  setSelectedTables([]);
  setSelectedTableFields({});
};

const handleVisibilitySettings = async (
  visibilitySettings: VisibilitySettings,
  selectedTab: string,
  supabase: SupabaseClient,
  activeMainTab: string,
  fetchStructure: () => Promise<void>
) => {
  try {
    const { data: current, error: fetchError } = await supabase
      .from('profile_category_table_mapping_2')
      .select('structure')
      .eq('Tabs', selectedTab)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('profile_category_table_mapping_2')
      .update({
        structure: {
          ...current.structure,
          visibility: visibilitySettings
        },
        updated_at: new Date().toISOString()
      })
      .eq('Tabs', selectedTab);

    if (updateError) throw updateError;

    toast.success('Visibility settings saved successfully');
    await fetchStructure();

  } catch (error) {
    console.error('Error saving visibility settings:', error);
    toast.error('Failed to save visibility settings');
  }
};

const handleReorder = async (
  type: 'tab' | 'section' | 'subsection' | 'column',
  id: string,
  direction: 'up' | 'down',
  structure: StructureItem[],
  selectedTab: string,
  selectedSection: any,
  columnOrder: any,
  currentStructure: any,
  supabase: SupabaseClient,
  fetchStructure: () => Promise<void>
) => {
  const items = type === 'tab' ? uniqueTabs :
    type === 'section' ? structure.find(s => s.Tabs === selectedTab)?.sections :
      type === 'subsection' ? structure.find(s => s.Tabs === selectedTab)?.sections.find(s => s.name === selectedSection?.section)?.subsections :
        columnOrder.columns;

  const currentIndex = items.findIndex(item =>
    type === 'tab' ? item === id :
      type === 'section' ? item.name === id :
        type === 'subsection' ? item.name === id :
          item === id
  );

  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (newIndex < 0 || newIndex >= items.length) return;

  const newOrder = [...items];
  [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

  // Update order in database
  const { error } = await supabase
    .from('profile_category_table_mapping_2')
    .update({
      structure: {
        ...structure,
        order: {
          ...structure.order,
          [type + 's']: newOrder.reduce((acc, item, index) => ({
            ...acc,
            [type === 'tab' ? item : item.name]: index + 1
          }), {})
        }
      }
    })
    .eq('id', currentStructure.id);

  if (!error) {
    await fetchStructure(activeMainTab);
  }
};

// Database operations
const updateExistingStructure = async (
  supabase: SupabaseClient,
  existingStructure: any,
  newSectionData: any
) => {
  const { error } = await supabase
    .from('profile_category_table_mapping_2')
    .update({
      structure: {
        ...existingStructure.structure,
        sections: [...existingStructure.structure.sections, newSectionData]
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', existingStructure.id);

  if (error) throw error;
};

const createNewStructure = async (
  supabase: SupabaseClient,
  activeMainTab: string,
  newStructure: NewStructure,
  newSectionData: any
) => {
  const { error } = await supabase
    .from('profile_category_table_mapping_2')
    .insert({
      main_tab: activeMainTab,
      Tabs: newStructure.Tabs,
      structure: {
        sections: [newSectionData],
        relationships: {},
        visibility: {
          tab: true,
          sections: {
            [newStructure.section]: true
          }
        },
        order: {
          tab: 1,
          sections: {
            [newStructure.section]: 1
          }
        }
      }
    });

  if (error) throw error;
};

const fetchSectionFields = async (section: string) => {
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

const handleSectionSelect = async (
  sectionValue: string,
  supabase: SupabaseClient,
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

    const { data, error } = await supabase
      .from('profile_category_table_mapping_2')
      .select('structure')
      .eq('Tabs', selectedTab)
      .single();

    if (error) throw error;

    const sectionData = data.structure.sections.find(s => s.name === sectionValue);
    if (sectionData) {
      const allTables = new Set<string>();
      const tableFields: Record<string, string[]> = {};

      sectionData.subsections.forEach(subsection => {
        subsection.tables?.forEach(table => {
          allTables.add(table);
          if (!tableFields[table]) tableFields[table] = [];

          subsection.fields
            .filter(f => f.table === table)
            .forEach(f => {
              if (!tableFields[table].includes(f.name)) {
                tableFields[table].push(f.name);
              }
            });
        });
      });

      setNewStructure(prev => ({
        ...prev,
        section: sectionValue,
        isNewSection: false,
        table_names: Array.from(allTables)
      }));

      setSelectedTables(Array.from(allTables));
      setSelectedTableFields(tableFields);
    }

  } catch (error) {
    console.error('Error fetching section data:', error);
    toast.error('Failed to load section data');
  }
};

const handleSubsectionSelect = async (
  subsectionValue: string,
  supabase: SupabaseClient,
  setNewStructure: (value: any) => void,
  setSelectedTables: (tables: string[]) => void,
  setSelectedTableFields: (fields: any) => void,
  processColumnMappings: (mappings: Record<string, string>) => Record<string, string[]>
) => {
  try {
    if (subsectionValue === 'new') {
      setNewStructure(prev => ({
        ...prev,
        subsection: '',
        isNewSubsection: true
      }));
      return;
    }

    setNewStructure(prev => ({
      ...prev,
      subsection: subsectionValue,
      isNewSubsection: false
    }));

  } catch (error) {
    console.error('Error in subsection selection:', error);
    toast.error('Failed to load subsection data');
  }
};


// Export all your existing helper functions and utilities
export {
  handleAddStructure,
  handleTabSelect,
  handleSectionSelect,
  handleSubsectionSelect,
  handleVisibilitySettings,
  handleReorder,
  fetchSectionFields
};