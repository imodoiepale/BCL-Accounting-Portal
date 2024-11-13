// SettingsDialog.tsx
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { tableStructure, helperColumnConfigs } from './constants';
import { Badge } from "@/components/ui/badge";

interface SettingsDialogProps {
    open: boolean;
    onClose: () => void;
    visibility: {
        sections: Record<string, boolean>;
        categories: Record<string, boolean>;
        subcategories: Record<string, boolean>;
    };
    helperColumns: {
        calculation: Record<string, boolean>;
        reference: Record<string, boolean>;
        information: Record<string, boolean>;
    };
    onVisibilityChange: (type: string, id: string, value: boolean) => void;
    onHelperColumnChange: (type: string, id: string) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
    open,
    onClose,
    visibility,
    helperColumns,
    onVisibilityChange,
    onHelperColumnChange
}) => {
    const handleSectionVisibilityChange = (sectionId: string) => {
        const newValue = !visibility.sections[sectionId];
        onVisibilityChange('sections', sectionId, newValue);

        // Update all categories and subcategories under this section
        tableStructure.sections
            .find(s => s.id === sectionId)
            ?.categories.forEach(category => {
                const categoryId = `${sectionId}-${category.id}`;
                onVisibilityChange('categories', categoryId, newValue);

                category.subcategories.forEach(subcategory => {
                    const subcategoryId = `${sectionId}-${category.id}-${subcategory.id}`;
                    onVisibilityChange('subcategories', subcategoryId, newValue);
                });
            });
    };

    const handleCategoryVisibilityChange = (sectionId: string, categoryId: string) => {
        const fullCategoryId = `${sectionId}-${categoryId}`;
        const newValue = !visibility.categories[fullCategoryId];
        onVisibilityChange('categories', fullCategoryId, newValue);

        // Update all subcategories under this category
        const category = tableStructure.sections
            .find(s => s.id === sectionId)
            ?.categories.find(c => c.id === categoryId);

        category?.subcategories.forEach(subcategory => {
            const subcategoryId = `${sectionId}-${categoryId}-${subcategory.id}`;
            onVisibilityChange('subcategories', subcategoryId, newValue);
        });

        // Check if any categories are visible in this section
        const hasVisibleCategories = tableStructure.sections
            .find(s => s.id === sectionId)
            ?.categories.some(c => visibility.categories[`${sectionId}-${c.id}`]);

        if (!hasVisibleCategories) {
            onVisibilityChange('sections', sectionId, false);
        }
    };

    const handleSubcategoryVisibilityChange = (sectionId: string, categoryId: string, subcategoryId: string) => {
        const fullSubcategoryId = `${sectionId}-${categoryId}-${subcategoryId}`;
        const newValue = !visibility.subcategories[fullSubcategoryId];
        onVisibilityChange('subcategories', fullSubcategoryId, newValue);

        // Check if any subcategories are visible in this category
        const hasVisibleSubcategories = tableStructure.sections
            .find(s => s.id === sectionId)
            ?.categories.find(c => c.id === categoryId)
            ?.subcategories.some(sub =>
                visibility.subcategories[`${sectionId}-${categoryId}-${sub.id}`]
            );

        if (!hasVisibleSubcategories) {
            onVisibilityChange('categories', `${sectionId}-${categoryId}`, false);

            // Check if any categories are visible in this section
            const hasVisibleCategories = tableStructure.sections
                .find(s => s.id === sectionId)
                ?.categories.some(c => visibility.categories[`${sectionId}-${c.id}`]);

            if (!hasVisibleCategories) {
                onVisibilityChange('sections', sectionId, false);
            }
        }
    };

    const renderVisibilityTabs = () => (
        <div className="grid grid-cols-3 gap-4">
            {/* Sections Column */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Sections</CardTitle>
                    <CardDescription className="text-xs">
                        Toggle main section visibility
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {tableStructure.sections.map(section => (
                        <div key={section.id}
                            className={cn(
                                "flex items-center justify-between space-x-2 p-2 rounded-md",
                                section.bgColor.replace('700', '50')
                            )}>
                            <div className="space-y-1">
                                <Label htmlFor={`section-${section.id}`}
                                    className="text-sm font-medium">
                                    {section.title}
                                </Label>
                                <Badge variant="secondary" className="text-xs">
                                    {section.categories.length} categories
                                </Badge>
                            </div>
                            <Switch
                                id={`section-${section.id}`}
                                checked={visibility.sections[section.id]}
                                onCheckedChange={() => handleSectionVisibilityChange(section.id)}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Categories Column */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Categories</CardTitle>
                    <CardDescription className="text-xs">
                        Manage category visibility by section
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-6">
                            {tableStructure.sections.map(section => (
                                <div key={section.id} className="space-y-3">
                                    <h3 className={cn(
                                        "text-xs font-semibold px-2 py-1 rounded-md",
                                        section.bgColor.replace('700', '100'),
                                        section.headerTextColor.replace('white', 'gray-800')
                                    )}>
                                        {section.title}
                                    </h3>
                                    <div className="space-y-2 pl-2">
                                        {section.categories.map(category => (
                                            <div key={`${section.id}-${category.id}`}
                                                className={cn(
                                                    "flex items-center justify-between space-x-2 p-2 rounded-md",
                                                    category.bgColor
                                                )}>
                                                <Label htmlFor={`category-${section.id}-${category.id}`}
                                                    className="text-sm">
                                                    {category.title}
                                                </Label>
                                                <Switch
                                                    id={`category-${section.id}-${category.id}`}
                                                    checked={visibility.categories[`${section.id}-${category.id}`]}
                                                    onCheckedChange={() => handleCategoryVisibilityChange(section.id, category.id)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Subcategories Column */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Subcategories</CardTitle>
                    <CardDescription className="text-xs">
                        Configure individual column visibility
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-6">
                            {tableStructure.sections.map(section => (
                                <div key={section.id} className="space-y-4">
                                    <h3 className={cn(
                                        "text-xs font-semibold px-2 py-1 rounded-md",
                                        section.bgColor.replace('700', '100'),
                                        section.headerTextColor.replace('white', 'gray-800')
                                    )}>
                                        {section.title}
                                    </h3>
                                    {section.categories.map(category => (
                                        <div key={`${section.id}-${category.id}`} className="space-y-2">
                                            <h4 className={cn(
                                                "text-xs font-medium pl-2 pb-1 border-b",
                                                category.bgColor
                                            )}>
                                                {category.title}
                                            </h4>
                                            <div className="space-y-1 pl-4">
                                                {category.subcategories.map(subcategory => (
                                                    <div key={`${section.id}-${category.id}-${subcategory.id}`}
                                                        className="flex items-center justify-between space-x-2 py-1">
                                                        <div className="flex items-center space-x-2">
                                                            <Label htmlFor={`subcategory-${section.id}-${category.id}-${subcategory.id}`}
                                                                className="text-sm">
                                                                {subcategory.header}
                                                            </Label>
                                                            <Badge variant="outline" className="text-[10px]">
                                                                {subcategory.type}
                                                            </Badge>
                                                        </div>
                                                        <Switch
                                                            id={`subcategory-${section.id}-${category.id}-${subcategory.id}`}
                                                            checked={visibility.subcategories[`${section.id}-${category.id}-${subcategory.id}`]}
                                                            onCheckedChange={() => handleSubcategoryVisibilityChange(section.id, category.id, subcategory.id)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );

    const renderHelperColumnsTabs = () => (
        <div className="grid grid-cols-2 gap-4">
            {/* Calculation Helpers */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Calculation Helpers</CardTitle>
                    <CardDescription className="text-xs">
                        Statistical calculations for numeric columns
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(helperColumnConfigs.calculation).map(([id, config]) => (
                        <div key={`calc-${id}`}
                            className={cn(
                                "flex items-center justify-between space-x-2 p-2 rounded-md",
                                config.bgColor
                            )}>
                            <div className="space-y-1">
                                <Label htmlFor={`helper-calc-${id}`} className="text-sm font-medium">
                                    {config.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {config.description}
                                </p>
                            </div>
                            <Switch
                                id={`helper-calc-${id}`}
                                checked={helperColumns.calculation[id]}
                                onCheckedChange={() => onHelperColumnChange('calculation', id)}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Reference Helpers */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Reference Helpers</CardTitle>
                    <CardDescription className="text-xs">
                        Comparative and reference calculations
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(helperColumnConfigs.reference).map(([id, config]) => (
                        <div key={`ref-${id}`}
                            className={cn(
                                "flex items-center justify-between space-x-2 p-2 rounded-md",
                                config.bgColor
                            )}>
                            <div className="space-y-1">
                                <Label htmlFor={`helper-ref-${id}`} className="text-sm font-medium">
                                    {config.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {config.description}
                                </p>
                            </div>
                            <Switch
                                id={`helper-ref-${id}`}
                                checked={helperColumns.reference[id]}
                                onCheckedChange={() => onHelperColumnChange('reference', id)}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Table Settings</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="visibility" className="flex-1">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="visibility">Column Visibility</TabsTrigger>
                        <TabsTrigger value="helpers">Helper Columns</TabsTrigger>
                    </TabsList>

                    <ScrollArea className="flex-1 mt-4">
                        <div className="px-1 py-2">
                            <TabsContent value="visibility" className="mt-0 space-y-4">
                                {renderVisibilityTabs()}
                            </TabsContent>

                            <TabsContent value="helpers" className="mt-0 space-y-4">
                                {renderHelperColumnsTabs()}
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};