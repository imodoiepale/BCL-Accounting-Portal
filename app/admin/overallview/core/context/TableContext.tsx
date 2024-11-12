// /core/context/TableContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { TableConfiguration, TableState } from '../types';

interface TableContextValue {
    config: TableConfiguration;
    state: TableState;
    dispatch: (action: TableAction) => void;
}

const TableContext = createContext<TableContextValue | undefined>(undefined);

export const TableProvider: React.FC<{
    children: ReactNode;
    value: TableContextValue;
}> = ({ children, value }) => {
    return (
        <TableContext.Provider value={value}>
            {children}
        </TableContext.Provider>
    );
};

export const useTable = () => {
    const context = useContext(TableContext);
    if (!context) {
        throw new Error('useTable must be used within a TableProvider');
    }
    return context;
};