// components/AdvancedTable/index.tsx
import React from 'react';
import { Table } from '@/components/ui/table';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TableFooter } from './TableFooter';

interface AdvancedTableProps {
    data: any[];
    config: TableConfiguration;
    onUpdate?: (data: any) => void;
}

export const AdvancedTable: React.FC<AdvancedTableProps> = ({
    data,
    config,
    onUpdate
}) => {
    return (
        <div className="advanced-table-wrapper">
            <Table>
                <TableHeader structure={config.structure} />
                <TableBody data={data} structure={config.structure} onUpdate={onUpdate} />
                <TableFooter calculations={config.calculations} />
            </Table>
        </div>
    );
};