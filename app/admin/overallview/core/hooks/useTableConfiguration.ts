// /core/hooks/useTableConfiguration.ts
import { useAtom } from 'jotai';
import { tableConfigAtom, tableConfigLoadingAtom } from '../store/tableStore';
import tableConfig from './tableConfig.json';

export const useTableConfiguration = (configId: string) => {
    const [config, setConfig] = useAtom(tableConfigAtom);
    const [loading, setLoading] = useAtom(tableConfigLoadingAtom);

    const loadConfiguration = async () => {
        setLoading(true);
        try {
            setConfig(tableConfig); // Set the imported configuration
        } catch (error) {
            console.error('Error loading configuration:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        config,
        loading,
        loadConfiguration
    };
};