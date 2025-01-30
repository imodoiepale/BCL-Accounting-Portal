// @ts-nocheck
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SelectTablesAndFieldsDialog } from './SelectTablesAndFieldsDialog';

interface StructureItem {
    id: string;
    name: string;
    visible: boolean;
    order: number;
    type: 'maintab' | 'subtab' | 'section' | 'subsection' | 'field';
    table?: string;
    parent?: {
        maintab?: string;
        subtab?: string;
        section?: string;
        subsection?: string;
    };
}

interface StructureTabProps {
    items: StructureItem[];
    type: 'maintab' | 'subtab' | 'section' | 'subsection' | 'field';
    onAdd: (item: StructureItem) => Promise<void>;
    onEdit: (item: StructureItem) => Promise<void>;
    onDelete: (item: StructureItem) => Promise<void>;
    parentItem?: StructureItem;
    onSelect?: (item: StructureItem) => void;
    selectedItem?: string | null;
    isSelectTablesDialogOpen: boolean;
    setIsSelectTablesDialogOpen: (open: boolean) => void;
    onTablesFieldsSelect: (tables: string[], fields: Record<string, string[]>) => void;
}

export function StructureTab({
    items,
    type,
    onAdd,
    onEdit,
    onDelete,
    parentItem,
    onSelect,
    selectedItem,
    isSelectTablesDialogOpen,
    setIsSelectTablesDialogOpen,
    onTablesFieldsSelect
}: StructureTabProps) {
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
    const [selectedSubTab, setSelectedSubTab] = useState<string | null>(null);
    const [selectedMainTab, setSelectedMainTab] = useState<string | null>(null);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [selectedSubSection, setSelectedSubSection] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<{
        type: 'maintab' | 'subtab' | 'section' | 'subsection' | null;
        value: string;
        id?: string;
    }>({ type: null, value: '', id: undefined });
    const [selectedItemType, setSelectedItemType] = useState<'maintab' | 'subtab' | 'section' | 'subsection' | 'field' | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const handleInlineEdit = (type: 'maintab' | 'subtab' | 'section' | 'subsection', value: string, id?: string) => {
        setEditingField({ type, value, id });
    };

    const handleInlineEditSubmit = async (e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
        if ('key' in e && e.key !== 'Enter') return;

        if (editingField.type && editingField.value.trim()) {
            await onEdit({
                type: editingField.type,
                name: editingField.value.trim(),
                id: editingField.id || '',
                visible: true,
                parent: {
                    maintab: selectedMainTab || undefined,
                    subtab: selectedSubTab || undefined,
                    section: selectedSection || undefined,
                    subsection: selectedSubSection || undefined
                }
            });
        }
        setEditingField({ type: null, value: '', id: undefined });
    };

    const handleAddClick = (type: 'maintab' | 'subtab' | 'section' | 'subsection' | 'field') => {
        setSelectedItemType(type);
        setIsAddDialogOpen(true);
    };

    const handleAddSubmit = async (name: string) => {
        if (selectedItemType && name.trim()) {
            await onAdd({
                type: selectedItemType,
                name: name.trim(),
                id: String(Date.now()),
                visible: true,
                parent: {
                    maintab: selectedMainTab || undefined,
                    subtab: selectedSubTab || undefined,
                    section: selectedSection || undefined,
                    subsection: selectedSubSection || undefined
                }
            });
            setIsAddDialogOpen(false);
            setSelectedItemType(null);
        }
    };

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
                                                    subtab: item.subtab,
                                                    section: section.name
                                                }
                                            });

                                            // Process fields with visibility
                                            subsection.fields?.forEach((field: any) => {
                                                acc.fields.add({
                                                    name: field.name,
                                                    table: field.table,
                                                    visible: visibility.fields?.[field.name] ?? true,
                                                    order: order.fields?.[field.name] ?? 0,
                                                    parent: {
                                                        maintab: item.main_tab,
                                                        subtab: item.subtab,
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
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((item, id) => ({
                        id: String(id),
                        ...item
                    })),
                subtabs: Array.from(processedData.subtabs)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((item, id) => ({
                        id: String(id),
                        ...item
                    })),
                sections: Array.from(processedData.sections)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((item, id) => ({
                        id: String(id),
                        ...item
                    })),
                subsections: Array.from(processedData.subsections)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((item, id) => ({
                        id: String(id),
                        ...item
                    })),
                fields: Array.from(processedData.fields)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((item, id) => ({
                        id: String(id),
                        ...item
                    }))
            };

            setStructure(structureData);
        } catch (error) {
            console.error('Error fetching structure data:', error);
            toast.error('Failed to load structure data');
        }
    };

    useEffect(() => {
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

    const handleTablesFieldsSelect = useCallback((tables: string[], fields: { [table: string]: string[] }) => {
        setFormState(prev => ({
            ...prev,
            selectedTables: tables,
            selectedFields: fields
        }));
        setIsSelectTablesDialogOpen(false);
    }, []);

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
                                onDoubleClick={() => handleInlineEdit('maintab', selectedMainTab || '', selectedMainTab || undefined)}
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
                                onDoubleClick={() => handleInlineEdit('subtab', selectedSubTab || '', selectedSubTab || undefined)}
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
                                onDoubleClick={() => handleInlineEdit('section', selectedSection || '', selectedSection || undefined)}
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
                                onDoubleClick={() => handleInlineEdit('subsection', selectedSubSection || '', selectedSubSection || undefined)}
                            >
                                {selectedSubSection || 'Not selected'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
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
    const getFieldsForMainTab = (maintabName: string) => {
        return structure.fields.filter(field => 
          field.parent?.maintab === maintabName
        );
      };
      
      const getFieldsForSubTab = (subtabName: string) => {
        return structure.fields.filter(field => 
          field.parent?.subtab === subtabName
        );
      };
      
      const getFieldsForSection = (sectionName: string) => {
        return structure.fields.filter(field => 
          field.parent?.section === sectionName
        );
      };
      
      const getSectionsForMainTab = (maintabName: string) => {
        return structure.sections.filter(section => 
          section.parent?.maintab === maintabName
        );
      };
      
      const getSubsectionsForMainTab = (maintabName: string) => {
        return structure.subsections.filter(subsection => 
          subsection.parent?.maintab === maintabName
        );
      };
      
      const getSubsectionsForSubTab = (subtabName: string) => {
        return structure.subsections.filter(subsection => 
          subsection.parent?.subtab === subtabName
        );
      };

    const handleVisibilityChange = async (item: StructureItem, visible: boolean) => {
        try {
            // 1. Check parent visibility first
            const parents = getParentItems(item);
            const parentVisibilityCheck = parents.every(parent => {
                const parentItems = structure[`${parent.type}s`] as any[];
                const parentItem = parentItems.find(p => p.name === parent.name);
                return parentItem?.visible;
            });

            if (visible && !parentVisibilityCheck) {
                const hiddenParent = parents.find(parent => {
                    const parentItems = structure[`${parent.type}s`] as any[];
                    const parentItem = parentItems.find(p => p.name === parent.name);
                    return !parentItem?.visible;
                });
                toast.error(`Cannot enable visibility while ${hiddenParent?.type} is hidden`);
                return;
            }

            // 2. Get the current record
            const { data: records, error: fetchError } = await supabase
                .from('profile_category_table_mapping_2')
                .select('*')
                .eq('main_tab', item.parent?.maintab || item.name);

            if (fetchError) throw fetchError;

            // 3. Handle record creation if needed
            if (!records || records.length === 0) {
                const newStructure = {
                    maintabs: [],
                    subtabs: [],
                    sections: [],
                    subsections: [],
                    fields: [],
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
                        maintabs: {
                            [item.name]: visible
                        },
                        sections: {},
                        subsections: {}
                    }
                };

                const { error: insertError } = await supabase
                    .from('profile_category_table_mapping_2')
                    .insert({
                        main_tab: item.parent?.maintab || item.name,
                        sub_tab: item.parent?.subtab || 'default',
                        structure: newStructure
                    });

                if (insertError) throw insertError;
                await fetchStructureData();
                toast.success('Visibility updated successfully');
                return;
            }

            // 4. Update all matching records
            const updatePromises = records.map(async (record) => {
                const updatedStructure = { ...record.structure };
                
                if (!updatedStructure.visibility) {
                    updatedStructure.visibility = {
                        fields: {},
                        subtabs: {},
                        maintabs: {},
                        sections: {},
                        subsections: {}
                    };
                }

                // Update visibility for the current item
                updatedStructure.visibility[`${item.type}s`] = {
                    ...updatedStructure.visibility[`${item.type}s`],
                    [item.name]: visible
                };

                // Get all child items that should be affected
                const children = getChildItems(item);

                // Update all children to match parent's visibility
                children.forEach(child => {
                    updatedStructure.visibility[`${child.type}s`] = {
                        ...updatedStructure.visibility[`${child.type}s`],
                        ...child.items.reduce((acc, childItem) => ({
                            ...acc,
                            [childItem.name]: visible
                        }), {})
                    };
                });

                return supabase
                    .from('profile_category_table_mapping_2')
                    .update({ structure: updatedStructure })
                    .eq('id', record.id);
            });

            // 5. Execute all updates
            await Promise.all(updatePromises);
            await fetchStructureData();
            toast.success('Visibility updated successfully');
        } catch (error) {
            console.error('Error updating visibility:', error);
            toast.error('Failed to update visibility');
        }
    };

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;

        const { source, destination, type } = result;
        if (source.index === destination.index) return;

        let items: any[] = [];
        switch (type) {
            case 'maintab':
                items = [...structure.maintabs];
                break;
            case 'subtab':
                items = getSubTabsForMainTab(selectedMainTab || '');
                break;
            case 'section':
                items = getSectionsForSubTab(selectedSubTab || '');
                break;
            case 'subsection':
                items = getSubsectionsForSection(selectedSection || '');
                break;
            case 'field':
                items = getFieldsForSubsection(selectedSubSection || '');
                break;
        }

        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);

        // Update the order in the database
        try {
            const { error } = await supabase
                .from('structure')
                .update({ order: destination.index })
                .eq('id', reorderedItem.id);

            if (error) throw error;

            // Update local state
            setStructure(prev => {
                const newStructure = { ...prev };
                switch (type) {
                    case 'maintab':
                        newStructure.maintabs = items;
                        break;
                    case 'subtab':
                        if (selectedMainTab) {
                            const mainTabIndex = newStructure.maintabs.findIndex(t => t.name === selectedMainTab);
                            if (mainTabIndex !== -1) {
                                newStructure.maintabs[mainTabIndex].subtabs = items;
                            }
                        }
                        break;
                    case 'section':
                        if (selectedMainTab && selectedSubTab) {
                            const mainTabIndex = newStructure.maintabs.findIndex(t => t.name === selectedMainTab);
                            if (mainTabIndex !== -1) {
                                const subTabIndex = newStructure.maintabs[mainTabIndex].subtabs.findIndex(t => t.name === selectedSubTab);
                                if (subTabIndex !== -1) {
                                    newStructure.maintabs[mainTabIndex].subtabs[subTabIndex].sections = items;
                                }
                            }
                        }
                        break;
                    case 'subsection':
                        if (selectedMainTab && selectedSubTab && selectedSection) {
                            const mainTabIndex = newStructure.maintabs.findIndex(t => t.name === selectedMainTab);
                            if (mainTabIndex !== -1) {
                                const subTabIndex = newStructure.maintabs[mainTabIndex].subtabs.findIndex(t => t.name === selectedSubTab);
                                if (subTabIndex !== -1) {
                                    const sectionIndex = newStructure.maintabs[mainTabIndex].subtabs[subTabIndex].sections.findIndex(s => s.name === selectedSection);
                                    if (sectionIndex !== -1) {
                                        newStructure.maintabs[mainTabIndex].subtabs[subTabIndex].sections[sectionIndex].subsections = items;
                                    }
                                }
                            }
                        }
                        break;
                }
                return newStructure;
            });
        } catch (error) {
            console.error('Error updating item order:', error);
            toast.error('Failed to update item order');
        }
    };

    const getParentItems = (item: StructureItem) => {
        const parents: { type: string; name: string }[] = [];
        
        if (item.parent?.maintab) {
            parents.push({ type: 'maintab', name: item.parent.maintab });
        }
        if (item.parent?.subtab) {
            parents.push({ type: 'subtab', name: item.parent.subtab });
        }
        if (item.parent?.section) {
            parents.push({ type: 'section', name: item.parent.section });
        }
        if (item.parent?.subsection) {
            parents.push({ type: 'subsection', name: item.parent.subsection });
        }
        
        return parents;
    };

    const getChildItems = (item: StructureItem) => {
        const children: { type: string; items: any[] }[] = [];
        
        switch (item.type) {
            case 'maintab':
                children.push({ 
                    type: 'subtab', 
                    items: structure.subtabs.filter(st => st.parent?.maintab === item.name) 
                });
                children.push({ 
                    type: 'section', 
                    items: structure.sections.filter(s => s.parent?.maintab === item.name) 
                });
                children.push({ 
                    type: 'subsection', 
                    items: structure.subsections.filter(ss => ss.parent?.maintab === item.name) 
                });
                children.push({ 
                    type: 'field', 
                    items: structure.fields.filter(f => f.parent?.maintab === item.name) 
                });
                break;
            case 'subtab':
                children.push({ 
                    type: 'section', 
                    items: structure.sections.filter(s => s.parent?.subtab === item.name) 
                });
                children.push({ 
                    type: 'subsection', 
                    items: structure.subsections.filter(ss => ss.parent?.subtab === item.name) 
                });
                children.push({ 
                    type: 'field', 
                    items: structure.fields.filter(f => f.parent?.subtab === item.name) 
                });
                break;
            case 'section':
                children.push({ 
                    type: 'subsection', 
                    items: structure.subsections.filter(ss => ss.parent?.section === item.name) 
                });
                children.push({ 
                    type: 'field', 
                    items: structure.fields.filter(f => f.parent?.section === item.name) 
                });
                break;
            case 'subsection':
                children.push({ 
                    type: 'field', 
                    items: structure.fields.filter(f => f.parent?.subsection === item.name) 
                });
                break;
        }
        
        return children;
    };

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
                    <DragDropContext onDragEnd={(result) => onDragEnd({ ...result, type: 'maintab' })}>
                        <Droppable droppableId="maintabs">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="p-4 space-y-2">
                                    {structure.maintabs.map((tab, index) => (
                                        <Draggable key={tab.id} draggableId={tab.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={cn(
                                                        "flex items-center justify-between p-2 rounded-md cursor-pointer",
                                                        selectedMainTab === tab.name ? "bg-blue-100" : "hover:bg-muted"
                                                    )}
                                                    onClick={() => handleMainTabSelect(tab.name)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div {...provided.dragHandleProps}>
                                                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                        </div>
                                                        <span>{tab.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={tab.visible}
                                                            onCheckedChange={(checked) => handleVisibilityChange({
                                                                type: 'maintab',
                                                                name: tab.name,
                                                                id: tab.id,
                                                                visible: tab.visible,
                                                                parent: {}
                                                            }, checked)}
                                                        />
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-destructive"
                                                            onClick={() => onDelete({
                                                                type: 'maintab',
                                                                name: tab.name,
                                                                id: tab.id,
                                                                visible: tab.visible,
                                                                parent: {}
                                                            })}
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
                    <DragDropContext onDragEnd={(result) => onDragEnd({ ...result, type: 'subtab' })}>
                        <Droppable droppableId="subtabs">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="p-4 space-y-2">
                                    {selectedMainTab && getSubTabsForMainTab(selectedMainTab).map((subtab, index) => (
                                        <Draggable key={subtab.id} draggableId={subtab.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={cn(
                                                        "flex items-center justify-between p-2 rounded-md cursor-pointer",
                                                        selectedSubTab === subtab.name ? "bg-blue-100" : "hover:bg-muted"
                                                    )}
                                                    onClick={() => handleSubTabSelect(subtab.name)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div {...provided.dragHandleProps}>
                                                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                        </div>
                                                        <span>{subtab.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={subtab.visible}
                                                            onCheckedChange={(checked) => handleVisibilityChange({
                                                                type: 'subtab',
                                                                name: subtab.name,
                                                                id: subtab.id,
                                                                visible: subtab.visible,
                                                                parent: {
                                                                    maintab: selectedMainTab
                                                                }
                                                            }, checked)}
                                                            disabled={!structure.maintabs.find(t => t.name === selectedMainTab)?.visible}
                                                        />
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-destructive"
                                                            onClick={() => onDelete({
                                                                type: 'subtab',
                                                                name: subtab.name,
                                                                id: subtab.id,
                                                                visible: subtab.visible,
                                                                parent: {
                                                                    maintab: selectedMainTab
                                                                }
                                                            })}
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
                    <DragDropContext onDragEnd={(result) => onDragEnd({ ...result, type: 'section' })}>
                        <Droppable droppableId="sections">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="p-4 space-y-2">
                                    {selectedSubTab && getSectionsForSubTab(selectedSubTab).map((section, index) => (
                                        <Draggable key={section.id} draggableId={section.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={cn(
                                                        "flex items-center justify-between p-2 rounded-md cursor-pointer",
                                                        selectedSection === section.name ? "bg-blue-100" : "hover:bg-muted"
                                                    )}
                                                    onClick={() => handleSectionSelect(section.name)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div {...provided.dragHandleProps}>
                                                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                        </div>
                                                        <span>{section.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={section.visible}
                                                            onCheckedChange={(checked) => handleVisibilityChange({
                                                                type: 'section',
                                                                name: section.name,
                                                                id: section.id,
                                                                visible: section.visible,
                                                                parent: {
                                                                    maintab: selectedMainTab,
                                                                    subtab: selectedSubTab
                                                                }
                                                            }, checked)}
                                                            disabled={!structure.maintabs.find(t => t.name === selectedMainTab)?.visible ||
                                                                !getSubTabsForMainTab(selectedMainTab || '').find(t => t.name === selectedSubTab)?.visible}
                                                        />
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-destructive"
                                                            onClick={() => onDelete({
                                                                type: 'section',
                                                                name: section.name,
                                                                id: section.id,
                                                                visible: section.visible,
                                                                parent: {
                                                                    maintab: selectedMainTab,
                                                                    subtab: selectedSubTab
                                                                }
                                                            })}
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
                    <DragDropContext onDragEnd={(result) => onDragEnd({ ...result, type: 'subsection' })}>
                        <Droppable droppableId="subsections">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="p-4 space-y-2">
                                    {selectedSection && getSubsectionsForSection(selectedSection).map((subsection, index) => (
                                        <Draggable key={subsection.id} draggableId={subsection.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={cn(
                                                        "flex items-center justify-between p-2 rounded-md cursor-pointer",
                                                        selectedSubSection === subsection.name ? "bg-blue-100" : "hover:bg-muted"
                                                    )}
                                                    onClick={() => handleSubsectionSelect(subsection.name)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div {...provided.dragHandleProps}>
                                                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                        </div>
                                                        <span>{subsection.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={subsection.visible}
                                                            onCheckedChange={(checked) => handleVisibilityChange({
                                                                type: 'subsection',
                                                                name: subsection.name,
                                                                id: subsection.id,
                                                                visible: subsection.visible,
                                                                parent: {
                                                                    maintab: selectedMainTab,
                                                                    subtab: selectedSubTab,
                                                                    section: selectedSection
                                                                }
                                                            }, checked)}
                                                            disabled={!structure.maintabs.find(t => t.name === selectedMainTab)?.visible ||
                                                                !getSubTabsForMainTab(selectedMainTab || '').find(t => t.name === selectedSubTab)?.visible ||
                                                                !getSectionsForSubTab(selectedSubTab || '').find(s => s.name === selectedSection)?.visible}
                                                        />
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-destructive"
                                                            onClick={() => onDelete({
                                                                type: 'subsection',
                                                                name: subsection.name,
                                                                id: subsection.id,
                                                                visible: subsection.visible,
                                                                parent: {
                                                                    maintab: selectedMainTab,
                                                                    subtab: selectedSubTab,
                                                                    section: selectedSection
                                                                }
                                                            })}
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
                            <DragDropContext onDragEnd={onDragEnd}>
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
                                                                        id: field.id,
                                                                        visible: field.visible,
                                                                        parent: {
                                                                            maintab: selectedMainTab,
                                                                            subtab: selectedSubTab,
                                                                            section: selectedSection,
                                                                            subsection: selectedSubSection
                                                                        }
                                                                    }, checked)}
                                                                    disabled={!structure.maintabs.find(t => t.name === selectedMainTab)?.visible || 
                                                                             !structure.subtabs.find(t => t.name === selectedSubTab)?.visible ||
                                                                             !structure.sections.find(s => s.name === selectedSection)?.visible ||
                                                                             !structure.subsections.find(ss => ss.name === selectedSubSection)?.visible}
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
}