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
  mainSections: any[];
  mainSubsections: any[];
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

  const [newStructure, setNewStructure] = useState({
    mainTabName: '',
    subTabName: '',
    sectionName: '',
    subsectionName: '',
    selectedTables: [] as string[],
    selectedFields: {} as { [table: string]: string[] }
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
        <SelectTablesAndFieldsDialog
          onSelect={async (selectedFields) => {
            try {
              const newFields = Object.entries(selectedFields).flatMap(([table, fields]) =>
                fields.map((field: string) => ({
                  id: `field-${Date.now()}-${field}`,
                  name: field,
                  order: 0,
                  visible: true,
                  type: 'field' as const,
                  table,
                  parent: {
                    maintab: selectedMainTab,
                    subtab: selectedSubTab,
                    section: selectedSection,
                    subsection: selectedSubSection
                  }
                }))
              );

              const updatedStructure = { ...structure };
              if (!updatedStructure.fields[selectedSubSection!]) {
                updatedStructure.fields[selectedSubSection!] = [];
              }
              updatedStructure.fields[selectedSubSection!].push(...newFields);

              setStructure(updatedStructure);
              await handleUpdateStructure(updatedStructure);
              setIsSelectTablesDialogOpen(false);
              toast.success('Fields added successfully');
            } catch (error) {
              console.error('Error adding fields:', error);
              toast.error('Failed to add fields');
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );

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
                    // Add edit logic
                  }}>
                    <Pencil className="h-4 w-4" />
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

  const renderNewStructureTab = () => {
    const [useExisting, setUseExisting] = useState(false);
    const [selectedExistingMainTab, setSelectedExistingMainTab] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<{
      subtabs: string[];
      sections: string[];
      subsections: { [section: string]: string[] };
    }>({
      subtabs: [],
      sections: [],
      subsections: {},
    });

    return (
      <div className="space-y-6 p-4">
        <div className="space-y-4">
          <div>
            <Label>New Main Tab Name</Label>
            <Input
              value={newStructure.mainTabName}
              onChange={(e) =>
                setNewStructure((prev) => ({ ...prev, mainTabName: e.target.value }))
              }
              placeholder="Enter main tab name"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="useExisting"
              checked={useExisting}
              onCheckedChange={(checked) => setUseExisting(checked as boolean)}
            />
            <Label htmlFor="useExisting">Use structure from existing main tab</Label>
          </div>

          {useExisting ? (
            <div className="space-y-4">
              <div>
                <Label>Select Main Tab to Copy From</Label>
                <Select
                  value={selectedExistingMainTab || ''}
                  onValueChange={setSelectedExistingMainTab}
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

              {selectedExistingMainTab && (
                <>
                  <div>
                    <Label>Select Sub Tabs</Label>
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                      {structure.subtabs[selectedExistingMainTab]?.map((subtab) => (
                        <div key={subtab.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            checked={selectedItems.subtabs.includes(subtab.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedItems((prev) => ({
                                  ...prev,
                                  subtabs: [...prev.subtabs, subtab.name],
                                }));
                              } else {
                                setSelectedItems((prev) => ({
                                  ...prev,
                                  subtabs: prev.subtabs.filter((t) => t !== subtab.name),
                                }));
                              }
                            }}
                          />
                          <span>{subtab.name}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>

                  <div>
                    <Label>Select Sections and Subsections</Label>
                    <ScrollArea className="h-[300px] border rounded-md p-2">
                      {selectedItems.subtabs.map((subtab) => (
                        <div key={subtab} className="space-y-2 py-2">
                          <h4 className="font-medium">{subtab}</h4>
                          {structure.sections[subtab]?.map((section) => (
                            <div key={section.id} className="ml-4 space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={selectedItems.sections.includes(section.name)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedItems((prev) => ({
                                        ...prev,
                                        sections: [...prev.sections, section.name],
                                      }));
                                    } else {
                                      setSelectedItems((prev) => ({
                                        ...prev,
                                        sections: prev.sections.filter((s) => s !== section.name),
                                      }));
                                    }
                                  }}
                                />
                                <span>{section.name}</span>
                              </div>
                              {structure.subsections[section.name]?.map((subsection) => (
                                <div key={subsection.id} className="ml-4 flex items-center space-x-2">
                                  <Checkbox
                                    checked={selectedItems.subsections[section.name]?.includes(
                                      subsection.name
                                    )}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedItems((prev) => ({
                                          ...prev,
                                          subsections: {
                                            ...prev.subsections,
                                            [section.name]: [
                                              ...(prev.subsections[section.name] || []),
                                              subsection.name,
                                            ],
                                          },
                                        }));
                                      } else {
                                        setSelectedItems((prev) => ({
                                          ...prev,
                                          subsections: {
                                            ...prev.subsections,
                                            [section.name]: prev.subsections[
                                              section.name
                                            ].filter((s) => s !== subsection.name),
                                          },
                                        }));
                                      }
                                    }}
                                  />
                                  <span>{subsection.name}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Sub Tab Name</Label>
                <Input
                  value={newStructure.subTabName}
                  onChange={(e) =>
                    setNewStructure((prev) => ({ ...prev, subTabName: e.target.value }))
                  }
                  placeholder="Enter sub tab name"
                />
              </div>
              <div>
                <Label>Section Name</Label>
                <Input
                  value={newStructure.sectionName}
                  onChange={(e) =>
                    setNewStructure((prev) => ({ ...prev, sectionName: e.target.value }))
                  }
                  placeholder="Enter section name"
                />
              </div>
              <div>
                <Label>Subsection Name</Label>
                <Input
                  value={newStructure.subsectionName}
                  onChange={(e) =>
                    setNewStructure((prev) => ({ ...prev, subsectionName: e.target.value }))
                  }
                  placeholder="Enter subsection name"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (useExisting) {
                await handleCreateFromExisting(
                  selectedExistingMainTab!,
                  selectedItems,
                  newStructure.mainTabName
                );
              } else {
                await handleSubmitNewStructure();
              }
            }}
            disabled={
              !newStructure.mainTabName ||
              (!useExisting
                ? !newStructure.subTabName ||
                  !newStructure.sectionName ||
                  !newStructure.subsectionName
                : !selectedExistingMainTab ||
                  selectedItems.subtabs.length === 0 ||
                  selectedItems.sections.length === 0)
            }
          >
            Create Structure
          </Button>
        </div>
      </div>
    );
  };

  const handleCreateFromExisting = async (
    sourceMainTab: string,
    selectedItems: {
      subtabs: string[];
      sections: string[];
      subsections: { [section: string]: string[] };
    },
    newMainTabName: string
  ) => {
    try {
      const newStructureData = {
        main_tab: newMainTabName,
        sub_tab: selectedItems.subtabs[0], // Using the first selected subtab
        structure: {
          order: {
            maintabs: { [newMainTabName]: structure.maintabs.length },
            subtabs: {},
            sections: {},
            subsections: {},
          },
          visibility: {
            maintabs: { [newMainTabName]: true },
            subtabs: {},
            sections: {},
            subsections: {},
          },
          sections: [] as any[],
        },
      };

      // Copy selected subtabs, sections, and subsections
      selectedItems.subtabs.forEach((subtab, index) => {
        newStructureData.structure.order.subtabs[subtab] = index;
        newStructureData.structure.visibility.subtabs[subtab] = true;

        const sections = structure.sections[subtab]?.filter((section) =>
          selectedItems.sections.includes(section.name)
        );

        sections?.forEach((section, sectionIndex) => {
          newStructureData.structure.order.sections[section.name] = sectionIndex;
          newStructureData.structure.visibility.sections[section.name] = true;

          const subsections = structure.subsections[section.name]?.filter((subsection) =>
            selectedItems.subsections[section.name]?.includes(subsection.name)
          );

          const newSection = {
            name: section.name,
            subsections: subsections?.map((subsection, subsectionIndex) => {
              newStructureData.structure.order.subsections[subsection.name] = subsectionIndex;
              newStructureData.structure.visibility.subsections[subsection.name] = true;

              return {
                name: subsection.name,
                fields: structure.fields[subsection.name]?.map((field) => ({
                  name: field.name,
                  table: field.table,
                  column: field.name,
                })),
              };
            }),
          };

          newStructureData.structure.sections.push(newSection);
        });
      });

      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .insert(newStructureData);

      if (error) throw error;

      toast.success('New structure created successfully');
      setIsOpen(false);
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error creating structure from existing:', error);
      toast.error('Failed to create structure');
    }
  };

  const handleSubmitNewStructure = async () => {
    try {
      // Convert the new structure to the required format
      const newStructureData = {
        main_tab: newStructure.mainTabName,
        sub_tab: newStructure.subTabName,
        structure: {
          order: {
            maintabs: { [newStructure.mainTabName]: 0 },
            subtabs: { [newStructure.subTabName]: 0 },
            sections: { [newStructure.sectionName]: 0 },
            subsections: { [newStructure.subsectionName]: 0 }
          },
          visibility: {
            maintabs: { [newStructure.mainTabName]: true },
            subtabs: { [newStructure.subTabName]: true },
            sections: { [newStructure.sectionName]: true },
            subsections: { [newStructure.subsectionName]: true }
          },
          sections: [
            {
              name: newStructure.sectionName,
              subsections: [
                {
                  name: newStructure.subsectionName,
                  fields: Object.entries(newStructure.selectedFields).flatMap(([table, fields]) =>
                    fields.map((field: string) => ({
                      name: field,
                      table: table,
                      column: field
                    }))
                  )
                }
              ]
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
      setNewStructure({
        mainTabName: '',
        subTabName: '',
        sectionName: '',
        subsectionName: '',
        selectedTables: [],
        selectedFields: {}
      });
    } catch (error) {
      console.error('Error creating new structure:', error);
      toast.error('Failed to create new structure');
    }
  };

  const handleDeleteItem = async (type: string, id: string) => {
    try {
      const updatedStructure = { ...structure };
      
      switch (type) {
        case 'maintab':
          updatedStructure.maintabs = structure.maintabs.filter(tab => tab.id !== id);
          break;
        case 'subtab':
          if (selectedMainTab) {
            updatedStructure.subtabs[selectedMainTab] = structure.subtabs[selectedMainTab].filter(tab => tab.id !== id);
          }
          break;
        case 'section':
          if (selectedSubTab) {
            updatedStructure.sections[selectedSubTab] = structure.sections[selectedSubTab].filter(section => section.id !== id);
          }
          break;
        case 'subsection':
          if (selectedSection) {
            updatedStructure.subsections[selectedSection] = structure.subsections[selectedSection].filter(subsection => subsection.id !== id);
          }
          break;
        case 'field':
          if (selectedSubSection) {
            updatedStructure.fields[selectedSubSection] = structure.fields[selectedSubSection].filter(field => field.id !== id);
          }
          break;
      }

      setStructure(updatedStructure);
      await handleUpdateStructure(updatedStructure);
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleEditItem = (type: string, item: StructureItem) => {
    setEditingItem({ type, item });
    setIsEditDialogOpen(true);
  };

  const handleMoveItem = async (type: string, id: string, direction: 'up' | 'down') => {
    try {
      const updatedStructure = { ...structure };
      let items: StructureItem[] = [];
      
      switch (type) {
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

      const index = items.findIndex(item => item.id === id);
      if (index === -1) return;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= items.length) return;

      const item = items[index];
      items.splice(index, 1);
      items.splice(newIndex, 0, item);

      // Update order values
      items.forEach((item, idx) => {
        item.order = idx;
      });

      setStructure(updatedStructure);
      await handleUpdateStructure(updatedStructure);
    } catch (error) {
      console.error('Error moving item:', error);
      toast.error('Failed to move item');
    }
  };

  const FieldListItem = ({ field, index }: { field: StructureItem; index: number }) => (
    <Draggable draggableId={field.id} index={index}>
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
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={() => handleMoveItem('field', field.id, 'up')}
              disabled={index === 0}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={() => handleMoveItem('field', field.id, 'down')}
              disabled={index === structure.fields[selectedSubSection!].length - 1}
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
              const updatedFields = structure.fields[selectedSubSection!].map(f =>
                f.id === field.id ? { ...f, visible: checked } : f
              );
              setStructure(prev => ({ ...prev, fields: { ...prev.fields, [selectedSubSection!]: updatedFields } }));
              handleUpdateStructure(prev => ({ ...prev, fields: { ...prev.fields, [selectedSubSection!]: updatedFields } }));
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleEditItem('field', field)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => handleDeleteItem('field', field.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )}
  </Draggable>
);

  const handleVisibilityChange = async (item: StructureItem, visible: boolean) => {
    const updatedStructure = { ...structure };
    
    // Update visibility in the structure
    switch (item.type) {
      case 'maintab':
        updatedStructure.maintabs = updatedStructure.maintabs.map(tab =>
          tab.id === item.id ? { ...tab, visible } : tab
        );
        break;
      case 'subtab':
        if (item.parent?.maintab) {
          updatedStructure.subtabs[item.parent.maintab] = updatedStructure.subtabs[item.parent.maintab].map(
            tab => (tab.id === item.id ? { ...tab, visible } : tab)
          );
        }
        break;
      case 'section':
        if (item.parent?.subtab) {
          updatedStructure.sections[item.parent.subtab] = updatedStructure.sections[item.parent.subtab].map(
            section => (section.id === item.id ? { ...section, visible } : section)
          );
        }
        break;
      case 'subsection':
        if (item.parent?.section) {
          updatedStructure.subsections[item.parent.section] = updatedStructure.subsections[item.parent.section].map(
            subsection => (subsection.id === item.id ? { ...subsection, visible } : subsection)
          );
        }
        break;
      case 'field':
        if (item.parent?.subsection) {
          updatedStructure.fields[item.parent.subsection] = updatedStructure.fields[item.parent.subsection].map(
            field => (field.id === item.id ? { ...field, visible } : field)
          );
        }
        break;
    }

    setStructure(updatedStructure);

    try {
      // Save to database
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: {
            ...structure,
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
      toast.success('Visibility updated successfully');
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  const [editingItem, setEditingItem] = useState<{ type: string; item: StructureItem } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  const handleStructureUpdate = async (updatedStructure: any) => {
    try {
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: updatedStructure,
          updated_at: new Date().toISOString()
        })
        .eq('main_tab', activeMainTab)
        .eq('sub_tab', activeSubTab);

      if (error) throw error;
      
      onStructureChange();
      toast.success('Structure updated successfully');
    } catch (error) {
      console.error('Error updating structure:', error);
      toast.error('Failed to update structure');
    }
  };

  const handleVisibilityUpdate = async (type: string, id: string, visible: boolean) => {
    try {
      const newVisibilityState = {
        ...visibilityState,
        [type]: {
          ...visibilityState[type],
          [id]: visible
        }
      };
      
      onVisibilityChange(newVisibilityState);
      
      const updatedStructure = {
        ...structure,
        visibility: newVisibilityState
      };
      
      await handleStructureUpdate(updatedStructure);
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  const handleOrderUpdate = async (type: string, items: StructureItem[]) => {
    try {
      const newOrder = items.reduce((acc, item, index) => ({
        ...acc,
        [item.id]: index
      }), {});

      const newOrderState = {
        ...orderState,
        [type]: newOrder
      };
      
      onOrderChange(newOrderState);
      
      const updatedStructure = {
        ...structure,
        order: newOrderState
      };
      
      await handleStructureUpdate(updatedStructure);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const renderSubsections = useCallback(() => {
    console.log('Rendering subsections with:', {
      processedSections,
      activeMainTab,
      activeSubTab
    });

    if (!processedSections || !activeMainTab || !activeSubTab) {
      console.log('Missing required props');
      return null;
    }

    // Get all subsections from all sections
    const allSubsections = processedSections.reduce((acc, section) => {
      if (section.subsections) {
        acc.push(...section.subsections);
      }
      return acc;
    }, []);

    console.log('All subsections:', allSubsections);

    if (!allSubsections.length) {
      return <div>No subsections found</div>;
    }

    return (
      <div className="space-y-4">
        {allSubsections.map((subsection, index) => {
          console.log('Rendering subsection:', subsection);
          return (
            <div
              key={subsection.id || `subsection-${index}`}
              className={cn(
                "p-4 rounded-lg border",
                visibilityState.subsections?.[subsection.id] === false
                  ? "bg-muted/50"
                  : "bg-background"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">{subsection.name}</h3>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={visibilityState.subsections?.[subsection.id] !== false}
                    onCheckedChange={(checked) =>
                      handleVisibilityUpdate('subsections', subsection.id, checked)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditSubsection(subsection)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <DraggableList
                items={subsection.fields.map((field, fieldIndex) => ({
                  id: `${field.table}-${field.name}`,
                  name: field.label || field.name,
                  order: orderState.fields?.[`${subsection.id}-${field.table}-${field.name}`] ?? fieldIndex,
                  visible: visibilityState.fields?.[`${subsection.id}-${field.table}-${field.name}`] !== false,
                  type: 'field',
                  table: field.table,
                  parent: {
                    maintab: activeMainTab,
                    subtab: activeSubTab,
                    section: subsection.name,
                    subsection: subsection.name
                  }
                }))}
                type="fields"
                onEdit={handleEditField}
                onDelete={handleDeleteField}
                onVisibilityChange={(item, visible) =>
                  handleVisibilityUpdate('fields', `${subsection.id}-${item.table}-${item.name}`, visible)
                }
                onDragEnd={(result) => {
                  if (!result.destination) return;
                  const items = Array.from(subsection.fields);
                  const [reorderedItem] = items.splice(result.source.index, 1);
                  items.splice(result.destination.index, 0, reorderedItem);
                  handleOrderUpdate('fields', items.map((field, index) => ({
                    id: `${subsection.id}-${field.table}-${field.name}`,
                    name: field.label || field.name,
                    order: index,
                    visible: visibilityState.fields?.[`${subsection.id}-${field.table}-${field.name}`] !== false,
                    type: 'field',
                    table: field.table
                  })));
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }, [processedSections, activeMainTab, activeSubTab, visibilityState, orderState]);

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
                <TabsTrigger value="structure">Structure</TabsTrigger>
                <TabsTrigger value="new">New Structure</TabsTrigger>
              </TabsList>
              <TabsContent value="structure" className="flex-1 p-6 overflow-auto">
                {renderStructureTab()}
              </TabsContent>
              <TabsContent value="new" className="flex-1 p-6 overflow-auto">
                {renderNewStructureTab()}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {isSelectTablesDialogOpen && (
        <SelectTablesAndFieldsDialog
          isOpen={isSelectTablesDialogOpen}
          onClose={() => setIsSelectTablesDialogOpen(false)}
          onSelect={handleTablesSelected}
        />
      )}
      {editingItem && <EditDialog />}
      <AddDialog />
      <SelectTablesDialog />
    </>
  );
}