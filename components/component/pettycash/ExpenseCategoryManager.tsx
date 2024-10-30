// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Search, Edit2, Trash2, Grid, List, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PettyCashService } from './PettyCashService';

interface Subcategory {
    id?: string;
    name: string;
    description: string;
}

interface ExpenseCategory {
    id: string;
    expense_category: string;
    subcategories: string;
    description: string;
    created_at: string;
    is_active: boolean;
}


interface CategoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<ExpenseCategory>) => Promise<void>;
    category?: ExpenseCategory;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({
    isOpen,
    onClose,
    onSave,
    category
}) => {
    const [formData, setFormData] = useState<Partial<ExpenseCategory>>({
        expense_category: '',
        subcategories: [{ name: '', description: '' }]
    });

    useEffect(() => {
        if (category) {
            setFormData(category);
        } else {
            setFormData({
                expense_category: '',
                subcategories: [{ name: '', description: '' }]
            });
        }
    }, [category]);

    const handleAddSubcategory = () => {
        setFormData(prev => ({
            ...prev,
            subcategories: [...(prev.subcategories || []), { name: '', description: '' }]
        }));
    };

    const handleRemoveSubcategory = (index: number) => {
        setFormData(prev => ({
            ...prev,
            subcategories: prev.subcategories?.filter((_, i) => i !== index)
        }));
    };

    const handleSubcategoryChange = (index: number, field: keyof Subcategory, value: string) => {
        setFormData(prev => ({
            ...prev,
            subcategories: prev.subcategories?.map((sub, i) =>
                i === index ? { ...sub, [field]: value } : sub
            )
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate main category
        if (!formData.expense_category?.trim()) {
            toast.error('Main category name is required');
            return;
        }

        // Validate subcategories
        const validSubcategories = formData.subcategories?.filter(sub => sub.name.trim());
        if (!validSubcategories?.length) {
            toast.error('At least one subcategory with a name is required');
            return;
        }

        try {
            // Just pass the category data, PettyCashService will handle the userId
            await onSave({
                expense_category: formData.expense_category,
                subcategories: validSubcategories
            });
            onClose();
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error('Failed to save category');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>{category ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="expense_category">Main Category Name *</Label>
                        <Input
                            id="expense_category"
                            value={formData.expense_category}
                            onChange={(e) => setFormData(prev => ({ ...prev, expense_category: e.target.value }))}
                            required
                            className="font-medium"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Subcategories *</Label>
                            <Button
                                type="button"
                                onClick={handleAddSubcategory}
                                variant="outline"
                                size="sm"
                            >
                                <Plus className="h-4 w-4 mr-1" /> Add Subcategory
                            </Button>
                        </div>

                        {formData.subcategories?.map((subcategory, index) => (
                            <Card key={index} className="p-4">
                                <div className="grid gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Subcategory Name *</Label>
                                                <Input
                                                    value={subcategory.name}
                                                    onChange={(e) => handleSubcategoryChange(index, 'name', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Description</Label>
                                                <Input
                                                    value={subcategory.description}
                                                    onChange={(e) => handleSubcategoryChange(index, 'description', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        {formData.subcategories.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveSubcategory(index)}
                                                className="ml-2 text-red-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {category ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export function ExpenseCategoryManager() {
    const { userId } = useAuth();
    const [view, setView] = useState<'table' | 'grid'>('table');
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        category?: ExpenseCategory;
    }>({
        isOpen: false
    });

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const data = await PettyCashService.fetchExpenseCategories(userId);
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to fetch categories');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [userId]);

    const handleSaveCategory = async (data: Partial<ExpenseCategory>) => {
        try {
            if (dialogState.category) {
                await PettyCashService.updateExpenseCategory(dialogState.category.id, data);
                toast.success('Category updated successfully');
            } else {
                // Remove userId from submission, let PettyCashService handle it
                await PettyCashService.createExpenseCategory({
                    expense_category: data.expense_category,
                    subcategories: data.subcategories
                });
                toast.success('Category created successfully');
            }
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error('Failed to save category');
        }
    };

    const handleDeleteCategory = async (category: ExpenseCategory) => {
        try {
            await PettyCashService.deleteExpenseCategory(category.id);
            toast.success('Category deleted successfully');
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        }
    };

    const filteredCategories = categories.filter(category =>
        category.expense_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.subcategories.some(sub =>
            sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 w-64"
                        />
                    </div>
                    <Tabs value={view} onValueChange={(v) => setView(v as 'table' | 'grid')}>
                        <TabsList>
                            <TabsTrigger value="table">
                                <List className="h-4 w-4 mr-1" />
                                Table View
                            </TabsTrigger>
                            <TabsTrigger value="grid">
                                <Grid className="h-4 w-4 mr-1" />
                                Card View
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="table" className="m-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Expense Categories</CardTitle>
                                    <CardDescription>
                                        Manage your expense categories and their subcategories
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[600px]">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[200px]">Main Category</TableHead>
                                                    <TableHead>Subcategories</TableHead>
                                                    <TableHead className="w-[100px]">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredCategories.map((category) => (
                                                    <TableRow key={category.id}>
                                                        <TableCell className="font-medium">
                                                            {category.expense_category}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-2">
                                                                {category.subcategories.map((sub, index) => (
                                                                    <div key={index} className="flex justify-between items-start border-b last:border-0 pb-2">
                                                                        <div>
                                                                            <div className="font-medium">{sub.name}</div>
                                                                            {sub.description && (
                                                                                <div className="text-sm text-gray-500">{sub.description}</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setDialogState({ isOpen: true, category })}
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteCategory(category)}
                                                                    className="text-red-600"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="grid" className="m-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredCategories.map((category) => (
                                    <Card key={category.id} className="relative">
                                        <CardHeader>
                                            <CardTitle className="text-lg">{category.expense_category}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {category.subcategories.map((sub, index) => (
                                                    <div key={index} className="border-b last:border-0 pb-2">
                                                        <div className="font-medium">{sub.name}</div>
                                                        {sub.description && (
                                                            <div className="text-sm text-gray-500">{sub.description}</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDialogState({ isOpen: true, category })}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteCategory(category)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                    </Tabs>
                </div>
                <Button onClick={() => setDialogState({ isOpen: true })} className="bg-blue-600">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add Category
                </Button>
            </div>



            <CategoryDialog
                isOpen={dialogState.isOpen}
                onClose={() => setDialogState({ isOpen: false })}
                onSave={handleSaveCategory}
                category={dialogState.category}
            />
        </div>
    );
}

export default ExpenseCategoryManager;