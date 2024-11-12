// /components/Table.tsx
import { useTable } from '../core/context/TableContext';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TableFooter } from './TableFooter';
import { HelperHeaders } from './HelperHeaders';

export const AdvancedTable: React.FC<{
    configId: string;
    data?: any[];
    onUpdate?: (data: any) => void;
}> = ({ configId, data, onUpdate }) => {
    const {
        config,
        state,
        dispatch
    } = useTable();

    useEffect(() => {
        if (configId) {
            dispatch({ type: 'LOAD_CONFIG', payload: configId });
        }
    }, [configId]);

    return (
        <div className="advanced-table-container">
            <div className="table-wrapper">
                <Table>
                    <TableHeader
                        structure={config.structure}
                        onSort={handleSort}
                    />
                    <TableBody
                        data={state.processedData}
                        structure={config.structure}
                        onUpdate={handleUpdate}
                    />
                    <TableFooter
                        calculations={state.calculations}
                        structure={config.structure}
                    />
                </Table>
            </div>
            <HelperHeaders
                config={config.helperHeaders}
                data={state.processedData}
                calculations={state.calculations}
            />
        </div>
    );
};
