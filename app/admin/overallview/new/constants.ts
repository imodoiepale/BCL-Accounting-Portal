// constants.ts
import { ColumnStructure } from './types';




export const helperColumnConfigs = {
    calculation: {
        sum: {
            label: 'Sum',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700',
            borderColor: 'border-blue-200',
            description: 'Total sum of values',
            applicableTypes: ['number', 'currency'],
            format: (value: number) => value.toLocaleString(),
            compute: (values: number[]) => values.reduce((a, b) => a + b, 0)
        },
        average: {
            label: 'Avg',
            bgColor: 'bg-green-50',
            textColor: 'text-green-700',
            borderColor: 'border-green-200',
            description: 'Average value',
            applicableTypes: ['number', 'currency', 'percentage'],
            format: (value: number) => value.toFixed(2),
            compute: (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length
        },
        count: {
            label: 'Count',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700',
            borderColor: 'border-purple-200',
            description: 'Number of entries',
            applicableTypes: ['all'],
            format: (value: number) => value.toString(),
            compute: (values: any[]) => values.filter(v => v !== null && v !== undefined).length
        },
        min: {
            label: 'Min',
            bgColor: 'bg-red-50',
            textColor: 'text-red-700',
            borderColor: 'border-red-200',
            description: 'Minimum value',
            applicableTypes: ['number', 'currency', 'percentage'],
            format: (value: number) => value.toLocaleString(),
            compute: (values: number[]) => Math.min(...values)
        },
        max: {
            label: 'Max',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-700',
            borderColor: 'border-orange-200',
            description: 'Maximum value',
            applicableTypes: ['number', 'currency', 'percentage'],
            format: (value: number) => value.toLocaleString(),
            compute: (values: number[]) => Math.max(...values)
        }
    },
    reference: {
        previous: {
            label: 'Prev',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-700',
            borderColor: 'border-yellow-200',
            description: 'Previous value',
            applicableTypes: ['all'],
            format: (value: any) => String(value),
            compute: (values: any[], index: number) => index > 0 ? values[index - 1] : null
        },
        next: {
            label: 'Next',
            bgColor: 'bg-teal-50',
            textColor: 'text-teal-700',
            borderColor: 'border-teal-200',
            description: 'Next value',
            applicableTypes: ['all'],
            format: (value: any) => String(value),
            compute: (values: any[], index: number) => index < values.length - 1 ? values[index + 1] : null
        },
        delta: {
            label: 'Δ Change',
            bgColor: 'bg-indigo-50',
            textColor: 'text-indigo-700',
            borderColor: 'border-indigo-200',
            description: 'Change from previous',
            applicableTypes: ['number', 'currency', 'percentage'],
            format: (value: number) => value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2),
            compute: (values: number[], index: number) => index > 0 ? values[index] - values[index - 1] : null
        },
        percentChange: {
            label: '% Change',
            bgColor: 'bg-pink-50',
            textColor: 'text-pink-700',
            borderColor: 'border-pink-200',
            description: 'Percent change',
            applicableTypes: ['number', 'currency', 'percentage'],
            format: (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
            compute: (values: number[], index: number) => {
                if (index === 0 || values[index - 1] === 0) return null;
                return ((values[index] - values[index - 1]) / values[index - 1]) * 100;
            }
        }
    }
};

export const tableStructure: ColumnStructure = {
    sections: [
        {
            id: 'manufacturing',
            title: 'Manufacturing Details',
            colspan: 12,
            borderColor: 'border-blue-600',
            bgColor: 'bg-blue-700',
            headerTextColor: 'text-white',
            categories: [
                {
                    id: 'specifications',
                    title: 'Technical Specifications',
                    colspan: 6,
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    subcategories: [
                        { id: 'index', header: '#', type: 'number', width: '50px' },
                        { id: 'productId', header: 'Product ID', type: 'text' },
                        { id: 'specifications', header: 'Specifications', type: 'text' },
                        { id: 'materials', header: 'Materials Used', type: 'text' },
                        { id: 'process', header: 'Process', type: 'text' },
                        { id: 'quality', header: 'Quality Grade', type: 'text' }
                    ]
                },
                {
                    id: 'production',
                    title: 'Production Metrics',
                    colspan: 6,
                    bgColor: 'bg-blue-25',
                    borderColor: 'border-blue-200',
                    subcategories: [
                        { id: 'batchSize', header: 'Batch Size', type: 'number' },
                        { id: 'cycleTime', header: 'Cycle Time', type: 'text' },
                        { id: 'efficiency', header: 'Efficiency', type: 'percentage' },
                        { id: 'defectRate', header: 'Defect Rate', type: 'percentage' },
                        { id: 'outputRate', header: 'Output Rate', type: 'number' },
                        { id: 'status', header: 'Status', type: 'select' }
                    ]
                }
            ]
        },
        {
            id: 'commercial',
            title: 'Commercial Information',
            colspan: 10,
            borderColor: 'border-green-600',
            bgColor: 'bg-green-700',
            headerTextColor: 'text-white',
            categories: [
                {
                    id: 'costs',
                    title: 'Cost Analysis',
                    colspan: 5,
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    subcategories: [
                        { id: 'rawMaterialCost', header: 'Raw Material Cost', type: 'currency' },
                        { id: 'laborCost', header: 'Labor Cost', type: 'currency' },
                        { id: 'overheadCost', header: 'Overhead Cost', type: 'currency' },
                        { id: 'totalCost', header: 'Total Cost', type: 'currency' },
                        { id: 'profitMargin', header: 'Profit Margin', type: 'percentage' }
                    ]
                },
                {
                    id: 'market',
                    title: 'Market Data',
                    colspan: 5,
                    bgColor: 'bg-green-25',
                    borderColor: 'border-green-200',
                    subcategories: [
                        { id: 'marketPrice', header: 'Market Price', type: 'currency' },
                        { id: 'competitorPrice', header: 'Competitor Price', type: 'currency' },
                        { id: 'marketShare', header: 'Market Share', type: 'percentage' },
                        { id: 'salesVolume', header: 'Sales Volume', type: 'number' },
                        { id: 'growth', header: 'Growth Rate', type: 'percentage' }
                    ]
                }
            ]
        },
        {
            id: 'quality',
            title: 'Quality Control',
            colspan: 8,
            borderColor: 'border-purple-600',
            bgColor: 'bg-purple-700',
            headerTextColor: 'text-white',
            categories: [
                {
                    id: 'testing',
                    title: 'Testing Results',
                    colspan: 4,
                    bgColor: 'bg-purple-50',
                    borderColor: 'border-purple-200',
                    subcategories: [
                        { id: 'testDate', header: 'Test Date', type: 'date' },
                        { id: 'testResult', header: 'Result', type: 'select' },
                        { id: 'compliance', header: 'Compliance', type: 'select' },
                        { id: 'certifications', header: 'Certifications', type: 'text' }
                    ]
                },
                {
                    id: 'metrics',
                    title: 'Quality Metrics',
                    colspan: 4,
                    bgColor: 'bg-purple-25',
                    borderColor: 'border-purple-200',
                    subcategories: [
                        { id: 'qualityScore', header: 'Quality Score', type: 'number' },
                        { id: 'defects', header: 'Defects', type: 'number' },
                        { id: 'returns', header: 'Returns', type: 'number' },
                        { id: 'satisfaction', header: 'Customer Satisfaction', type: 'percentage' }
                    ]
                }
            ]
        }
    ]
};

export const statusColors = {
    "Active": "bg-green-100 text-green-800",
    "Inactive": "bg-red-100 text-red-800",
    "Pending": "bg-yellow-100 text-yellow-800",
    "Passed": "bg-green-100 text-green-800",
    "Failed": "bg-red-100 text-red-800"
};

export const defaultHelperColumns = {
    calculation: {
        sum: false,
        average: false,
        count: false,
        min: false,
        max: false
    },
    reference: {
        previous: false,
        next: false,
        delta: false,
        percentChange: false
    }
};

export const headerThemes = {
    section: {
        base: "px-6 py-3 text-center font-bold border-b-4",
        text: "text-white"
    },
    category: {
        base: "px-6 py-2 text-center font-semibold border-b-2",
        text: "text-gray-800"
    },
    subcategory: {
        base: "px-4 py-2 text-center font-medium border-b",
        text: "text-gray-700"
    }
};

export const defaultVisibility = {
    sections: {} as Record<string, boolean>,
    categories: {} as Record<string, boolean>,
    subcategories: {} as Record<string, boolean>
};

// Initialize the defaultVisibility with all sections, categories, and subcategories set to true
tableStructure.sections.forEach(section => {
    defaultVisibility.sections[section.id] = true;

    section.categories.forEach(category => {
        defaultVisibility.categories[`${section.id}-${category.id}`] = true;

        category.subcategories.forEach(subcategory => {
            defaultVisibility.subcategories[`${section.id}-${category.id}-${subcategory.id}`] = true;
        });
    });
});