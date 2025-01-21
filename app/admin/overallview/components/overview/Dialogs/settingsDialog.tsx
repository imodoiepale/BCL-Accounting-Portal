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
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="flex items-center gap-2 p-2 bg-background hover:bg-muted/50 rounded-md group"
                  >
                    <div {...provided.dragHandleProps} className="cursor-grab">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="flex-grow">{item.name}</span>
                    <Switch
                      checked={item.visible}
                      onCheckedChange={(checked) => onVisibilityChange(item, checked)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
  onStructureChange: () => void;
}

export function SettingsDialog({ onStructureChange }: SettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('structure');
  const [selectedMainTab, setSelectedMainTab] = useState<string | null>(null);
  const [selectedSubTab, setSelectedSubTab] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSubSection, setSelectedSubSection] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState<'maintab' | 'subtab' | 'section' | 'subsection' | null>(null);
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
        if (!newStructure.subtabs[row.main_tab].find(tab => tab.name === row.Tabs)) {
          newStructure.subtabs[row.main_tab].push({
            id: `subtab-${row.id}`,
            name: row.Tabs,
            order: row.structure.order.subtabs?.[row.Tabs] || 0,
            visible: row.structure.visibility.subtabs?.[row.Tabs] ?? true,
            type: 'subtab',
            parent: { maintab: row.main_tab }
          });
        }

        // Process sections and their children
        row.structure.sections.forEach((section: any, sectionIndex: number) => {
          if (!newStructure.sections[row.Tabs]) {
            newStructure.sections[row.Tabs] = [];
          }
          if (!newStructure.sections[row.Tabs].find(s => s.name === section.name)) {
            newStructure.sections[row.Tabs].push({
              id: `section-${row.id}-${sectionIndex}`,
              name: section.name,
              order: row.structure.order.sections?.[section.name] || sectionIndex,
              visible: row.structure.visibility.sections?.[section.name] ?? true,
              type: 'section',
              parent: { maintab: row.main_tab, subtab: row.Tabs }
            });

            section.subsections.forEach((subsection: any, subsectionIndex: number) => {
              if (!newStructure.subsections[section.name]) {
                newStructure.subsections[section.name] = [];
              }
              if (!newStructure.subsections[section.name].find(ss => ss.name === subsection.name)) {
                newStructure.subsections[section.name].push({
                  id: `subsection-${row.id}-${sectionIndex}-${subsectionIndex}`,
                  name: subsection.name,
                  order: row.structure.order.subsections?.[subsection.name] || subsectionIndex,
                  visible: row.structure.visibility.subsections?.[subsection.name] ?? true,
                  type: 'subsection',
                  parent: { maintab: row.main_tab, subtab: row.Tabs, section: section.name }
                });

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
                        subtab: row.Tabs,
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
        order: {
          maintabs: Object.fromEntries(updatedStructure.maintabs.map(tab => [tab.name, tab.order])),
          subtabs: {},
          sections: {},
          subsections: {},
          fields: {}
        },
        visibility: {
          maintabs: Object.fromEntries(updatedStructure.maintabs.map(tab => [tab.name, tab.visible])),
          subtabs: {},
          sections: {},
          subsections: {},
          fields: {}
        },
        sections: [] as any[]
      };

      // Process the structure to build the sections array
      updatedStructure.maintabs.forEach(maintab => {
        const subtabs = updatedStructure.subtabs[maintab.name] || [];
        subtabs.forEach(subtab => {
          const sections = updatedStructure.sections[subtab.name] || [];
          sections.forEach(section => {
            const subsections = updatedStructure.subsections[section.name] || [];
            const sectionData = {
              name: section.name,
              subsections: subsections.map(subsection => {
                const fields = updatedStructure.fields[subsection.name] || [];
                return {
                  name: subsection.name,
                  fields: fields.map(field => ({
                    name: field.name,
                    table: field.table,
                    column: field.name // Assuming column name is same as field name
                  }))
                };
              })
            };
            dbStructure.sections.push(sectionData);
          });
        });
      });

      // Update the database
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({ structure: dbStructure })
        .eq('id', 1); // Assuming we're updating the first record

      if (error) throw error;
      toast.success('Structure updated successfully');
    } catch (error) {
      console.error('Error updating structure:', error);
      toast.error('Failed to update structure');
    }
  };

  const handleDragEnd = async (result: any, items: StructureItem[], type: string) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    // Update orders
    reorderedItems.forEach((item, index) => {
      item.order = index;
    });

    // Update the structure
    if (type === 'maintabs') {
      setStructure(prev => ({ ...prev, maintabs: reorderedItems }));
    } else if (type === 'subtabs') {
      setStructure(prev => ({ ...prev, subtabs: { ...prev.subtabs, [selectedMainTab]: reorderedItems } }));
    } else if (type === 'sections') {
      setStructure(prev => ({ ...prev, sections: { ...prev.sections, [selectedSubTab]: reorderedItems } }));
    } else if (type === 'subsections') {
      setStructure(prev => ({ ...prev, subsections: { ...prev.subsections, [selectedSection]: reorderedItems } }));
    } else if (type === 'fields') {
      setStructure(prev => ({ ...prev, fields: { ...prev.fields, [selectedSubSection]: reorderedItems } }));
    }

    // Update the database
    await handleUpdateStructure(structure);
  };

  const handleOrderChange = (index: number, direction: 'up' | 'down', items: StructureItem[]) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) return;

    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    
    // Update orders
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

  const handleAddClick = (type: 'maintab' | 'subtab' | 'section' | 'subsection') => {
    setAddDialogType(type);
    setIsAddDialogOpen(true);
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
                  <div className="divide-y">
                    {structure.fields[selectedSubSection]?.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-[auto,2fr,2fr,auto] gap-2 p-2 items-center hover:bg-muted/50">
                        <div className="text-sm text-muted-foreground">{index + 1}</div>
                        <div className="text-sm font-medium">{field.name}</div>
                        <div className="text-sm text-muted-foreground">{field.table}</div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderNewStructureTab = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Create New Structure</h3>
        <p className="text-muted-foreground">
          Create a new structure by defining main tabs, sub tabs, sections, subsections, and fields.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <Label>Main Tab Name</Label>
            <Input 
              placeholder="Enter main tab name" 
              value={newStructure.mainTabName}
              onChange={(e) => setNewStructure(prev => ({ ...prev, mainTabName: e.target.value }))}
            />
          </div>
          <div>
            <Label>Sub Tab Name</Label>
            <Input 
              placeholder="Enter sub tab name" 
              value={newStructure.subTabName}
              onChange={(e) => setNewStructure(prev => ({ ...prev, subTabName: e.target.value }))}
            />
          </div>
          <div>
            <Label>Section Name</Label>
            <Input 
              placeholder="Enter section name" 
              value={newStructure.sectionName}
              onChange={(e) => setNewStructure(prev => ({ ...prev, sectionName: e.target.value }))}
            />
          </div>
          <div>
            <Label>Subsection Name</Label>
            <Input 
              placeholder="Enter subsection name" 
              value={newStructure.subsectionName}
              onChange={(e) => setNewStructure(prev => ({ ...prev, subsectionName: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Tables and Fields</Label>
            <div className="border rounded-md p-4">
              {newStructure.selectedTables.length > 0 ? (
                <div className="space-y-4">
                  {newStructure.selectedTables.map(table => (
                    <div key={table} className="space-y-2">
                      <h4 className="font-medium">{table}</h4>
                      <div className="ml-4 space-y-1">
                        {newStructure.selectedFields[table]?.map(field => (
                          <div key={`${table}-${field}`} className="text-sm text-muted-foreground">
                            {field}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsSelectTablesDialogOpen(true)}
                  >
                    Modify Selection
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsSelectTablesDialogOpen(true)}
                >
                  Select Tables and Fields
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={() => {
            setNewStructure({
              mainTabName: '',
              subTabName: '',
              sectionName: '',
              subsectionName: '',
              selectedTables: [],
              selectedFields: {}
            });
            setActiveTab('structure');
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            // Handle creating new structure
            console.log('New Structure:', newStructure);
            // TODO: Implement the creation logic
            toast.success('Structure created successfully');
            setNewStructure({
              mainTabName: '',
              subTabName: '',
              sectionName: '',
              subsectionName: '',
              selectedTables: [],
              selectedFields: {}
            });
            setActiveTab('structure');
          }}
        >
          Create Structure
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Table Structure Settings</DialogTitle>
            <DialogDescription>
              Manage your table structure, sections, and column visibility settings
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="new">New Structure</TabsTrigger>
            </TabsList>

            <TabsContent value="structure" className="mt-4">
              {renderStructureTab()}
            </TabsContent>

            <TabsContent value="new" className="mt-4">
              {renderNewStructureTab()}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <SelectTablesAndFieldsDialog
        isOpen={isSelectTablesDialogOpen}
        onClose={() => setIsSelectTablesDialogOpen(false)}
        onApply={(selectedTables, selectedFields) => {
          setNewStructure(prev => ({
            ...prev,
            selectedTables,
            selectedFields
          }));
        }}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add {addDialogType === 'maintab' ? 'Main Tab' :
                    addDialogType === 'subtab' ? 'Sub Tab' :
                    addDialogType === 'section' ? 'Section' :
                    'Subsection'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input placeholder={`Enter ${addDialogType} name`} />
            </div>
            {addDialogType !== 'maintab' && (
              <div>
                <Label>Parent</Label>
                <Input 
                  value={addDialogType === 'subtab' ? selectedMainTab :
                         addDialogType === 'section' ? selectedSubTab :
                         selectedSection}
                  readOnly 
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Handle add logic here
                setIsAddDialogOpen(false);
              }}>
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}