// @ts-nocheck 
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus, Trash, Settings, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { EditFieldDialog } from './EditDialog';
import { MultiSelectDialog } from './MultiselectDialog';
import { fetchTableColumns, fetchTables, getColumnOrder, safeJSONParse, handleSaveFieldEdit, processColumnMappings, fetchSectionFields, fetchExistingSectionsAndSubsections, handleSaveVisibilitySettings, generateIndices, isVisible, getVisibleColumns, handleTabSelection, handleAddNewField, handleSectionSelection, handleNameUpdate, handleUpdateSection, handleCreateTable, handleDeleteField, handleEditField, handleAddField, toColumnName, handleSubsectionSelection, handleAddExistingFields, processStructureForUI, mergeAndProcessStructure } from './settingsFunctions';
import { DraggableColumns, DragHandle, onDragEnd, persistColumnOrder } from './DragOder';
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

interface SettingsDialogProps {
  mainTabs: string[];
  mainSections: string[];
  mainSubsections: string[];
  onStructureChange: () => void;
  activeMainTab: string;
  subTabs: string[];
  processedSections: {
    name: string;
    label: string;
    categorizedFields?: {
      category: string;
      fields: {
        name: string;
        label: string;
        table: string;
        column: string;
        dropdownOptions?: string[];
        subCategory?: string;
      }[];
    }[];
    isSeparator?: boolean;
  }[];
}
interface ColumnOrder {
  order: {
    tabs: { [key: string]: number },
    sections: { [key: string]: number },
    subsections: { [key: string]: number },
    columns: { [key: string]: number }
  },
  visibility: {
    tabs: { [key: string]: boolean },
    sections: { [key: string]: boolean },
    subsections: { [key: string]: boolean },
    columns: { [key: string]: boolean }
  }
}

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
interface VisibilitySettings {
  tabs: { [key: string]: boolean };
  sections: { [key: string]: boolean };
  subsections: { [key: string]: boolean };
  columns: { [key: string]: boolean };
}

interface ColumnOrderState {
  columns: string[];
  visibility: Record<string, boolean>;
}

