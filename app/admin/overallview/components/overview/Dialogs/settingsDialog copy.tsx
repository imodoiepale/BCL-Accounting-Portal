// SettingsDialog.tsx
// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronUp, ChevronDown, Plus, GripVertical, Settings, Trash2, Pencil } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from './settingsStore';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { SelectTablesAndFieldsDialog } from './SelectTablesAndFieldsDialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { v4 as uuidv4 } from 'uuid';

interface StructureItem {
  id: string;
  name: string;
  order: number;
  visible: boolean;
  type: 'maintab' | 'subtab' | 'section' | 'subsection' | 'field';
  table?: string;
  parent?: {
    maintab?: string;
    subtab?: string;
    section?: string;
    subsection?: string;
  };
}

interface Section {
  name: string;
  id?: string;
  fields?: Array<{
    name: string;
    table: string;
    column: string;
  }>;
}

interface DatabaseStructure {
  order: {
    maintabs?: number[];
    subtabs?: { [maintab: string]: number[] };
    sections?: { [subtab: string]: number[] };
    subsections?: { [section: string]: number[] };
    fields?: { [subsection: string]: number[] };
  };
  visibility: {
    maintabs?: { [id: string]: boolean };
    subtabs?: { [id: string]: boolean };
    sections?: { [id: string]: boolean };
    subsections?: { [id: string]: boolean };
    fields?: { [id: string]: boolean };
  };
  sections: Array<{
    name: string;
    subsections: Array<{
      name: string;
      fields: Array<{
        name: string;
        table: string;
        column: string;
      }>;
    }>;
  }>;
}

interface DraggableListProps {
  items: StructureItem[];
  type: string;
  onEdit: (item: StructureItem) => void;
  onDelete: (item: StructureItem) => void;
  onVisibilityChange: (item: StructureItem, visible: boolean) => void;
  onDragEnd: (result: any) => void;
}

const DraggableList = ({
  items,
  type,
  onDelete,
  onVisibilityChange,
  onDragEnd
}) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={type} type={type}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2"
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={cn(
                      "flex items-center gap-2 p-2 bg-background rounded-md group",
                      snapshot.isDragging ? "ring-2 ring-primary" : "hover:bg-muted/50"
                    )}
                  >
                    <div {...provided.dragHandleProps} className="cursor-grab">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="flex-grow">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.visible}
                        onCheckedChange={(checked) => onVisibilityChange(item, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(item)}
                        className="text-destructive opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

interface EditSheetProps {
  item: StructureItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: StructureItem) => Promise<void>;
  type: 'maintab' | 'subtab' | 'section' | 'subsection' | 'field';
  parentItem?: StructureItem;
}

const EditSheet = ({ item, isOpen, onClose, onSave, type, parentItem }: EditSheetProps) => {
  const [name, setName] = useState(item?.name || '');
  const [table, setTable] = useState(item?.table || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setName(item?.name || '');
    setTable(item?.table || '');
  }, [item]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      const newItem: StructureItem = {
        id: item?.id || `${type}-${Date.now()}`,
        name: name.trim(),
        order: item?.order || 0,
        visible: item?.visible ?? true,
        type,
        ...(table && { table }),
        ...(parentItem && {
          parent: {
            ...(parentItem.type === 'maintab' && { maintab: parentItem.name }),
            ...(parentItem.type === 'subtab' && { subtab: parentItem.name }),
            ...(parentItem.type === 'section' && { section: parentItem.name }),
            ...(parentItem.type === 'subsection' && { subsection: parentItem.name }),
          }
        })
      };

      await onSave(newItem);
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{item ? 'Edit' : 'Add'} {type}</SheetTitle>
          <SheetDescription>
            {item ? 'Edit the details of this item' : 'Add a new item to the structure'}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
            />
          </div>
          {type === 'field' && (
            <div>
              <Label htmlFor="table">Table</Label>
              <Input
                id="table"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                placeholder="Enter table name"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading} size="sm">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading} size="sm">
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mainTabs: string[];
  mainSections: Section[];
  mainSubsections: Section[];
  onStructureChange: () => void;
  activeMainTab: string;
  activeSubTab: string;
  subTabs: string[];
  processedSections: any[];
  visibilityState: any;
  orderState: any;
  onVisibilityChange: (state: any) => void;
  onOrderChange: (state: any) => void;
}

