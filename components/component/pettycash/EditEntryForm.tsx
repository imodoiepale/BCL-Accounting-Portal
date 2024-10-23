// components/EditEntryForm.tsx
// @ts-nocheck
// EditEntryForm.tsx
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "@/components/ui/select";
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { CategoryFilter } from './CategoryFilter';
import { PettyCashService } from './PettyCashService';

interface EditEntryFormProps {
    entry: any;
    onClose: () => void;
    onSubmit: (entry: any) => Promise<void>;
    branches?: { id: string; branch_name: string; }[];
    users?: { id: string; name: string; }[];
}

export const EditEntryForm: React.FC<EditEntryFormProps> = ({
    entry,
    onClose,
    onSubmit,
    branches = [],
    users = []
}) => {
    const [editedEntry, setEditedEntry] = useState(entry);
    const [selectedCategory, setSelectedCategory] = useState(entry?.category_code || 'ALL');
    const [selectedSubcategory, setSelectedSubcategory] = useState(entry?.subcategory_code || 'ALL');
    const [fileUpload, setFileUpload] = useState<File | null>(null);

    useEffect(() => {
        setEditedEntry(entry);
        setSelectedCategory(entry?.category_code || 'ALL');
        setSelectedSubcategory(entry?.subcategory_code || 'ALL');
    }, [entry]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const updatedEntry = {
            ...editedEntry,
            category_code: selectedCategory === 'ALL' ? '' : selectedCategory,
            subcategory_code: selectedSubcategory === 'ALL' ? '' : selectedSubcategory,
            is_verified: Boolean(editedEntry.approved_by)
        };

        try {
            if (fileUpload) {
                const uploadPath = `receipts/${editedEntry.id}/${fileUpload.name}`;
                const receiptUrl = await PettyCashService.uploadReceipt(fileUpload, uploadPath);
                updatedEntry.receipt_url = receiptUrl;
            }

            await onSubmit(updatedEntry);
            onClose();
        } catch (error) {
            console.error('Error updating entry:', error);
            toast.error('Failed to update entry');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setEditedEntry(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setEditedEntry(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formFields = [
        { id: 'amount', label: 'Amount (KES)', type: 'number', step: '0.01', required: true },
        { id: 'invoice_date', label: 'Invoice Date', type: 'date', required: true },
        { id: 'description', label: 'Description', type: 'text', required: true },
        { id: 'checked_by', label: 'Checked By', type: 'text' },
        { id: 'approved_by', label: 'Approved By', type: 'text' },
        { id: 'receipt', label: 'Receipt', type: 'file', accept: 'image/*', special: 'fileUpload' }
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {formFields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input
                        id={field.id}
                        name={field.id}
                        type={field.type}
                        step={field.step}
                        accept={field.accept}
                        value={field.special ? undefined : editedEntry[field.id] || ''}
                        onChange={field.special === 'fileUpload' 
                            ? (e) => setFileUpload(e.target.files?.[0] || null)
                            : handleInputChange}
                        className="h-8"
                        required={field.required}
                    />
                </div>
            ))}

            {branches.length > 0 && (
                <div className="space-y-1.5">
                    <Label htmlFor="branch_id">Branch</Label>
                    <Select
                        value={editedEntry.branch_id?.toString()}
                        onValueChange={(value) => handleSelectChange('branch_id', value)}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                            {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id.toString()}>
                                    {branch.branch_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {users.length > 0 && (
                <div className="space-y-1.5">
                    <Label htmlFor="user_id">User</Label>
                    <Select
                        value={editedEntry.user_id?.toString()}
                        onValueChange={(value) => handleSelectChange('user_id', value)}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <CategoryFilter
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
                onCategoryChange={setSelectedCategory}
                onSubcategoryChange={setSelectedSubcategory}
            />

            {editedEntry.receipt_url && (
                <div className="relative h-40 w-full">
                    <Image
                        src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${editedEntry.receipt_url}`}
                        alt="Current receipt"
                        fill
                        style={{ objectFit: 'contain' }}
                    />
                </div>
            )}

            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="h-8"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="h-8 bg-blue-600 text-white"
                >
                    Save Changes
                </Button>
            </DialogFooter>
        </form>
    );
};

export default EditEntryForm;