// SettingsDialog.tsx
// @ts-nocheck 
"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Edit2, X, ChevronDown, ChevronUp, Eye, EyeOff, Trash } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/lib/supabaseClient';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from '@/components/ui/switch';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditFieldDialog } from './EditDialog';
import { MultiSelectDialog } from './MultiselectDialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useStructureState, useVisibilityState, useTableState, useFormState, processStructureForUI } from './settingsState';
import { fetchTableColumns, handleTabSelection, handleSubsectionSelection, fetchTables, getColumnOrder, safeJSONParse, handleSaveFieldEdit, processColumnMappings, fetchExistingSectionsAndSubsections, handleSaveVisibilitySettings, generateIndices, isVisible, getVisibleColumns, handleAddNewField, handleNameUpdate, handleUpdateSection, handleCreateTable, handleDeleteField, handleEditField, handleAddField, toColumnName, handleAddExistingFields, } from './settingsFunctions';
import {
  handleTabSelect,
  handleSectionSelect,
  handleSubsectionSelect,
  handleVisibilitySettings,
  handleReorder,
  fetchSectionFields
} from './SettingsHandlers';
import { DraggableColumns } from './DragOder';
import { updateVisibility, updateOrder, getVisibilityState, getOrderState, type VisibilitySettings, type OrderSettings } from './visibilityHandler';
import { ColumnManagement } from './columnManangementTab';

interface SettingsDialogProps {
  onStructureChange: () => void;
  activeMainTab: string;
  processedSections?: any[];
}

