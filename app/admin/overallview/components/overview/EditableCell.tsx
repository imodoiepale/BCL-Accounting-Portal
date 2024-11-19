// components/overview/EditableCell.tsx
// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export const EditableCell = ({
    value: initialValue,
    onSave,
    fieldName,
    rowId,
    companyName,
    className,
    field,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(initialValue);
    const inputRef = useRef(null);

    useEffect(() => {
        setEditValue(initialValue);
    }, [initialValue]);

    const handleSave = async () => {
        if (editValue !== initialValue) {
            try {
                const today = new Date();
                let changedValues = { [fieldName]: editValue };
    
                // Handle different effective_to dates and their corresponding status updates
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
    
                if (fieldName in effectiveDateFields) {
                    const effectiveDate = new Date(editValue);
                    const { status, flag } = effectiveDateFields[fieldName];
                    changedValues[status] = effectiveDate > today ? 'Active' : 'Inactive';
                    changedValues[flag] = effectiveDate > today ? 'Yes' : 'No';
                }
    
                const { data: companyData, error: companyError } = await supabase
                    .from('acc_portal_company_duplicate')
                    .select('company_name')
                    .eq('company_name', companyName)
                    .single();
    
                if (companyError || !companyData) {
                    console.log(`Company not found in acc_portal_company_duplicate: ${companyName}`);
                    toast.error(`Company "${companyName}" not found.`);
                    return;
                }
    
                console.log(`Company found in acc_portal_company_duplicate: ${companyName}`);
    
                const tables = [
                    'acc_portal_company_duplicate',
                    'etims_companies_duplicate',
                    'PasswordChecker_duplicate',
                    'nssf_companies_duplicate',
                    'ecitizen_companies_duplicate',
                    'nhif_companies_duplicate2'
                ];
    
                let fieldFound = false;
    
                for (const table of tables) {
                    const { data, error } = await supabase
                        .from(table)
                        .select('*')
                        .eq(table === 'ecitizen_companies_duplicate' ? 'name' : 'company_name', companyName)
                        .single();
    
                    if (error || !data) {
                        console.log(`Field ${fieldName} not found in table: ${table}`);
                        continue;
                    }
    
                    if (data.hasOwnProperty(fieldName)) {
                        console.log(`Field ${fieldName} found in table: ${table}`);
                        const { error: updateError } = await supabase
                            .from(table)
                            .update(changedValues)
                            .eq(table === 'ecitizen_companies_duplicate' ? 'name' : 'company_name', companyName);
    
                        if (updateError) {
                            throw updateError;
                        }
    
                        console.log(`Updated field ${fieldName} in table: ${table}`);
                        setEditValue(editValue);
                        fieldFound = true;
                        onSave(editValue);
                        setIsEditing(false);
                        break;
                    }
                }
    
                if (!fieldFound) {
                    console.log(`Field ${fieldName} not found in any table.`);
                    toast.error(`Field "${fieldName}" not found in any table.`);
                }
            } catch (error) {
                console.error('Error during update operation:', error);
                toast.error('Update failed due to an unexpected error');
                setEditValue(initialValue);
            }
        } else {
            setIsEditing(false);
        }
    };
    

    const handleDoubleClick = () => {
        setIsEditing(true);
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

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (inputRef.current.select) { // Check if select() is a function
                inputRef.current.select();
            }
        }
    }, [isEditing]);

    if (isEditing) {
        if (field.type === 'select') {
            return (
                <select
                    ref={inputRef}
                    value={editValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`m-0 p-1 h-8 ${className}`}
                >
                    {field.options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            );
        } else {
            return (
                <input
                    ref={inputRef}
                    value={editValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`m-0 p-1 h-8 ${className}`}
                    type={field.type === 'date' ? 'date' : 'text'}
                />
            );
        }
    }

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

    return (
        <div
            onDoubleClick={handleDoubleClick}
            className={`cursor-pointer ${className}`}
        >
            {displayValue || <span className="text-red-500 font-semibold">Missing</span>}
        </div>
    );
};