// SettingsDialog.tsx
"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [addDialogType, setAddDialogType] = useState<'maintab' | 'subtab' | 'section' | 'subsection' | 'field' | null>(null);
  const [isSelectTablesDialogOpen, setIsSelectTablesDialogOpen] = useState(false);
  const [structure, setStructure] = useState<{
    maintabs: StructureItem[];
    subtabs: Record<string, StructureItem[]>;
    sections: Record<string, StructureItem[]>;
    subsections: Record<string, StructureItem[]>;
    fields: Record<string, StructureItem[]>;
  }>({
    maintabs: [],
    subtabs: {},
    sections: {},
    subsections: {},
    fields: {}
  });

  const [formState, setFormState] = useState({
    tab: '',
    section: '',
    mainTab: '',
    selectedTables: [] as string[],
    selectedFields: {} as { [table: string]: string[] }
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
      // Get actual values, either from selection or new input
      const mainTabValue = getFormValue('mainTab');
      const tabValue = getFormValue('tab');
      const sectionValue = getFormValue('section');

      if (!mainTabValue || !tabValue || !sectionValue) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Convert the new structure to the required format
      const newStructureData = {
        main_tab: mainTabValue,
        sub_tab: tabValue,
        structure: {
          order: {
            maintabs: { [mainTabValue]: 0 },
            subtabs: { [tabValue]: 0 },
            sections: { [sectionValue]: 0 }
          },
          visibility: {
            maintabs: { [mainTabValue]: true },
            subtabs: { [tabValue]: true },
            sections: { [sectionValue]: true }
          },
          sections: [
            {
              name: sectionValue,
              subsections: []
            }
          ]
        }
      };

      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .insert(newStructureData);

      if (error) throw error;

      toast.success('New structure created successfully');
      setIsOpen(false);
      // Reset the form
      setFormState({
        mainTab: '',
        tab: '',
        section: '',
        selectedTables: [],
        selectedFields: {}
      });
      setNewItemInputs({
        mainTab: '',
        tab: '',
        section: ''
      });
    } catch (error) {
      console.error('Error creating new structure:', error);
      toast.error('Failed to create new structure');
    }
  };

  const handleTablesFieldsSelect = (tables: string[], fields: { [table: string]: string[] }) => {
    setFormState(prev => ({
      ...prev,
      selectedTables: tables,
      selectedFields: fields
    }));
    setIsSelectTablesDialogOpen(false);
  };

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

  const [newItemInputs, setNewItemInputs] = useState({
    mainTab: '',
    tab: '',
    section: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    console.log('Structure data changed:', structure);
    if (structure && structure.length > 0) {
      // Process the structure data
      const currentStructure = structure.find(
        s => s.main_tab === activeMainTab && s.sub_tab === activeSubTab
      );
      
      console.log('Current structure:', currentStructure);
      
      if (currentStructure?.structure?.sections) {
        setProcessedSections(currentStructure.structure.sections);
      }
    }
  }, [structure, activeMainTab, activeSubTab]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*');

      if (error) throw error;

      const newStructure = {
        maintabs: [] as StructureItem[],
        subtabs: {} as Record<string, StructureItem[]>,
        sections: {} as Record<string, StructureItem[]>,
        subsections: {} as Record<string, StructureItem[]>,
        fields: {} as Record<string, StructureItem[]>
      };

      data.forEach((row) => {
        // Add main tab if it doesn't exist
        if (!newStructure.maintabs.find(tab => tab.name === row.main_tab)) {
          newStructure.maintabs.push({
            id: `maintab-${row.id}`,
            name: row.main_tab,
            order: row.structure.order.maintabs?.[row.main_tab] || 0,
            visible: row.structure.visibility.maintabs?.[row.main_tab] ?? true,
            type: 'maintab'
          });
        }

        // Add sub tab if it doesn't exist
        if (!newStructure.subtabs[row.main_tab]) {
          newStructure.subtabs[row.main_tab] = [];
        }
        if (!newStructure.subtabs[row.main_tab].find(tab => tab.name === row.sub_tab)) {
          newStructure.subtabs[row.main_tab].push({
            id: `subtab-${row.id}`,
            name: row.sub_tab,
            order: row.structure.order.subtabs?.[row.sub_tab] || 0,
            visible: row.structure.visibility.subtabs?.[row.sub_tab] ?? true,
            type: 'subtab',
            parent: { maintab: row.main_tab }
          });
        }

        // Process sections and subsections
        if (row.structure?.sections) {
          row.structure.sections.forEach((section: any, sectionIndex: number) => {
            if (!newStructure.sections[row.sub_tab]) {
              newStructure.sections[row.sub_tab] = [];
            }
            if (!newStructure.sections[row.sub_tab].find(s => s.name === section.name)) {
              newStructure.sections[row.sub_tab].push({
                id: `section-${row.id}-${sectionIndex}`,
                name: section.name,
                order: row.structure.order.sections?.[section.name] || sectionIndex,
                visible: row.structure.visibility.sections?.[section.name] ?? true,
                type: 'section',
                parent: { maintab: row.main_tab, subtab: row.sub_tab }
              });
            }

            if (section.subsections) {
              section.subsections.forEach((subsection: any, subsectionIndex: number) => {
                if (!newStructure.subsections[section.name]) {
                  newStructure.subsections[section.name] = [];
                }
                if (!newStructure.subsections[section.name].find(s => s.name === subsection.name)) {
                  newStructure.subsections[section.name].push({
                    id: `subsection-${row.id}-${sectionIndex}-${subsectionIndex}`,
                    name: subsection.name,
                    order: row.structure.order.subsections?.[subsection.name] || subsectionIndex,
                    visible: row.structure.visibility.subsections?.[subsection.name] ?? true,
                    type: 'subsection',
                    parent: { maintab: row.main_tab, subtab: row.sub_tab, section: section.name }
                  });
                }

                if (subsection.fields) {
                  subsection.fields.forEach((field: any, fieldIndex: number) => {
                    if (!newStructure.fields[subsection.name]) {
                      newStructure.fields[subsection.name] = [];
                    }
                    if (!newStructure.fields[subsection.name].find(f => f.name === field.name)) {
                      newStructure.fields[subsection.name].push({
                        id: `field-${row.id}-${sectionIndex}-${subsectionIndex}-${fieldIndex}`,
                        name: field.name,
                        order: row.structure.order.fields?.[field.name] || fieldIndex,
                        visible: row.structure.visibility.fields?.[field.name] ?? true,
                        type: 'field',
                        table: field.table,
                        parent: {
                          maintab: row.main_tab,
                          subtab: row.sub_tab,
                          section: section.name,
                          subsection: subsection.name
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });

      // Sort all arrays by order
      newStructure.maintabs.sort((a, b) => a.order - b.order);
      Object.values(newStructure.subtabs).forEach(tabs => tabs.sort((a, b) => a.order - b.order));
      Object.values(newStructure.sections).forEach(sections => sections.sort((a, b) => a.order - b.order));
      Object.values(newStructure.subsections).forEach(subsections => subsections.sort((a, b) => a.order - b.order));
      Object.values(newStructure.fields).forEach(fields => fields.sort((a, b) => a.order - b.order));

      setStructure(newStructure);
    } catch (error) {
      console.error('Error fetching structure:', error);
      toast.error('Failed to load settings data');
    }
  };

  const handleUpdateStructure = async (updatedStructure: typeof structure) => {
    try {
      // Convert the structure back to the database format
      const dbStructure = {
        main_tab: selectedMainTab,
        sub_tab: selectedSubTab,
        structure: {
          order: {
            maintabs: Object.fromEntries(updatedStructure.maintabs.map(tab => [tab.name, tab.order])),
            subtabs: Object.fromEntries(
              Object.values(updatedStructure.subtabs)
                .flat()
                .map(tab => [tab.name, tab.order])
            ),
            sections: Object.fromEntries(
              Object.values(updatedStructure.sections)
                .flat()
                .map(section => [section.name, section.order])
            ),
            subsections: Object.fromEntries(
              Object.values(updatedStructure.subsections)
                .flat()
                .map(subsection => [subsection.name, subsection.order])
            ),
            fields: Object.fromEntries(
              Object.values(updatedStructure.fields)
                .flat()
                .map(field => [field.name, field.order])
            )
          },
          visibility: {
            maintabs: Object.fromEntries(updatedStructure.maintabs.map(tab => [tab.name, tab.visible])),
            subtabs: Object.fromEntries(
              Object.values(updatedStructure.subtabs)
                .flat()
                .map(tab => [tab.name, tab.visible])
            ),
            sections: Object.fromEntries(
              Object.values(updatedStructure.sections)
                .flat()
                .map(section => [section.name, section.visible])
            ),
            subsections: Object.fromEntries(
              Object.values(updatedStructure.subsections)
                .flat()
                .map(subsection => [subsection.name, subsection.visible])
            ),
            fields: Object.fromEntries(
              Object.values(updatedStructure.fields)
                .flat()
                .map(field => [field.name, field.visible])
            )
          },
          sections: Object.values(updatedStructure.sections)
            .flat()
            .map(section => ({
              name: section.name,
              subsections: updatedStructure.subsections[section.name]?.map(subsection => ({
                name: subsection.name,
                fields: updatedStructure.fields[subsection.name]?.map(field => ({
                  name: field.name,
                  table: field.table,
                  column: field.name
                })) || []
              })) || []
            }))
        }
      };

      // Update the database
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .upsert(dbStructure);

      if (error) throw error;
      toast.success('Structure updated successfully');
    } catch (error) {
      console.error('Error updating structure:', error);
      toast.error('Failed to update structure');
    }
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
          updatedStructure.subtabs[selectedMainTab] = reorder(
            structure.subtabs[selectedMainTab],
            source.index,
            destination.index
          );
        }
        break;
      case 'sections':
        if (selectedSubTab) {
          updatedStructure.sections[selectedSubTab] = reorder(
            structure.sections[selectedSubTab],
            source.index,
            destination.index
          );
        }
        break;
      case 'subsections':
        if (selectedSection) {
          updatedStructure.subsections[selectedSection] = reorder(
            structure.subsections[selectedSection],
            source.index,
            destination.index
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
      updateOrders(updatedStructure.subtabs[selectedMainTab]);
    } else if (type === 'sections' && selectedSubTab) {
      updateOrders(updatedStructure.sections[selectedSubTab]);
    } else if (type === 'subsections' && selectedSection) {
      updateOrders(updatedStructure.subsections[selectedSection]);
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
                Object.entries(updatedStructure.subtabs).map(([key, tabs]) => [
                  key,
                  tabs.map(tab => tab.order)
                ])
              ),
              sections: Object.fromEntries(
                Object.entries(updatedStructure.sections).map(([key, sections]) => [
                  key,
                  sections.map(section => section.order)
                ])
              ),
              subsections: Object.fromEntries(
                Object.entries(updatedStructure.subsections).map(([key, subsections]) => [
                  key,
                  subsections.map(subsection => subsection.order)
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
                Object.values(updatedStructure.subtabs)
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
    setAddDialogType(type);
    setIsAddDialogOpen(true);
  };

  const handleAddNewItem = async () => {
    if (!addDialogType) return;

    try {
      let newItemName = '';
      let parentInfo = {};

      switch (addDialogType) {
        case 'maintab':
          newItemName = newStructure.mainTabName;
          break;
        case 'subtab':
          if (!selectedMainTab) {
            toast.error('Please select a main tab first');
            return;
          }
          parentInfo = { maintab: selectedMainTab };
          newItemName = newStructure.subTabName;
          break;
        case 'section':
          if (!selectedSubTab) {
            toast.error('Please select a sub tab first');
            return;
          }
          parentInfo = { maintab: selectedMainTab, subtab: selectedSubTab };
          newItemName = newStructure.sectionName;
          break;
        case 'subsection':
          if (!selectedSection) {
            toast.error('Please select a section first');
            return;
          }
          parentInfo = {
            maintab: selectedMainTab,
            subtab: selectedSubTab,
            section: selectedSection
          };
          newItemName = newStructure.subsectionName;
          break;
        case 'field':
          if (!selectedSubSection) {
            toast.error('Please select a subsection first');
            return;
          }
          parentInfo = {
            maintab: selectedMainTab,
            subtab: selectedSubTab,
            section: selectedSection,
            subsection: selectedSubSection
          };
          setIsSelectTablesDialogOpen(true);
          return;
      }

      if (!newItemName) {
        toast.error('Name is required');
        return;
      }

      let newStructureData = {
        main_tab: selectedMainTab || newItemName,
        sub_tab: selectedSubTab || newItemName,
        structure: {
          order: {
            maintabs: {},
            subtabs: {},
            sections: {},
            subsections: {},
            fields: {}
          },
          visibility: {
            maintabs: {},
            subtabs: {},
            sections: {},
            subsections: {},
            fields: {}
          },
          sections: []
        }
      };

      // Update the structure based on the type
      switch (addDialogType) {
        case 'maintab':
          newStructureData.structure.order.maintabs[newItemName] = 0;
          newStructureData.structure.visibility.maintabs[newItemName] = true;
          break;
        case 'subtab':
          newStructureData.structure.order.subtabs[newItemName] = 0;
          newStructureData.structure.visibility.subtabs[newItemName] = true;
          break;
        case 'section':
          newStructureData.structure.order.sections[newItemName] = 0;
          newStructureData.structure.visibility.sections[newItemName] = true;
          newStructureData.structure.sections.push({
            name: newItemName,
            subsections: []
          });
          break;
        case 'subsection':
          newStructureData.structure.order.subsections[newItemName] = 0;
          newStructureData.structure.visibility.subsections[newItemName] = true;
          const sectionIndex = newStructureData.structure.sections.findIndex(s => s.name === selectedSection);
          if (sectionIndex >= 0) {
            newStructureData.structure.sections[sectionIndex].subsections.push({
              name: newItemName,
              fields: []
            });
          }
          break;
      }

      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .upsert(newStructureData);

      if (error) throw error;

      toast.success(`${addDialogType} added successfully`);
      setIsAddDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    }
  };

  const AddDialog = () => (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {addDialogType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={
                addDialogType === 'maintab'
                  ? newStructure.mainTabName
                  : addDialogType === 'subtab'
                  ? newStructure.subTabName
                  : addDialogType === 'section'
                  ? newStructure.sectionName
                  : newStructure.subsectionName
              }
              onChange={(e) => {
                const value = e.target.value;
                setNewStructure((prev) => ({
                  ...prev,
                  [addDialogType === 'maintab'
                    ? 'mainTabName'
                    : addDialogType === 'subtab'
                    ? 'subTabName'
                    : addDialogType === 'section'
                    ? 'sectionName'
                    : 'subsectionName']: value,
                }));
              }}
              placeholder={`Enter ${addDialogType} name`}
            />
          </div>
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
            onSelect={(tables, fields) => {
              handleTablesFieldsSelect(tables, fields);
              setIsSelectTablesDialogOpen(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );

  const EditDialog = () => {
    const [name, setName] = useState(editingItem?.item.name || '');

    return (
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingItem?.type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Enter ${editingItem?.type} name`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editingItem) return;

                try {
                  const updatedStructure = { ...structure };
                  let items: StructureItem[] = [];

                  switch (editingItem.type) {
                    case 'maintab':
                      items = updatedStructure.maintabs;
                      break;
                    case 'subtab':
                      items = updatedStructure.subtabs[selectedMainTab!];
                      break;
                    case 'section':
                      items = updatedStructure.sections[selectedSubTab!];
                      break;
                    case 'subsection':
                      items = updatedStructure.subsections[selectedSection!];
                      break;
                    case 'field':
                      items = updatedStructure.fields[selectedSubSection!];
                      break;
                  }

                  const item = items.find(i => i.id === editingItem.item.id);
                  if (item) {
                    item.name = name;
                  }

                  setStructure(updatedStructure);
                  await handleUpdateStructure(updatedStructure);
                  setIsEditDialogOpen(false);
                  toast.success('Item updated successfully');
                } catch (error) {
                  console.error('Error updating item:', error);
                  toast.error('Failed to update item');
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const handleEditItem = (type: string, item: StructureItem) => {
    setEditingItem({ type, item });
    setIsEditDialogOpen(true);
  };

  const renderStructureTab = () => (
    <div className="grid grid-cols-[2fr,2fr,2fr,2fr,3fr] gap-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Main Tabs</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddClick('maintab')}
          >
            Add Tab
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
                onClick={() => {
                  setSelectedMainTab(tab.name);
                  setSelectedSubTab(null);
                  setSelectedSection(null);
                  setSelectedSubSection(null);
                }}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <span>{tab.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={tab.visible} 
                    onCheckedChange={(checked) => {
                      const updatedMaintabs = structure.maintabs.map(t => 
                        t.id === tab.id ? { ...t, visible: checked } : t
                      );
                      setStructure(prev => ({ ...prev, maintabs: updatedMaintabs }));
                      handleUpdateStructure(prev => ({ ...prev, maintabs: updatedMaintabs }));
                    }}
                  />
                  <Button variant="ghost" size="icon" onClick={(e) => {
                    e.stopPropagation();
                    handleEditItem('maintab', tab);
                  }}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => {
                    e.stopPropagation();
                    // Add delete logic
                  }}>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddClick('subtab')}
            disabled={!selectedMainTab}
          >
            Add Sub Tab
          </Button>
        </div>
        <ScrollArea className="h-[70vh] border rounded-md">
          <div className="p-4 space-y-2">
            {selectedMainTab && structure.subtabs[selectedMainTab]?.map((subtab) => (
              <div
                key={subtab.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md cursor-pointer",
                  selectedSubTab === subtab.name ? "bg-blue-100" : "hover:bg-muted"
                )}
                onClick={() => {
                  setSelectedSubTab(subtab.name);
                  setSelectedSection(null);
                  setSelectedSubSection(null);
                }}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <span>{subtab.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={subtab.visible} />
                  <Button variant="ghost" size="icon">
                    <Edit2 className="h-4 w-4" />
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddClick('section')}
            disabled={!selectedSubTab}
          >
            Add Section
          </Button>
        </div>
        <ScrollArea className="h-[70vh] border rounded-md">
          <div className="p-4 space-y-2">
            {selectedSubTab && structure.sections[selectedSubTab]?.map((section) => (
              <div
                key={section.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md cursor-pointer",
                  selectedSection === section.name ? "bg-blue-100" : "hover:bg-muted"
                )}
                onClick={() => {
                  setSelectedSection(section.name);
                  setSelectedSubSection(null);
                }}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <span>{section.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={section.visible} />
                  <Button variant="ghost" size="icon">
                    <Edit2 className="h-4 w-4" />
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddClick('subsection')}
            disabled={!selectedSection}
          >
            Add Subsection
          </Button>
        </div>
        <ScrollArea className="h-[70vh] border rounded-md">
          <div className="p-4 space-y-2">
            {selectedSection && structure.subsections[selectedSection]?.map((subsection) => (
              <div
                key={subsection.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md cursor-pointer",
                  selectedSubSection === subsection.name ? "bg-blue-100" : "hover:bg-muted"
                )}
                onClick={() => setSelectedSubSection(subsection.name)}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <span>{subsection.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={subsection.visible} />
                  <Button variant="ghost" size="icon">
                    <Edit2 className="h-4 w-4" />
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
          <h3 className="text-lg font-semibold">Details</h3>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </div>
        <div className="border rounded-md p-4 space-y-4">
          <div className="space-y-2">
            <Label>Tab Name</Label>
            <Input value={selectedMainTab || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Sub Tab Name</Label>
            <Input value={selectedSubTab || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Section Name</Label>
            <Input value={selectedSection || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Subsection Name</Label>
            <Input value={selectedSubSection || ''} readOnly />
          </div>

          {selectedSubSection && (
            <div className="space-y-2">
              <Label>Fields</Label>
              <div className="border rounded-md">
                <div className="grid grid-cols-[auto,2fr,2fr,auto] gap-2 p-2 bg-muted text-sm font-medium">
                  <div>Order</div>
                  <div>Display Name</div>
                  <div>Table Name</div>
                  <div>Actions</div>
                </div>
                <ScrollArea className="h-[300px]">
                  <DragDropContext
                    onDragEnd={(result) => {
                      if (!result.destination) return;
                      const items = Array.from(structure.fields[selectedSubSection]);
                      const [reorderedItem] = items.splice(result.source.index, 1);
                      items.splice(result.destination.index, 0, reorderedItem);
                      
                      // Update order values
                      items.forEach((item, index) => {
                        item.order = index;
                      });

                      const updatedStructure = {
                        ...structure,
                        fields: {
                          ...structure.fields,
                          [selectedSubSection]: items
                        }
                      };

                      setStructure(updatedStructure);
                      handleUpdateStructure(updatedStructure);
                    }}
                  >
                    <Droppable droppableId="fields">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="divide-y"
                        >
                          {structure.fields[selectedSubSection]?.map((field, index) => (
                            <div
                              key={field.id}
                              className="grid grid-cols-[auto,2fr,2fr,auto] gap-2 p-2 items-center hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4"
                                    onClick={() => handleOrderChange(index, 'up', structure.fields[selectedSubSection])}
                                    disabled={index === 0}
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4"
                                    onClick={() => handleOrderChange(index, 'down', structure.fields[selectedSubSection])}
                                    disabled={index === structure.fields[selectedSubSection].length - 1}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </div>
                                <span className="text-sm text-muted-foreground">{index + 1}</span>
                              </div>
                              <div className="text-sm font-medium">{field.name}</div>
                              <div className="text-sm text-muted-foreground">{field.table}</div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={field.visible}
                                  onCheckedChange={(checked) => {
                                    const updatedFields = structure.fields[selectedSubSection].map(f =>
                                      f.id === field.id ? { ...f, visible: checked } : f
                                    );
                                    setStructure(prev => ({ ...prev, fields: { ...prev.fields, [selectedSubSection]: updatedFields } }));
                                    handleUpdateStructure(prev => ({ ...prev, fields: { ...prev.fields, [selectedSubSection]: updatedFields } }));
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleAddClick('field')}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleAddClick('field')}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleAddClick('field')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderNewStructureForm = () => (
    <div className="space-y-6 p-4">
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
              <div className="flex-1">
                <Select
                  value={formState.mainTab}
                  onValueChange={(value) => handleFormChange('mainTab', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Main Tab" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Create New</SelectItem>
                    {mainSubsections.map((subsection) => (
                      <SelectItem key={subsection.name} value={subsection.name}>
                        {subsection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formState.mainTab === 'new' && (
                <div className="flex-1">
                  <Input
                    placeholder="Enter new main tab name"
                    value={newItemInputs.mainTab}
                    onChange={(e) => setNewItemInputs(prev => ({ ...prev, mainTab: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Tab</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select 
                  value={formState.tab}
                  onValueChange={(value) => handleFormChange('tab', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Tab" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Create New</SelectItem>
                    {mainTabs.map((tab) => (
                      <SelectItem key={tab} value={tab}>
                        {tab}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formState.tab === 'new' && (
                <div className="flex-1">
                  <Input
                    placeholder="Enter new tab name"
                    value={newItemInputs.tab}
                    onChange={(e) => setNewItemInputs(prev => ({ ...prev, tab: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Section</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={formState.section}
                  onValueChange={(value) => handleFormChange('section', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Create New</SelectItem>
                    {mainSections.map((section) => (
                      <SelectItem key={section.name} value={section.name}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formState.section === 'new' && (
                <div className="flex-1">
                  <Input
                    placeholder="Enter new section name"
                    value={newItemInputs.section}
                    onChange={(e) => setNewItemInputs(prev => ({ ...prev, section: e.target.value }))}
                  />
                </div>
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
                onSelect={(tables, fields) => {
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