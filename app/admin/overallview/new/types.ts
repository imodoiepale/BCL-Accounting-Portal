// types.ts


// types.ts
export interface TableHeadersProps {
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
    };
    data: any[];  // Your data array
    totalRowCount: number;
    calculations: {
        stats: Record<string, ColumnStats>;
        helpers: Record<string, Record<string, any>>;
    };
}

interface ColumnStats {
    total: number;
    completed: number;
    pending: number;
    values: any[];
}

interface Section {
    id: string;
    title: string;
    colspan: number;
    borderColor: string;
    bgColor: string;
    headerTextColor: string;
    categories: Category[];
}

interface Category {
    id: string;
    title: string;
    colspan: number;
    bgColor: string;
    borderColor: string;
    subcategories: Subcategory[];
}

interface Subcategory {
    id: string;
    header: string;
    type: string;
    width?: string;
}

interface SortConfig {
    key: string;
    direction: 'asc' | 'desc' | null;
}

export interface ColumnStructure {
    sections: Section[];
}

// export interface Section {
//     id: string;
//     title: string;
//     colspan: number;
//     borderColor: string;
//     bgColor: string;
//     headerTextColor: string;
//     categories: Category[];
// }

// export interface Category {
//     id: string;
//     title: string;
//     colspan: number;
//     bgColor: string;
//     borderColor: string;
//     subcategories: Subcategory[];
// }

// export interface Subcategory {
//     id: string;
//     header: string;
//     type: 'text' | 'number' | 'date' | 'select' | 'currency' | 'percentage';
//     width?: string;
// }

export interface ProductData {
    companyName: string;
    manufacturingData: {
        specifications: {
            index: number;
            productId: string;
            specifications: string;
            materials: string;
            process: string;
            quality: string;
        };
        production: {
            batchSize: number;
            cycleTime: string;
            efficiency: number;
            defectRate: number;
            outputRate: number;
            status: string;
        };
    };
    commercialData: {
        costs: {
            rawMaterialCost: number;
            laborCost: number;
            overheadCost: number;
            totalCost: number;
            profitMargin: number;
        };
        market: {
            marketPrice: number;
            competitorPrice: number;
            marketShare: number;
            salesVolume: number;
            growth: number;
        };
    };
    qualityData: {
        testing: {
            testDate: string;
            testResult: string;
            compliance: string;
            certifications: string;
        };
        metrics: {
            qualityScore: number;
            defects: number;
            returns: number;
            satisfaction: number;
        };
    };
}

// export interface SortConfig {
//     key: string;
//     direction: 'asc' | 'desc' | null;
// }

export interface VisibilityState {
    sections: Record<string, boolean>;
    categories: Record<string, boolean>;
    subcategories: Record<string, boolean>;
}

export interface HelperColumn {
    id: string;
    type: 'calculation' | 'reference' | 'information';
    title: string;
    compute?: (data: any[]) => any;
}

export interface TableStyles {
    header: {
        section: string;
        category: string;
        subcategory: string;
    };
    cell: {
        base: string;
        sticky: string;
    };
    row: {
        base: string;
        alternate: string;
        hover: string;
    };
}

export const helperColumnConfigs = {
    calculation: {
        sum: {
            label: 'Sum',
            bgColor: 'bg-blue-50',
            description: 'Calculates the total sum of numeric values',
            applicableTypes: ['number', 'currency'],
        },
        average: {
            label: 'Average',
            bgColor: 'bg-green-50',
            description: 'Calculates the mean value',
            applicableTypes: ['number', 'currency', 'percentage'],
        },
        count: {
            label: 'Count',
            bgColor: 'bg-purple-50',
            description: 'Counts non-empty values',
            applicableTypes: ['all'],
        },
        min: {
            label: 'Minimum',
            bgColor: 'bg-red-50',
            description: 'Shows the smallest value',
            applicableTypes: ['number', 'currency', 'percentage'],
        },
        max: {
            label: 'Maximum',
            bgColor: 'bg-orange-50',
            description: 'Shows the largest value',
            applicableTypes: ['number', 'currency', 'percentage'],
        }
    },
    reference: {
        previous: {
            label: 'Previous',
            bgColor: 'bg-yellow-50',
            description: `Shows the previous row's value`,
            applicableTypes: ['all'],
        },
        next: {
            label: 'Next',
            bgColor: 'bg-teal-50',
            description: `Shows the next row's value`,
            applicableTypes: ['all'],
        },
        delta: {
            label: 'Delta',
            bgColor: 'bg-indigo-50',
            description: 'Shows change from previous value',
            applicableTypes: ['number', 'currency', 'percentage'],
        }
    }
};


export interface HelperColumns {
    calculation: {
        sum: boolean;
        average: boolean;
        count: boolean;
        min: boolean;
        max: boolean;
    };
    reference: {
        previous: boolean;
        next: boolean;
        delta: boolean;
        percentChange: boolean;
    };
    information: {
        description: boolean;
        metadata: boolean;
        notes: boolean;
    };
}