export function SettingsDialog({
  isOpen,
  onClose,
  mainTabs,
  mainSections,
  mainSubsections,
  onStructureChange,
  activeMainTab,
  activeSubTab,
  subTabs,
  processedSections,
  visibilityState,
  orderState,
  onVisibilityChange,
  onOrderChange
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('structure');
  const [selectedMainTab, setSelectedMainTab] = useState<string | null>(null);
  const [selectedSubTab, setSelectedSubTab] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSubSection, setSelectedSubSection] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<'maintab' | 'subtab' | 'section' | 'subsection' | 'field' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [isSelectTablesDialogOpen, setIsSelectTablesDialogOpen] = useState(false);
  const [structure, setStructure] = useState<{
    maintabs: Array<{ id: string; name: string; visible: boolean; order: number }>;
    subtabs: Array<{ id: string; name: string; visible: boolean; order: number; parent: { maintab: string } }>;
    sections: Array<{ id: string; name: string; visible: boolean; order: number; parent: { maintab: string; subtab: string } }>;
    subsections: Array<{ id: string; name: string; visible: boolean; order: number; parent: { maintab: string; subtab: string; section: string } }>;
    fields: Array<{ id: string; name: string; table: string; visible: boolean; order: number; parent: { maintab: string; subtab: string; section: string; subsection: string } }>;
  }>({
    maintabs: [],
    subtabs: [],
    sections: [],
    subsections: [],
    fields: []
  });

  interface FormState {
    mainTab: string;
    tab: string;
    section: string;
    subsection: string;
    selectedTables: string[];
    selectedFields: { [table: string]: string[] };
  }

  const [formState, setFormState] = useState<FormState>({
    mainTab: '',
    tab: '',
    section: '',
    subsection: '',
    selectedTables: [],
    selectedFields: {}
  });

  const [newItemInputs, setNewItemInputs] = useState({
    mainTab: '',
    tab: '',
    section: '',
    subsection: '',
  });

  const handleFormChange = (field: string, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));

    // Reset new item input when switching away from 'new'
    if (value !== 'new') {
      setNewItemInputs(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getFormValue = (field: string) => {
    if (formState[field] === 'new') {
      return newItemInputs[field];
    }
    return formState[field];
  };

  const handleSubmitNewStructure = async () => {
    try {
      const mainTab = formState.mainTab === 'new' ? newItemInputs.mainTab : formState.mainTab;
      const subTab = formState.tab === 'new' ? newItemInputs.tab : formState.tab;
      const sectionName = formState.section === 'new' ? newItemInputs.section : formState.section;
      const subsectionName = formState.subsection === 'new' ? newItemInputs.subsection : formState.subsection;

      if (!mainTab || !subTab || !sectionName || !subsectionName) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Create fields array from the selected tables and fields
      const fieldsArray = Object.entries(formState.selectedFields).flatMap(([table, columns]) =>
        columns.map(column => ({
          name: column,
          table: table,
          column: column,
          display: column.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        }))
      );

      const newStructureData = {
        main_tab: mainTab,
        sub_tab: subTab,
        structure: {
          order: {
            fields: fieldsArray.reduce((acc, field, index) => ({ ...acc, [field.name]: index }), {}),
            subtabs: { [subTab]: 0 },
            maintabs: { [mainTab]: 0 },
            sections: { [sectionName]: 0 },
            subsections: { [subsectionName]: 0 }
          },
          sections: [
            {
              name: sectionName,
              subsections: [
                {
                  name: subsectionName,
                  fields: fieldsArray
                }
              ]
            }
          ],
          visibility: {
            fields: fieldsArray.reduce((acc, field) => ({ ...acc, [field.name]: true }), {}),
            subtabs: { [subTab]: true },
            maintabs: { [mainTab]: true },
            sections: { [sectionName]: true },
            subsections: { [subsectionName]: true }
          }
        }
      };

      console.log('Submitting new structure:', newStructureData);

      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .insert(newStructureData);

      if (error) {
        if (error.code === '23505' && error.details?.includes('already exists')) {
          toast.error('Structure already exists with this combination');
        } else {
          toast.error('Failed to create new structure');
        }
        return;
      }

      toast.success('New structure created successfully');
      setIsSelectTablesDialogOpen(false);
      setNewItemInputs({
        mainTab: '',
        tab: '',
        section: '',
        subsection: ''
      });
      setFormState({
        mainTab: '',
        tab: '',
        section: '',
        subsection: '',
        selectedTables: [],
        selectedFields: {}
      });
      onStructureChange();
    } catch (error) {
      console.error('Error creating new structure:', error);
      toast.error('Failed to create new structure');
    }
  };

  const handleTablesFieldsSelect = useCallback((tables: string[], fields: { [table: string]: string[] }) => {
    setFormState(prev => ({
      ...prev,
      selectedTables: tables,
      selectedFields: fields
    }));
    setIsSelectTablesDialogOpen(false);
  }, []);

  const [newStructure, setNewStructure] = useState({
    mainTabName: '',
    subTabName: '',
    sectionName: '',
    subsectionName: '',
    selectedTables: [] as string[],
    selectedFields: {} as { [table: string]: string[] }
  });

  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<{ [table: string]: string[] }>({});
  const [editingItem, setEditingItem] = useState<{ type: string; item: StructureItem } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editItemName, setEditItemName] = useState('');
  const [editItemType, setEditItemType] = useState<'maintab' | 'subtab' | 'section' | 'subsection' | null>(null);

  useEffect(() => {
    const fetchStructureData = async () => {
      try {
        const { data, error } = await supabase
          .from('profile_category_table_mapping_2')
          .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
          console.error('No data returned from query');
          return;
        }

        // Process the data to maintain relationships and visibility
        const processedData = data.reduce((acc, item) => {
          const structure = item.structure || {};
          const visibility = structure.visibility || {};
          const order = structure.order || {};

          // Add main tab with visibility
          if (item.main_tab) {
            if (!acc.maintabs.has(item.main_tab)) {
              acc.maintabs.add({
                name: item.main_tab,
                visible: visibility.maintabs?.[item.main_tab] ?? true,
                order: order.maintabs?.[item.main_tab] ?? 0
              });
            }

            if (item.sub_tab) {
              acc.subtabs.add({
                name: item.sub_tab,
                visible: visibility.subtabs?.[item.sub_tab] ?? true,
                order: order.subtabs?.[item.sub_tab] ?? 0,
                parent: { maintab: item.main_tab }
              });

              // Process sections with visibility
              if (structure.sections) {
                structure.sections.forEach((section: any) => {
                  if (section.name) {
                    acc.sections.add({
                      name: section.name,
                      visible: visibility.sections?.[section.name] ?? true,
                      order: order.sections?.[section.name] ?? 0,
                      parent: {
                        maintab: item.main_tab,
                        subtab: item.sub_tab
                      }
                    });

                    // Process subsections with visibility
                    section.subsections?.forEach((subsection: any) => {
                      if (subsection.name) {
                        acc.subsections.add({
                          name: subsection.name,
                          visible: visibility.subsections?.[subsection.name] ?? true,
                          order: order.subsections?.[subsection.name] ?? 0,
                          parent: {
                            maintab: item.main_tab,
                            subtab: item.sub_tab,
                            section: section.name
                          }
                        });

                        // Process fields with visibility
                        subsection.fields?.forEach((field: any) => {
                          acc.fields.add({
                            name: field.name,
                            table: field.table,
                            column: field.column,
                            visible: visibility.fields?.[field.name] ?? true,
                            order: order.fields?.[field.name] ?? 0,
                            parent: {
                              maintab: item.main_tab,
                              subtab: item.sub_tab,
                              section: section.name,
                              subsection: subsection.name
                            }
                          });
                        });
                      }
                    });
                  }
                });
              }
            }
          }
          return acc;
        }, {
          maintabs: new Set<any>(),
          subtabs: new Set<any>(),
          sections: new Set<any>(),
          subsections: new Set<any>(),
          fields: new Set<any>()
        });

        // Convert Sets to arrays and sort by order
        const structureData = {
          maintabs: Array.from(processedData.maintabs)
            .sort((a, b) => a.order - b.order)
            .map((item, id) => ({
              id: String(id),
              ...item
            })),
          subtabs: Array.from(processedData.subtabs)
            .sort((a, b) => a.order - b.order)
            .map((item, id) => ({
              id: String(id),
              ...item
            })),
          sections: Array.from(processedData.sections)
            .sort((a, b) => a.order - b.order)
            .map((item, id) => ({
              id: String(id),
              ...item
            })),
          subsections: Array.from(processedData.subsections)
            .sort((a, b) => a.order - b.order)
            .map((item, id) => ({
              id: String(id),
              ...item
            })),
          fields: Array.from(processedData.fields)
            .sort((a, b) => a.order - b.order)
            .map((item, id) => ({
              id: String(id),
              ...item
            }))
        };

        setStructure(structureData);
        console.log('Structure loaded:', structureData);
      } catch (error) {
        console.error('Error fetching structure data:', error);
        toast.error('Failed to load structure data');
      }
    };

    fetchStructureData();
  }, [supabase]);

  useEffect(() => {
    if (structure?.maintabs?.length > 0) {
      const firstMainTab = structure.maintabs[0].name;
      const firstSubTab = structure.subtabs.find(tab => tab.parent.maintab === firstMainTab)?.name;
      const firstSection = structure.sections.find(section => section.parent.subtab === firstSubTab)?.name;
      const firstSubSection = structure.subsections.find(subsection => subsection.parent.section === firstSection)?.name;

      setSelectedMainTab(firstMainTab);
      setSelectedSubTab(firstSubTab);
      setSelectedSection(firstSection);
      setSelectedSubSection(firstSubSection);
    }
  }, [structure]);

  const handleMainTabSelect = (maintabName: string) => {
    setSelectedMainTab(maintabName);
    setSelectedSubTab(null);
    setSelectedSection(null);
    setSelectedSubSection(null);
  };

  const handleSubTabSelect = (subtabName: string) => {
    setSelectedSubTab(subtabName);
    setSelectedSection(null);
    setSelectedSubSection(null);
  };

  const handleSectionSelect = (sectionName: string) => {
    setSelectedSection(sectionName);
    setSelectedSubSection(null);
  };

  const handleSubsectionSelect = (subsectionName: string) => {
    setSelectedSubSection(subsectionName);
  };

  // Filter functions for each level
  const getSubTabsForMainTab = (maintabName: string) => {
    return structure.subtabs.filter(subtab =>
      subtab.parent?.maintab === maintabName
    );
  };

  const getSectionsForSubTab = (subtabName: string) => {
    return structure.sections.filter(section =>
      section.parent?.subtab === subtabName
    );
  };

  const getSubsectionsForSection = (sectionName: string) => {
    return structure.subsections.filter(subsection =>
      subsection.parent?.section === sectionName
    );
  };

  const getFieldsForSubsection = (subsectionName: string) => {
    return structure.fields.filter(field =>
      field.parent?.subsection === subsectionName
    );
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    try {
      // Get current structure
      const { data: currentData } = await supabase
        .from('profile_category_table_mapping_2')
        .select('structure')
        .eq('main_tab', selectedMainTab)
        .eq('sub_tab', selectedSubTab)
        .single();

      if (!currentData) return;

      const updatedStructure = { ...currentData.structure };
      let items;

      // Get the correct items array based on type
      switch (type) {
        case 'maintabs':
          items = structure.maintabs;
          break;
        case 'subtabs':
          items = structure.subtabs;
          break;
        case 'sections':
          items = structure.sections;
          break;
        case 'subsections':
          items = structure.subsections;
          break;
      }

      // Perform the reorder
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);

      // Update order in structure
      const newOrder = {};
      items.forEach((item, index) => {
        newOrder[item.name] = index;
      });

      // Update the appropriate order object
      switch (type) {
        case 'maintabs':
          updatedStructure.order.maintabs = newOrder;
          break;
        case 'subtabs':
          updatedStructure.order.subtabs = newOrder;
          break;
        case 'sections':
          updatedStructure.order.sections = newOrder;
          break;
        case 'subsections':
          updatedStructure.order.subsections = newOrder;
          break;
      }

      // Update database
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({ structure: updatedStructure })
        .eq('main_tab', selectedMainTab)
        .eq('sub_tab', selectedSubTab);

      if (error) throw error;

      // Update local state
      setStructure(prev => ({
        ...prev,
        [type]: items,
        order: updatedStructure.order
      }));

      toast.success('Order updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const handleOrderChange = (index: number, direction: 'up' | 'down', items: StructureItem[]) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) return;

    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];

    // Update order values
    newItems.forEach((item, idx) => {
      item.order = idx;
    });

    // Update the structure
    if (items === structure.maintabs) {
      setStructure(prev => ({ ...prev, maintabs: newItems }));
    } else if (items === structure.subtabs[selectedMainTab]) {
      setStructure(prev => ({ ...prev, subtabs: { ...prev.subtabs, [selectedMainTab]: newItems } }));
    } else if (items === structure.sections[selectedSubTab]) {
      setStructure(prev => ({ ...prev, sections: { ...prev.sections, [selectedSubTab]: newItems } }));
    } else if (items === structure.subsections[selectedSection]) {
      setStructure(prev => ({ ...prev, subsections: { ...prev.subsections, [selectedSection]: newItems } }));
    } else if (items === structure.fields[selectedSubSection]) {
      setStructure(prev => ({ ...prev, fields: { ...prev.fields, [selectedSubSection]: newItems } }));
    }

    // Update the database
    handleUpdateStructure(structure);
  };

  const tabLevels = {
    maintabs: { label: 'Main Tabs', level: 1 },
    subtabs: { label: 'Sub Tabs', level: 2 },
    sections: { label: 'Sections', level: 3 },
    subsections: { label: 'Subsections', level: 4 },
    fields: { label: 'Fields', level: 5 }
  };

  const handleAddClick = (type: 'maintab' | 'subtab' | 'section' | 'subsection' | 'field') => {
    setSelectedItemType(type);
    setIsAddDialogOpen(true);
  };

  const handleAddNewItem = () => {
    if (!newItemName) return;

    const newItem = {
      id: uuidv4(),
      name: newItemName,
      visible: true,
    };

    switch (selectedItemType) {
      case 'maintab':
        setStructure(prev => ({
          ...prev,
          maintabs: [...prev.maintabs, newItem]
        }));
        break;
      case 'subtab':
        if (!selectedMainTab) return;
        setStructure(prev => ({
          ...prev,
          subtabs: [...prev.subtabs, { ...newItem, parent: { maintab: selectedMainTab } }]
        }));
        break;
      case 'section':
        if (!selectedMainTab || !selectedSubTab) return;
        setStructure(prev => ({
          ...prev,
          sections: [...prev.sections, {
            ...newItem,
            parent: {
              maintab: selectedMainTab,
              subtab: selectedSubTab
            }
          }]
        }));
        break;
      case 'subsection':
        if (!selectedMainTab || !selectedSubTab || !selectedSection) return;
        setStructure(prev => ({
          ...prev,
          subsections: [...prev.subsections, {
            ...newItem,
            parent: {
              maintab: selectedMainTab,
              subtab: selectedSubTab,
              section: selectedSection
            }
          }]
        }));
        break;
    }

    // Reset form
    setNewItemName('');
    setSelectedMainTab(null);
    setSelectedSubTab(null);
    setSelectedSection(null);
    setSelectedSubSection(null);
    setIsAddDialogOpen(false);
  };

  const AddDialog = () => (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {selectedItemType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              placeholder={`Enter ${selectedItemType} name`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
          </div>
          {selectedItemType === 'subtab' && (
            <div>
              <Label>Parent Main Tab</Label>
              <Select
                value={selectedMainTab || ''}
                onValueChange={(value) => setSelectedMainTab(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a main tab" />
                </SelectTrigger>
                <SelectContent>
                  {structure.maintabs.map((tab) => (
                    <SelectItem key={tab.id} value={tab.name}>
                      {tab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {selectedItemType === 'section' && (
            <>
              <div>
                <Label>Parent Main Tab</Label>
                <Select
                  value={selectedMainTab || ''}
                  onValueChange={(value) => setSelectedMainTab(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a main tab" />
                  </SelectTrigger>
                  <SelectContent>
                    {structure.maintabs.map((tab) => (
                      <SelectItem key={tab.id} value={tab.name}>
                        {tab.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Parent Sub Tab</Label>
                <Select
                  value={selectedSubTab || ''}
                  onValueChange={(value) => setSelectedSubTab(value)}
                  disabled={!selectedMainTab}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sub tab" />
                  </SelectTrigger>
                  <SelectContent>
                    {structure.subtabs
                      .filter(subtab => subtab.parent.maintab === selectedMainTab)
                      .map((subtab) => (
                        <SelectItem key={subtab.id} value={subtab.name}>
                          {subtab.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {selectedItemType === 'subsection' && (
            <>
              <div>
                <Label>Parent Main Tab</Label>
                <Select
                  value={selectedMainTab || ''}
                  onValueChange={(value) => setSelectedMainTab(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a main tab" />
                  </SelectTrigger>
                  <SelectContent>
                    {structure.maintabs.map((tab) => (
                      <SelectItem key={tab.id} value={tab.name}>
                        {tab.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Parent Sub Tab</Label>
                <Select
                  value={selectedSubTab || ''}
                  onValueChange={(value) => setSelectedSubTab(value)}
                  disabled={!selectedMainTab}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sub tab" />
                  </SelectTrigger>
                  <SelectContent>
                    {structure.subtabs
                      .filter(subtab => subtab.parent.maintab === selectedMainTab)
                      .map((subtab) => (
                        <SelectItem key={subtab.id} value={subtab.name}>
                          {subtab.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Parent Section</Label>
                <Select
                  value={selectedSection || ''}
                  onValueChange={(value) => setSelectedSection(value)}
                  disabled={!selectedSubTab}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {structure.sections
                      .filter(section =>
                        section.parent.maintab === selectedMainTab &&
                        section.parent.subtab === selectedSubTab
                      )
                      .map((section) => (
                        <SelectItem key={section.id} value={section.name}>
                          {section.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewItem}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const SelectTablesDialog = () => (
    <Dialog open={isSelectTablesDialogOpen} onOpenChange={setIsSelectTablesDialogOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Tables and Fields</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <SelectTablesAndFieldsDialog
            isOpen={isSelectTablesDialogOpen}
            onClose={() => setIsSelectTablesDialogOpen(false)}
            onApply={(tables, fields) => {
              handleTablesFieldsSelect(tables, fields);
              setIsSelectTablesDialogOpen(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );

  const EditDialog = () => {
    const handleEditItem = () => {
      if (!editItemName || !editItemType) return;

      switch (editItemType) {
        case 'maintab':
          setStructure(prev => ({
            ...prev,
            maintabs: prev.maintabs.map(tab =>
              tab.name === selectedMainTab ? { ...tab, name: editItemName } : tab
            )
          }));
          setSelectedMainTab(editItemName);
          break;
        case 'subtab':
          setStructure(prev => ({
            ...prev,
            subtabs: prev.subtabs.map(subtab =>
              subtab.name === selectedSubTab ? { ...subtab, name: editItemName } : subtab
            )
          }));
          setSelectedSubTab(editItemName);
          break;
        case 'section':
          setStructure(prev => ({
            ...prev,
            sections: prev.sections.map(section =>
              section.name === selectedSection ? { ...section, name: editItemName } : section
            )
          }));
          setSelectedSection(editItemName);
          break;
        case 'subsection':
          setStructure(prev => ({
            ...prev,
            subsections: prev.subsections.map(subsection =>
              subsection.name === selectedSubSection ? { ...subsection, name: editItemName } : subsection
            )
          }));
          setSelectedSubSection(editItemName);
          break;
      }

      setIsEditDialogOpen(false);
      setEditItemName('');
      setEditItemType(null);
    };

    return (
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editItemType}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
                placeholder={`Enter ${editItemType} name`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditItem}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const [editingField, setEditingField] = useState<{
    type: 'maintab' | 'subtab' | 'section' | 'subsection' | null;
    value: string;
  }>({ type: null, value: '' });

  const handleInlineEdit = (type: 'maintab' | 'subtab' | 'section' | 'subsection', currentValue: string) => {
    setEditingField({ type, value: currentValue });
  };

  const handleInlineEditSubmit = async (e: React.KeyboardEvent | React.FocusEvent) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') {
      return;
    }

    if (!editingField.value || editingField.value === '') {
      setEditingField({ type: '', value: '' });
      return;
    }

    try {
      const { data: currentData } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*')
        .eq('main_tab', selectedMainTab)
        .eq('sub_tab', selectedSubTab)
        .single();

      if (!currentData) return;

      // Create updated structure with new name
      const updatedStructure = { ...currentData.structure };
      const oldValue = editingField.type === 'maintab' ? selectedMainTab :
                      editingField.type === 'subtab' ? selectedSubTab :
                      editingField.type === 'section' ? selectedSection :
                      selectedSubSection;

      // Update names in all relevant places
      switch (editingField.type) {
        case 'maintab':
          // Update in maintabs array
          updatedStructure.maintabs = updatedStructure.maintabs.map(tab =>
            tab.name === oldValue ? { ...tab, name: editingField.value } : tab
          );
          // Update in subtabs parent references
          updatedStructure.subtabs = updatedStructure.subtabs.map(tab =>
            tab.parent.maintab === oldValue ? { ...tab, parent: { ...tab.parent, maintab: editingField.value } } : tab
          );
          // Update in order
          if (updatedStructure.order.maintabs[oldValue] !== undefined) {
            updatedStructure.order.maintabs[editingField.value] = updatedStructure.order.maintabs[oldValue];
            delete updatedStructure.order.maintabs[oldValue];
          }
          // Update in visibility
          if (updatedStructure.visibility.maintabs[oldValue] !== undefined) {
            updatedStructure.visibility.maintabs[editingField.value] = updatedStructure.visibility.maintabs[oldValue];
            delete updatedStructure.visibility.maintabs[oldValue];
          }
          break;

        case 'subtab':
          // Update in subtabs array
          updatedStructure.subtabs = updatedStructure.subtabs.map(tab =>
            tab.name === oldValue ? { ...tab, name: editingField.value } : tab
          );
          // Update in sections parent references
          updatedStructure.sections = updatedStructure.sections.map(section =>
            section.parent.subtab === oldValue ? { ...section, parent: { ...section.parent, subtab: editingField.value } } : section
          );
          // Update in order
          if (updatedStructure.order.subtabs[oldValue] !== undefined) {
            updatedStructure.order.subtabs[editingField.value] = updatedStructure.order.subtabs[oldValue];
            delete updatedStructure.order.subtabs[oldValue];
          }
          // Update in visibility
          if (updatedStructure.visibility.subtabs[oldValue] !== undefined) {
            updatedStructure.visibility.subtabs[editingField.value] = updatedStructure.visibility.subtabs[oldValue];
            delete updatedStructure.visibility.subtabs[oldValue];
          }
          break;

        case 'section':
          // Update in sections array
          updatedStructure.sections = updatedStructure.sections.map(section =>
            section.name === oldValue ? { ...section, name: editingField.value } : section
          );
          // Update in subsections parent references
          updatedStructure.subsections = updatedStructure.subsections.map(subsection =>
            subsection.parent.section === oldValue ? { ...subsection, parent: { ...subsection.parent, section: editingField.value } } : subsection
          );
          // Update in order
          if (updatedStructure.order.sections[oldValue] !== undefined) {
            updatedStructure.order.sections[editingField.value] = updatedStructure.order.sections[oldValue];
            delete updatedStructure.order.sections[oldValue];
          }
          // Update in visibility
          if (updatedStructure.visibility.sections[oldValue] !== undefined) {
            updatedStructure.visibility.sections[editingField.value] = updatedStructure.visibility.sections[oldValue];
            delete updatedStructure.visibility.sections[oldValue];
          }
          break;

        case 'subsection':
          // Update in subsections array
          updatedStructure.subsections = updatedStructure.subsections.map(subsection =>
            subsection.name === oldValue ? { ...subsection, name: editingField.value } : subsection
          );
          // Update in order
          if (updatedStructure.order.subsections[oldValue] !== undefined) {
            updatedStructure.order.subsections[editingField.value] = updatedStructure.order.subsections[oldValue];
            delete updatedStructure.order.subsections[oldValue];
          }
          // Update in visibility
          if (updatedStructure.visibility.subsections[oldValue] !== undefined) {
            updatedStructure.visibility.subsections[editingField.value] = updatedStructure.visibility.subsections[oldValue];
            delete updatedStructure.visibility.subsections[oldValue];
          }
          break;
      }

      // Update the database with new structure and name
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          [editingField.type === 'maintab' ? 'main_tab' :
           editingField.type === 'subtab' ? 'sub_tab' : 'structure']: 
           editingField.type === 'maintab' || editingField.type === 'subtab' ? 
           editingField.value : updatedStructure
        })
        .eq('main_tab', selectedMainTab)
        .eq('sub_tab', selectedSubTab);

      if (error) throw error;

      // Update local state
      setStructure(updatedStructure);

      // Update selected item if necessary
      if (editingField.type === 'maintab') setSelectedMainTab(editingField.value);
      if (editingField.type === 'subtab') setSelectedSubTab(editingField.value);
      if (editingField.type === 'section') setSelectedSection(editingField.value);
      if (editingField.type === 'subsection') setSelectedSubSection(editingField.value);

      // Clear editing state
      setEditingField({ type: '', value: '' });

      toast.success('Name updated successfully');
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name');
    }
  };

  const handleVisibilityChange = async (item: StructureItem, visible: boolean) => {
    try {
      // Get current structure
      const { data: currentData } = await supabase
        .from('profile_category_table_mapping_2')
        .select('structure')
        .eq('main_tab', selectedMainTab)
        .eq('sub_tab', selectedSubTab)
        .single();

      if (!currentData) return;

      const updatedStructure = { ...currentData.structure };
      const visibility = updatedStructure.visibility;
      
      // Update visibility based on item type and hierarchy
      switch (item.type) {
        case 'maintab':
          // Main tab affects everything
          visibility.maintabs[item.name] = visible;
          
          // When turning maintab ON, restore all child items to visible
          // When turning OFF, hide all child items
          structure.subtabs
            .filter(subtab => subtab.parent.maintab === item.name)
            .forEach(subtab => {
              visibility.subtabs[subtab.name] = visible;
              
              structure.sections
                .filter(section => section.parent.subtab === subtab.name)
                .forEach(section => {
                  visibility.sections[section.name] = visible;
                  
                  structure.subsections
                    .filter(subsection => subsection.parent.section === section.name)
                    .forEach(subsection => {
                      visibility.subsections[subsection.name] = visible;
                      
                      structure.fields
                        .filter(field => field.parent.subsection === subsection.name)
                        .forEach(field => {
                          visibility.fields[field.name] = visible;
                        });
                    });
                });
            });
          break;

        case 'subtab':
          // Subtab affects sections, subsections, and fields
          visibility.subtabs[item.name] = visible;
          
          // Find all sections under this subtab
          structure.sections
            .filter(section => section.parent.subtab === item.name)
            .forEach(section => {
              visibility.sections[section.name] = visible;
              
              // Find all subsections under these sections
              structure.subsections
                .filter(subsection => subsection.parent.section === section.name)
                .forEach(subsection => {
                  visibility.subsections[subsection.name] = visible;
                  
                  // Find all fields under these subsections
                  structure.fields
                    .filter(field => field.parent.subsection === subsection.name)
                    .forEach(field => {
                      visibility.fields[field.name] = visible;
                    });
                });
            });
          break;

        case 'section':
          // Section affects subsections and fields
          visibility.sections[item.name] = visible;
          
          // Find all subsections under this section
          structure.subsections
            .filter(subsection => subsection.parent.section === item.name)
            .forEach(subsection => {
              visibility.subsections[subsection.name] = visible;
              
              // Find all fields under these subsections
              structure.fields
                .filter(field => field.parent.subsection === subsection.name)
                .forEach(field => {
                  visibility.fields[field.name] = visible;
                });
            });
          break;

        case 'subsection':
          // Subsection only affects fields
          visibility.subsections[item.name] = visible;
          
          // Find all fields under this subsection
          structure.fields
            .filter(field => field.parent.subsection === item.name)
            .forEach(field => {
              visibility.fields[field.name] = visible;
            });
          break;

        case 'field':
          // Fields don't affect anything else
          visibility.fields[item.name] = visible;
          break;
      }

      // Update database
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({ structure: updatedStructure })
        .eq('main_tab', selectedMainTab)
        .eq('sub_tab', selectedSubTab);

      if (error) throw error;

      // Update local state with the exact same visibility states we just set
      setStructure(prev => {
        const newStructure = { ...prev };
        
        // Helper function to update visibility of items
        const updateItems = (items: any[], type: string) => {
          return items.map(item => {
            const isVisible = visibility[type]?.[item.name] ?? true;
            return {
              ...item,
              visible: isVisible
            };
          });
        };

        // Update all item types
        newStructure.maintabs = updateItems(prev.maintabs, 'maintabs');
        newStructure.subtabs = updateItems(prev.subtabs, 'subtabs');
        newStructure.sections = updateItems(prev.sections, 'sections');
        newStructure.subsections = updateItems(prev.subsections, 'subsections');
        newStructure.fields = updateItems(prev.fields, 'fields');

        return newStructure;
      });

      toast.success('Visibility updated successfully');
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  const handleMainTabVisibilityChange = async (mainTab: string, visible: boolean) => {
    try {
      // Get current structure for this main tab
      const { data: currentData } = await supabase
        .from('profile_category_table_mapping_2')
        .select('structure')
        .eq('main_tab', mainTab)
        .single();

      if (!currentData) return;

      const updatedStructure = { ...currentData.structure };
      const visibility = updatedStructure.visibility;

      // Update main tab visibility
      visibility.maintabs = {
        ...visibility.maintabs,
        [mainTab]: visible
      };

      if (!visible) {
        // Hide all child elements
        structure.subtabs
          .filter(subtab => subtab.parent.maintab === mainTab)
          .forEach(subtab => {
            visibility.subtabs[subtab.name] = false;
            
            structure.sections
              .filter(section => section.parent.subtab === subtab.name)
              .forEach(section => {
                visibility.sections[section.name] = false;
                
                structure.subsections
                  .filter(subsection => subsection.parent.section === section.name)
                  .forEach(subsection => {
                    visibility.subsections[subsection.name] = false;
                    
                    structure.fields
                      .filter(field => field.parent.subsection === subsection.name)
                      .forEach(field => {
                        visibility.fields[field.name] = false;
                      });
                  });
              });
          });
      }

      // Update database
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({ structure: updatedStructure })
        .eq('main_tab', mainTab);

      if (error) throw error;

      // Update local state
      setStructure(prev => {
        const newStructure = { ...prev };
        const updateVisibility = (items: any[], type: string) => {
          return items.map(item => ({
            ...item,
            visible: getEffectiveVisibility(item, type, updatedStructure)
          }));
        };

        newStructure.maintabs = updateVisibility(prev.maintabs, 'maintabs');
        newStructure.subtabs = updateVisibility(prev.subtabs, 'subtabs');
        newStructure.sections = updateVisibility(prev.sections, 'sections');
        newStructure.subsections = updateVisibility(prev.subsections, 'subsections');
        newStructure.fields = updateVisibility(prev.fields, 'fields');

        return newStructure;
      });

      toast.success('Main tab visibility updated successfully');
    } catch (error) {
      console.error('Error updating main tab visibility:', error);
      toast.error('Failed to update main tab visibility');
    }
  };

  const handleUpdateStructure = async (structure: any) => {
    try {
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({ structure });

      if (error) throw error;

      toast.success('Structure updated successfully');
    } catch (error) {
      console.error('Error updating structure:', error);
      toast.error('Failed to update structure');
    }
  };

  const renderStructureTab = () => {
    return (
      <div className="grid grid-cols-[2fr,2fr,2fr,2fr,3fr] gap-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Main Tabs</h3>
            <Button variant="outline" size="sm" onClick={() => handleAddClick('maintab')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[70vh] border rounded-md">
            <div className="p-4 space-y-2">
              {structure.maintabs.map((tab) => (
                <div
                  key={tab.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md cursor-pointer",
                    selectedMainTab === tab.name ? "bg-blue-100" : "hover:bg-muted"
                  )}
                  onClick={() => handleMainTabSelect(tab.name)}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span>{tab.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={tab.visible} 
                      onCheckedChange={(checked) => handleVisibilityChange({
                        type: 'maintab',
                        name: tab.name,
                        id: tab.id
                      }, checked)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleInlineEdit('maintab', tab.name)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Sub Tabs</h3>
            <Button variant="outline" size="sm" onClick={() => handleAddClick('subtab')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[70vh] border rounded-md">
            <div className="p-4 space-y-2">
              {selectedMainTab && getSubTabsForMainTab(selectedMainTab).map((subtab) => (
                <div
                  key={subtab.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md cursor-pointer",
                    selectedSubTab === subtab.name ? "bg-blue-100" : "hover:bg-muted"
                  )}
                  onClick={() => handleSubTabSelect(subtab.name)}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span>{subtab.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={subtab.visible}
                      onCheckedChange={(checked) => handleVisibilityChange({
                        type: 'subtab',
                        name: subtab.name,
                        id: subtab.id
                      }, checked)}
                    />
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Sections</h3>
            <Button variant="outline" size="sm" onClick={() => handleAddClick('section')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[70vh] border rounded-md">
            <div className="p-4 space-y-2">
              {selectedSubTab && getSectionsForSubTab(selectedSubTab).map((section) => (
                <div
                  key={section.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md cursor-pointer",
                    selectedSection === section.name ? "bg-blue-100" : "hover:bg-muted"
                  )}
                  onClick={() => handleSectionSelect(section.name)}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span>{section.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={section.visible}
                      onCheckedChange={(checked) => handleVisibilityChange({
                        type: 'section',
                        name: section.name,
                        id: section.id
                      }, checked)}
                    />
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Subsections</h3>
            <Button variant="outline" size="sm" onClick={() => handleAddClick('subsection')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[70vh] border rounded-md">
            <div className="p-4 space-y-2">
              {selectedSection && getSubsectionsForSection(selectedSection).map((subsection) => (
                <div
                  key={subsection.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md cursor-pointer",
                    selectedSubSection === subsection.name ? "bg-blue-100" : "hover:bg-muted"
                  )}
                  onClick={() => handleSubsectionSelect(subsection.name)}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span>{subsection.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={subsection.visible}
                      onCheckedChange={(checked) => handleVisibilityChange({
                        type: 'subsection',
                        name: subsection.name,
                        id: subsection.id
                      }, checked)}
                    />
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Selected Items</h3>
          </div>
          {renderSelectedItems()}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Column Mappings</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSelectTablesDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Fields
            </Button>
          </div>
          <div className="border rounded-md">
            <div className="p-4">
              <div className="bg-muted/50 rounded-md mb-2">
                <div className="grid grid-cols-[auto,2fr,2fr,auto] gap-4 p-3 font-medium">
                  <div>Order</div>
                  <div>Name</div>
                  <div>Table</div>
                  <div>Actions</div>
                </div>
              </div>
              <ScrollArea className="h-[400px] pr-4">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="fields">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-2"
                      >
                        {getFieldsForSubsection(selectedSubSection).map((field, index) => (
                          <Draggable
                            key={field.id}
                            draggableId={field.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="grid grid-cols-[auto,2fr,2fr,auto] gap-4 p-3 bg-white rounded-md border items-center hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                  </div>
                                  <span className="font-medium">{index + 1}</span>
                                </div>
                                <span className="truncate">{field.name}</span>
                                <span className="truncate text-muted-foreground">{field.table}</span>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={field.visible}
                                    onCheckedChange={(checked) => handleVisibilityChange({
                                      type: 'field',
                                      name: field.name,
                                      id: field.id
                                    }, checked)}
                                  />
                                  <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNewStructureForm = () => {
    return (
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-[1fr,1fr] gap-8">
          {/* Selection Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Add New Structure</h3>
              <Button
                variant="default"
                size="sm"
                onClick={handleSubmitNewStructure}
              >
                Add Structure
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Main Tab</Label>
                <div className="flex gap-2">
                  <Select
                    value={formState.mainTab}
                    onValueChange={(value) => handleFormChange('mainTab', value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Main Tab" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">+ Create New</SelectItem>
                      {structure.maintabs.map((tab) => (
                        <SelectItem key={tab.id} value={tab.name}>
                          {tab.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formState.mainTab === 'new' && (
                    <Input
                      placeholder="Enter new main tab name"
                      value={newItemInputs.mainTab}
                      onChange={(e) => setNewItemInputs(prev => ({ ...prev, mainTab: e.target.value }))}
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Sub Tab</Label>
                <div className="flex gap-2">
                  <Select
                    value={formState.tab}
                    onValueChange={(value) => handleFormChange('tab', value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Sub Tab" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">+ Create New</SelectItem>
                      {structure.subtabs
                        .filter(tab => !formState.mainTab || tab.parent.maintab === formState.mainTab)
                        .map((tab) => (
                          <SelectItem key={tab.id} value={tab.name}>
                            {tab.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {formState.tab === 'new' && (
                    <Input
                      placeholder="Enter new sub tab name"
                      value={newItemInputs.tab}
                      onChange={(e) => setNewItemInputs(prev => ({ ...prev, tab: e.target.value }))}
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Section</Label>
                <div className="flex gap-2">
                  <Select
                    value={formState.section}
                    onValueChange={(value) => handleFormChange('section', value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">+ Create New</SelectItem>
                      {structure.sections
                        .filter(section => !formState.tab || section.parent.subtab === formState.tab)
                        .map((section) => (
                          <SelectItem key={section.id} value={section.name}>
                            {section.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {formState.section === 'new' && (
                    <Input
                      placeholder="Enter new section name"
                      value={newItemInputs.section}
                      onChange={(e) => setNewItemInputs(prev => ({ ...prev, section: e.target.value }))}
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Subsection</Label>
                <div className="flex gap-2">
                  <Select
                    value={formState.subsection}
                    onValueChange={(value) => handleFormChange('subsection', value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Subsection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">+ Create New</SelectItem>
                      {structure.subsections
                        .filter(subsection => !formState.section || subsection.parent.section === formState.section)
                        .map((subsection) => (
                          <SelectItem key={subsection.id} value={subsection.name}>
                            {subsection.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {formState.subsection === 'new' && (
                    <Input
                      placeholder="Enter new subsection name"
                      value={newItemInputs.subsection}
                      onChange={(e) => setNewItemInputs(prev => ({ ...prev, subsection: e.target.value }))}
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Tables and Fields</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Select Tables and Fields"
                    readOnly
                    value={formState.selectedTables.length > 0 ? `${formState.selectedTables.length} tables selected` : ''}
                    onClick={() => formState.subsection ? setIsSelectTablesDialogOpen(true) : toast.error('Please select a subsection first')}
                    className="w-[200px]"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => formState.subsection ? setIsSelectTablesDialogOpen(true) : toast.error('Please select a subsection first')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Structure Preview</h3>
            <div className="border rounded-md p-4 space-y-4">
              <div className="space-y-2">
                <Label>Main Tab</Label>
                <div className="p-2 bg-muted rounded-md">
                  {formState.mainTab === 'new' ? newItemInputs.mainTab : formState.mainTab || 'Not selected'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sub Tab</Label>
                <div className="p-2 bg-muted rounded-md">
                  {formState.tab === 'new' ? newItemInputs.tab : formState.tab || 'Not selected'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Section</Label>
                <div className="p-2 bg-muted rounded-md">
                  {formState.section === 'new' ? newItemInputs.section : formState.section || 'Not selected'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subsection</Label>
                <div className="p-2 bg-muted rounded-md">
                  {formState.subsection === 'new' ? newItemInputs.subsection : formState.subsection || 'Not selected'}
                </div>
              </div>

              {formState.selectedTables.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Tables</Label>
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    {formState.selectedTables.map((table) => (
                      <div key={table} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md">
                        <span>{table}</span>
                        <div className="ml-4 text-sm text-muted-foreground">
                          {formState.selectedFields[table]?.length || 0} fields selected
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getEffectiveVisibility = (item: any, type: string, structure: any) => {
    if (!structure?.visibility) return true;

    const visibility = structure.visibility;
    const itemVisible = visibility[type]?.[item.name] ?? true;

    switch (type) {
      case 'fields':
        return itemVisible &&
          (visibility.subsections?.[item.parent?.subsection] ?? true) &&
          (visibility.sections?.[item.parent?.section] ?? true) &&
          (visibility.subtabs?.[item.parent?.subtab] ?? true) &&
          (visibility.maintabs?.[item.parent?.maintab] ?? true);
      case 'subsections':
        return itemVisible &&
          (visibility.sections?.[item.parent?.section] ?? true) &&
          (visibility.subtabs?.[item.parent?.subtab] ?? true) &&
          (visibility.maintabs?.[item.parent?.maintab] ?? true);
      case 'sections':
        return itemVisible &&
          (visibility.subtabs?.[item.parent?.subtab] ?? true) &&
          (visibility.maintabs?.[item.parent?.maintab] ?? true);
      case 'subtabs':
        return itemVisible &&
          (visibility.maintabs?.[item.parent?.maintab] ?? true);
      case 'maintabs':
        return itemVisible;
      default:
        return true;
    }
  };

  const renderSelectedItems = () => (
    <div className="border rounded-md p-4 space-y-4 mb-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Main Tab</Label>
          <div className="flex items-center mb-2 gap-2">
            {editingField.type === 'maintab' ? (
              <Input
                value={editingField.value}
                onChange={(e) => setEditingField(prev => ({ ...prev, value: e.target.value }))}
                onKeyDown={handleInlineEditSubmit}
                onBlur={handleInlineEditSubmit}
                autoFocus
              />
            ) : (
              <div
                className="flex-1 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted/50"
                onDoubleClick={() => handleInlineEdit('maintab', selectedMainTab || '')}
              >
                {selectedMainTab || 'Not selected'}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Sub Tab</Label>
          <div className="flex items-center mb-2 gap-2">
            {editingField.type === 'subtab' ? (
              <Input
                value={editingField.value}
                onChange={(e) => setEditingField(prev => ({ ...prev, value: e.target.value }))}
                onKeyDown={handleInlineEditSubmit}
                onBlur={handleInlineEditSubmit}
                autoFocus
              />
            ) : (
              <div
                className="flex-1 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted/50"
                onDoubleClick={() => handleInlineEdit('subtab', selectedSubTab || '')}
              >
                {selectedSubTab || 'Not selected'}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Section</Label>
          <div className="flex items-center mb-2 gap-2">
            {editingField.type === 'section' ? (
              <Input
                value={editingField.value}
                onChange={(e) => setEditingField(prev => ({ ...prev, value: e.target.value }))}
                onKeyDown={handleInlineEditSubmit}
                onBlur={handleInlineEditSubmit}
                autoFocus
              />
            ) : (
              <div
                className="flex-1 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted/50"
                onDoubleClick={() => handleInlineEdit('section', selectedSection || '')}
              >
                {selectedSection || 'Not selected'}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Subsection</Label>
          <div className="flex items-center mb-2 gap-2">
            {editingField.type === 'subsection' ? (
              <Input
                value={editingField.value}
                onChange={(e) => setEditingField(prev => ({ ...prev, value: e.target.value }))}
                onKeyDown={handleInlineEditSubmit}
                onBlur={handleInlineEditSubmit}
                autoFocus
              />
            ) : (
              <div
                className="flex-1 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted/50"
                onDoubleClick={() => handleInlineEdit('subsection', selectedSubSection || '')}
              >
                {selectedSubSection || 'Not selected'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-8xl max-h-[80vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Table Structure Settings</DialogTitle>
            <DialogDescription>
              Manage your table structure, sections, and column visibility settings
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="structure" className="h-full flex flex-col" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="px-6 border-b">
                <TabsTrigger value="new">New Structure</TabsTrigger>
                <TabsTrigger value="structure">Structure</TabsTrigger>
              </TabsList>
              <TabsContent value="structure" className="flex-1 p-6 overflow-auto">
                {renderStructureTab()}
              </TabsContent>
              <TabsContent value="new" className="flex-1 p-6 overflow-auto">
                {renderNewStructureForm()}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {isSelectTablesDialogOpen && (
        <Dialog open={isSelectTablesDialogOpen} onOpenChange={setIsSelectTablesDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Select Tables and Fields</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <SelectTablesAndFieldsDialog
                isOpen={isSelectTablesDialogOpen}
                onClose={() => setIsSelectTablesDialogOpen(false)}
                onApply={(tables, fields) => {
                  handleTablesFieldsSelect(tables, fields);
                  setIsSelectTablesDialogOpen(false);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isEditDialogOpen && <EditDialog />}
      <AddDialog />
    </>
  );
}