// components/overview/EditableCell.tsx
// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
interface EditableCellProps {
    value: any;
    onSave: (value: any) => void;
    refreshData: () => Promise<void>; 
    fieldName: string;
    rowId?: number | string;
    companyName?: string;
    companyId?: number | string; // Add this line
    className?: string;
    field: any;
    activeMainTab: string;
    activeSubTab: string;
}
export const EditableCell = ({
    value: initialValue,
    onSave,
    refreshData, 
    fieldName,
    rowId,
    companyName,
    companyId,
    className,
    field,
    activeMainTab,
    activeSubTab,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(initialValue);
    const [dropdownOptions, setDropdownOptions] = useState([]);
    const inputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setEditValue(initialValue);
    }, [initialValue]);
    
    const fetchDropdownOptions = async () => {
        try {
            console.log('Fetching dropdown options for:', fieldName);
            const [tableName, columnName] = fieldName.split('.');
            
            const { data, error } = await supabase
                .from('profile_category_table_mapping_2')
                .select('*');
    
            if (error) throw error;
    
            // Find all relevant structures
            const matchingStructures = data.filter(item => 
                item.structure?.sections?.some(section =>
                    section.subsections?.some(subsection =>
                        subsection.fields?.some(field =>
                            field.table === tableName && 
                            field.name === columnName
                        )
                    )
                )
            );
    
            // Get the field with dropdown options
            for (const structure of matchingStructures) {
                const field = structure.structure.sections
                    .flatMap(section => section.subsections)
                    .flatMap(subsection => subsection.fields)
                    .find(field => 
                        field.table === tableName && 
                        field.name === columnName
                    );
    
                if (field?.dropdownOptions?.length > 0) {
                    console.log('Found dropdown options:', field.dropdownOptions);
                    setDropdownOptions(field.dropdownOptions);
                    return;
                }
            }
    
            setDropdownOptions([]);
    
        } catch (error) {
            console.error('Error in fetchDropdownOptions:', error);
            setDropdownOptions([]);
        }
    };
    
    
    // Helper function to parse table names
    const parseTableNames = (mappings) => {
        return mappings.reduce((acc, mapping) => {
            try {
                // Parse the JSON string if it's a string and ensure it's not null/undefined
                const tableData = mapping.table_names ? (
                    typeof mapping.table_names === 'string'
                        ? JSON.parse(mapping.table_names)
                        : mapping.table_names
                ) : {};
                // Extract table names from all categories if tableData exists
                if (tableData && typeof tableData === 'object') {
                    Object.values(tableData).forEach(tables => {
                        if (Array.isArray(tables)) {
                            acc.push(...tables);
                        }
                    });
                }
            } catch (error) {
                console.error('Error parsing table names:', error);
            }
            return acc;
        }, []);
    };

    const handleSave = async () => {
        if (editValue !== initialValue) {
            try {
                const today = new Date();
                const [tableName, columnName] = fieldName.split('.');
                let changedValues = { [columnName]: editValue };
    
                // Define effective date fields and their corresponding status/flag fields
                const effectiveDateFields = {
                    'acc_client_effective_to': {
                        status: 'acc_client_status',
                        flag: 'acc_client'
                    },
                    'audit_tax_client_effective_to': {
                        status: 'audit_tax_client_status',
                        flag: 'audit_tax_client'
                    },
                    'imm_client_effective_to': {
                        status: 'imm_client_status',
                        flag: 'imm_client'
                    },
                    'cps_sheria_client_effective_to': {
                        status: 'cps_sheria_client_status',
                        flag: 'cps_sheria_client'
                    }
                };
                
                // Check if current field is an effective date field
                if (columnName in effectiveDateFields) {
                    const effectiveDate = new Date(editValue);
                    const { status, flag } = effectiveDateFields[columnName];
                    
                    // Update status and flag based on date comparison
                    changedValues[status] = effectiveDate >= today ? 'Active' : 'Inactive';
                    changedValues[flag] = effectiveDate >= today ? 'Yes' : 'No';
                }
    
                const { error: updateError } = await supabase
                    .from(tableName)
                    .update(changedValues)
                    .eq('id', rowId);
    
                if (updateError) throw updateError;
    
                setEditValue(editValue);
                onSave(editValue);
                await refreshData();
                setIsEditing(false);
                toast.success('Updated successfully');
            } catch (error) {
                console.error('Error during update operation:', error);
                toast.error('Update failed');
                setEditValue(initialValue);
            }
        } else {
            setIsEditing(false);
        }
    };
    

    const handleDoubleClick = async () => {
        console.log('Double clicked field:', fieldName);
        await fetchDropdownOptions();
        setIsEditing(true);
        console.log('Available dropdown options:', dropdownOptions);
    };

    const handleBlur = () => {
        handleSave();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        }
        if (e.key === 'Escape') {
            setEditValue(initialValue);
            setIsEditing(false);
        }
    };

    const handleChange = (e) => {
        let newValue = e.target.value;

        // Add null check when accessing field.type
        if (field?.type === 'number') {
            newValue = !isNaN(parseFloat(newValue)) ? parseFloat(newValue) : newValue;
        } else if (field?.type === 'boolean') {
            newValue = newValue.toLowerCase() === 'true' || newValue.toLowerCase() === 'yes';
        } else if (field?.type === 'date') {
            newValue = newValue;
        } else if (field?.type === 'select') {
            newValue = e.target.value; // Handle select value change
        }

        setEditValue(newValue);
    };

    const getCompanyPrefix = (fullName) => {
        if (!fullName) return '';
        const words = fullName.split(' ');
        // return words.map(word => word[0]).join('').toUpperCase();
        return words[0];
    };

    let displayValue = editValue;
    if (field.type === 'boolean') {
        displayValue = editValue ? 'Yes' : 'No';
    } else if (field.type === 'date' && editValue) {
        try {
            displayValue = new Date(editValue).toLocaleDateString();
        } catch (e) {
            displayValue = editValue;
        }
    }

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (inputRef.current.select) { // Check if select() is a function
                inputRef.current.select();
            }
        }
    }, [isEditing]);

    if (isEditing) {
        // Check if this field has dropdown options
        if (dropdownOptions && dropdownOptions.length > 0) {
            console.log('Rendering dropdown with options:', dropdownOptions);
            return (
                <select
                    ref={inputRef}
                    value={editValue || ''}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    className={`w-full p-2 border rounded ${className}`}
                >
                    <option value="">Select {field.label}</option>
                    {dropdownOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            );
        } else {
            // Regular input field for non-dropdown fields
            return (
                <input
                    ref={inputRef}
                    value={editValue || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`m-0 p-1 h-8 ${className}`}
                    type={field.type === 'date' ? 'date' : 'text'}
                />
            );
        }
    }

    if (isEditing && dropdownOptions && dropdownOptions.length > 0) {
        return (
            <select
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                className={`w-full p-2 border rounded ${className}`}
            >
                <option value="">Select {field.label}</option>
                {dropdownOptions.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        );
    }

    const renderValue = () => {
        if (fieldName === 'acc_portal_company_duplicate.company_name') {
            return (
                <div className="group relative">
                    <span>{getCompanyPrefix(editValue)}</span>
                    <div className="absolute hidden group-hover:block bg-gray-800 text-white p-2 rounded-md text-sm z-50 min-w-max">
                        {editValue}
                    </div>
                </div>
            );
        }
        return editValue || <span className="text-red-500 font-semibold">Missing</span>;
    };
    if (isLoading) {
        return <div className="p-2">Loading...</div>;
    }
    return (
        <div
            onDoubleClick={handleDoubleClick}
            className={`cursor-pointer ${className}`}
            title={editValue} // Add tooltip for full value
        >
            {renderValue()}
        </div>
    );
};