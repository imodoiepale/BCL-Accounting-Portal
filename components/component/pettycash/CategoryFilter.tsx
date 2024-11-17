// @ts-nocheck
// CategoryFilter.tsx
import React, { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { PettyCashService } from './PettyCashService';

interface Subcategory {
    name: string;
    description?: string;
}

interface ExpenseCategory {
    id: string;
    expense_category: string;
    subcategories: Subcategory[];  // Array of subcategory objects
    description?: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

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
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const categories = await PettyCashService.fetchExpenseCategories();
                console.log('Fetched categories:', categories);
                setExpenseCategories(categories.filter(cat => cat.is_active));
            } catch (error) {
                console.error('Error fetching expense categories:', error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load expense categories"
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const currentCategory = expenseCategories.find(cat => cat.expense_category === selectedCategory);

    if (isLoading) {
        return <div className="flex items-center gap-4">Loading categories...</div>;
    }

    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <div className="flex flex-col gap-1.5">
                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                    <SelectTrigger className="h-8 w-[200px]">
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Categories</SelectItem>
                        {expenseCategories.map((category) => (
                            <SelectItem
                                key={category.id}
                                value={category.expense_category}
                            >
                                {category.expense_category}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-1.5">
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
                            <SelectItem
                                key={subcategory.name}
                                value={subcategory.name}
                            >
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