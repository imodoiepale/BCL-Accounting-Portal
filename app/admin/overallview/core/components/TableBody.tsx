// /components/TableBody.tsx
import { TableBody as UITableBody, TableRow, TableCell } from '@/components/ui/table';

import { CellRenderer } from './CellRenderer';
import { useTable } from '../context/TableContext';

export const TableBody: React.FC<{
    data: any[];
    structure: TableStructure;
    onUpdate: (rowId: string, field: string, value: any) => void;
}> = ({ data, structure, onUpdate }) => {
    const { config, state } = useTable();

    const renderRow = (row: any, rowIndex: number) => {
        const hasNestedData = row.hasOwnProperty('_children');

        return (
            <>
                <TableRow
                    key={row.id}
                    className={`data-row ${hasNestedData ? 'has-nested' : ''}`}
                >
                    {structure.columns.map(column => (
                        <TableCell
                            key={`${row.id}-${column.id}`}
                            className={`data-cell ${column.config.className || ''}`}
                        >
                            <CellRenderer
                                column={column}
                                value={row[column.field]}
                                row={row}
                                onUpdate={(value) => onUpdate(row.id, column.field, value)}
                            />
                        </TableCell>
                    ))}
                </TableRow>

                {hasNestedData && row._expanded && (
                    <NestedRows
                        data={row._children}
                        structure={structure}
                        onUpdate={onUpdate}
                        level={1}
                    />
                )}
            </>
        );
    };

    return (
        <UITableBody>
            {data.map((row, index) => renderRow(row, index))}
        </UITableBody>
    );
};

// Nested component for handling hierarchical data
const NestedRows: React.FC<{
    data: any[];
    structure: TableStructure;
    onUpdate: (rowId: string, field: string, value: any) => void;
    level: number;
}> = ({ data, structure, onUpdate, level }) => {
    return (
        <>
            {data.map(row => (
                <TableRow
                    key={row.id}
                    className={`nested-row level-${level}`}
                    style={{ paddingLeft: `${level * 20}px` }}
                >
                    {structure.columns.map(column => (
                        <TableCell key={`${row.id}-${column.id}`}>
                            <CellRenderer
                                column={column}
                                value={row[column.field]}
                                row={row}
                                onUpdate={(value) => onUpdate(row.id, column.field, value)}
                                isNested={true}
                                level={level}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
};