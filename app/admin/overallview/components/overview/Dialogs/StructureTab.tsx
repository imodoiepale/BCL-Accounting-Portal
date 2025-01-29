// @ts-nocheck
"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { Label } from '@/components/ui/label';

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
    onVisibilityChange: (item: StructureItem, visible: boolean) => Promise<void>;
    onDragEnd: (result: any) => Promise<void>;
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
    onVisibilityChange,
    onDragEnd,
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
    }>({ type: null, value: '' });
    const handleAddClick = (type: 'maintab' | 'subtab' | 'section' | 'subsection' | 'field') => {
        setSelectedItemType(type);
        setIsAddDialogOpen(true);
    };
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
    const handleVisibilityChange = async (item: StructureItem, visible: boolean) => {
        try {
            let query = supabase
                .from('profile_category_table_mapping_2')
                .select('*')
                .order('created_at', { ascending: true });
    
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
    
                // Initialize visibility objects if they don't exist
                const types = ['maintabs', 'subtabs', 'sections', 'subsections', 'fields'];
                types.forEach(type => {
                    visibility[type] = visibility[type] || {};
                });
    
                // Check parent visibility when trying to show an item
                if (visible && item.type !== 'maintab') {
                    const { isVisible, parentType } = getParentVisibility(item);
                    if (!isVisible) {
                        toast.error(`Cannot enable visibility while ${parentType} is hidden`);
                        return;
                    }
                }
    
                // Update visibility for the current item
                visibility[`${item.type}s`][item.name] = visible;
    
                // Update children visibility based on parent state
                const updateChildrenVisibility = (items: StructureItem[], type: string, parentName: string, parentType: string) => {
                    items.forEach(childItem => {
                        if (childItem.parent) {
                            const isChild = parentType === 'maintab' ? childItem.parent.maintab === parentName :
                                          parentType === 'subtab' ? childItem.parent.subtab === parentName :
                                          parentType === 'section' ? childItem.parent.section === parentName :
                                          parentType === 'subsection' ? childItem.parent.subsection === parentName : false;
    
                            if (isChild) {
                                visibility[type][childItem.name] = visible;
                            }
                        }
                    });
                };
    
                // Cascade visibility changes to all children
                switch (item.type) {
                    case 'maintab': {
                        // Update subtabs
                        const subtabs = getSubTabsForMainTab(item.name);
                        updateChildrenVisibility(subtabs, 'subtabs', item.name, 'maintab');
    
                        // Update sections under those subtabs
                        subtabs.forEach(subtab => {
                            const sections = getSectionsForSubTab(subtab.name);
                            updateChildrenVisibility(sections, 'sections', subtab.name, 'subtab');
    
                            // Update subsections under those sections
                            sections.forEach(section => {
                                const subsections = getSubsectionsForSection(section.name);
                                updateChildrenVisibility(subsections, 'subsections', section.name, 'section');
    
                                // Update fields under those subsections
                                subsections.forEach(subsection => {
                                    const fields = getFieldsForSubsection(subsection.name);
                                    updateChildrenVisibility(fields, 'fields', subsection.name, 'subsection');
                                });
                            });
                        });
                        break;
                    }
                    case 'subtab': {
                        const sections = getSectionsForSubTab(item.name);
                        updateChildrenVisibility(sections, 'sections', item.name, 'subtab');
    
                        sections.forEach(section => {
                            const subsections = getSubsectionsForSection(section.name);
                            updateChildrenVisibility(subsections, 'subsections', section.name, 'section');
    
                            subsections.forEach(subsection => {
                                const fields = getFieldsForSubsection(subsection.name);
                                updateChildrenVisibility(fields, 'fields', subsection.name, 'subsection');
                            });
                        });
                        break;
                    }
                    case 'section': {
                        const subsections = getSubsectionsForSection(item.name);
                        updateChildrenVisibility(subsections, 'subsections', item.name, 'section');
    
                        subsections.forEach(subsection => {
                            const fields = getFieldsForSubsection(subsection.name);
                            updateChildrenVisibility(fields, 'fields', subsection.name, 'subsection');
                        });
                        break;
                    }
                    case 'subsection': {
                        const fields = getFieldsForSubsection(item.name);
                        updateChildrenVisibility(fields, 'fields', item.name, 'subsection');
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
                
                const updateItemAndChildren = (items: any[], type: string, parentName: string, parentType: string) => {
                    return items.map(currentItem => {
                        const isTarget = currentItem.name === item.name;
                        const isChild = currentItem.parent && (
                            parentType === 'maintab' ? currentItem.parent.maintab === parentName :
                            parentType === 'subtab' ? currentItem.parent.subtab === parentName :
                            parentType === 'section' ? currentItem.parent.section === parentName :
                            parentType === 'subsection' ? currentItem.parent.subsection === parentName : false
                        );
    
                        return {
                            ...currentItem,
                            visible: isTarget || isChild ? visible : currentItem.visible
                        };
                    });
                };
    
                if (item.type === 'maintab') {
                    newStructure.maintabs = updateItemAndChildren(prev.maintabs, 'maintabs', item.name, 'maintab');
                    newStructure.subtabs = updateItemAndChildren(prev.subtabs, 'subtabs', item.name, 'maintab');
                    newStructure.sections = updateItemAndChildren(prev.sections, 'sections', item.name, 'maintab');
                    newStructure.subsections = updateItemAndChildren(prev.subsections, 'subsections', item.name, 'maintab');
                    newStructure.fields = updateItemAndChildren(prev.fields, 'fields', item.name, 'maintab');
                } else {
                    newStructure[`${item.type}s`] = updateItemAndChildren(
                        prev[`${item.type}s`],
                        `${item.type}s`,
                        item.name,
                        item.type
                    );
                }
    
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
                .eq('main_tab', removed.parent?.maintab)
                .eq('sub_tab', removed.parent?.subtab)
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

    const getParentVisibility = (item: StructureItem): { isVisible: boolean; parentType: string | null } => {
        const getItemVisibility = (type: string, name: string | undefined) => {
            if (!name) return true;
            const items = structure[`${type}s` as keyof typeof structure] as Array<any>;
            return items.find(i => i.name === name)?.visible ?? true;
        };
    
        switch (item.type) {
            case 'maintab':
                return { isVisible: true, parentType: null };
    
            case 'subtab': {
                const maintabVisible = getItemVisibility('maintab', item.parent?.maintab);
                return {
                    isVisible: maintabVisible,
                    parentType: !maintabVisible ? 'main tab' : null
                };
            }
    
            case 'section': {
                const maintabVisible = getItemVisibility('maintab', item.parent?.maintab);
                const subtabVisible = getItemVisibility('subtab', item.parent?.subtab);
                return {
                    isVisible: maintabVisible && subtabVisible,
                    parentType: !maintabVisible ? 'main tab' : 
                               !subtabVisible ? 'sub tab' : null
                };
            }
    
            case 'subsection': {
                const maintabVisible = getItemVisibility('maintab', item.parent?.maintab);
                const subtabVisible = getItemVisibility('subtab', item.parent?.subtab);
                const sectionVisible = getItemVisibility('section', item.parent?.section);
                return {
                    isVisible: maintabVisible && subtabVisible && sectionVisible,
                    parentType: !maintabVisible ? 'main tab' : 
                               !subtabVisible ? 'sub tab' : 
                               !sectionVisible ? 'section' : null
                };
            }
    
            case 'field': {
                const maintabVisible = getItemVisibility('maintab', item.parent?.maintab);
                const subtabVisible = getItemVisibility('subtab', item.parent?.subtab);
                const sectionVisible = getItemVisibility('section', item.parent?.section);
                const subsectionVisible = getItemVisibility('subsection', item.parent?.subsection);
                return {
                    isVisible: maintabVisible && subtabVisible && sectionVisible && subsectionVisible,
                    parentType: !maintabVisible ? 'main tab' : 
                               !subtabVisible ? 'sub tab' : 
                               !sectionVisible ? 'section' : 
                               !subsectionVisible ? 'subsection' : null
                };
            }
    
            default:
                return { isVisible: true, parentType: null };
        }
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
                                            id: tab.id,
                                            visible: tab.visible,
                                            parent: {}
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
                                        onCheckedChange={(checked) => {
                                            const { isVisible, parentType } = getParentVisibility({
                                                type: 'subtab',
                                                name: subtab.name,
                                                id: subtab.id,
                                                visible: subtab.visible,
                                                parent: {
                                                    maintab: selectedMainTab
                                                }
                                            });

                                            if (!isVisible && checked) {
                                                toast.error(`Cannot enable visibility while ${parentType} is hidden`);
                                                return;
                                            }

                                            handleVisibilityChange({
                                                type: 'subtab',
                                                name: subtab.name,
                                                id: subtab.id,
                                                visible: subtab.visible,
                                                parent: {
                                                    maintab: selectedMainTab
                                                }
                                            }, checked);
                                        }}
                                        disabled={!structure.maintabs.find(t => t.name === selectedMainTab)?.visible}
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
                                        onCheckedChange={(checked) => {
                                            const { isVisible, parentType } = getParentVisibility({
                                                type: 'section',
                                                name: section.name,
                                                id: section.id,
                                                visible: section.visible,
                                                parent: {
                                                    maintab: selectedMainTab,
                                                    subtab: selectedSubTab
                                                }
                                            });

                                            if (!isVisible && checked) {
                                                toast.error(`Cannot enable visibility while ${parentType} is hidden`);
                                                return;
                                            }

                                            handleVisibilityChange({
                                                type: 'section',
                                                name: section.name,
                                                id: section.id,
                                                visible: section.visible,
                                                parent: {
                                                    maintab: selectedMainTab,
                                                    subtab: selectedSubTab
                                                }
                                            }, checked);
                                        }}
                                        disabled={!structure.subtabs.find(t => t.name === selectedSubTab)?.visible}
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
                                        onCheckedChange={(checked) => {
                                            const { isVisible, parentType } = getParentVisibility({
                                                type: 'subsection',
                                                name: subsection.name,
                                                id: subsection.id,
                                                visible: subsection.visible,
                                                parent: {
                                                    maintab: selectedMainTab,
                                                    subtab: selectedSubTab,
                                                    section: selectedSection
                                                }
                                            });

                                            if (!isVisible && checked) {
                                                toast.error(`Cannot enable visibility while ${parentType} is hidden`);
                                                return;
                                            }

                                            handleVisibilityChange({
                                                type: 'subsection',
                                                name: subsection.name,
                                                id: subsection.id,
                                                visible: subsection.visible,
                                                parent: {
                                                    maintab: selectedMainTab,
                                                    subtab: selectedSubTab,
                                                    section: selectedSection
                                                }
                                            }, checked);
                                        }}
                                        disabled={!structure.sections.find(s => s.name === selectedSection)?.visible}
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
                                                                    onCheckedChange={(checked) => {
                                                                        const { isVisible, parentType } = getParentVisibility({
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
                                                                        });

                                                                        if (!isVisible && checked) {
                                                                            toast.error(`Cannot enable visibility while ${parentType} is hidden`);
                                                                            return;
                                                                        }

                                                                        handleVisibilityChange({
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
                                                                        }, checked);
                                                                    }}
                                                                    disabled={!structure.subsections.find(s => s.name === selectedSubSection)?.visible}
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