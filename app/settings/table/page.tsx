// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash, Settings, Edit2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
    processedSections: Array<{
      name: string;
      label: string;
      isSeparator?: boolean;
      categorizedFields?: Array<{
        category: string;
        isSeparator?: boolean;
        fields: Array<{
          name: string;
          label: string;
          type?: string;
        }>;
      }>;
    }>;
    helperColumnConfigs: {
      calculation: Record<string, any>;
      reference: Record<string, any>;
    };
    visibility: {
      sections: Record<string, boolean>;
      categories: Record<string, boolean>;
      subcategories: Record<string, boolean>;
    };
    helperColumns: {
      calculation: Record<string, boolean>;
      reference: Record<string, boolean>;
    };
    onHelperColumnChange: (type: string, id: string) => void;
    mainTabs: string[];
    mainSections: Record<string, any>;
    mainSubsections: Record<string, any>;
    onStructureChange: () => void;
    onVisibilityChange: (type: string, id: string, value: boolean) => void;
  }
  


interface StructureItem {
    id: number;
    section: string;
    subsection: string;
    table_name: string;
    column_mappings: Record<string, string>;
    column_order: Record<string, number>;
    Tabs: string;
    table_names: Record<string, string[]>;
}


interface Tab {
    name: string;
    sections: Section[];
}

interface Section {
    name: string;
    subsections: Subsection[];
}

interface Subsection {
    name: string;
    tables: string[];
}

// Add these helper functions
const toColumnName = (displayName: string) => {
    return displayName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .trim();
};

// Add this interface
interface TableColumn {
    column_name: string;
    data_type: string;
}
interface NewStructure {
    section: string;
    subsection: string;
    table_name: string;
    Tabs: string;
    column_mappings: Record<string, string>;
    isNewTab: boolean;
    isNewSection: boolean;
    isNewSubsection: boolean;
    table_names: string[];
}

interface SectionFields {
    [section: string]: {
        fields: string[];
        subsections: {
            [subsection: string]: string[];
        };
    };
}


