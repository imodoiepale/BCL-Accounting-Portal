// components/TableBody.tsx
import React from 'react';
import {
    TableBody as ShadcnTableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProductData } from './types';
import { formatValue } from './utils';
import { statusColors } from './constants';

interface TableBodyProps {
    data: ProductData[];
    visibility: {
        sections: Record<string, boolean>;
        categories: Record<string, boolean>;
        subcategories: Record<string, boolean>;
    };
    onRowClick: (data: ProductData) => void;
}

export const TableBody: React.FC<TableBodyProps> = ({
    data,
    visibility,
    onRowClick
}) => {
    const renderCellContent = (rowData: ProductData, section: string, category: string, subcategory: string) => {
        // Safely access nested properties
        const value = rowData?.[section]?.[category]?.[subcategory];
        if (value === undefined || value === null) return '-';

        const type = getFieldType(section, category, subcategory);
        const formattedValue = formatValue(value, type);

        if (type === 'select' || ['Active', 'Inactive', 'Pending', 'Passed', 'Failed'].includes(value)) {
            return (
                <Badge
                    variant="secondary"
                    className={cn(
                        "font-medium",
                        statusColors[formattedValue as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                    )}
                >
                    {formattedValue}
                </Badge>
            );
        }

        return formattedValue;
    };

    return (
        <ShadcnTableBody>
            {data.map((row, rowIndex) => (
                <TableRow
                    key={`row-${rowIndex}`}
                    className={cn(
                        "cursor-pointer hover:bg-accent/50 transition-colors",
                        "h-10"
                    )}
                    onClick={() => onRowClick(row)}
                >
                    <TableCell className="sticky left-0 bg-white border-r">
                        {row.companyName}
                    </TableCell>

                    {/* Manufacturing Data */}
                    {visibility.sections['manufacturing'] && (
                        <>
                            {visibility.categories['manufacturing-specifications'] &&
                                row.manufacturingData.specifications &&
                                Object.keys(row.manufacturingData.specifications).map(key => (
                                    visibility.subcategories[`manufacturing-specifications-${key}`] && (
                                        <TableCell key={`manufacturing-specifications-${key}`}>
                                            {renderCellContent(row, 'manufacturingData', 'specifications', key)}
                                        </TableCell>
                                    )
                                ))
                            }

                            {visibility.categories['manufacturing-production'] &&
                                row.manufacturingData.production &&
                                Object.keys(row.manufacturingData.production).map(key => (
                                    visibility.subcategories[`manufacturing-production-${key}`] && (
                                        <TableCell key={`manufacturing-production-${key}`}>
                                            {renderCellContent(row, 'manufacturingData', 'production', key)}
                                        </TableCell>
                                    )
                                ))
                            }
                        </>
                    )}

                    {/* Commercial Data */}
                    {visibility.sections['commercial'] && (
                        <>
                            {visibility.categories['commercial-costs'] &&
                                row.commercialData.costs &&
                                Object.keys(row.commercialData.costs).map(key => (
                                    visibility.subcategories[`commercial-costs-${key}`] && (
                                        <TableCell key={`commercial-costs-${key}`}>
                                            {renderCellContent(row, 'commercialData', 'costs', key)}
                                        </TableCell>
                                    )
                                ))
                            }

                            {visibility.categories['commercial-market'] &&
                                row.commercialData.market &&
                                Object.keys(row.commercialData.market).map(key => (
                                    visibility.subcategories[`commercial-market-${key}`] && (
                                        <TableCell key={`commercial-market-${key}`}>
                                            {renderCellContent(row, 'commercialData', 'market', key)}
                                        </TableCell>
                                    )
                                ))
                            }
                        </>
                    )}

                    {/* Quality Data */}
                    {visibility.sections['quality'] && (
                        <>
                            {visibility.categories['quality-testing'] &&
                                row.qualityData.testing &&
                                Object.keys(row.qualityData.testing).map(key => (
                                    visibility.subcategories[`quality-testing-${key}`] && (
                                        <TableCell key={`quality-testing-${key}`}>
                                            {renderCellContent(row, 'qualityData', 'testing', key)}
                                        </TableCell>
                                    )
                                ))
                            }

                            {visibility.categories['quality-metrics'] &&
                                row.qualityData.metrics &&
                                Object.keys(row.qualityData.metrics).map(key => (
                                    visibility.subcategories[`quality-metrics-${key}`] && (
                                        <TableCell key={`quality-metrics-${key}`}>
                                            {renderCellContent(row, 'qualityData', 'metrics', key)}
                                        </TableCell>
                                    )
                                ))
                            }
                        </>
                    )}
                </TableRow>
            ))}
        </ShadcnTableBody>
    );
};

// Helper function to determine field type
const getFieldType = (section: string, category: string, subcategory: string): string => {
    const fieldTypes: Record<string, Record<string, Record<string, string>>> = {
        manufacturingData: {
            specifications: {
                index: 'number',
                productId: 'text',
                specifications: 'text',
                materials: 'text',
                process: 'text',
                quality: 'text'
            },
            production: {
                batchSize: 'number',
                cycleTime: 'text',
                efficiency: 'percentage',
                defectRate: 'percentage',
                outputRate: 'number',
                status: 'select'
            }
        },
        commercialData: {
            costs: {
                rawMaterialCost: 'currency',
                laborCost: 'currency',
                overheadCost: 'currency',
                totalCost: 'currency',
                profitMargin: 'percentage'
            },
            market: {
                marketPrice: 'currency',
                competitorPrice: 'currency',
                marketShare: 'percentage',
                salesVolume: 'number',
                growth: 'percentage'
            }
        },
        qualityData: {
            testing: {
                testDate: 'date',
                testResult: 'select',
                compliance: 'text',
                certifications: 'text'
            },
            metrics: {
                qualityScore: 'number',
                defects: 'number',
                returns: 'number',
                satisfaction: 'percentage'
            }
        }
    };

    return fieldTypes[section]?.[category]?.[subcategory] || 'text';
};