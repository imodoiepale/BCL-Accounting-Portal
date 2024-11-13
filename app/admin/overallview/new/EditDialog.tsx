// EditDialog.tsx
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductData } from './types';
import { tableStructure } from './constants';
import { cn } from "@/lib/utils";

interface EditDialogProps {
    open: boolean;
    onClose: () => void;
    data: ProductData | null;
    onSave: (data: ProductData) => void;
}

export const EditDialog: React.FC<EditDialogProps> = ({
    open,
    onClose,
    data,
    onSave
}) => {
    const [formData, setFormData] = useState<ProductData | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Initialize form data when dialog opens
    useEffect(() => {
        if (data) {
            setFormData({
                companyName: data.companyName,
                manufacturingData: {
                    specifications: { ...data.manufacturingData.specifications },
                    production: { ...data.manufacturingData.production }
                },
                commercialData: {
                    costs: { ...data.commercialData.costs },
                    market: { ...data.commercialData.market }
                },
                qualityData: {
                    testing: { ...data.qualityData.testing },
                    metrics: { ...data.qualityData.metrics }
                }
            });
            setErrors({});
        }
    }, [data]);

    const handleChange = (section: string, category: string, field: string, value: any) => {
        if (!formData) return;

        setFormData(prev => {
            if (!prev) return null;

            const newData = { ...prev };
            if (section === 'manufacturingData' || section === 'commercialData' || section === 'qualityData') {
                if (!newData[section]) newData[section] = {} as any;
                if (!newData[section][category]) newData[section][category] = {} as any;
                newData[section][category][field] = value;
            } else if (section === 'companyName') {
                newData.companyName = value;
            }

            return newData;
        });

        // Clear error for this field if exists
        if (errors[`${section}.${category}.${field}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`${section}.${category}.${field}`];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData) {
            newErrors['general'] = 'Form data is missing';
            return false;
        }

        // Validate required fields and data types
        tableStructure.sections.forEach(section => {
            section.categories.forEach(category => {
                category.subcategories.forEach(subcategory => {
                    const value = formData[section.id]?.[category.id]?.[subcategory.id];

                    // Required field validation
                    if (value === undefined || value === null || value === '') {
                        newErrors[`${section.id}.${category.id}.${subcategory.id}`] = 'This field is required';
                    }

                    // Type validation
                    if (value !== undefined && value !== null && value !== '') {
                        switch (subcategory.type) {
                            case 'number':
                            case 'currency':
                            case 'percentage':
                                if (isNaN(Number(value))) {
                                    newErrors[`${section.id}.${category.id}.${subcategory.id}`] = 'Must be a valid number';
                                }
                                break;
                            case 'date':
                                if (!Date.parse(value)) {
                                    newErrors[`${section.id}.${category.id}.${subcategory.id}`] = 'Must be a valid date';
                                }
                                break;
                        }
                    }
                });
            });
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm() && formData) {
            onSave(formData);
            onClose();
        }
    };

    const renderField = (
        section: string,
        category: string,
        subcategory: { id: string; header: string; type: string }
    ) => {
        if (!formData?.[section]?.[category]) return null;

        const value = formData[section][category][subcategory.id];
        const error = errors[`${section}.${category}.${subcategory.id}`];

        const commonProps = {
            id: `${section}-${category}-${subcategory.id}`,
            className: cn(
                "w-full",
                error && "border-red-500 focus:ring-red-500"
            )
        };

        switch (subcategory.type) {
            case 'select':
                return (
                    <div className="space-y-2">
                        <Select
                            value={String(value)}
                            onValueChange={(newValue) => handleChange(section, category, subcategory.id, newValue)}
                        >
                            <SelectTrigger className={commonProps.className}>
                                <SelectValue placeholder={subcategory.header} />
                            </SelectTrigger>
                            <SelectContent>
                                {['Active', 'Inactive', 'Pending', 'Passed', 'Failed'].map(option => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                );

            case 'number':
            case 'currency':
            case 'percentage':
                return (
                    <div className="space-y-2">
                        <Input
                            type="number"
                            step={subcategory.type === 'percentage' ? '0.1' : '0.01'}
                            value={value ?? ''}
                            onChange={(e) => handleChange(section, category, subcategory.id,
                                e.target.value === '' ? '' : Number(e.target.value)
                            )}
                            {...commonProps}
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                );

            case 'date':
                return (
                    <div className="space-y-2">
                        <Input
                            type="date"
                            value={value ?? ''}
                            onChange={(e) => handleChange(section, category, subcategory.id, e.target.value)}
                            {...commonProps}
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                );

            default:
                return (
                    <div className="space-y-2">
                        <Input
                            type="text"
                            value={value ?? ''}
                            onChange={(e) => handleChange(section, category, subcategory.id, e.target.value)}
                            {...commonProps}
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                );
        }
    };

    if (!formData) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit Entry - {formData.companyName}</DialogTitle>
                    <DialogDescription>
                        Make changes to the entry below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[700px]">
                    <div className="space-y-6 pb-4">
                        {tableStructure.sections.map(section => (
                            <Card key={section.id} className={cn("border-t-4", section.borderColor)}>
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">
                                        {section.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {section.categories.map(category => (
                                        <div key={category.id} className="space-y-4">
                                            <h4 className={cn(
                                                "text-sm font-medium pb-2 border-b",
                                                category.borderColor
                                            )}>
                                                {category.title}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {category.subcategories.map(subcategory => (
                                                    <div key={subcategory.id} className="space-y-2">
                                                        <Label
                                                            htmlFor={`${section.id}-${category.id}-${subcategory.id}`}
                                                            className="text-sm text-muted-foreground"
                                                        >
                                                            {subcategory.header}
                                                        </Label>
                                                        {renderField(section.id, category.id, subcategory)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>

                {errors['general'] && (
                    <p className="text-sm text-red-500 mt-2">{errors['general']}</p>
                )}

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};