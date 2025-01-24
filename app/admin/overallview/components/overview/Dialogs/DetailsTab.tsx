"use client";

import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface DetailsTabProps {
    structure: any;
    onUpdate: (updatedStructure: any) => void;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({ structure, onUpdate }) => {
    const [tables, setTables] = useState<any[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [fields, setFields] = useState<any[]>([]);
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchTables();
    }, []);

    useEffect(() => {
        if (selectedTable) {
            fetchFields(selectedTable);
        }
    }, [selectedTable]);

    const fetchTables = async () => {
        console.log('Fetching tables...');
        try {
            const { data, error } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public');

            if (error) throw error;
            console.log('Fetched tables:', data);
            setTables(data.map(t => t.table_name));
        } catch (error) {
            console.error('Error fetching tables:', error);
        }
    };

    const fetchFields = async (tableName: string) => {
        console.log('Fetching fields for table:', tableName);
        try {
            const { data, error } = await supabase
                .from('information_schema.columns')
                .select('column_name')
                .eq('table_schema', 'public')
                .eq('table_name', tableName);

            if (error) throw error;
            console.log('Fetched fields:', data);
            setFields(data.map(f => f.column_name));
        } catch (error) {
            console.error('Error fetching fields:', error);
        }
    };

    const handleFieldSelect = (field: string) => {
        setSelectedFields(prev => {
            const isSelected = prev.includes(field);
            if (isSelected) {
                return prev.filter(f => f !== field);
            } else {
                return [...prev, field];
            }
        });
    };

    const handleApplySelection = () => {
        const newFields = selectedFields.map(field => ({
            name: field,
            table: selectedTable,
            column: field,
            display: field.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')
        }));

        const updatedStructure = {
            ...structure,
            sections: structure.sections.map((section: any) => ({
                ...section,
                subsections: section.subsections.map((subsection: any) => ({
                    ...subsection,
                    fields: [...(subsection.fields || []), ...newFields]
                }))
            }))
        };

        console.log('Updating structure with new fields:', updatedStructure);
        onUpdate(updatedStructure);
    };

    return (
        <div className="space-y-4 p-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Select Table</label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                        >
                            {selectedTable || "Select a table..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                        <Command>
                            <CommandInput placeholder="Search tables..." />
                            <CommandEmpty>No table found.</CommandEmpty>
                            <CommandGroup>
                                <ScrollArea className="h-72">
                                    {tables.map((table) => (
                                        <CommandItem
                                            key={table}
                                            onSelect={() => {
                                                setSelectedTable(table);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedTable === table ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {table}
                                        </CommandItem>
                                    ))}
                                </ScrollArea>
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {selectedTable && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">Select Fields</label>
                    <ScrollArea className="h-72 w-full border rounded-md p-4">
                        <div className="space-y-2">
                            {fields.map((field) => (
                                <div key={field} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={field}
                                        checked={selectedFields.includes(field)}
                                        onCheckedChange={() => handleFieldSelect(field)}
                                    />
                                    <label
                                        htmlFor={field}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {field}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}

            <div className="flex justify-end space-x-2">
                <Button
                    variant="outline"
                    onClick={() => {
                        setSelectedTable('');
                        setSelectedFields([]);
                    }}
                >
                    Clear Selection
                </Button>
                <Button
                    disabled={!selectedTable || selectedFields.length === 0}
                    onClick={handleApplySelection}
                >
                    Apply Selection
                </Button>
            </div>
        </div>
    );
};

export default DetailsTab;