export function SettingsDialog({
  onStructureChange,
  activeMainTab,
  processedSections = []
}: SettingsDialogProps) {
  // Dialog state
  const [isOpen, setIsOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [showNewTableDialog, setShowNewTableDialog] = React.useState(false);
  const [addFieldDialogOpen, setAddFieldDialogOpen] = React.useState(false);
  const [showMultiSelectDialog, setShowMultiSelectDialog] = React.useState(false);
  const [editFieldDialogOpen, setEditFieldDialogOpen] = React.useState(false);
  const [existingSections, setExistingSections] = useState<string[]>([]);
  const [existingSubsections, setExistingSubsections] = useState<Record<string, string[]>>({});
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({});
  const [categoryVisibility, setCategoryVisibility] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const { structure, mappingData, uniqueTabs, setUniqueTabs, selectedTab, selectedSection, selectedSubsection, setSelectedTab, setSelectedSection, setSelectedSubsection, fetchStructure } = useStructureState(supabase, activeMainTab);
  const { visibilityState, orderState, setVisibilityState, setOrderState } = useVisibilityState();
  const { tables, tableColumns, newTableName, setNewTableName, loadingTable, setLoadingTable, selectedTables, selectedTableFields, setTables, setTableColumns, setSelectedTables, setSelectedTableFields } = useTableState();
  const { newStructure, editingField, addFieldState, setNewStructure, setEditingField, setAddFieldState, currentStructure, setCurrentStructure, sectionFields, setSectionFields, } = useFormState();
  const [processedStructure, setProcessedStructure] = useState(processStructureForUI(mappingData?.structure));
  const [isNewStructure, setIsNewStructure] = useState(false);
  const [indexMapping, setIndexMapping] = useState<{
    tabs: { [key: string]: number },
    sections: { [key: string]: string },
    subsections: { [key: string]: string }
  }>({
    tabs: {},
    sections: {},
    subsections: {}
  });
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>({
    columns: [],
    visibility: {}
  });
  const [editedNames, setEditedNames] = useState({
    tab: '',
    section: '',
    subsection: ''
  });
  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>({
    tabs: {},
    sections: {},
    subsections: {},
    fields: {}
  });
  const [subTabs, setSubTabs] = useState<Record<string, string[]>>({});

  // Effect hooks
  useEffect(() => {
    if (activeMainTab) {
      fetchStructure();
    }
  }, [activeMainTab]);

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

  useEffect(() => {
    if (mappingData?.structure) {
      setVisibilityState(getVisibilityState(mappingData.structure));
      setOrderState(getOrderState(mappingData.structure));
    }
  }, [mappingData]);

  useEffect(() => {
    const handleStructureUpdate = () => {
      fetchStructure(activeMainTab);
    };

    window.addEventListener('structure-updated', handleStructureUpdate);

    return () => {
      window.removeEventListener('structure-updated', handleStructureUpdate);
    };
  }, [activeMainTab, fetchStructure]);

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
      const newSubTabs: Record<string, string[]> = {};

      structure.forEach(item => {
        const mainTab = item.main_tab;
        const subTab = item.Tabs;

        if (mainTab && subTab) {
          if (!newSubTabs[mainTab]) {
            newSubTabs[mainTab] = [];
          }
          if (!newSubTabs[mainTab].includes(subTab)) {
            newSubTabs[mainTab].push(subTab);
          }
        }
      });

      setSubTabs(newSubTabs);
    }
  }, [structure]);

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

  useEffect(() => {
    const loadVisibilitySettings = async () => {
      try {
        if (!currentStructure?.id) return;

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
  }, [currentStructure?.id]);

  useEffect(() => {
    if (structure.length > 0 && selectedTab) {
      const current = structure.find(item => item.Tabs === selectedTab);
      if (current) {
        setCurrentStructure(current);
      }
    }
  }, [structure, selectedTab]);

  const selectedTabIndex = uniqueTabs.indexOf(selectedTab);
  const selectedSectionIndex = structure
    .find(item => item.Tabs === selectedTab)
    ?.sections.findIndex(s => s.name === selectedSection?.section) ?? -1;

  // Render helpers
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
      // toast.error('Failed to update visibility');
    }
  }, [visibilitySettings, selectedTab, activeMainTab]);

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
            <DialogDescription>
              Manage your table structure, sections, and column visibility settings.
            </DialogDescription>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTab('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {Array.isArray(uniqueTabs) && uniqueTabs.length > 0 && uniqueTabs
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
                            onClick={() => handleTabSelect(tab, isNewStructure, supabase, {
                              setExistingSections,
                              setExistingSubsections,
                              setNewStructure,
                              setSelectedTab,
                              setSelectedTables,
                              setSelectedTableFields
                            })}
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
                      {Array.isArray(structure) && structure.length > 0 && structure
                        .filter(item => item.Tabs === selectedTab)
                        .flatMap(item => Array.isArray(item.sections) ? item.sections : [])
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
                      {selectedSection && Array.isArray(structure) && structure.length > 0 && structure
                        .find(item => item.Tabs === selectedTab)
                        ?.sections.find(s => s.name === selectedSection.section)
                        ?.subsections && Array.isArray(structure.find(item => item.Tabs === selectedTab)?.sections.find(s => s.name === selectedSection.section)?.subsections)
                        ?.sort((a, b) => a.order - b.order)
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
                              {selectedSection && selectedSubsection && Array.isArray(structure) && structure.length > 0 && structure
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
                            columnMappings={Array.isArray(structure) && structure.length > 0 && structure
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
                            dropdowns={Array.isArray(structure) && structure.length > 0 && structure
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
                                setEditFieldDialogOpen,
                                supabase,
                                fetchStructure
                              )
                            }
                            handleDeleteField={(key) => handleDeleteField(
                              key,
                              structure,
                              selectedTab,
                              selectedSection,
                              selectedSubsection,
                              supabase,
                              fetchStructure
                            )}
                            toggleVisibility={toggleVisibility}
                            structure={structure}
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
                      onValueChange={(value) => handleTabSelection(
                        value,
                        isNewStructure,
                        supabase,
                        {
                          setExistingSections,
                          setExistingSubsections,
                          setNewStructure,
                          setSelectedTab,
                          setSelectedTables,
                          setSelectedTableFields
                        }
                      )}

                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select or Create Tab" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(uniqueTabs) && uniqueTabs.filter(tab => tab?.trim()).map(tab => (
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
                      onValueChange={(value) =>
                        handleSectionSelect(
                          value,
                          supabase,
                          setNewStructure,
                          setSelectedTables,
                          setSelectedTableFields,
                          selectedTab,
                          processColumnMappings
                        )
                      }
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
                        onValueChange={(value) => handleSubsectionSelection(
                          value,
                          supabase,
                          setNewStructure,
                          setSelectedTables,
                          setSelectedTableFields,
                          processColumnMappings
                        )}

                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select or Create Subsection" />
                        </SelectTrigger>
                        <SelectContent>
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
                    <label className="text-sm font-medium text-gray-700">Main Tab</label>
                    <Select
                      value={newStructure.main_tab}
                      onValueChange={(value) =>
                        setNewStructure(prev => ({
                          ...prev,
                          main_tab: value
                        }))
                      }
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select or Create Main Tab" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...new Set(Array.isArray(subTabs) ? subTabs : [])] // This ensures unique main tab names
                          .filter(tab => tab?.trim())
                          .map(tab => (
                            <SelectItem key={tab} value={tab}>
                              {tab}
                            </SelectItem>
                          ))}
                        <SelectItem value="new" className="text-blue-600 font-medium">
                          + Create New Main Tab
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {newStructure.isNewMainTab && (
                      <Input
                        placeholder="Enter new main tab name"
                        value={newStructure.main_tab}
                        onChange={(e) => setNewStructure(prev => ({
                          ...prev,
                          main_tab: e.target.value
                        }))}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-row gap-4">
                  {/* Tables Selection/Creation */}
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

                <div className="flex justify-end">
                  <Button
                    onClick={() =>
                      handleAddStructure(
                        newStructure,
                        supabase,
                        activeMainTab,
                        () => setNewStructure({
                          section: '',
                          subsection: '',
                          table_name: '',
                          Tabs: '',
                          column_mappings: {},
                          isNewTab: false,
                          isNewSection: false,
                          isNewSubsection: false,
                          table_names: []
                        }),
                        setAddFieldDialogOpen,
                        fetchStructure,
                        onStructureChange
                      )
                    }
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Structure
                  </Button>
                </div>
              </div>

            </TabsContent>

            {/* Column Management Tab */}
            <TabsContent value="visibility" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <ColumnManagement
                    structure={structure}
                    onUpdate={fetchStructure}
                    supabase={supabase}
                    mainTabs={uniqueTabs}
                    subTabs={subTabs}
                    visibilityState={visibilityState}
                    activeMainTab={activeMainTab}
                  />
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
                <div className="flex items-center gap-2 p-2 border-b">
                  <input
                    type="checkbox"
                    id="select-all-tables"
                    checked={tables.length > 0 && selectedTables.length === tables.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTables(tables);
                      } else {
                        setSelectedTables([]);
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <label htmlFor="select-all-tables">Select All Tables</label>
                </div>
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
                          <div className="flex items-center justify-between">
                            <h5 className="font-lg text-black">{tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h5>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`select-all-${tableName}`}
                                checked={tableFields.length > 0 && selectedTableFields[tableName]?.length === tableFields.length}
                                onChange={(e) => {
                                  setSelectedTableFields(prev => ({
                                    ...prev,
                                    [tableName]: e.target.checked ? tableFields.map(f => f.column_name) : []
                                  }));
                                }}
                                className="h-4 w-4"
                              />
                              <label htmlFor={`select-all-${tableName}`}>Select All</label>
                            </div>
                          </div>
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
                handleAddExistingFields(
                  selectedTableFields,
                  selectedTab,
                  selectedSection,
                  selectedSubsection,
                  structure,
                  supabase,
                  fetchStructure,
                  setAddFieldDialogOpen
                );
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
        handleSaveFieldEdit={handleSaveFieldEdit}
        structure={structure} // Add this
        selectedTab={selectedTab}
        selectedSection={selectedSection}
        selectedSubsection={selectedSubsection}
        supabase={supabase}
        fetchStructure={fetchStructure}
      />
    </>
  );
}