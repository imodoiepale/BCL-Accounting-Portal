// components/overview/EditableCell.tsx
// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

interface EditableCellProps {
    value: any;
    onSave: (value: any) => void;
    refreshData?: () => Promise<void>;
    fieldName?: string;
    rowId?: number | string;
    companyName?: string;
    companyId?: number | string;
    className?: string;
    textClassName?: string;
    field?: any;
    activeMainTab?: string;
    activeSubTab?: string;
    disabled?: boolean;
    verificationStatus?: {
        is_verified: boolean;
        verified_at?: string;
        verified_by?: string;
    };
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
    textClassName = '',
    field,
    activeMainTab,
    activeSubTab,
    disabled,
    verificationStatus
}: EditableCellProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(initialValue);
    const [dropdownOptions, setDropdownOptions] = useState([]);
    const inputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const isDisabled = disabled || verificationStatus?.is_verified;

    useEffect(() => {
        setEditValue(initialValue);
    }, [initialValue]);

    const handleDoubleClick = () => {
        if (!isDisabled) {
            setIsEditing(true);
        }
    };

    const handleBlur = async () => {
        setIsEditing(false);
        if (editValue !== initialValue) {
            await onSave(editValue);
        }
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setIsEditing(false);
            if (editValue !== initialValue) {
                await onSave(editValue);
            }
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(initialValue);
        }
    };

    return (
        <div 
            className={`min-h-[24px] px-2 py-1 relative ${className}`}
            onDoubleClick={handleDoubleClick}
        >
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full p-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                />
            ) : (
                <div className={`cursor-pointer ${textClassName}`}>
                    {initialValue}
                </div>
            )}
            {isDisabled && (
                <div className="absolute top-0 right-0 p-1">
                    <Lock className="h-3 w-3 text-gray-400" />
                </div>
            )}
        </div>
    );
};