// /components/TableFooter.tsx
import { TableFooter as UITableFooter, TableRow, TableCell } from '@/components/ui/table';
import { useTable } from '../context/TableContext';
import { CalculationResult } from '../core/types';

export const TableFooter: React.FC<{
    calculations: Record<string, CalculationResult>;
    structure: TableStructure;
}> = ({ calculations, structure }) => {
    const { config } = useTable();

    const renderCalculationCell = (column: ColumnDefinition) => {
        const calculation = calculations[column.id];

        if (!calculation) return null;

        return (
            <TableCell
                key={`calc-${column.id}`}
                className={`calculation-cell ${column.config.className || ''}`}
            >
                <div className="calculation-content">
                    {calculation.isValid ? (
                        <span className="calculation-value">
                            {formatCalculationValue(calculation.value, column.config.format)}
                        </span>
                    ) : (
                        <span className="calculation-error">
                            Error calculating value
                        </span>
                    )}
                </div>
            </TableCell>
        );
    };

    return (
        <UITableFooter>
            <TableRow className="calculations-row">
                {structure.columns.map(column => renderCalculationCell(column))}
            </TableRow>
        </UITableFooter>
    );
};