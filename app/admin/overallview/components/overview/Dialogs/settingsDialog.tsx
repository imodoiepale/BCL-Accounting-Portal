// SettingsDialog.tsx
// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronUp, ChevronDown, Plus, GripVertical, Settings, Edit2, Trash2, Pencil } from "lucide-react";
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

const DraggableList: React.FC<DraggableListProps> = ({
  items,
  type,
  onEdit,
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
                        aria-label={`Toggle ${item.name} visibility`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(item)}
                        className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
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
    maintabs: Array<{ id: string; name: string; visible: boolean }>;
    subtabs: Array<{ id: string; name: string; visible: boolean; parent: { maintab: string } }>;
    sections: Array<{ id: string; name: string; visible: boolean; parent: { maintab: string; subtab: string } }>;
    subsections: Array<{ id: string; name: string; visible: boolean; parent: { maintab: string; subtab: string; section: string } }>;
    fields: Array<{ id: string; name: string; table: string; visible: boolean; parent: { maintab: string; subtab: string; section: string; subsection: string } }>;
  }>({
    maintabs: [],
    subtabs: [],
    sections: [],
    subsections: [],
    fields: []
  });

  const [formState, setFormState] = useState({
    mainTab: '',
    tab: '',
    section: '',
    subsection: '',
    selectedTables: [] as string[],
    selectedFields: {} as { [table: string]: string[] }
  });

  const [newItemInputs, setNewItemInputs] = useState({
    mainTab: '',
    tab: '',
    section: '',
    subsection: ''
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

        // Process the data to maintain relationships
        const processedData = data.reduce((acc, item) => {
          // Add main tab and its subtabs
          if (item.main_tab) {
            if (!acc.maintabs.has(item.main_tab)) {
              acc.maintabs.add(item.main_tab);
            }
            
            if (item.sub_tab) {
              acc.subtabs.add({
                name: item.sub_tab,
                parent: { maintab: item.main_tab }
              });

              // Process sections from structure
              if (item.structure?.sections) {
                item.structure.sections.forEach((section: any) => {
                  if (section.name) {
                    acc.sections.add({
                      name: section.name,
                      parent: { 
                        maintab: item.main_tab,
                        subtab: item.sub_tab 
                      }
                    });

                    // Process subsections
                    section.subsections?.forEach((subsection: any) => {
                      if (subsection.name) {
                        acc.subsections.add({
                          name: subsection.name,
                          parent: {
                            maintab: item.main_tab,
                            subtab: item.sub_tab,
                            section: section.name
                          }
                        });

                        // Process fields
                        subsection.fields?.forEach((field: any) => {
                          acc.fields.add({
                            name: field.name,
                            table: field.table,
                            column: field.column,
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
          maintabs: new Set<string>(),
          subtabs: new Set<any>(),
          sections: new Set<any>(),
          subsections: new Set<any>(),
          fields: new Set<any>()
        });

        // Convert Sets to arrays with IDs
        const structureData = {
          maintabs: Array.from(processedData.maintabs).map((name, id) => ({ 
            id: String(id), 
            name 
          })),
          subtabs: Array.from(processedData.subtabs).map((item: any, id) => ({ 
            id: String(id), 
            name: item.name,
            parent: item.parent 
          })),
          sections: Array.from(processedData.sections).map((item: any, id) => ({ 
            id: String(id), 
            name: item.name,
            parent: item.parent 
          })),
          subsections: Array.from(processedData.subsections).map((item: any, id) => ({ 
            id: String(id), 
            name: item.name,
            parent: item.parent 
          })),
          fields: Array.from(processedData.fields).map((item: any, id) => ({ 
            id: String(id), 
            name: item.name,
            table: item.table,
            column: item.column,
            parent: item.parent 
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
    let updatedStructure = { ...structure };

    const reorder = (list: StructureItem[], startIndex: number, endIndex: number) => {
      const result = Array.from(list);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    };

    switch (type) {
      case 'maintabs':
        updatedStructure.maintabs = reorder(
          structure.maintabs,
          source.index,
          destination.index
        );
        break;
      case 'subtabs':
        if (selectedMainTab) {
          updatedStructure.maintabs = updatedStructure.maintabs.map(tab => 
            tab.name === selectedMainTab ? { ...tab, subtabs: reorder(tab.subtabs, source.index, destination.index) } : tab
          );
        }
        break;
      case 'sections':
        if (selectedSubTab) {
          updatedStructure.sections = updatedStructure.sections.map(section => 
            section.name === selectedSubTab ? { ...section, subsections: reorder(section.subsections, source.index, destination.index) } : section
          );
        }
        break;
      case 'subsections':
        if (selectedSection) {
          updatedStructure.subsections = updatedStructure.subsections.map(subsection => 
            subsection.name === selectedSection ? { ...subsection, fields: reorder(subsection.fields, source.index, destination.index) } : subsection
          );
        }
        break;
      case 'fields':
        if (selectedSubSection) {
          updatedStructure.fields[selectedSubSection] = reorder(
            structure.fields[selectedSubSection],
            source.index,
            destination.index
          );
        }
        break;
    }

    // Update order values
    const updateOrders = (items: StructureItem[]) => {
      items.forEach((item, index) => {
        item.order = index;
      });
    };

    // Update orders for all affected items
    if (type === 'maintabs') {
      updateOrders(updatedStructure.maintabs);
    } else if (type === 'subtabs' && selectedMainTab) {
      updateOrders(updatedStructure.maintabs.find(tab => tab.name === selectedMainTab)?.subtabs || []);
    } else if (type === 'sections' && selectedSubTab) {
      updateOrders(updatedStructure.sections.find(section => section.name === selectedSubTab)?.subsections || []);
    } else if (type === 'subsections' && selectedSection) {
      updateOrders(updatedStructure.subsections.find(subsection => subsection.name === selectedSection)?.fields || []);
    } else if (type === 'fields' && selectedSubSection) {
      updateOrders(updatedStructure.fields[selectedSubSection]);
    }

    setStructure(updatedStructure);

    try {
      // Save to database
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: {
            order: {
              maintabs: updatedStructure.maintabs.map(tab => tab.order),
              subtabs: Object.fromEntries(
                Object.entries(updatedStructure.maintabs).map(([key, tabs]) => [
                  key,
                  tabs.subtabs.map(tab => tab.order)
                ])
              ),
              sections: Object.fromEntries(
                Object.entries(updatedStructure.sections).map(([key, sections]) => [
                  key,
                  sections.subsections.map(section => section.order)
                ])
              ),
              subsections: Object.fromEntries(
                Object.entries(updatedStructure.subsections).map(([key, subsections]) => [
                  key,
                  subsections.fields.map(subsection => subsection.order)
                ])
              ),
              fields: Object.fromEntries(
                Object.entries(updatedStructure.fields).map(([key, fields]) => [
                  key,
                  fields.map(field => field.order)
                ])
              )
            },
            visibility: {
              maintabs: Object.fromEntries(
                updatedStructure.maintabs.map(tab => [tab.id, tab.visible])
              ),
              subtabs: Object.fromEntries(
                Object.values(updatedStructure.maintabs)
                  .flat()
                  .map(tab => [tab.id, tab.visible])
              ),
              sections: Object.fromEntries(
                Object.values(updatedStructure.sections)
                  .flat()
                  .map(section => [section.id, section.visible])
              ),
              subsections: Object.fromEntries(
                Object.values(updatedStructure.subsections)
                  .flat()
                  .map(subsection => [subsection.id, subsection.visible])
              ),
              fields: Object.fromEntries(
                Object.values(updatedStructure.fields)
                  .flat()
                  .map(field => [field.id, field.visible])
              )
            }
          }
        })
        .eq('id', 1);

      if (error) throw error;
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

  const handleEditClick = (type: 'maintab' | 'subtab' | 'section' | 'subsection', currentName: string) => {
    setEditItemType(type);
    setEditItemName(currentName);
    setIsEditDialogOpen(true);
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
                    <Switch checked={tab.visible} />
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick('maintab', tab.name)}>
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
                    <Switch checked={subtab.visible} />
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick('subtab', subtab.name)}>
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
                    <Switch checked={section.visible} />
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick('section', section.name)}>
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
                    <Switch checked={subsection.visible} />
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick('subsection', subsection.name)}>
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
            <h3 className="text-lg font-semibold">Selected Items</h3>
          </div>
          {selectedSubSection && (
            <div className="border rounded-md p-4 space-y-4 mb-4">
              <div className=" gap-4">
                <div className="space-y-2">
                  <Label>Main Tab</Label>
                  <div className="flex items-center mb-2 gap-2">
                    <Input value={selectedMainTab || ''} readOnly />
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick('maintab', selectedMainTab)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sub Tab</Label>
                  <div className="flex items-center mb-2 gap-2">
                    <Input value={selectedSubTab || ''} readOnly />
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick('subtab', selectedSubTab)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <div className="flex items-center mb-2 gap-2">
                    <Input value={selectedSection || ''} readOnly />
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick('section', selectedSection)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subsection</Label>
                  <div className="flex items-center mb-2 gap-2">
                    <Input value={selectedSubSection || ''} readOnly />
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick('subsection', selectedSubSection)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
         
         <h4 className="text-lg font-semibold">Column Mappings</h4>
          <div className="border rounded-md">
            <div className="p-4">
              <div className="grid grid-cols-[auto,2fr,2fr,auto] gap-2 p-2 font-medium">
                <div>Order</div>
                <div>Name</div>
                <div>Table</div>
                <div>Actions</div>
              </div>
              <ScrollArea className="h-[300px]">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="fields">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="divide-y"
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
                                className="grid grid-cols-[auto,2fr,2fr,auto] gap-2 p-2 items-center hover:bg-muted/50"
                              >
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                  </div>
                                  <span>{index + 1}</span>
                                </div>
                                <span>{field.name}</span>
                                <span>{field.table}</span>
                                <div className="flex items-center gap-2">
                                  <Switch checked={field.visible} />
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

  const renderNewStructureForm = () => (
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
                  disabled={!formState.mainTab}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Sub Tab" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Create New</SelectItem>
                    {formState.mainTab && structure.subtabs[formState.mainTab]?.map((tab) => (
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
                  disabled={!formState.tab}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Create New</SelectItem>
                    {formState.tab && structure.sections[formState.tab]?.map((section) => (
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
              <Label>Tables and Fields</Label>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Select Tables and Fields"
                  readOnly
                  value={formState.selectedTables.length > 0 ? `${formState.selectedTables.length} tables selected` : ''}
                  onClick={() => setIsSelectTablesDialogOpen(true)}
                  className="w-[200px]"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsSelectTablesDialogOpen(true)}
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