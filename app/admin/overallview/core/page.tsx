// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTableConfiguration } from './hooks/useTableConfiguration';
import { useTableData } from './hooks/useTableData';
import { useCalculations } from './hooks/useCalculations';
import { useHelperHeaders } from './hooks/useHelperHeaders';
import { ConfigurationPanel } from './settings/ConfigurationPanel';
import tableConfig from './hooks/tableConfig';

export default function TablePage() {
    const [configId] = useState(tableConfig.configId);
    const { config, loading: configLoading } = useTableConfiguration(configId);
    const { data, loading: dataLoading } = useTableData(configId, ['mainTable']);
    const { calculations, processCalculations } = useCalculations(data?.mainTable || [], config.calculations);
    const { headers, processHeaders } = useHelperHeaders(config.helperHeaders);

    useEffect(() => {
        processCalculations();
        processHeaders();
    }, [data]);

    if (configLoading || dataLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    const renderSection = (section: any) => {
        const sectionCategories = config.structure.categories.filter(cat => cat.sectionId === section.id);
        return (
            <div key={section.id} className="mb-8">
                <h2 className="text-xl font-bold mb-4 bg-gray-100 p-3 rounded">{section.name}</h2>
                {sectionCategories.map(category => renderCategory(category))}
            </div>
        );
    };

    const renderCategory = (category: any) => {
        const categorySubCategories = config.structure.subCategories.filter(subCat => subCat.categoryId === category.id);
        return (
            <div key={category.id} className="mb-6 ml-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">{category.name}</h3>
                {categorySubCategories.map(subCategory => renderSubCategory(subCategory))}
            </div>
        );
    };

    const renderSubCategory = (subCategory: any) => {
        const subCategoryColumns = config.structure.columns.filter(col => subCategory.columns.includes(col.id));
        return (
            <div key={subCategory.id} className="mb-4 ml-4">
                <h4 className="text-md font-medium mb-2 text-gray-600">{subCategory.name}</h4>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {subCategoryColumns.map(column => (
                                    <th key={column.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data?.mainTable?.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {subCategoryColumns.map(column => (
                                        <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {column.type === 'number'
                                                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row[column.field])
                                                : row[column.field]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        {/* Helper Headers */}
                        {Object.values(headers).map(header => (
                            <tfoot key={header.id}>
                                <tr className="bg-gray-50">
                                    <td colSpan={subCategoryColumns.length} className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                                        {header.label}: {calculations[header.config.calculation.id]?.value || 0}
                                    </td>
                                </tr>
                            </tfoot>
                        ))}
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <div className="flex-1 p-8">
                <h1 className="text-2xl font-bold mb-6">Employee Information</h1>
                {config.structure.sections.map(section => renderSection(section))}
            </div>
            <div className="w-1/3 border-l bg-white p-4">
                <ConfigurationPanel />
            </div>
        </div>
    );
}