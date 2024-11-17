// /core/hooks/useTableData.ts
import { useState, useEffect } from 'react';
import { tableCache } from '../cache/TableCache';
import tableData from './tableData.json'; // Import your JSON data

export const useTableData = (configId: string, tables: string[]) => {
    const [data, setData] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [configId, tables]);

    const loadData = async () => {
        setLoading(true);
        try {
            const results: Record<string, any> = {};

            for (const table of tables) {
                // Directly use the imported JSON data
                results[table] = tableData[table] || [];
            }

            setData(results);
        } catch (error) {
            console.error('Error loading table data:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        data,
        loading,
        refresh: loadData
    };
};