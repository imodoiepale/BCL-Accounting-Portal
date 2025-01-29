"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectTablesAndFieldsDialog } from './SelectTablesAndFieldsDialog';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface FormState {
  mainTab: string;
  tab: string;
  section: string;
  subsection: string;
  selectedTables: string[];
  selectedFields: { [table: string]: string[] };
}

interface NewItemInputs {
  mainTab: string;
  tab: string;
  section: string;
  subsection: string;
}

interface NewStructureFormProps {
  onStructureChange: () => void;
  mainTabs: string[];
  subTabs: string[];
  isSelectTablesDialogOpen: boolean;
  setIsSelectTablesDialogOpen: (open: boolean) => void;
  onTablesFieldsSelect: (tables: string[], fields: Record<string, string[]>) => void;
}

export function NewStructureForm({
  onStructureChange,
  mainTabs,
  subTabs,
  isSelectTablesDialogOpen,
  setIsSelectTablesDialogOpen,
  onTablesFieldsSelect
}: NewStructureFormProps) {
  const [formState, setFormState] = useState<FormState>({
    mainTab: '',
    tab: '',
    section: '',
    subsection: '',
    selectedTables: [],
    selectedFields: {}
  });
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
  const [newItemInputs, setNewItemInputs] = useState({
    mainTab: '',
    tab: '',
    section: '',
    subsection: '',
  });

  // Fetch existing structure from database
  const fetchStructureData = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*');

      if (error) throw error;

      if (data) {
        const processedData = data.reduce((acc, item) => {
          const structure = item.structure || {};
          const { order = {}, visibility = {}, sections = [] } = structure;

          // Process main tab
          acc.maintabs.push({
            id: item.id,
            name: item.main_tab,
            visible: visibility.maintabs?.[item.main_tab] ?? true,
            order: order.maintabs?.[item.main_tab] ?? 0
          });

          // Process sub tab
          acc.subtabs.push({
            id: item.id,
            name: item.sub_tab,
            visible: visibility.subtabs?.[item.sub_tab] ?? true,
            order: order.subtabs?.[item.sub_tab] ?? 0,
            parent: { maintab: item.main_tab }
          });

          // Process sections and subsections
          sections.forEach((section: any) => {
            acc.sections.push({
              id: item.id,
              name: section.name,
              visible: visibility.sections?.[section.name] ?? true,
              order: order.sections?.[section.name] ?? 0,
              parent: { maintab: item.main_tab, subtab: item.sub_tab }
            });

            section.subsections?.forEach((subsection: any) => {
              acc.subsections.push({
                id: item.id,
                name: subsection.name,
                visible: visibility.subsections?.[subsection.name] ?? true,
                order: order.subsections?.[subsection.name] ?? 0,
                parent: { maintab: item.main_tab, subtab: item.sub_tab, section: section.name }
              });

              subsection.fields?.forEach((field: any) => {
                acc.fields.push({
                  id: item.id,
                  name: field.name,
                  table: field.table,
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
            });
          });

          return acc;
        }, {
          maintabs: [] as any[],
          subtabs: [] as any[],
          sections: [] as any[],
          subsections: [] as any[],
          fields: [] as any[]
        });

        // Sort all arrays by order
        Object.keys(processedData).forEach(key => {
          processedData[key].sort((a: any, b: any) => a.order - b.order);
        });

        setStructure(processedData);
      }
    } catch (error) {
      console.error('Error fetching structure data:', error);
      toast.error('Failed to load existing structure');
    }
  };

  // Fetch structure data on component mount
  useEffect(() => {
    fetchStructureData();
  }, []);

  const handleFormChange = (field: string, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));

    // Reset new item input when switching away from 'new'
    if (value !== 'new') {
      setNewItemInputs(prev => ({ ...prev, [field]: '' }));

      // Only reset dependent fields when selecting an existing item (not 'new')
      if (field === 'mainTab') {
        setFormState(prev => ({ ...prev, tab: '', section: '', subsection: '' }));
      } else if (field === 'tab') {
        setFormState(prev => ({ ...prev, section: '', subsection: '' }));
      } else if (field === 'section') {
        setFormState(prev => ({ ...prev, subsection: '' }));
      }
    }
  };

  const handleNewItemInputChange = (field: keyof NewItemInputs, value: string) => {
    setNewItemInputs(prev => ({ ...prev, [field]: value }));
  };

  const getFormValue = (field: keyof FormState) => {
    if (formState[field] === 'new') {
      return newItemInputs[field];
    }
    return formState[field];
  };

  const handleTablesFieldsSelect = (tables: string[], fields: { [table: string]: string[] }) => {
    setFormState(prev => ({
      ...prev,
      selectedTables: tables,
      selectedFields: fields
    }));
    setIsSelectTablesDialogOpen(false);
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
}