// @ts-nocheck
// components/SupplierForm.tsx

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { SupplierData, SUPPLIER_TYPES, TRADING_TYPES, DEFAULT_SUPPLIER_DATA } from './supplier';

interface SupplierFormProps {
    onSubmit: (data: SupplierData) => void;
    initialData?: SupplierData | null;
    mode?: 'create' | 'edit';
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
    onSubmit,
    initialData = null,
    mode = 'create'
}) => {
    const [formData, setFormData] = useState<SupplierData>({
        ...DEFAULT_SUPPLIER_DATA,
        ...(initialData || {})
    });

    // Reset PIN or ID Number when supplier type changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            pin: prev.supplierType === 'Corporate' ? prev.pin : null,
            idNumber: prev.supplierType === 'Individual' ? prev.idNumber : null
        }));
    }, [formData.supplierType]);

    const handleChange = (field: keyof SupplierData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Ensure the unused field is null
        const submissionData = {
            ...formData,
            pin: formData.supplierType === 'Corporate' ? formData.pin : null,
            idNumber: formData.supplierType === 'Individual' ? formData.idNumber : null
        };
        onSubmit(submissionData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="supplierName">Supplier Name *</Label>
                <Input
                    id="supplierName"
                    value={formData.supplierName}
                    onChange={(e) => handleChange('supplierName', e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="supplierType">Supplier Type *</Label>
                <Select
                    value={formData.supplierType}
                    onValueChange={(value: 'Corporate' | 'Individual') => {
                        setFormData(prev => ({
                            ...prev,
                            supplierType: value,
                            pin: value === 'Corporate' ? '' : null,
                            idNumber: value === 'Individual' ? '' : null
                        }));
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        {SUPPLIER_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Dynamic PIN/ID Number field */}
            {formData.supplierType === 'Corporate' ? (
                <div className="space-y-2">
                    <Label htmlFor="pin">PIN *</Label>
                    <Input
                        id="pin"
                        value={formData.pin || ''}
                        onChange={(e) => handleChange('pin', e.target.value)}
                        required
                        placeholder="e.g., A123456789P"
                    />
                </div>
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number *</Label>
                    <Input
                        id="idNumber"
                        value={formData.idNumber || ''}
                        onChange={(e) => handleChange('idNumber', e.target.value)}
                        required
                        placeholder="Enter ID number"
                    />
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="mobile">Mobile *</Label>
                <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => handleChange('mobile', e.target.value)}
                    required
                    placeholder="+254XXXXXXXXX"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    placeholder="example@email.com"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="tradingType">Supplier Trading Type *</Label>
                <Select
                    value={formData.tradingType}
                    onValueChange={(value) => handleChange('tradingType', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select trading type" />
                    </SelectTrigger>
                    <SelectContent>
                        {TRADING_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <DialogFooter>
                <Button type="submit" className="bg-blue-600 text-white">
                    {mode === 'create' ? 'Add Supplier' : 'Update Supplier'}
                </Button>
            </DialogFooter>
        </form>
    );
};

export default SupplierForm;