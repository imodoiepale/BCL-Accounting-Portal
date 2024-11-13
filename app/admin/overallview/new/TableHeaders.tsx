// TableHeaders.tsx
import React from 'react';
import {
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Section, SortConfig } from './types';
import { helperColumnConfigs } from './constants';

interface TableHeadersProps {
    sections: Section[];
    sortConfig: SortConfig;
    onSort: (key: string) => void;
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
}

export const TableHeaders: React.FC<TableHeadersProps> = ({
    sections,
    sortConfig,
    onSort,
    visibility,
    helperColumns
}) => {
    const renderSortIcon = (key: string) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? (
            <ArrowUpIcon className="ml-2 h-4 w-4 inline" />
        ) : (
            <ArrowDownIcon className="ml-2 h-4 w-4 inline" />
        );
    };

    // Helper functions to calculate visibility and colspans
    const getVisibleSubcategoriesCount = (sectionId: string, categoryId: string) => {
        const section = sections.find(s => s.id === sectionId);
        const category = section?.categories.find(c => c.id === categoryId);
        if (!section || !category) return 0;

        return category.subcategories.filter(sub =>
            visibility.subcategories[`${sectionId}-${categoryId}-${sub.id}`]
        ).length;
    };

    const getVisibleSectionCount = (sectionId: string) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return 0;

        return section.categories.reduce((total, category) => {
            return total + getVisibleSubcategoriesCount(sectionId, category.id);
        }, 0);
    };

    const isCategoryVisible = (sectionId: string, categoryId: string) => {
        return visibility.categories[`${sectionId}-${categoryId}`] &&
            getVisibleSubcategoriesCount(sectionId, categoryId) > 0;
    };

    const isSectionVisible = (sectionId: string) => {
        return visibility.sections[sectionId] && getVisibleSectionCount(sectionId) > 0;
    };

    // Calculate total visible columns for helper rows
    const getTotalVisibleColumns = () => {
        return sections.reduce((total, section) => {
            return total + getVisibleSectionCount(section.id);
        }, 0);
    };

    return (
        <TableHeader className="bg-white">
            {/* Section Headers */}
            <TableRow>
                <TableHead
                    className={cn(
                        "sticky left-0 top-0 z-20 bg-white border-r",
                        "h-12 px-4 text-center font-bold"
                    )}
                >
                    Company Name
                </TableHead>
                {sections.map(section => {
                    const visibleCount = getVisibleSectionCount(section.id);
                    return isSectionVisible(section.id) && visibleCount > 0 && (
                        <TableHead
                            key={section.id}
                            colSpan={visibleCount}
                            className={cn(
                                "sticky top-0 z-10",
                                "h-12 text-center font-bold border-b-2",
                                section.bgColor,
                                section.borderColor,
                                section.headerTextColor
                            )}
                        >
                            {section.title}
                        </TableHead>
                    );
                })}
            </TableRow>

            {/* Category Headers */}
            <TableRow>
                <TableHead
                    className={cn(
                        "sticky left-0 top-12 z-20 bg-white border-r",
                        "h-10 px-4 text-center font-semibold"
                    )}
                />
                {sections.map(section =>
                    visibility.sections[section.id] && section.categories.map(category => {
                        const visibleCount = getVisibleSubcategoriesCount(section.id, category.id);
                        return isCategoryVisible(section.id, category.id) && visibleCount > 0 && (
                            <TableHead
                                key={`${section.id}-${category.id}`}
                                colSpan={visibleCount}
                                className={cn(
                                    "sticky top-12 z-10",
                                    "h-10 text-center font-semibold border-b",
                                    category.bgColor,
                                    category.borderColor
                                )}
                            >
                                {category.title}
                            </TableHead>
                        );
                    })
                )}
            </TableRow>

            {/* Subcategory Headers */}
            <TableRow>
                <TableHead
                    className={cn(
                        "sticky left-0 top-[5.5rem] z-20 bg-white border-r",
                        "h-10 px-4 text-center font-medium"
                    )}
                />
                {sections.map(section =>
                    visibility.sections[section.id] && section.categories.map(category =>
                        visibility.categories[`${section.id}-${category.id}`] &&
                        category.subcategories.map(subcategory => (
                            visibility.subcategories[`${section.id}-${category.id}-${subcategory.id}`] && (
                                <TableHead
                                    key={`${section.id}-${category.id}-${subcategory.id}`}
                                    className={cn(
                                        "sticky top-[5.5rem] z-10",
                                        "h-10 text-center font-medium border-b",
                                        "cursor-pointer hover:bg-accent/50 transition-colors",
                                        category.bgColor
                                    )}
                                    style={{ width: subcategory.width }}
                                    onClick={() => onSort(`${section.id}.${category.id}.${subcategory.id}`)}
                                >
                                    <div className="flex items-center justify-center space-x-1">
                                        <span>{subcategory.header}</span>
                                        {renderSortIcon(`${section.id}.${category.id}.${subcategory.id}`)}
                                    </div>
                                </TableHead>
                            )
                        ))
                    )
                )}
            </TableRow>

            {/* Helper Column Headers */}
            {Object.entries(helperColumns.calculation).map(([helperType, enabled]) =>
                enabled && (
                    <TableRow key={`helper-calculation-${helperType}`} className="h-8 bg-gray-50">
                        <TableHead className="sticky left-0 bg-white border-r" />
                        {sections.map(section =>
                            visibility.sections[section.id] && section.categories.map(category =>
                                visibility.categories[`${section.id}-${category.id}`] &&
                                category.subcategories.map(subcategory => {
                                    const config = helperColumnConfigs.calculation[helperType];
                                    const isApplicable = config.applicableTypes.includes('all') ||
                                        config.applicableTypes.includes(subcategory.type);

                                    return visibility.subcategories[`${section.id}-${category.id}-${subcategory.id}`] && (
                                        <TableHead
                                            key={`helper-calc-${helperType}-${section.id}-${category.id}-${subcategory.id}`}
                                            className={cn(
                                                "text-xs font-medium border-b h-8",
                                                config.bgColor,
                                                "transition-colors duration-200",
                                                !isApplicable && "opacity-50"
                                            )}
                                        >
                                            <div className="flex flex-col items-center justify-center p-1">
                                                <span className="text-[10px] font-semibold">
                                                    {config.label}
                                                </span>
                                                <span className="text-[8px] text-muted-foreground">
                                                    {config.description}
                                                </span>
                                            </div>
                                        </TableHead>
                                    );
                                })
                            )
                        )}
                    </TableRow>
                )
            )}

            {/* Reference Helper Headers */}
            {Object.entries(helperColumns.reference).map(([helperType, enabled]) =>
                enabled && (
                    <TableRow key={`helper-reference-${helperType}`} className="h-8 bg-gray-50">
                        <TableHead className="sticky left-0 bg-white border-r" />
                        {sections.map(section =>
                            visibility.sections[section.id] && section.categories.map(category =>
                                visibility.categories[`${section.id}-${category.id}`] &&
                                category.subcategories.map(subcategory => {
                                    const config = helperColumnConfigs.reference[helperType];
                                    const isApplicable = config.applicableTypes.includes('all') ||
                                        config.applicableTypes.includes(subcategory.type);

                                    return visibility.subcategories[`${section.id}-${category.id}-${subcategory.id}`] && (
                                        <TableHead
                                            key={`helper-ref-${helperType}-${section.id}-${category.id}-${subcategory.id}`}
                                            className={cn(
                                                "text-xs font-medium border-b h-8",
                                                config.bgColor,
                                                "transition-colors duration-200",
                                                !isApplicable && "opacity-50"
                                            )}
                                        >
                                            <div className="flex flex-col items-center justify-center p-1">
                                                <span className="text-[10px] font-semibold">
                                                    {config.label}
                                                </span>
                                                <span className="text-[8px] text-muted-foreground">
                                                    {config.description}
                                                </span>
                                            </div>
                                        </TableHead>
                                    );
                                })
                            )
                        )}
                    </TableRow>
                )
            )}
        </TableHeader>
    );
};