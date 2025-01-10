// utils.ts
import { ProductData, SortConfig } from './types';

export const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '-';

    switch (type) {
        case 'currency':
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(value);
        case 'percentage':
            return `${value}%`;
        case 'date':
            return new Date(value).toLocaleDateString();
        case 'number':
            return new Intl.NumberFormat('en-US').format(value);
        default:
            return value;
    }
};

export const sortData = (data: ProductData[], sortConfig: SortConfig) => {
    if (!sortConfig.key || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        if (sortConfig.direction === 'asc') {
            return aStr.localeCompare(bStr);
        }
        return bStr.localeCompare(aStr);
    });
};

// Add export statement here
export const generateSampleData = (): ProductData[] => {
    const statuses = ['Active', 'Pending', 'On Hold'];
    const qualities = ['Grade A', 'Grade A+', 'Grade B', 'Grade C'];
    const processes = ['CNC Machining', 'Die Casting', 'Injection Molding', 'Forging'];
    const testResults = ['Passed', 'Failed', 'Pending'];
    const materials = ['Stainless Steel 304', 'AL6061-T6', 'Carbon Steel', 'Titanium', 'Brass'];

    const generateRandomEntry = (index: number) => {
        const shouldHaveMissingData = Math.random() > 0.7;

        return {
            companyName: `Company ${String.fromCharCode(65 + index)}`,
            manufacturingData: {
                specifications: {
                    index: index + 1,
                    productId: shouldHaveMissingData ? "To be registered" : `PRD-2024-${(index + 1).toString().padStart(3, '0')}`,
                    specifications: shouldHaveMissingData ? "Missing" : `${materials[Math.floor(Math.random() * materials.length)]}, ${(Math.random() * 3).toFixed(1)}mm thickness`,
                    materials: shouldHaveMissingData ? "To be registered" : materials[Math.floor(Math.random() * materials.length)],
                    process: processes[Math.floor(Math.random() * processes.length)],
                    quality: qualities[Math.floor(Math.random() * qualities.length)]
                },
                production: {
                    batchSize: shouldHaveMissingData ? 0 : Math.floor(Math.random() * 5000) + 500,
                    cycleTime: shouldHaveMissingData ? "Missing" : `${Math.floor(Math.random() * 60) + 15} minutes`,
                    efficiency: shouldHaveMissingData ? 0 : Number((Math.random() * 20 + 80).toFixed(1)),
                    defectRate: shouldHaveMissingData ? 0 : Number((Math.random() * 2).toFixed(1)),
                    outputRate: shouldHaveMissingData ? 0 : Math.floor(Math.random() * 150) + 50,
                    status: statuses[Math.floor(Math.random() * statuses.length)]
                }
            },
            commercialData: {
                costs: {
                    rawMaterialCost: shouldHaveMissingData ? 0 : Number((Math.random() * 2000 + 800).toFixed(2)),
                    laborCost: shouldHaveMissingData ? 0 : Number((Math.random() * 1000 + 400).toFixed(2)),
                    overheadCost: shouldHaveMissingData ? 0 : Number((Math.random() * 600 + 200).toFixed(2)),
                    totalCost: shouldHaveMissingData ? 0 : Number((Math.random() * 3000 + 1500).toFixed(2)),
                    profitMargin: shouldHaveMissingData ? 0 : Number((Math.random() * 30 + 20).toFixed(2))
                },
                market: {
                    marketPrice: shouldHaveMissingData ? 0 : Number((Math.random() * 4000 + 2000).toFixed(2)),
                    competitorPrice: shouldHaveMissingData ? 0 : Number((Math.random() * 4000 + 2000).toFixed(2)),
                    marketShare: shouldHaveMissingData ? 0 : Number((Math.random() * 40 + 10).toFixed(1)),
                    salesVolume: shouldHaveMissingData ? 0 : Math.floor(Math.random() * 10000) + 1000,
                    growth: shouldHaveMissingData ? 0 : Number((Math.random() * 20 + 5).toFixed(1))
                }
            },
            qualityData: {
                testing: {
                    testDate: shouldHaveMissingData ? "Missing" : new Date(2024, 2, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
                    testResult: testResults[Math.floor(Math.random() * testResults.length)],
                    compliance: shouldHaveMissingData ? "To be registered" : "ISO 9001",
                    certifications: shouldHaveMissingData ? "Missing" : "CE, RoHS" + (Math.random() > 0.5 ? ", UL" : "")
                },
                metrics: {
                    qualityScore: shouldHaveMissingData ? 0 : Math.floor(Math.random() * 20 + 80),
                    defects: shouldHaveMissingData ? 0 : Math.floor(Math.random() * 50),
                    returns: shouldHaveMissingData ? 0 : Math.floor(Math.random() * 20),
                    satisfaction: shouldHaveMissingData ? 0 : Number((Math.random() * 10 + 90).toFixed(1))
                }
            }
        };
    };

    return Array.from({ length: 20 }, (_, index) => generateRandomEntry(index));
};

export const filterData = (data: ProductData[], searchTerm: string) => {
    if (!searchTerm) return data;
    const lowercaseSearch = searchTerm.toLowerCase();

    return data.filter(row => {
        return Object.entries(row).some(([_, value]) => {
            if (typeof value === 'object') {
                return JSON.stringify(value).toLowerCase().includes(lowercaseSearch);
            }
            return String(value).toLowerCase().includes(lowercaseSearch);
        });
    });
};