// Helper function to parse JSON safely
const safeJSONParse = (jsonString: string, fallback: any = {}) => {
    try {
        return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch (error) {
        return fallback;
    }
};

// Helper function to process sections and subsections
const processStructureData = (data: any[]) => {
    const allSections = new Set<string>();
    const allSubsections: Record<string, Set<string>> = {};
    const mappings: Record<string, Record<string, string[]>> = {};

    data.forEach(item => {
        const sectionsData = safeJSONParse(item.sections_sections);
        const subsectionsData = safeJSONParse(item.sections_subsections);
        const columnMappings = safeJSONParse(item.column_mappings);

        // Process sections
        Object.keys(sectionsData).forEach(section => {
            allSections.add(section);
            if (!allSubsections[section]) {
                allSubsections[section] = new Set();
            }
            if (!mappings[section]) {
                mappings[section] = {};
            }
        });

        // Process subsections and their mappings
        Object.entries(subsectionsData).forEach(([section, subs]) => {
            if (!allSubsections[section]) {
                allSubsections[section] = new Set();
            }

            const subsections = Array.isArray(subs) ? subs : [subs];
            subsections.forEach(sub => {
                if (sub) {
                    allSubsections[section].add(sub);
                    if (!mappings[section][sub]) {
                        mappings[section][sub] = [];
                    }
                }
            });
        });

        // Process column mappings
        Object.entries(columnMappings).forEach(([key, value]) => {
            const [table, field] = key.split('.');
            Object.keys(sectionsData).forEach(section => {
                const subsection = subsectionsData[section];
                if (subsection) {
                    if (!mappings[section][subsection]) {
                        mappings[section][subsection] = [];
                    }
                    if (!mappings[section][subsection].includes(field)) {
                        mappings[section][subsection].push(field);
                    }
                }
            });
        });
    });

    return {
        sections: Array.from(allSections),
        subsections: Object.fromEntries(
            Object.entries(allSubsections).map(([k, v]) => [k, Array.from(v)])
        ),
        mappings
    };
};


export default function SettingsDialog({
    processedSections = [], // Provide default empty array
    helperColumnConfigs = { calculation: {}, reference: {} },
    visibility = { sections: {}, categories: {}, subcategories: {} },
    helperColumns = { calculation: {}, reference: {} },
    onHelperColumnChange,
    mainTabs = [],
    mainSections = {},
    mainSubsections = {},
    onStructureChange,
    onVisibilityChange,
}: SettingsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [structure, setStructure] = useState<StructureItem[]>([]);
    const [uniqueTabs, setUniqueTabs] = useState<string[]>([]);
    const [selectedTab, setSelectedTab] = useState('');
    const [existingSections, setExistingSections] = useState<string[]>([]);
    const [existingSubsections, setExistingSubsections] = useState<Record<string, string[]>>({});
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [selectedTableFields, setSelectedTableFields] = useState<{ [table: string]: string[] }>({});
    const [newStructure, setNewStructure] = useState<NewStructure>({
        section: '',
        subsection: '',
        table_name: '',
        Tabs: '',
        column_mappings: {},
        isNewTab: false,
        isNewSection: false,
        isNewSubsection: false,
        table_names: []
    });

    const [selectedSection, setSelectedSection] = useState<StructureItem | null>(null);
    const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [newField, setNewField] = useState({ key: '', value: '' });
    const [tables, setTables] = useState<string[]>([]);
    const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [showNewTableDialog, setShowNewTableDialog] = useState(false);
    const [newTableName, setNewTableName] = useState('');
    const [loadingTable, setLoadingTable] = useState(false);
    const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
    const [showMultiSelectDialog, setShowMultiSelectDialog] = useState(false);
    const [availableFields, setAvailableFields] = useState<{ table: string, fields: TableColumn[] }[]>([]);
    const [addFieldState, setAddFieldState] = useState({
        displayName: '',
        selectedTables: [],
        selectedFields: {},
        selectedTab: 'new',
        newFieldTable: ''
    });
    const [sectionFields, setSectionFields] = useState<SectionFields>({});



    const resetNewStructure = () => {
        setNewStructure({
            section: '',
            subsection: '',
            table_name: '',
            Tabs: '',
            column_mappings: {},
            isNewTab: false,
            isNewSection: false,
            isNewSubsection: false,
            table_names: []
        });
        setSelectedTables([]);
        setSelectedTableFields({});
    };

    const [tabs, setTabs] = useState<Tab[]>([]);
    useEffect(() => {
        fetchStructure();
    }, []);

    const fetchStructure = async () => {
        try {
            const { data: mappings, error } = await supabase
                .from('profile_category_table_mapping')
                .select('*')
                .order('Tabs', { ascending: true });

            if (error) throw error;

            const processedMappings = mappings.map(mapping => ({
                id: mapping.id,
                section: mapping.section,
                subsection: mapping.subsection,
                table_name: mapping.table_name,
                column_mappings: typeof mapping.column_mappings === 'string'
                    ? JSON.parse(mapping.column_mappings)
                    : mapping.column_mappings || {},
                column_order: mapping.column_order || {},
                Tabs: mapping.Tabs,
                sections_subsections: typeof mapping.sections_subsections === 'string'
                    ? JSON.parse(mapping.sections_subsections)
                    : mapping.sections_subsections || {},
                sections_sections: typeof mapping.sections_sections === 'string'
                    ? JSON.parse(mapping.sections_sections)
                    : mapping.sections_sections || {}
            }));

            setStructure(processedMappings);
            const uniqueTabs = [...new Set(mappings.map(m => m.Tabs))];
            setUniqueTabs(uniqueTabs);

            if (!selectedTab && uniqueTabs.length > 0) {
                setSelectedTab(uniqueTabs[0]);
            }
        } catch (error) {
            console.error('Error fetching structure:', error);
            toast.error('Failed to fetch table structure');
        }
    };

    useEffect(() => {
        fetchTables();
        fetchExistingSectionsAndSubsections();
    }, []);

    const fetchTables = async () => {
        try {
            const { data: tablesData, error: tablesError } = await supabase.rpc('get_all_tables');
            if (tablesError) throw tablesError;

            const tableNames = tablesData.map(t => t.table_name).sort();
            setTables(tableNames);

            const columnsPromises = tableNames.map(async (tableName) => {
                const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
                    input_table_name: tableName
                });

                if (columnsError) throw columnsError;

                return {
                    table_name: tableName,
                    columns: columns.map(col => ({
                        ...col,
                        table_name: tableName
                    }))
                };
            });

            const allTableColumns = await Promise.all(columnsPromises);
            const flattenedColumns = allTableColumns.reduce((acc, table) => {
                return [...acc, ...table.columns];
            }, []);

            // console.log('Tables with columns:', allTableColumns);
            setTableColumns(flattenedColumns);
        } catch (error) {
            toast.error('Failed to fetch tables and columns');
        }
    };
    const fetchTableColumns = async (tableName: string) => {
        try {
            const { data, error } = await supabase.rpc('get_table_columns', {
                input_table_name: tableName
            });

            if (error) throw error;

            const columns = data.map(col => ({
                column_name: col.column_name,
                data_type: col.data_type,
                table_name: tableName // Add table name to track source
            }));

            setTableColumns(prev => [...prev, ...columns]);
        } catch (error) {
            toast.error('Failed to fetch columns');
        }
    };

    useEffect(() => {
        if (selectedTab) {
            fetchExistingSectionsAndSubsections(selectedTab);
        }
    }, [selectedTab]);

    const fetchExistingSectionsAndSubsections = async (tab) => {
        try {
            const { data, error } = await supabase
                .from('profile_category_table_mapping')
                .select('sections_sections, sections_subsections')
                .eq('Tabs', tab);

            if (error) throw error;

            const sections = [];
            const subsections = {};

            data.forEach(item => {
                const sectionsData = item.sections_sections ? JSON.parse(item.sections_sections) : {};
                const subsectionsData = item.sections_subsections ? JSON.parse(item.sections_subsections) : {};

                Object.keys(sectionsData).forEach(section => {
                    if (!sections.includes(section)) {
                        sections.push(section);
                    }
                    if (!subsections[section]) {
                        subsections[section] = [];
                    }
                    if (subsectionsData[section]) {
                        subsections[section].push(subsectionsData[section]);
                    }
                });
            });

            setExistingSections(sections);
            setExistingSubsections(subsections);
        } catch (error) {
            toast.error('Failed to fetch sections and subsections');
        }
    };

    const handleAddColumn = async (tableName: string, columnName: string) => {
        try {
            const { error } = await supabase.rpc('add_column_to_table', {
                p_table_name: tableName,
                p_column_name: columnName,
                p_data_type: 'text'
            });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error adding column:', error);
            return false;
        }
    };

    const handleRemoveColumn = async (tableName: string, columnName: string) => {
        try {
            const { error } = await supabase.rpc('remove_column_from_table', {
                p_table_name: tableName,
                p_column_name: columnName
            });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error removing column:', error);
            return false;
        }
    };

    const handleAddField = async () => {
        if (!selectedSection || !newField.value) return;

        try {
            const columnName = toColumnName(newField.value);

            // Add new column mapping
            const { error: addError } = await supabase.rpc('add_column_mapping_overalltable', {
                p_table_name: selectedSection.table_name,
                p_column_name: columnName,
                p_display_name: newField.value
            });

            if (addError) throw addError;

            // Refresh the table columns
            await fetchTableColumns(selectedSection.table_name);

            // Refresh the selected section to get updated mappings
            const { data: updatedSection } = await supabase
                .from('profile_category_table_mapping')
                .select('*')
                .eq('id', selectedSection.id)
                .single();

            if (updatedSection) {
                setSelectedSection(updatedSection);
            }

            setNewField({ key: '', value: '' });
            setAddFieldDialog(false);
            toast.success('Field added successfully');

        } catch (error) {
            console.error('Error adding field:', error);
            toast.error('Failed to add field');
        }
    };

    const handleDeleteField = async (key: string) => {
        if (!selectedSection) return;

        try {
            // Delete column mapping
            const { error: deleteError } = await supabase.rpc('delete_column_mapping_overalltable', {
                p_table_name: selectedSection.table_name,
                p_column_name: key
            });

            if (deleteError) throw deleteError;

            // Refresh the table columns
            await fetchTableColumns(selectedSection.table_name);

            // Refresh the selected section to get updated mappings
            const { data: updatedSection } = await supabase
                .from('profile_category_table_mapping')
                .select('*')
                .eq('id', selectedSection.id)
                .single();

            if (updatedSection) {
                setSelectedSection(updatedSection);
            }

            toast.success('Field removed successfully');

        } catch (error) {
            console.error('Error removing field:', error);
            toast.error('Failed to remove field');
        }
    };

    const handleReorder = async (key: string, newOrder: number) => {
        if (!selectedSection) return;

        try {
            // Update column order
            const { error: updateError } = await supabase.rpc('update_column_order_overalltable', {
                p_table_name: selectedSection.table_name,
                p_column_name: key,
                p_new_order: newOrder
            });

            if (updateError) throw updateError;

            // Refresh the selected section to get updated order
            const { data: updatedSection } = await supabase
                .from('profile_category_table_mapping')
                .select('*')
                .eq('id', selectedSection.id)
                .single();

            if (updatedSection) {
                setSelectedSection(updatedSection);
            }

            toast.success('Order updated successfully');

        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Failed to update order');
        }
    };

    const handleCreateTable = async (tableName: string) => {
        setLoadingTable(true);
        try {
            // Create table with default mappings
            const { error: createError } = await supabase.rpc('create_table_with_mappings_overalltable', {
                p_table_name: tableName
            });

            if (createError) throw createError;

            await fetchTables();
            setNewTableName('');
            setShowNewTableDialog(false);

            // Set the new table as selected and fetch its columns
            setNewStructure(prev => ({
                ...prev,
                table_name: tableName
            }));
            await fetchTableColumns(tableName);

            toast.success('Table created successfully');

        } catch (error) {
            toast.error('Failed to create table');
            console.error('Error creating table:', error);
        } finally {
            setLoadingTable(false);
        }
    };

    const handleUpdateSection = async (id: number, updates: Partial<StructureItem>) => {
        try {
            const { error } = await supabase
                .from('profile_category_table_mapping')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            await fetchStructure();
            toast.success('Updated successfully');
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const handleAddStructure = async () => {
        try {
            // Create column mappings from selected fields
            const finalColumnMappings: Record<string, string> = {};
            Object.entries(selectedTableFields).forEach(([table, fields]) => {
                fields.forEach(field => {
                    finalColumnMappings[`${table}.${field}`] = field
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());
                });
            });

            // Prepare payload
            const payload = {
                sections_sections: JSON.stringify({ [newStructure.section]: true }),
                sections_subsections: JSON.stringify({
                    [newStructure.section]: newStructure.subsection
                }),
                Tabs: newStructure.Tabs,
                column_mappings: JSON.stringify(finalColumnMappings),
                table_names: JSON.stringify({
                    [newStructure.section]: selectedTables
                }),
                column_order: JSON.stringify(
                    Object.keys(finalColumnMappings).reduce((acc, key, index) => {
                        acc[key] = index + 1;
                        return acc;
                    }, {} as Record<string, number>)
                )
            };

            // Check for existing mapping
            const { data: existingMapping, error: fetchError } = await supabase
                .from('profile_category_table_mapping')
                .select('*')
                .match({
                    sections_sections: payload.sections_sections,
                    sections_subsections: payload.sections_subsections
                });

            if (fetchError) throw fetchError;

            if (existingMapping && existingMapping.length > 0) {
                const { error: updateError } = await supabase
                    .from('profile_category_table_mapping')
                    .update(payload)
                    .eq('id', existingMapping[0].id);

                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('profile_category_table_mapping')
                    .insert([payload]);

                if (insertError) throw insertError;
            }

            // Refresh structure and reset states
            await fetchStructure();
            await onStructureChange();
            resetNewStructure();
            toast.success('Structure updated successfully');

        } catch (error) {
            console.error('Error updating structure:', error);
            toast.error('Failed to update structure');
        }
    };



    const fetchSectionFields = async (section) => {
        try {
            const { data, error } = await supabase
                .from('profile_category_table_mapping')
                .select('sections_sections, sections_subsections, column_mappings')
                .eq('sections_sections', JSON.stringify({ [section]: true }));

            if (error) throw error;

            const fields = [];
            const subsectionFields = {};

            data.forEach(item => {
                const columnMappings = typeof item.column_mappings === 'string' ? JSON.parse(item.column_mappings) : item.column_mappings || {};
                const sectionsSubsections = typeof item.sections_subsections === 'string' ? JSON.parse(item.sections_subsections) : item.sections_subsections || {};

                Object.entries(columnMappings).forEach(([key]) => {
                    if (!fields.includes(key)) {
                        fields.push(key);
                    }
                });

                if (sectionsSubsections && sectionsSubsections[section]) {
                    const subsection = sectionsSubsections[section];
                    if (typeof subsection === 'string') {
                        subsectionFields[subsection] = Object.keys(columnMappings);
                    } else if (Array.isArray(subsection)) {
                        subsection.forEach(sub => {
                            subsectionFields[sub] = Object.keys(columnMappings);
                        });
                    }
                }
            });

            setSectionFields(prev => ({
                ...prev,
                [section]: {
                    fields,
                    subsections: subsectionFields
                }
            }));
        } catch (error) {
            toast.error('Failed to fetch section fields');
        }
    };
    // Add useEffect for section/subsection changes
    useEffect(() => {
        if (newStructure.section && !newStructure.isNewSection) {
            fetchSectionFields(newStructure.section);
        }
    }, [newStructure.section]);

    useEffect(() => {
        if (newStructure.section && newStructure.subsection && !newStructure.isNewSubsection) {
            const subsectionFields = sectionFields[newStructure.section]?.subsections[newStructure.subsection] || [];
            setSelectedTableFields(prevFields => ({
                ...prevFields,
                [newStructure.section]: subsectionFields
            }));
        }
    }, [newStructure.subsection, sectionFields, newStructure.section]);


    const MultiSelectDialog = () => {
        const [tempSelectedTables, setTempSelectedTables] = useState<string[]>(selectedTables);
        const [tempSelectedFields, setTempSelectedFields] = useState<{ [table: string]: string[] }>(selectedTableFields);

        useEffect(() => {
            if (showMultiSelectDialog) {
                setTempSelectedTables(selectedTables);
                setTempSelectedFields(selectedTableFields);
            }
        }, [showMultiSelectDialog, selectedTables, selectedTableFields]);

        useEffect(() => {
            console.log('Selected Tables:', selectedTables);
            console.log('Selected Fields:', selectedTableFields);
        }, [selectedTables, selectedTableFields]);

        return (
            <Dialog open={showMultiSelectDialog} onOpenChange={setShowMultiSelectDialog}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Select Tables and Fields</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Tables Selection */}
                        <div className="border rounded-lg p-4 bg-white shadow-sm">
                            <h4 className="font-medium mb-4 text-lg text-gray-800">Select Tables</h4>
                            <ScrollArea className="h-[400px]">
                                {tables.map(table => (
                                    <div key={table} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            id={`multiselect-table-${table}`}
                                            checked={tempSelectedTables.includes(table)}
                                            onChange={(e) => {
                                                setTempSelectedTables(prev =>
                                                    e.target.checked
                                                        ? [...prev, table]
                                                        : prev.filter(t => t !== table)
                                                );
                                                if (!e.target.checked) {
                                                    setTempSelectedFields(prev => {
                                                        const { [table]: _, ...rest } = prev;
                                                        return rest;
                                                    });
                                                }
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <label
                                            htmlFor={`multiselect-table-${table}`}
                                            className="text-sm text-gray-700 hover:text-gray-900 cursor-pointer flex-1"
                                        >
                                            {table.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </label>
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>

                        {/* Fields Selection */}
                        <div className="border rounded-lg p-4 bg-white shadow-sm">
                            <h4 className="font-medium mb-4 text-lg text-gray-800">Select Fields</h4>
                            <ScrollArea className="h-[400px]">
                                {tempSelectedTables.map((tableName, index) => {
                                    const tableFields = tableColumns.filter(col => col.table_name === tableName);
                                    return (
                                        <div key={tableName}>
                                            <div className="bg-gray-50 p-3 rounded-t-lg border-b-2 border-primary/20">
                                                <h5 className="font-lg text-black">
                                                    {tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </h5>
                                            </div>
                                            <div className="p-2 mb-4 border-x border-b rounded-b-lg">
                                                {tableFields.map(field => (
                                                    <div
                                                        key={`${tableName}-${field.column_name}`}
                                                        className="flex items-center gap-3 p-2.5 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            id={`multiselect-field-${tableName}-${field.column_name}`}
                                                            checked={tempSelectedFields[tableName]?.includes(field.column_name) || false}
                                                            onChange={(e) => {
                                                                setTempSelectedFields(prev => ({
                                                                    ...prev,
                                                                    [tableName]: e.target.checked
                                                                        ? [...(prev[tableName] || []), field.column_name]
                                                                        : (prev[tableName] || []).filter(f => f !== field.column_name)
                                                                }));
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <label
                                                            htmlFor={`multiselect-field-${tableName}-${field.column_name}`}
                                                            className="text-sm text-gray-700 hover:text-gray-900 cursor-pointer flex-1"
                                                        >
                                                            {field.column_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                            <span className="ml-2 text-xs text-gray-500">({field.data_type})</span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                            {index < tempSelectedTables.length - 1 && (
                                                <div className="h-4 border-l-2 border-r-2 border-dashed border-gray-200 mx-4" />
                                            )}
                                        </div>
                                    );
                                })}
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowMultiSelectDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedTables(tempSelectedTables);
                                setSelectedTableFields(tempSelectedFields);
                                setNewStructure(prev => ({
                                    ...prev,
                                    table_names: tempSelectedTables,
                                    column_mappings: Object.entries(tempSelectedFields).reduce((acc, [table, fields]) => {
                                        fields.forEach(field => {
                                            acc[`${table}.${field}`] = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                        });
                                        return acc;
                                    }, {})
                                }));
                                setShowMultiSelectDialog(false);
                            }}
                        >
                            Apply Selection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    // Handle Tab Selection
    const handleTabSelection = async (tabValue: string, isNewStructure: boolean = false) => {
        try {
            if (isNewStructure) {
                // This is for Add New Structure section
                if (tabValue === 'new') {
                    // Load ALL sections and subsections independently for new tab
                    const { data, error } = await supabase
                        .from('profile_category_table_mapping')
                        .select('*');

                    if (error) throw error;

                    // Get ALL sections and subsections regardless of tab
                    const allSections = new Set<string>();
                    const allSubsections = new Set<string>();

                    data.forEach(item => {
                        const sectionsData = safeJSONParse(item.sections_sections, {});
                        const subsectionsData = safeJSONParse(item.sections_subsections, {});

                        Object.keys(sectionsData).forEach(section => allSections.add(section));
                        Object.values(subsectionsData).forEach(subs => {
                            if (Array.isArray(subs)) {
                                subs.forEach(sub => allSubsections.add(sub));
                            } else if (subs) {
                                allSubsections.add(subs as string);
                            }
                        });
                    });

                    setExistingSections(Array.from(allSections));
                    setExistingSubsections({
                        "all": Array.from(allSubsections)
                    });

                    setNewStructure({
                        section: '',
                        subsection: '',
                        table_name: '',
                        Tabs: '',
                        column_mappings: {},
                        isNewTab: true,
                        isNewSection: false,
                        isNewSubsection: false,
                        table_names: []
                    });
                } else {
                    // Existing tab for new structure
                    setNewStructure(prev => ({
                        ...prev,
                        Tabs: tabValue,
                        isNewTab: false
                    }));
                }
            } else {
                // This is for Table Structure Settings section
                setSelectedTab(tabValue);
                fetchExistingSectionsAndSubsections(tabValue);
            }

            setSelectedTables([]);
            setSelectedTableFields({});

        } catch (error) {
            console.error('Error in tab selection:', error);
            toast.error('Failed to load tab data');
        }
    };

    const handleSectionSelection = async (sectionValue: string) => {
        try {
            if (sectionValue === 'new') {
                if (newStructure.isNewTab) {
                    // For new tab, preserve existing subsections and just reset section-related states
                    setNewStructure(prev => ({
                        ...prev,
                        section: '',
                        subsection: '',
                        isNewSection: true,
                        isNewSubsection: false,
                        table_names: []
                    }));

                    // Clear selections but keep existing subsections
                    setSelectedTables([]);
                    setSelectedTableFields({});
                    return;
                } else {
                    // For existing tab, handle new section creation
                    setNewStructure(prev => ({
                        ...prev,
                        section: '',
                        subsection: '',
                        isNewSection: true,
                        isNewSubsection: false,
                        table_names: []
                    }));

                    // Clear all selections and subsections for existing tab
                    setSelectedTables([]);
                    setSelectedTableFields({});
                    setExistingSubsections({});
                    return;
                }
            }

            // Fetch all mapping data
            const { data, error } = await supabase
                .from('profile_category_table_mapping')
                .select('*');

            if (error) throw error;

            if (newStructure.isNewTab) {
                // For new tab, process ALL data to get complete set of mappings
                const allSubsectionsSet = new Set<string>();
                const allMappings: Record<string, string[]> = {};

                data.forEach(item => {
                    // Process subsections
                    const subsectionsData = safeJSONParse(item.sections_subsections, {});
                    Object.values(subsectionsData).forEach(subs => {
                        if (Array.isArray(subs)) {
                            subs.forEach(sub => allSubsectionsSet.add(sub));
                        } else if (subs) {
                            allSubsectionsSet.add(subs as string);
                        }
                    });

                    // Process mappings
                    const columnMappings = safeJSONParse(item.column_mappings, {});
                    Object.entries(columnMappings).forEach(([key, value]) => {
                        const [table, field] = key.split('.');
                        if (!allMappings[table]) {
                            allMappings[table] = [];
                        }
                        if (!allMappings[table].includes(field)) {
                            allMappings[table].push(field);
                        }
                    });
                });

                // Keep all subsections available under the "all" key
                if (!existingSubsections["all"]) {
                    setExistingSubsections(prev => ({
                        ...prev,
                        all: Array.from(allSubsectionsSet)
                    }));
                }

                setNewStructure(prev => ({
                    ...prev,
                    section: sectionValue,
                    isNewSection: false,
                    subsection: '',
                    table_names: []
                }));

                // Clear specific selections but maintain all available options
                setSelectedTables([]);
                setSelectedTableFields({});

            } else {
                // For existing tab, filter data for this tab and section
                const relevantData = data.filter(item =>
                    item.Tabs === newStructure.Tabs &&
                    item.sections_sections &&
                    Object.keys(safeJSONParse(item.sections_sections)).includes(sectionValue)
                );

                // Process section-specific data
                const sectionMappings: Record<string, string[]> = {};
                const sectionSubsections = new Set<string>();

                relevantData.forEach(item => {
                    // Process subsections for this section
                    const subsectionsData = safeJSONParse(item.sections_subsections, {});
                    const sectionSubs = subsectionsData[sectionValue] || [];
                    if (Array.isArray(sectionSubs)) {
                        sectionSubs.forEach(sub => sectionSubsections.add(sub));
                    } else if (sectionSubs) {
                        sectionSubsections.add(sectionSubs as string);
                    }

                    // Process mappings
                    const columnMappings = safeJSONParse(item.column_mappings, {});
                    Object.entries(columnMappings).forEach(([key, value]) => {
                        const [table, field] = key.split('.');
                        if (!sectionMappings[table]) {
                            sectionMappings[table] = [];
                        }
                        if (!sectionMappings[table].includes(field)) {
                            sectionMappings[table].push(field);
                        }
                    });
                });

                // Update states for existing tab
                setExistingSubsections({
                    [sectionValue]: Array.from(sectionSubsections)
                });

                setSelectedTables(Object.keys(sectionMappings));
                setSelectedTableFields(sectionMappings);

                setNewStructure(prev => ({
                    ...prev,
                    section: sectionValue,
                    isNewSection: false,
                    subsection: '',
                    table_names: Object.keys(sectionMappings)
                }));
            }

            // Log for debugging
            console.log('Section selection completed:', {
                isNewTab: newStructure.isNewTab,
                selectedSection: sectionValue,
                availableSubsections: existingSubsections,
                selectedTables,
                selectedTableFields
            });

        } catch (error) {
            console.error('Error in section selection:', error);
            toast.error('Failed to load section data');

            // Reset states on error
            setNewStructure(prev => ({
                ...prev,
                section: '',
                subsection: '',
                isNewSection: false,
                isNewSubsection: false,
                table_names: []
            }));
            setSelectedTables([]);
            setSelectedTableFields({});
        }
    };

    // Handle Subsection Selection
    const handleSubsectionSelection = async (subsectionValue: string) => {
        try {
            if (subsectionValue === 'new') {
                setNewStructure(prev => ({
                    ...prev,
                    subsection: '',
                    isNewSubsection: true
                }));
                return;
            }

            let mappingsToUse = {};

            if (newStructure.isNewTab) {
                // For new tab, get all mappings for this section/subsection combination
                const { data, error } = await supabase
                    .from('profile_category_table_mapping')
                    .select('*');

                if (error) throw error;

                const relevantStructure = data.find(item => {
                    const sections = safeJSONParse(item.sections_sections);
                    const subsections = safeJSONParse(item.sections_subsections);
                    return Object.keys(sections).includes(newStructure.section) &&
                        subsections[newStructure.section] === subsectionValue;
                });

                if (relevantStructure) {
                    mappingsToUse = safeJSONParse(relevantStructure.column_mappings);
                }
            } else {
                // For existing tab, get mappings only from this tab
                const existingStructure = structure.find(item =>
                    item.Tabs === newStructure.Tabs &&
                    item.sections_sections &&
                    Object.keys(safeJSONParse(item.sections_sections)).includes(newStructure.section) &&
                    safeJSONParse(item.sections_subsections)[newStructure.section] === subsectionValue
                );

                if (existingStructure) {
                    mappingsToUse = safeJSONParse(existingStructure.column_mappings);
                }
            }

            // Extract tables and fields
            const mappings = Object.entries(mappingsToUse).reduce((acc, [key, value]) => {
                const [table, field] = key.split('.');
                if (!acc[table]) {
                    acc[table] = [];
                }
                acc[table].push(field);
                return acc;
            }, {} as Record<string, string[]>);

            // Update states
            setSelectedTables(Object.keys(mappings));
            setSelectedTableFields(mappings);

            setNewStructure(prev => ({
                ...prev,
                subsection: subsectionValue,
                isNewSubsection: false,
                table_names: Object.keys(mappings),
                column_mappings: mappingsToUse
            }));

        } catch (error) {
            console.error('Error in subsection selection:', error);
            toast.error('Failed to load subsection data');
        }
    };

    const handleAddNewField = async () => {
        console.log('Adding new field:', addFieldState);
        if (!addFieldState.displayName || !addFieldState.newFieldTable) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            const columnName = toColumnName(addFieldState.displayName);
            const selectedTables = [addFieldState.newFieldTable];

            console.log('Adding column mapping for:', { columnName, selectedTables });
            // Add column mapping and create table column
            const { error: addMappingError } = await supabase.rpc('add_column_mapping_overalltable', {
                p_table_name: addFieldState.newFieldTable,
                p_column_name: columnName,
                p_display_name: addFieldState.displayName,
                p_selected_tables: selectedTables
            });

            if (addMappingError) throw addMappingError;

            // Refresh data
            await fetchTableColumns(addFieldState.newFieldTable);
            await fetchStructure();

            setAddFieldDialogOpen(false);
            setAddFieldState({
                displayName: '',
                selectedTables: [],
                selectedFields: {},
                selectedTab: 'new',
                newFieldTable: ''
            });

            toast.success('New field added successfully');
        } catch (error) {
            console.error('Error adding new field:', error);
            toast.error('Failed to add new field');
        }
    };

    const handleAddExistingFields = async () => {
        console.log('Adding existing fields:', addFieldState.selectedFields);
        if (Object.keys(addFieldState.selectedFields).length === 0) {
            toast.error('Please select at least one field');
            return;
        }

        try {
            // Get all selected tables
            const selectedTables = Object.keys(addFieldState.selectedFields);

            // Process each field for selected tables
            for (const [table, fields] of Object.entries(addFieldState.selectedFields)) {
                console.log('Processing fields for table:', table, fields);
                for (const field of fields) {
                    const { error } = await supabase
                        .from('profile_categories_mappings')
                        .insert([{
                            table_name: table,
                            column_name: field,
                            display_name: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                            selected_tables: selectedTables
                        }]);

                    if (error) throw error;
                }
            }

            // Refresh data
            await Promise.all(selectedTables.map(table => fetchTableColumns(table)));
            await fetchStructure();

            setAddFieldDialogOpen(false);
            setAddFieldState({
                displayName: '',
                selectedTables: [],
                selectedFields: {},
                selectedTab: 'new',
                newFieldTable: ''
            });

            toast.success('Fields added successfully');
        } catch (error) {
            console.error('Error adding existing fields:', error);
            toast.error('Failed to add fields');
        }
    };

    return (
        <>

            <Tabs defaultValue="structure" className="flex-1">
                <TabsList className="">
                    <TabsTrigger value="add-structure"> Add Table Structure </TabsTrigger>
                    <TabsTrigger value="structure">Table Structure Settings</TabsTrigger>
                    <TabsTrigger value="visibility">Column Visibility</TabsTrigger>
                    <TabsTrigger value="helpers">Helper Columns</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 mt-4">
                    <div className="px-1 py-2">
                        <TabsContent value="add-structure" className="mt-0 space-y-4">
                            {/* Add New Structure UI */}
                            <div className="border-t pt-6 mt-6">
                                <h3 className="text-lg font-semibold mb-6">Add New Structure</h3>
                                <div className="flex flex-row md:flex-row gap-4">
                                    {/* Tab Selection/Creation */}
                                    <div className="space-y-3 w-full md:w-1/2 mb-4">
                                        <label className="text-sm font-medium text-gray-700">Tab</label>
                                        <Select
                                            value={newStructure.Tabs}
                                            onValueChange={(value) => handleTabSelection(value, true)}
                                        >
                                            <SelectTrigger className="w-full bg-white">
                                                <SelectValue placeholder="Select or Create Tab" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {uniqueTabs.filter(tab => tab?.trim()).map(tab => (
                                                    <SelectItem key={tab} value={tab}>{tab}</SelectItem>
                                                ))}
                                                <SelectItem value="new" className="text-blue-600 font-medium">+ Create New Tab</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {/* Add this input field for new tab */}
                                        {newStructure.isNewTab && (
                                            <Input
                                                placeholder="Enter new tab name"
                                                value={newStructure.Tabs}
                                                onChange={(e) => setNewStructure(prev => ({
                                                    ...prev,
                                                    Tabs: e.target.value
                                                }))}
                                                className="mt-2"
                                            />
                                        )}
                                    </div>

                                    {/* Section Selection/Creation */}
                                    <div className="space-y-3 w-full md:w-1/2 mb-4 ">
                                        <label className="text-sm font-medium text-gray-700">Section</label>
                                        <Select
                                            value={newStructure.section}
                                            onValueChange={(value) => {
                                                if (value === 'new') {
                                                    setNewStructure(prev => ({
                                                        ...prev,
                                                        section: '',
                                                        isNewSection: true,
                                                        subsection: '',
                                                        isNewSubsection: false
                                                    }));
                                                } else {
                                                    handleSectionSelection(value);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full bg-white">
                                                <SelectValue placeholder="Select or Create Section" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {existingSections.filter(section => section?.trim()).map(section => (
                                                    <SelectItem key={section} value={section}>{section}</SelectItem>
                                                ))}
                                                <SelectItem value="new" className="text-blue-600 font-medium">+ Create New Section</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {newStructure.isNewSection && (
                                            <Input
                                                placeholder="Enter new section name"
                                                value={newStructure.section}
                                                onChange={(e) => setNewStructure(prev => ({
                                                    ...prev,
                                                    section: e.target.value
                                                }))}
                                                className="mt-2"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-row gap-4">
                                    {/* Subsection Selection/Creation */}
                                    <div className="space-y-3 w-full md:w-1/2 mb-4">
                                        <label className="text-sm font-medium text-gray-700">Subsection</label>
                                        {!newStructure.isNewSection ? (
                                            <Select
                                                value={newStructure.subsection}
                                                onValueChange={(value) => {
                                                    if (value === 'new') {
                                                        setNewStructure(prev => ({
                                                            ...prev,
                                                            subsection: '',
                                                            isNewSubsection: true
                                                        }));
                                                    } else {
                                                        handleSubsectionSelection(value);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="w-full bg-white">
                                                    <SelectValue placeholder="Select or Create Subsection" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* This is the key change - when in new tab mode, always show all subsections */}
                                                    {(newStructure.isNewTab
                                                        ? existingSubsections["all"] || []  // Show ALL subsections for new tab
                                                        : existingSubsections[newStructure.section] || []  // Show section-specific subsections for existing tab
                                                    )
                                                        .filter(subsection => subsection?.trim())
                                                        .map(subsection => (
                                                            <SelectItem key={subsection} value={subsection}>
                                                                {subsection}
                                                            </SelectItem>
                                                        ))}
                                                    <SelectItem value="new" className="text-blue-600 font-medium">
                                                        + Create New Subsection
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                placeholder="Enter new subsection name"
                                                value={newStructure.subsection}
                                                onChange={(e) => setNewStructure(prev => ({
                                                    ...prev,
                                                    subsection: e.target.value
                                                }))}
                                                className="mt-2"
                                            />
                                        )}

                                        {!newStructure.isNewSection && newStructure.isNewSubsection && (
                                            <Input
                                                placeholder="Enter new subsection name"
                                                value={newStructure.subsection}
                                                onChange={(e) => setNewStructure(prev => ({
                                                    ...prev,
                                                    subsection: e.target.value
                                                }))}
                                                className="mt-2"
                                            />
                                        )}
                                    </div>

                                    {/* Table Selection/Creation */}
                                    <div className="space-y-3 w-full md:w-1/2 mb-4">
                                        <label className="text-sm font-medium text-gray-700">Tables and Fields</label>
                                        <Button
                                            onClick={() => setShowMultiSelectDialog(true)}
                                            variant="outline"
                                            className="w-full justify-between"
                                            type="button"
                                        >
                                            {selectedTables.length > 0
                                                ? `${selectedTables.length} tables selected`
                                                : "Select Tables and Fields"}
                                            <Plus className="h-4 w-4" />
                                        </Button>

                                        {/* Show selected tables and fields preview */}
                                        {newStructure.table_names.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {newStructure.table_names.map(table => (
                                                    <div key={table} className="border rounded-md p-2">
                                                        <h6 className="font-medium text-sm">{table}</h6>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {selectedTableFields[table]?.map(fieldName => (
                                                                <span key={fieldName} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                    {fieldName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-row gap-4">
                                    {/* Preview and Add Button */}
                                    <div className="pt-6 space-y-6">
                                        {(newStructure.Tabs || newStructure.isNewTab) &&
                                            (newStructure.section || newStructure.isNewSection) &&
                                            (newStructure.subsection || newStructure.isNewSubsection) &&
                                            newStructure.table_name && (
                                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                                                    <h4 className="font-medium text-gray-900">Structure Preview</h4>
                                                    <div className="flex justify-between gap-4">
                                                        <div className="space-y-2">
                                                            <p className="text-sm"><span className="font-medium text-gray-700">Tab:</span> <span className="text-gray-600">{newStructure.Tabs}</span></p>
                                                            <p className="text-sm"><span className="font-medium text-gray-700">Section:</span> <span className="text-gray-600">{newStructure.section}</span></p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-sm"><span className="font-medium text-gray-700">Subsection:</span> <span className="text-gray-600">{newStructure.subsection}</span></p>
                                                            <p className="text-sm"><span className="font-medium text-gray-700">Table:</span> <span className="text-gray-600">{newStructure.table_name}</span></p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleAddStructure}
                                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Structure
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="structure" className="mt-0 space-y-4">
                            <div className="grid grid-cols-12 gap-4">
                                {/* Left Panel - Tabs */}
                                <Card className="col-span-2 h-[700px]">
                                    <CardContent className="p-2">
                                        <ScrollArea className="h-[700px]">
                                            <div className="flex justify-between items-center mb-2 px-2">
                                                <h3 className="font-semibold">Tabs</h3>
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedTab('')}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {uniqueTabs.map(tab => (
                                                <button
                                                    key={tab}
                                                    className={`w-full text-left px-3 py-2 rounded transition-colors ${selectedTab === tab ? 'bg-primary text-white' : 'hover:bg-gray-100'
                                                        }`}
                                                    onClick={() => handleTabSelection(tab, false)}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>

                                {/* Middle Panel - Sections */}
                                <Card className="col-span-2 h-[700px]">
                                    <CardContent className="p-2">
                                        <ScrollArea className="h-[700px]">
                                            <div className="flex justify-between items-center mb-2 px-2">
                                                <h3 className="font-semibold">Sections</h3>
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedSection(null)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {existingSections
                                                .filter(section => {
                                                    const sectionItems = structure.filter(item =>
                                                        item.Tabs === selectedTab &&
                                                        item.sections_sections &&
                                                        Object.keys(item.sections_sections).includes(section)
                                                    );
                                                    return sectionItems.length > 0;
                                                })
                                                .map(section => (
                                                    <div
                                                        key={section}
                                                        className={`mb-2 p-2 rounded cursor-pointer transition-colors ${selectedSection?.section === section ? 'bg-primary/10' : 'hover:bg-gray-100'
                                                            }`}
                                                        onClick={() => setSelectedSection({ section })}
                                                    >
                                                        <div className="font-medium">{section}</div>
                                                    </div>
                                                ))}

                                        </ScrollArea>
                                    </CardContent>
                                </Card>

                                {/* Subsections Panel */}
                                <Card className="col-span-2 h-[700px]">
                                    <CardContent className="p-2">
                                        <ScrollArea className="h-[700px]">
                                            <div className="flex justify-between items-center mb-2 px-2">
                                                <h3 className="font-semibold">Subsections</h3>
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedSubsection(null)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {selectedSection && structure
                                                .filter(item =>
                                                    item.Tabs === selectedTab &&
                                                    item.sections_sections &&
                                                    item.sections_subsections &&
                                                    Object.keys(item.sections_sections).includes(selectedSection.section)
                                                )
                                                .flatMap(item => {
                                                    const subsections = item.sections_subsections[selectedSection.section] || [];
                                                    return Array.isArray(subsections) ? subsections : [subsections];
                                                })
                                                .map(subsection => (
                                                    <div
                                                        key={subsection}
                                                        className={`mb-2 p-2 rounded cursor-pointer transition-colors ${selectedSubsection === subsection ? 'bg-primary/10' : 'hover:bg-gray-100'
                                                            }`}
                                                        onClick={() => setSelectedSubsection(subsection)}
                                                    >
                                                        <div className="font-medium">{subsection}</div>
                                                    </div>
                                                ))}

                                        </ScrollArea>
                                    </CardContent>
                                </Card>

                                {/* Right Panel - Details */}
                                <Card className="col-span-6 h-[700px]">
                                    <CardContent className="p-4">
                                        <ScrollArea className="h-[700px]">
                                            {selectedSubsection ? (
                                                <div className="space-y-4">
                                                    {/* Header with Edit Button */}
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="font-semibold">Section Details</h3>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setEditing(!editing)}
                                                            >
                                                                <Edit2 className="h-4 w-4 mr-2" />
                                                                {editing ? 'View' : 'Edit'}
                                                            </Button>
                                                            {editing && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => {/* Add delete handler */ }}
                                                                >
                                                                    <Trash className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Section Info */}
                                                    <div className="grid gap-4">
                                                        <div>
                                                            <label className="text-sm font-medium">Section</label>
                                                            <Input
                                                                value={selectedSection?.section || ''}
                                                                disabled={!editing}
                                                                onChange={(e) => handleUpdateSection(selectedSection!.id, { section: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium">Subsection</label>
                                                            <Input
                                                                value={selectedSubsection || ''}
                                                                disabled={!editing}
                                                                onChange={(e) => handleUpdateSection(selectedSection!.id, { subsection: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium">Table Name</label>
                                                            {selectedSection && selectedSubsection && structure
                                                                .filter(item =>
                                                                    item.Tabs === selectedTab &&
                                                                    item.sections_sections &&
                                                                    Object.keys(item.sections_sections).includes(selectedSection.section) &&
                                                                    item.sections_subsections &&
                                                                    item.sections_subsections[selectedSection.section] === selectedSubsection
                                                                )
                                                                .map(item => {
                                                                    const tableNames = typeof item.table_names === 'string'
                                                                        ? JSON.parse(item.table_names)
                                                                        : item.table_names || {};

                                                                    const sectionTables = tableNames[selectedSection.section] || [];

                                                                    return sectionTables.map(tableName => (
                                                                        <Input
                                                                            key={tableName}
                                                                            value={tableName || ''}
                                                                            disabled={!editing}
                                                                            onChange={(e) => handleUpdateSection(item.id, { table_name: e.target.value })}
                                                                        />
                                                                    ));
                                                                })}
                                                        </div>
                                                    </div>

                                                    {/* Column Mappings */}
                                                    <div>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="font-medium">Column Mappings</h4>
                                                            {editing && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setAddFieldDialogOpen(true)}
                                                                >
                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                    Add Field
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <div className="border rounded-lg">
                                                            <div className="grid grid-cols-[60px,40px,1fr,1fr,1fr,80px] gap-2 p-2 bg-gray-50 border-b">
                                                                <div className="text-sm font-medium text-gray-500">Order</div>
                                                                <div className="text-sm font-medium text-gray-500">#</div>
                                                                <div className="text-sm font-medium text-gray-500">Column Name</div>
                                                                <div className="text-sm font-medium text-gray-500">Display Name</div>
                                                                <div className="text-sm font-medium text-gray-500">Table Name</div>
                                                                <div></div>
                                                            </div>

                                                            <ScrollArea className="h-[300px]" orientation="both">
                                                                {selectedSection && selectedSubsection && structure
                                                                    .filter(item =>
                                                                        item.Tabs === selectedTab &&
                                                                        item.sections_sections &&
                                                                        Object.keys(item.sections_sections).includes(selectedSection.section) &&
                                                                        item.sections_subsections &&
                                                                        item.sections_subsections[selectedSection.section] === selectedSubsection
                                                                    )
                                                                    .map(item => {
                                                                        const columnMappings = typeof item.column_mappings === 'string'
                                                                            ? JSON.parse(item.column_mappings)
                                                                            : item.column_mappings;

                                                                        return Object.entries(columnMappings)
                                                                            .sort((a, b) => {
                                                                                const orderA = item.column_order?.[a[0]] || 0;
                                                                                const orderB = item.column_order?.[b[0]] || 0;
                                                                                return orderA - orderB;
                                                                            })
                                                                            .map(([key, value], index) => (
                                                                                <div
                                                                                    key={key}
                                                                                    className="grid grid-cols-[60px,40px,1fr,1fr,1fr,80px] gap-2 p-2 border-b last:border-b-0 hover:bg-gray-50"
                                                                                >
                                                                                    <div className="flex items-center gap-1">
                                                                                        <span className="text-sm text-gray-500">{index + 1}</span>
                                                                                    </div>
                                                                                    <div className="text-sm text-gray-500">{index + 1}</div>
                                                                                    <div className="text-sm">{key.split('.')[1]}</div>
                                                                                    <div className="text-sm">{value}</div>
                                                                                    <div className="text-sm">{key.split('.')[0]}</div>
                                                                                    {editing && (
                                                                                        <div className="flex gap-1">
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                onClick={() => handleDeleteField(key)}
                                                                                                className="h-6 w-6"
                                                                                            >
                                                                                                <Trash className="h-4 w-4 text-red-500" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ));
                                                                    })}
                                                            </ScrollArea>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                                    <Settings className="h-12 w-12 mb-4" />
                                                    <p>Select a section to view details</p>
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                        <TabsContent value="visibility" className="mt-0 space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                {/* Sections Column */}
                                <Card className="col-span-1">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Sections</CardTitle>
                                        <CardDescription className="text-xs">
                                            Toggle main section visibility
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {processedSections?.length > 0 ? (
                                            processedSections.map(section => !section.isSeparator && (
                                                <div key={section.name}
                                                    className="flex items-center justify-between space-x-2 p-2 rounded-md bg-gray-50">
                                                    <div className="space-y-1">
                                                        <Label htmlFor={`section-${section.name}`}
                                                            className="text-sm font-medium">
                                                            {section.label}
                                                        </Label>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {section.categorizedFields?.length || 0} categories
                                                        </Badge>
                                                    </div>
                                                    <Switch
                                                        id={`section-${section.name}`}
                                                        checked={visibility.sections[section.name]}
                                                        onCheckedChange={() => onVisibilityChange('sections', section.name, !visibility.sections[section.name])}
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-gray-500">No sections available</div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Categories Column */}
                                <Card className="col-span-1">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Categories</CardTitle>
                                        <CardDescription className="text-xs">
                                            Manage category visibility by section
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[400px] pr-4">
                                            <div className="space-y-6">
                                                {processedSections.map(section => !section.isSeparator && (
                                                    <div key={section.name} className="space-y-3">
                                                        <h3 className="text-xs font-semibold px-2 py-1 rounded-md bg-gray-100">
                                                            {section.label}
                                                        </h3>
                                                        <div className="space-y-2 pl-2">
                                                            {section.categorizedFields?.map(category => !category.isSeparator && (
                                                                <div key={`${section.name}-${category.category}`}
                                                                    className="flex items-center justify-between space-x-2 p-2 rounded-md bg-gray-50">
                                                                    <Label htmlFor={`category-${section.name}-${category.category}`}
                                                                        className="text-sm">
                                                                        {category.category}
                                                                    </Label>
                                                                    <Switch
                                                                        id={`category-${section.name}-${category.category}`}
                                                                        checked={visibility.categories[`${section.name}-${category.category}`]}
                                                                        onCheckedChange={() => handleCategoryVisibilityChange(section.name, category.category)}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>

                                {/* Fields Column */}
                                <Card className="col-span-1">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Fields</CardTitle>
                                        <CardDescription className="text-xs">
                                            Configure individual field visibility
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[400px] pr-4">
                                            <div className="space-y-6">
                                                {processedSections.map(section => !section.isSeparator && (
                                                    <div key={section.name} className="space-y-4">
                                                        <h3 className="text-xs font-semibold px-2 py-1 rounded-md bg-gray-100">
                                                            {section.label}
                                                        </h3>
                                                        {section.categorizedFields?.map(category => !category.isSeparator && (
                                                            <div key={`${section.name}-${category.category}`} className="space-y-2">
                                                                <h4 className="text-xs font-medium pl-2 pb-1 border-b">
                                                                    {category.category}
                                                                </h4>
                                                                <div className="space-y-1 pl-4">
                                                                    {category.fields.map(field => (
                                                                        <div key={`${section.name}-${category.category}-${field.name}`}
                                                                            className="flex items-center justify-between space-x-2 py-1">
                                                                            <div className="flex items-center space-x-2">
                                                                                <Label htmlFor={`field-${section.name}-${category.category}-${field.name}`}
                                                                                    className="text-sm">
                                                                                    {field.label}
                                                                                </Label>
                                                                                <Badge variant="outline" className="text-[10px]">
                                                                                    {field.type || 'text'}
                                                                                </Badge>
                                                                            </div>
                                                                            <Switch
                                                                                id={`field-${section.name}-${category.category}-${field.name}`}
                                                                                checked={visibility.subcategories[`${section.name}-${category.category}-${field.name}`]}
                                                                                onCheckedChange={() => handleSubcategoryVisibilityChange(section.name, category.category, field.name)}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>


                        <TabsContent value="helpers" className="mt-0 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Calculation Helpers */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Calculation Helpers</CardTitle>
                                        <CardDescription className="text-xs">
                                            Statistical calculations for numeric columns
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {Object.entries(helperColumnConfigs.calculation).map(([id, config]) => (
                                            <div key={`calc-${id}`}
                                                className={cn(
                                                    "flex items-center justify-between space-x-2 p-2 rounded-md",
                                                    config.bgColor
                                                )}>
                                                <div className="space-y-1">
                                                    <Label htmlFor={`helper-calc-${id}`} className="text-sm font-medium">
                                                        {config.label}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {config.description}
                                                    </p>
                                                </div>
                                                <Switch
                                                    id={`helper-calc-${id}`}
                                                    checked={helperColumns.calculation[id]}
                                                    onCheckedChange={() => onHelperColumnChange('calculation', id)}
                                                />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Reference Helpers */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Reference Helpers</CardTitle>
                                        <CardDescription className="text-xs">
                                            Comparative and reference calculations
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {Object.entries(helperColumnConfigs.reference).map(([id, config]) => (
                                            <div key={`ref-${id}`}
                                                className={cn(
                                                    "flex items-center justify-between space-x-2 p-2 rounded-md",
                                                    config.bgColor
                                                )}>
                                                <div className="space-y-1">
                                                    <Label htmlFor={`helper-ref-${id}`} className="text-sm font-medium">
                                                        {config.label}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {config.description}
                                                    </p>
                                                </div>
                                                <Switch
                                                    id={`helper-ref-${id}`}
                                                    checked={helperColumns.reference[id]}
                                                    onCheckedChange={() => onHelperColumnChange('reference', id)}
                                                />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </div>
                </ScrollArea>
            </Tabs>


            {/* New Table Dialog */}
            <AlertDialog open={showNewTableDialog} onOpenChange={setShowNewTableDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Create New Table</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enter a name for the new table. It will be created with default columns (id, created_at, updated_at).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Input
                            value={newTableName}
                            onChange={(e) => setNewTableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="table_name"
                            className="mb-2"
                        />
                        <p className="text-sm text-gray-500">
                            Only lowercase letters, numbers, and underscores allowed
                        </p>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleCreateTable(newTableName)}
                            disabled={!newTableName || loadingTable}
                        >
                            {loadingTable ? 'Creating...' : 'Create Table'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={addFieldDialogOpen} onOpenChange={setAddFieldDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Add Field</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="new" onValueChange={(value) => setAddFieldState(prev => ({ ...prev, selectedTab: value }))}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="new">Add New Field</TabsTrigger>
                            <TabsTrigger value="existing">Add Existing Field</TabsTrigger>
                        </TabsList>

                        {/* New Field Tab */}
                        <div className={addFieldState.selectedTab === 'new' ? 'space-y-4 py-4' : 'hidden'}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Display Name</label>
                                <Input
                                    value={addFieldState.displayName}
                                    onChange={(e) => setAddFieldState(prev => ({ ...prev, displayName: e.target.value }))}
                                    placeholder="Enter display name"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Table</label>
                                <Select
                                    value={addFieldState.newFieldTable}
                                    onValueChange={(value) => setAddFieldState(prev => ({ ...prev, newFieldTable: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a table" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tables.filter(table => table?.trim()).map(table => (
                                            <SelectItem key={table} value={table}>
                                                {table}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Existing Fields Tab */}
                        <div className={addFieldState.selectedTab === 'existing' ? 'grid grid-cols-2 gap-4 py-4' : 'hidden'}>
                            {/* Tables Selection */}
                            <div className="border rounded-lg p-4">
                                <h4 className="font-medium mb-2">Select Tables</h4>
                                <ScrollArea className="h-[400px]">
                                    {tables.map(table => (
                                        <div key={table} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                id={`table-${table}`}
                                                checked={selectedTables.includes(table)}
                                                onChange={(e) => {
                                                    const newSelection = e.target.checked
                                                        ? [...selectedTables, table]
                                                        : selectedTables.filter(t => t !== table);
                                                    setSelectedTables(newSelection);

                                                }}
                                                className="h-4 w-4"
                                            />
                                            <label htmlFor={`table-${table}`}>{table}</label>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </div>

                            {/* Fields Selection */}
                            <div className="border rounded-lg p-4">
                                <h4 className="font-medium mb-2">Select Fields</h4>
                                <ScrollArea className="h-[400px]">
                                    {selectedTables.map((tableName) => {
                                        const tableFields = tableColumns.filter(col => col.table_name === tableName);
                                        return (
                                            <div key={tableName}>
                                                <div className="bg-gray-50 p-3 rounded-t-lg border-b-2 border-primary/20">
                                                    <h5 className="font-lg text-black">{tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h5>
                                                </div>
                                                <div className="p-2 mb-4 border-x border-b rounded-b-lg">
                                                    {tableFields.map(field => (
                                                        <div key={`${tableName}-${field.column_name}`} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                                                            <input
                                                                type="checkbox"
                                                                id={`field-${tableName}-${field.column_name}`}
                                                                checked={selectedTableFields[tableName]?.includes(field.column_name) || false}
                                                                onChange={(e) => {
                                                                    setSelectedTableFields(prev => ({
                                                                        ...prev,
                                                                        [tableName]: e.target.checked
                                                                            ? [...(prev[tableName] || []), field.column_name]
                                                                            : (prev[tableName] || []).filter(f => f !== field.column_name)
                                                                    }));
                                                                }}
                                                                className="h-4 w-4"
                                                            />
                                                            <label htmlFor={`field-${tableName}-${field.column_name}`}>
                                                                {field.column_name}
                                                                <span className="ml-2 text-xs text-gray-500">({field.data_type})</span>
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </ScrollArea>
                            </div>
                        </div>
                    </Tabs>

                    <DialogFooter>
                        <Button onClick={() => setAddFieldDialogOpen(false)} variant="outline">
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            if (addFieldState.selectedTab === 'new') {
                                handleAddNewField();
                            } else {
                                handleAddExistingFields();
                            }
                        }}>
                            Add Field{addFieldState.selectedTab === 'existing' && 's'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <MultiSelectDialog />
        </>
    );
}