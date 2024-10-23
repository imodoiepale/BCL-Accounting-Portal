// CategoryFilter.tsx
import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EXPENSE_CATEGORIES } from './expenseCategories';

interface CategoryFilterProps {
    selectedCategory: string;
    selectedSubcategory: string;
    onCategoryChange: (value: string) => void;
    onSubcategoryChange: (value: string) => void;
    className?: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
    selectedCategory,
    selectedSubcategory,
    onCategoryChange,
    onSubcategoryChange,
    className
}) => {
    const currentCategory = EXPENSE_CATEGORIES.find(cat => cat.code === selectedCategory);

    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                    <SelectTrigger className="h-8 w-[200px]">
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Categories</SelectItem>
                        {EXPENSE_CATEGORIES.map((category) => (
                            <SelectItem key={category.code} value={category.code}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Subcategory</Label>
                <Select
                    value={selectedSubcategory}
                    onValueChange={onSubcategoryChange}
                    disabled={!selectedCategory || selectedCategory === 'ALL'}
                >
                    <SelectTrigger className="h-8 w-[200px]">
                        <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Subcategories</SelectItem>
                        {currentCategory?.subcategories.map((subcategory) => (
                            <SelectItem key={subcategory.code} value={subcategory.code}>
                                {subcategory.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default CategoryFilter;