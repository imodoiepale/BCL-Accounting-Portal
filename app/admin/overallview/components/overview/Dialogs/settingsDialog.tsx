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
import { StructureTab } from './StructureTab';
import { NewStructureForm } from './NewStructureForm';

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
  subTabs,
  onStructureChange
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('new');
  const [selectedMainTab, setSelectedMainTab] = useState<string | null>(null);
  const [selectedSubTab, setSelectedSubTab] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [structure, setStructure] = useState<{
    maintabs: StructureItem[];
    subtabs: StructureItem[];
    sections: StructureItem[];
    subsections: StructureItem[];
    fields: StructureItem[];
  }>({
    maintabs: [],
    subtabs: [],
    sections: [],
    subsections: [],
    fields: []
  });

  const [isSelectTablesDialogOpen, setIsSelectTablesDialogOpen] = useState(false);
  const [selectedTablesData, setSelectedTablesData] = useState({
    tables: [],
    fields: {}
  });

  const handleTablesFieldsSelect = (tables: string[], fields: Record<string, string[]>) => {
    setSelectedTablesData({ tables, fields });
  };

  // Add the handlers for CRUD operations
  const handleAdd = async (type: string, item: StructureItem) => {
    try {
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .insert(convertItemToDbFormat(item));

      if (error) throw error;

      await fetchStructureData();
      toast.success(`${type} added successfully`);
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error(`Failed to add ${type}`);
    }
  };

  const handleEdit = async (type: string, item: StructureItem) => {
    try {
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update(convertItemToDbFormat(item))
        .match({ id: item.id });

      if (error) throw error;

      await fetchStructureData();
      toast.success(`${type} updated successfully`);
    } catch (error) {
      console.error('Error editing item:', error);
      toast.error(`Failed to edit ${type}`);
    }
  };

  const handleDelete = async (type: string, item: StructureItem) => {
    try {
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .delete()
        .match({ id: item.id });

      if (error) throw error;

      await fetchStructureData();
      toast.success(`${type} deleted successfully`);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(`Failed to delete ${type}`);
    }
  };

  const handleVisibilityChange = async (item: StructureItem, visible: boolean) => {
    try {
        // Get current structure based on the item type
        let query = supabase
            .from('profile_category_table_mapping_2')
            .select('*');

        if (item.type === 'maintab') {
            query = query.eq('main_tab', item.name);
        } else {
            query = query
                .eq('main_tab', item.parent?.maintab)
                .eq('sub_tab', item.parent?.subtab);
        }

        const { data: records, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (!records || records.length === 0) {
            console.error('No matching records found');
            toast.error('Failed to update visibility: No matching records found');
            return;
        }

        // Update all matching records
        for (const record of records) {
            const updatedStructure = { ...record.structure };
            const visibility = updatedStructure.visibility || {};

            // Check parent visibility when trying to show an item
            if (visible && item.type !== 'maintab') {
                const { isVisible, parentType } = getParentVisibility(item);
                if (!isVisible) {
                    toast.error(`Cannot enable visibility while ${parentType} is hidden`);
                    return;
                }
            }

            // Update visibility for the current item
            visibility[`${item.type}s`] = visibility[`${item.type}s`] || {};
            visibility[`${item.type}s`][item.name] = visible;

            // If hiding an item, cascade the change to children
            if (!visible) {
                const hideChildren = (items: StructureItem[], type: string) => {
                    items.forEach(childItem => {
                        visibility[type] = visibility[type] || {};
                        visibility[type][childItem.name] = false;
                    });
                };

                switch (item.type) {
                    case 'maintab':
                        hideChildren(getSubTabsForMainTab(item.name), 'subtabs');
                        break;
                    case 'subtab':
                        hideChildren(getSectionsForSubTab(item.name), 'sections');
                        break;
                    case 'section':
                        hideChildren(getSubsectionsForSection(item.name), 'subsections');
                        break;
                    case 'subsection':
                        hideChildren(getFieldsForSubsection(item.name), 'fields');
                        break;
                }
            }

            // Update database
            const { error: updateError } = await supabase
                .from('profile_category_table_mapping_2')
                .update({ 
                    structure: {
                        ...updatedStructure,
                        visibility
                    }
                })
                .eq('id', record.id);

            if (updateError) throw updateError;
        }

        // Update local state
        setStructure(prev => {
            const newStructure = { ...prev };
            const updateItems = (items: any[], type: string) => {
                return items.map(item => ({
                    ...item,
                    visible: visible
                }));
            };

            if (item.type === 'maintab') {
                newStructure.maintabs = updateItems(prev.maintabs, 'maintabs');
                // Update children visibility if parent is hidden
                if (!visible) {
                    newStructure.subtabs = updateItems(prev.subtabs.filter(st => 
                        st.parent?.maintab === item.name), 'subtabs');
                }
            } else {
                newStructure[`${item.type}s`] = updateItems(prev[`${item.type}s`], `${item.type}s`);
            }

            return newStructure;
        });

        toast.success('Visibility updated successfully');
    } catch (error) {
        console.error('Error updating visibility:', error);
        toast.error('Failed to update visibility');
    }
};

const handleDragEnd = async (result: any) => {
  if (!result.destination) return;

  try {
      const { type, source, destination } = result;
      
      // Ensure we have valid structure data
      if (!structure || !structure[type]) {
          console.error('Invalid structure data for drag and drop');
          return;
      }

      const items = Array.from(structure[type]);
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);

      // Update the order of items
      const updates = items.map((item, index) => ({
          ...item,
          order: index
      }));

      // Update each item in the database
      for (const item of updates) {
          const { error } = await supabase
              .from('profile_category_table_mapping_2')
              .update({
                  structure: {
                      ...structure,
                      order: {
                          ...structure.order,
                          [type]: {
                              ...structure.order?.[type],
                              [item.name]: item.order
                          }
                      }
                  }
              })
              .eq('id', item.id);

          if (error) throw error;
      }

      // Update local state
      setStructure(prev => ({
          ...prev,
          [type]: updates
      }));

      toast.success('Order updated successfully');
  } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
  }
};

  const fetchStructureData = async () => {
    try {
      let structureData;
      const { data, error } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*');

      if (error) {
        throw error;
      }

      // If no data exists, create initial structure
      if (!data || data.length === 0) {
        const initialStructure = {
          visibility: {
            maintabs: {},
            subtabs: {},
            sections: {},
            subsections: {},
            fields: {}
          },
          order: {
            maintabs: {},
            subtabs: {},
            sections: {},
            subsections: {},
            fields: {}
          }
        };

        const { error: insertError } = await supabase
          .from('profile_category_table_mapping_2')
          .insert({
            main_tab: 'Default',
            sub_tab: 'General',
            structure: initialStructure
          });

        if (insertError) throw insertError;

        // Fetch the data again after creating initial structure
        const { data: newData, error: refetchError } = await supabase
          .from('profile_category_table_mapping_2')
          .select('*');

        if (refetchError) throw refetchError;
        structureData = newData;
      } else {
        structureData = data;
      }

      // Process the data...
      const processedData = processStructureData(structureData);
      setStructure(processedData);
    } catch (error) {
      console.error('Error fetching structure data:', error);
      toast.error('Failed to load structure data');
    }
  };

  const processStructureData = (data: any[]) => {
    const processedData = data.reduce((acc, item) => {
      const structure = item.structure || {};
      const visibility = structure.visibility || {};
      const order = structure.order || {};

      // Process each level of the structure...
      // (rest of your existing processing logic)
      return acc;
    }, {
      maintabs: new Set<any>(),
      subtabs: new Set<any>(),
      sections: new Set<any>(),
      subsections: new Set<any>(),
      fields: new Set<any>()
    });

    return {
      maintabs: Array.from(processedData.maintabs)
        .sort((a, b) => a.order - b.order)
        .map((item, id) => ({
          id: String(id),
          ...item
        })),
      // ... rest of your array conversions
    };
  };

  useEffect(() => {
    fetchStructureData();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-8xl max-h-[80vh] overflow-hidden flex flex-col p-4">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList>
            <TabsTrigger value="new">New Structure</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <NewStructureForm
              onStructureChange={onStructureChange}
              mainTabs={mainTabs}
              subTabs={subTabs}
              isSelectTablesDialogOpen={isSelectTablesDialogOpen}
              setIsSelectTablesDialogOpen={setIsSelectTablesDialogOpen}
              onTablesFieldsSelect={handleTablesFieldsSelect}
            />
          </TabsContent>

          <TabsContent value="structure">
            <StructureTab
              items={structure.maintabs}
              type="maintabs"
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onVisibilityChange={handleVisibilityChange}
              onDragEnd={handleDragEnd}
              isSelectTablesDialogOpen={isSelectTablesDialogOpen}
              setIsSelectTablesDialogOpen={setIsSelectTablesDialogOpen}
              onTablesFieldsSelect={handleTablesFieldsSelect}
            />
          </TabsContent>
        </Tabs>

        {isSelectTablesDialogOpen && (
          <Sheet open={isSelectTablesDialogOpen} onOpenChange={setIsSelectTablesDialogOpen}>
            <SheetContent className="max-w-3xl">
              <SheetHeader>
                <SheetTitle>Select Tables and Fields</SheetTitle>
              </SheetHeader>
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
            </SheetContent>
          </Sheet>
        )}
      </DialogContent>
    </Dialog>
  );
}