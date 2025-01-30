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
  const defaultStructure = {
    maintabs: [], // Add this
    subtabs: [], // Add this
    sections: [],
    subsections: [], // Add this
    fields: [], // Add this
    order: {
      fields: {},
      subtabs: {},
      maintabs: {},
      sections: {},
      subsections: {}
    },
    visibility: {
      fields: {},
      subtabs: {},
      maintabs: {},
      sections: {},
      subsections: {}
    }
  };
  const [structure, setStructure] = useState<any>(defaultStructure);
  const [isSelectTablesDialogOpen, setIsSelectTablesDialogOpen] = useState(false);
  const [selectedTablesData, setSelectedTablesData] = useState({
    tables: [],
    fields: {}
  });

  const handleTablesFieldsSelect = (tables: string[], fields: Record<string, string[]>) => {
    setSelectedTablesData({ tables, fields });
  };

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
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    try {
      const { type, source, destination } = result;

      // Ensure we have valid structure data
      if (!structure || !structure[type]) {
        console.error('Invalid structure data for drag and drop');
        return;
      }

      // Create a copy of the items array
      const items = Array.from(structure[type]);

      // Perform the reorder
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);

      // Update the order of items
      const updates = items.map((item, index) => ({
        ...item,
        order: index
      }));

      // Get the current record
      const { data: currentRecord, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*')
        .eq('main_tab', selectedMainTab)
        .eq('sub_tab', selectedSubTab)
        .single();

      if (fetchError) throw fetchError;

      // Update the structure with new order
      const updatedStructure = {
        ...currentRecord.structure,
        order: {
          ...currentRecord.structure.order,
          [type]: updates.reduce((acc, item) => ({
            ...acc,
            [item.name]: item.order
          }), {})
        }
      };

      // Update the database
      const { error: updateError } = await supabase
        .from('profile_category_table_mapping_2')
        .update({ structure: updatedStructure })
        .eq('id', currentRecord.id);

      if (updateError) throw updateError;

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
    const defaultProcessedData = {
      maintabs: [],
      subtabs: [],
      sections: [],
      subsections: [],
      fields: [],
      order: defaultStructure.order,
      visibility: defaultStructure.visibility
    };

    if (!data || data.length === 0) {
      return defaultProcessedData;
    }

    const processedData = data.reduce((acc, item) => {
      const structure = item.structure || {};
      const visibility = structure.visibility || {};
      const order = structure.order || {};

      // Process your data here
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
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((item, id) => ({
          id: String(id),
          ...item
        })),
      subtabs: Array.from(processedData.subtabs),
      sections: Array.from(processedData.sections),
      subsections: Array.from(processedData.subsections),
      fields: Array.from(processedData.fields),
      order: defaultStructure.order,
      visibility: defaultStructure.visibility
    };
  };

  useEffect(() => {
    fetchStructureData();
  }, []);

  useEffect(() => {
    const loadStructure = async () => {
      try {
        await fetchStructureData();
      } catch (error) {
        console.error('Error loading structure:', error);
        setStructure(defaultStructure); // Fallback to default structure
        toast.error('Failed to load structure data');
      }
    };

    loadStructure();
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
              items={structure?.maintabs || []} // Add null check
              type="maintabs"
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDragEnd={handleDragEnd}
              isSelectTablesDialogOpen={isSelectTablesDialogOpen}
              setIsSelectTablesDialogOpen={setIsSelectTablesDialogOpen}
              onTablesFieldsSelect={handleTablesFieldsSelect}
            />
          </TabsContent>
        </Tabs>

        {isSelectTablesDialogOpen && (
          <Dialog open={isSelectTablesDialogOpen} onOpenChange={setIsSelectTablesDialogOpen}>
            <DialogContent className="max-w-3xl p-4 space-y-4">
              <DialogHeader>
                <DialogTitle>Select Tables and Fields</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col space-y-2">
                <p className="text-sm text-gray-600">
                  Select tables and fields to add to the new structure.
                </p>
                <p className="text-sm text-gray-600">
                  You can select multiple tables and fields by holding the Ctrl key while clicking.
                </p>
              </div>

              <SelectTablesAndFieldsDialog
                isOpen={isSelectTablesDialogOpen}
                onClose={() => setIsSelectTablesDialogOpen(false)}
                onApply={(tables, fields) => {
                  handleTablesFieldsSelect(tables, fields);
                  setIsSelectTablesDialogOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}