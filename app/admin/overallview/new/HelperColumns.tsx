// components/HelperColumns.tsx
import React from 'react';
import { tableStyles } from './styles';
import { formatValue } from './utils';

interface HelperColumnsProps {
    data: any[];
    helperColumns: {
        calculation: Record<string, boolean>;
        reference: Record<string, boolean>;
        information: Record<string, boolean>;
    };
    type: string;
    field: string;
}

export const HelperColumns: React.FC<HelperColumnsProps> = ({
    data,
    helperColumns,
    type,
    field
}) => {
    const calculateHelper = (type: string, field: string, data: any[]) => {
        const values = data.map(item => Number(item[field])).filter(val => !isNaN(val));

        switch (type) {
            case 'sum':
                return values.reduce((acc, curr) => acc + curr, 0);
            case 'average':
                return values.length ? values.reduce((acc, curr) => acc + curr, 0) / values.length : 0;
            case 'count':
                return values.length;
            case 'min':
                return Math.min(...values);
            case 'max':
                return Math.max(...values);
            default:
                return 0;
        }
    };

    return (
        <>
            {Object.entries(helperColumns[type]).map(([helper, enabled]) =>
                enabled && (
                    <td
                        key={`${helper}-${field}`}
                        className={tableStyles.cell.base}
                    >
                        {formatValue(calculateHelper(helper, field, data), 'number')}
                    </td>
                )
            )}
        </>
    );
};