export function SettingsDialog({ onStructureChange, activeMainTab, processedSections = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [structure, setStructure] = useState<StructureItem[]>([]);
  const [uniqueTabs, setUniqueTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [existingSections, setExistingSections] = useState<string[]>([]);
  const [existingSubsections, setExistingSubsections] = useState<Record<string, string[]>>({});
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [mappingData, setMappingData] = useState<any>(null);
  const [selectedTableFields, setSelectedTableFields] = useState<{ [table: string]: string[] }>({});
  const [processedStructure, setProcessedStructure] = useState(processStructureForUI(mappingData?.structure));

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
  const [currentStructure, setCurrentStructure] = useState({
    id: '',
    sections_sections: {},
    sections_subsections: {},
    column_mappings: {},
    column_order: {},
    Tabs: '',
    table_names: {}
  });
  const [selectedSection, setSelectedSection] = useState<StructureItem | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [newField, setNewField] = useState({ key: '', value: '' });
  const [mainSections, setMainSections] = useState<string[]>([]);
  const [mainSubsections, setMainSubsections] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [showNewTableDialog, setShowNewTableDialog] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [loadingTable, setLoadingTable] = useState(false);
  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
  const [showMultiSelectDialog, setShowMultiSelectDialog] = useState(false);
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
  const [visibilitySettings, setVisibilitySettings] = useState({
    tabs: {},
    sections: {},
    subsections: {},
    columns: {}
  });
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>({
    columns: [],
    visibility: {}
  });

  const [mainTabs, setMainTabs] = useState<string[]>([]);
  const [subTabs, setSubTabs] = useState<string[]>([]);
  useEffect(() => {
    if (mappingData?.structure) {
      setProcessedStructure(processStructureForUI(mappingData.structure));
    }
  }, [mappingData]);

  useEffect(() => {
    if (structure && structure.length > 0) {
      const currentStructure = structure.find(item => item.Tabs === selectedTab);
      if (currentStructure) {
        setColumnOrder({
          columns: getColumnOrder(currentStructure),
          visibility: currentStructure.column_order?.visibility?.columns || {}
        });
      }
    }
  }, [structure, selectedTab]);

  const fetchStructure = useCallback(async (activeMainTab: string) => {
    try {
      const { data: mappings, error } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*')
        .eq('main_tab', activeMainTab)
        .order('created_at');

      if (error) throw error;
      setMappingData(mappings[0]);

      // Process and merge the structure
      const processedStructure = mappings.map(mapping => {
        const structure = mapping.structure || {};
        const mergedStructure = mergeAndProcessStructure(structure);

        return {
          id: mapping.id,
          Tabs: mapping.Tabs,
          sections: mergedStructure.sections,
          column_mappings: mergedStructure.column_mappings || {},
          column_order: mergedStructure.order || {},
          visibility: mergedStructure.visibility || {},
          table_names: mergedStructure.table_names || {}
        };
      });

      setStructure(processedStructure);
      setMappingData(mappings[0]);

      // Extract unique tabs
      const tabs = [...new Set(mappings.map(m => m.Tabs))];
      setUniqueTabs(tabs);

      // Extract sections and subsections
      const sectionsSet = new Set();
      const subsectionsMap = {};

      processedStructure.forEach(item => {
        item.sections.forEach(section => {
          sectionsSet.add(section.name);

          if (!subsectionsMap[section.name]) {
            subsectionsMap[section.name] = new Set();
          }

          section.subsections.forEach(subsection => {
            subsectionsMap[section.name].add(subsection.name);
          });
        });
      });

      setExistingSections(Array.from(sectionsSet));
      const processedSubsections = {};
      Object.keys(subsectionsMap).forEach(section => {
        processedSubsections[section] = Array.from(subsectionsMap[section]);
      });
      setExistingSubsections(processedSubsections);

      // Set visibility settings
      const visibilityState = {
        tabs: {},
        sections: {},
        subsections: {},
        columns: {}
      };

      processedStructure.forEach(item => {
        Object.assign(visibilityState.tabs, item.visibility.tabs || {});
        Object.assign(visibilityState.sections, item.visibility.sections || {});
        Object.assign(visibilityState.subsections, item.visibility.subsections || {});
        Object.assign(visibilityState.columns, item.visibility.columns || {});
      });

      setVisibilitySettings(visibilityState);

      // Set default tab if none selected
      if (!selectedTab && tabs.length > 0) {
        setSelectedTab(tabs[0]);
      }

    } catch (error) {
      console.error('Error fetching structure:', error);
      toast.error('Failed to fetch structure');
    }
  }, [selectedTab]);

  useEffect(() => {
    if (activeMainTab) {
      fetchStructure(activeMainTab);
    }
  }, [activeMainTab]);



  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    const fetchTablesAndColumns = async () => {
      const fetchedTables = await fetchTables();
      setTables(fetchedTables);

      // Fetch columns for each table
      const columnsPromises = fetchedTables.map(table => fetchTableColumns(table));
      const allColumns = await Promise.all(columnsPromises);
      setTableColumns(allColumns.flat());
    };

    fetchTablesAndColumns();
  }, []);
  useEffect(() => {
    if (activeMainTab && setExistingSections && setExistingSubsections) {
      fetchExistingSectionsAndSubsections(
        activeMainTab,
        supabase,
        setExistingSections,
        setExistingSubsections
      );
    }
  }, [activeMainTab]);
  useEffect(() => {
    if (structure && structure.length > 0) {
      const tabs = [...new Set(structure.map(item => item.Tabs))];
      setUniqueTabs(tabs);
    }
  }, [structure]);

  // // Call this in useEffect after fetching structure
  // useEffect(() => {
  //   if (structure.length > 0) {
  //     generateIndices(structure);
  //   }
  // }, [structure, uniqueTabs]);

  const handleAddStructure = async () => {
    try {
      if (!newStructure.Tabs || !newStructure.section) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Check for existing structure
      const { data: existingStructure, error: checkError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*')
        .eq('main_tab', activeMainTab)
        .eq('Tabs', newStructure.Tabs)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      // Prepare new section data
      const newSectionData = {
        name: newStructure.section,
        order: newStructure.order || 1,
        visible: true,
        subsections: [{
          name: newStructure.subsection,
          order: 1,
          visible: true,
          tables: newStructure.table_names,
          fields: Object.entries(newStructure.column_mappings).map(([key, value], index) => {
            const [table, field] = key.split('.');
            return {
              name: field,
              display: value,
              table: table,
              order: index + 1,
              visible: true,
              dropdownOptions: newStructure.dropdownOptions?.[key] || []
            };
          })
        }]
      };

      if (existingStructure) {
        // Update existing structure
        const updatedStructure = {
          ...existingStructure.structure,
          sections: [...existingStructure.structure.sections, newSectionData]
        };

        const { error: updateError } = await supabase
          .from('profile_category_table_mapping_2')
          .update({
            structure: updatedStructure,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStructure.id);

        if (updateError) throw updateError;
      } else {
        // Create new structure
        const { error: insertError } = await supabase
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

        if (insertError) throw insertError;
      }

      // Refresh data and reset form
      await fetchStructure(activeMainTab);
      await onStructureChange(); // This refreshes the parent component
      resetNewStructure();
      setAddFieldDialogOpen(false);
      toast.success('Structure added and data refreshed successfully');

    } catch (error) {
      console.error('Error managing structure:', error);
      toast.error('Failed to manage structure');
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

  // Add useEffect to load initial visibility settings
  useEffect(() => {
    const loadVisibilitySettings = async () => {
      try {
        const { data, error } = await supabase
          .from('profile_category_table_mapping_2')
          .select('structure')
          .eq('id', currentStructure.id)
          .single();

        if (error) throw error;

        if (data?.structure?.visibility) {
          setSectionVisibility(data.structure.visibility.sections || {});
          setCategoryVisibility(data.structure.visibility.categories || {});
          setColumnVisibility(data.structure.visibility.columns || {});
        }
      } catch (error) {
        console.error('Error loading visibility settings:', error);
      }
    };

    loadVisibilitySettings();
  }, [currentStructure.id]);
  // Add useEffect to initialize visibility settings based on structure
  useEffect(() => {
    if (structure.length > 0 && selectedTab) {
      const current = structure.find(item => item.Tabs === selectedTab);
      if (current) {
        setCurrentStructure(current);
      }
    }
  }, [structure, selectedTab]);

  // Add bulk visibility controls
  const toggleAllVisibility = async (type: string, value: boolean) => {
    try {
      const newSettings = {
        ...visibilitySettings,
        [type]: Object.keys(visibilitySettings[type]).reduce((acc, key) => ({
          ...acc,
          [key]: value
        }), {})
      };

      await updateVisibilitySettings(newSettings);
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    }
  };
  const handleVisibilitySettings = async () => {
    try {
      const { data: current, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('structure')
        .eq('Tabs', selectedTab)
        .single();

      if (fetchError) throw fetchError;

      const updatedStructure = {
        ...current.structure,
        visibility: visibilitySettings
      };

      const { error: updateError } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: updatedStructure,
          updated_at: new Date().toISOString()
        })
        .eq('Tabs', selectedTab);

      if (updateError) throw updateError;

      toast.success('Visibility settings saved successfully');
      await fetchStructure(activeMainTab);

    } catch (error) {
      console.error('Error saving visibility settings:', error);
      toast.error('Failed to save visibility settings');
    }
  };

  const toggleVisibility = useCallback(async (type: string, key: string) => {
    try {
      const newSettings = {
        ...visibilitySettings,
        [type]: {
          ...visibilitySettings[type],
          [key]: !visibilitySettings[type]?.[key]
        }
      };

      const { data: current, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('structure')
        .eq('Tabs', selectedTab)
        .single();

      if (fetchError) throw fetchError;

      const updatedStructure = {
        ...current.structure,
        visibility: newSettings
      };

      const { error: updateError } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: updatedStructure,
          updated_at: new Date().toISOString()
        })
        .eq('Tabs', selectedTab);

      if (updateError) throw updateError;

      setVisibilitySettings(newSettings);
      await fetchStructure(activeMainTab);

    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
    }
  }, [visibilitySettings, selectedTab, activeMainTab]);

  const fetchSectionsAndSubsections = async (tab: string) => {
    if (!tab) return; await fetchExistingSectionsAndSubsections(
      tab,
      supabase,
      setExistingSections,
      setExistingSubsections
    );
  };
  const selectedTabIndex = uniqueTabs.indexOf(selectedTab);
  const selectedSectionIndex = structure
    .find(item => item.Tabs === selectedTab)
    ?.sections.findIndex(s => s.name === selectedSection?.section) ?? -1;

  const handleTabSelect = async (tabValue: string, isNewStructure: boolean = false) => {
    const stateSetters = {
      setExistingSections,
      setExistingSubsections,
      setNewStructure,
      setSelectedTab,
      setSelectedTables,
      setSelectedTableFields,
      setMainSections
    };

    await handleTabSelection(
      tabValue,
      isNewStructure,
      supabase,
      stateSetters
    );
  };


  // Define the callback function
  const fetchSectionsCallback = async (tab: string) => {
    await fetchExistingSectionsAndSubsections(
      tab,
      supabase,
      {
        setExistingSections,
        setExistingSubsections
      }
    );
  };

  const handleSectionSelect = async (sectionValue: string) => {
    if (!supabase) return;

    await handleSectionSelection(
      sectionValue,
      supabase, // Pass the initialized supabase client
      setNewStructure,
      setSelectedTables,
      setSelectedTableFields,
      selectedTab,
      processColumnMappings
    );
  };

  const handleSubsectionSelect = async (subsectionValue: string) => {
    await handleSubsectionSelection(
      subsectionValue,
      supabase,
      setNewStructure,
      setSelectedTables,
      setSelectedTableFields,
      processColumnMappings
    );
  };
  const OrderControls = ({ currentOrder, onMoveUp, onMoveDown }) => (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onMoveUp}
        className="h-6 w-6 p-0"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onMoveDown}
        className="h-6 w-6 p-0"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
  const handleReorder = async (type: 'tab' | 'section' | 'subsection' | 'column', id: string, direction: 'up' | 'down') => {
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
  const handleOrderSubmit = async () => {
    try {
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: {
            ...currentStructure.structure,
            order: {
              tabs: uniqueTabs.reduce((acc, tab, index) => ({
                ...acc,
                [tab]: index + 1
              }), {}),
              sections: structure
                .find(item => item.Tabs === selectedTab)
                ?.sections.reduce((acc, section, index) => ({
                  ...acc,
                  [section.name]: index + 1
                }), {}),
              subsections: structure
                .find(item => item.Tabs === selectedTab)
                ?.sections.find(s => s.name === selectedSection?.section)
                ?.subsections.reduce((acc, subsection, index) => ({
                  ...acc,
                  [subsection.name]: index + 1
                }), {})
            }
          }
        })
        .eq('id', currentStructure.id);

      if (!error) {
        toast.success('Order updated successfully');
        await fetchStructure(activeMainTab);
      }
    } catch (error) {
      toast.error('Failed to update order');
    }
  };
  const fetchStructureWithOrder = async () => {
    const { data, error } = await supabase
      .from('profile_category_table_mapping_2')
      .select('*')
      .eq('main_tab', activeMainTab)
      .eq('Tabs', activeSubTab)
      .single();

    if (!error && data) {
      const order = data.structure.order;
      return order;
    }
  };

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
                      {uniqueTabs
                        .sort((a, b) => {
                          const orderA = structure.find(item => item.Tabs === a)?.order?.tab || 0;
                          const orderB = structure.find(item => item.Tabs === b)?.order?.tab || 0;
                          return orderA - orderB;
                        })
                        .map((tab, tabIndex) => (
                          <button
                            key={tab}
                            className={`w-full text-left px-3 py-2 rounded transition-colors ${selectedTab === tab ? 'bg-primary text-white' : 'hover:bg-gray-100'
                              }`}
                            onClick={() => handleTabSelect(tab, false)}
                          >
                            <div className="flex justify-between items-center">
                              {`${tabIndex + 1}.0 ${tab}`}
                              <OrderControls
                                currentOrder={tabIndex}
                                onMoveUp={() => handleReorder('tab', tab, 'up')}
                                onMoveDown={() => handleReorder('tab', tab, 'down')}
                              />
                            </div>
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
                      {structure
                        .filter(item => item.Tabs === selectedTab)
                        .flatMap(item => item.sections)
                        .sort((a, b) => a.order - b.order)
                        .map((section, sectionIndex) => (
                          <div
                            key={section.name}
                            className={`mb-2 p-2 rounded cursor-pointer transition-colors ${selectedSection?.section === section.name ? 'bg-primary/10' : 'hover:bg-gray-100'
                              }`}
                            onClick={() => setSelectedSection({ section: section.name })}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex justify-between items-center w-full">
                                {`${selectedTabIndex + 1}.${sectionIndex + 1} ${section.name}`}
                                <div className="flex items-center gap-2">
                                  <OrderControls
                                    currentOrder={sectionIndex}
                                    onMoveUp={() => handleReorder('section', section.name, 'up')}
                                    onMoveDown={() => handleReorder('section', section.name, 'down')}
                                  />
                                  <Switch
                                    checked={section.visible}
                                    onCheckedChange={() => toggleVisibility('sections', section.name)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </ScrollArea>
                  </CardContent>
                </Card>

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
                        .find(item => item.Tabs === selectedTab)
                        ?.sections.find(s => s.name === selectedSection.section)
                        ?.subsections.sort((a, b) => a.order - b.order)
                        .map((subsection, subsectionIndex) => (
                          <div
                            key={subsection.name}
                            className={`mb-2 p-2 rounded cursor-pointer transition-colors ${selectedSubsection === subsection.name ? 'bg-primary/10' : 'hover:bg-gray-100'
                              }`}
                            onClick={() => setSelectedSubsection(subsection.name)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex justify-between items-center w-full">
                                {`${selectedTabIndex + 1}.${selectedSectionIndex + 1}.${subsectionIndex + 1} ${subsection.name}`}
                                <div className="flex items-center gap-2">
                                  <OrderControls
                                    currentOrder={subsectionIndex}
                                    onMoveUp={() => handleReorder('subsection', subsection.name, 'up')}
                                    onMoveDown={() => handleReorder('subsection', subsection.name, 'down')}
                                  />
                                  <Switch
                                    checked={subsection.visible}
                                    onCheckedChange={() => toggleVisibility('subsections', subsection.name)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="col-span-6 h-[700px]">
                  <CardContent className="p-4">
                    <ScrollArea className="h-[700px]">
                      {selectedSubsection ? (
                        <div className="space-y-4">
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
                          </div>
                          <DraggableColumns
                            columnMappings={structure
                              .find(item => item.Tabs === selectedTab)
                              ?.sections
                              .find(s => s.name === selectedSection?.section)
                              ?.subsections
                              .find(sub => sub.name === selectedSubsection)
                              ?.fields.reduce((acc, field) => ({
                                ...acc,
                                [`${field.table}-${field.name}`]: field.display
                              }), {})
                            }
                            dropdowns={structure
                              .find(item => item.Tabs === selectedTab)
                              ?.sections
                              .find(s => s.name === selectedSection?.section)
                              ?.subsections
                              .find(sub => sub.name === selectedSubsection)
                              ?.fields.reduce((acc, field) => ({
                                ...acc,
                                [`${field.table}.${field.name}`]: field.dropdownOptions
                              }), {})
                            }
                            visibilitySettings={visibilitySettings}
                            columnOrder={columnOrder}
                            onDragEnd={(result) => onDragEnd(result, columnOrder, setColumnOrder, currentStructure)}
                            handleEditField={
                              (key) => handleEditField(
                                key, 
                                structure, 
                                selectedTab, 
                                selectedSection, 
                                selectedSubsection,
                                setEditingField,
                                setEditFieldDialogOpen
                              )
                            }
                            
                            handleDeleteField={handleDeleteField}
                            toggleVisibility={toggleVisibility}
                          />
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
                      onValueChange={(value) => {
                        const stateSetters = {
                          setExistingSections,
                          setExistingSubsections,
                          setNewStructure,
                          setSelectedTab,
                          setSelectedTables,
                          setSelectedTableFields
                        };
                        handleTabSelection(value, true, supabase, stateSetters);
                      }}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select or Create Tab" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueTabs.filter(tab => tab?.trim()).map(tab => (
                          <SelectItem key={tab} value={tab}>
                            {indexMapping.tabs[tab] || ''} {tab}
                          </SelectItem>
                        ))}
                        <SelectItem value="new" className="text-blue-600 font-medium">
                          + Create New Tab
                        </SelectItem>
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
                      onValueChange={handleSectionSelect}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select or Create Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...new Set(existingSections)] // This ensures unique section names
                          .filter(section => section?.trim())
                          .map(section => (
                            <SelectItem key={section} value={section}>
                              {section}
                            </SelectItem>
                          ))}
                        <SelectItem value="new" className="text-blue-600 font-medium">
                          + Create New Section
                        </SelectItem>
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
                        onValueChange={handleSubsectionSelect}
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
                  <div className="space-y-4">
                    {/* Global controls */}
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">Visibility Settings</h3>
                      <div className="flex gap-2">
                        <Button onClick={() => toggleAllVisibility('columns', true)}>
                          Show All
                        </Button>
                        <Button onClick={() => toggleAllVisibility('columns', false)}>
                          Hide All
                        </Button>
                      </div>
                    </div>

                    {/* Tab visibility */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <h4 className="font-medium">Tabs</h4>
                        <Switch
                          checked={visibilitySettings.tabs[selectedTab] !== false}
                          onCheckedChange={(checked) => toggleVisibility('tabs', selectedTab)}
                        />
                      </div>
                    </div>

                    {/* Sections and columns */}
                    {structure
                      .filter(item => item.Tabs === selectedTab)
                      .map(item => {
                        const columnMappings = typeof item.column_mappings === 'string'
                          ? JSON.parse(item.column_mappings)
                          : item.column_mappings || {};

                        const visibleColumns = Object.entries(columnMappings)
                          .filter(([key]) => visibilitySettings?.columns?.[key] !== false)
                          .sort((a, b) => {
                            const orderA = item.column_order?.columns?.[a[0]] || 0;
                            const orderB = item.column_order?.columns?.[b[0]] || 0;
                            return orderA - orderB;
                          });

                        return (
                          <div key={item.Section} className="border rounded-lg p-4 space-y-4 mt-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{item.Section}</h4>
                              <Switch
                                checked={visibilitySettings.sections[item.Section] !== false}
                                onCheckedChange={(checked) => toggleVisibility('sections', item.Section)}
                              />
                            </div>

                            {/* Subsections */}
                            <div className="pl-4 space-y-2">
                              {typeof item.subsections === 'string' ? (
                                <div className="flex items-center justify-between">
                                  <span>{item.subsections}</span>
                                  <Switch
                                    checked={visibilitySettings.subsections[item.subsections] !== false}
                                    onCheckedChange={(checked) =>
                                      toggleVisibility('subsections', item.subsections)
                                    }
                                  />
                                </div>
                              ) : (
                                Array.isArray(item.subsections) &&
                                item.subsections.map(subsection => (
                                  <div key={subsection} className="flex items-center justify-between">
                                    <span>{subsection}</span>
                                    <Switch
                                      checked={visibilitySettings.subsections[subsection] !== false}
                                      onCheckedChange={(checked) =>
                                        toggleVisibility('subsections', subsection)
                                      }
                                    />
                                  </div>
                                ))
                              )}

                              {/* Columns */}
                              <div className="pl-4 mt-2 space-y-2">
                                {Object.entries(columnMappings)
                                  .sort((a, b) => {
                                    const orderA = item.column_order?.columns?.[a[0]] || 0;
                                    const orderB = item.column_order?.columns?.[b[0]] || 0;
                                    return orderA - orderB;
                                  })
                                  .map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between">
                                      <span>{value}</span>
                                      <Switch
                                        checked={visibilitySettings.columns[key] !== false}
                                        onCheckedChange={(checked) =>
                                          toggleVisibility('columns', key)
                                        }
                                      />
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {/* Save button */}
                    <div className="flex justify-end mt-6">
                      <Button onClick={handleSaveVisibilitySettings}>
                        Save Visibility Settings
                      </Button>
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
                <input
                  type="text"
                  placeholder="Search tables..."
                  className="w-full p-2 mb-2 border rounded"
                  onChange={(e) => {
                    const searchValue = e.target.value.toLowerCase();
                    const filteredTables = tables.filter(table =>
                      table.toLowerCase().includes(searchValue)
                    );
                    setTables(filteredTables);
                  }}
                />
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
                <input
                  type="text"
                  placeholder="Search fields..."
                  className="w-full p-2 mb-2 border rounded"
                  onChange={(e) => {
                    const searchValue = e.target.value.toLowerCase();
                    const filteredFields = tableColumns.filter(field =>
                      field.column_name.toLowerCase().includes(searchValue)
                    );
                    setTableColumns(filteredFields);
                  }}
                />
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
      <MultiSelectDialog
        showMultiSelectDialog={showMultiSelectDialog}
        setShowMultiSelectDialog={setShowMultiSelectDialog}
        selectedTables={selectedTables}
        selectedTableFields={selectedTableFields}
        tables={tables}
        tableColumns={tableColumns}
        setSelectedTables={setSelectedTables}
        setSelectedTableFields={setSelectedTableFields}
        setNewStructure={setNewStructure}
        initialData={newStructure.column_mappings} // Add this
      />
<EditFieldDialog
  editFieldDialogOpen={editFieldDialogOpen}
  setEditFieldDialogOpen={setEditFieldDialogOpen}
  editingField={editingField}
  setEditingField={setEditingField}
  handleSaveFieldEdit={() => handleSaveFieldEdit(
    editingField,
    structure,
    selectedTab,
    selectedSection,
    selectedSubsection,
    supabase,
    fetchStructure
  )}
/>

    </>
  );
}